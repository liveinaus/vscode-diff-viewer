import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
export const UNCOMMITTED = "*";
export let extensionPath: string;

const tempFolderName = "temp";
const repo: string = getRepoPath();
const gitRoot: string = resolveGitRoot(repo);

function resolveGitRoot(fromPath: string): string {
	try {
		return cp.execSync('git rev-parse --show-toplevel', { cwd: fromPath, encoding: 'utf8' }).trim();
	} catch {
		return fromPath;
	}
}

export function viewDiffInFile(fromHash: string, toHash: string, oldFilePath: string, newFilePath: string): string {
	if (fromHash === UNCOMMITTED) {
		fromHash = "HEAD";
	}

	fromHash = fromHash === toHash ? fromHash + "^" : fromHash;

	if (toHash === "*") {
		toHash = "";
	}
	return `git diff ${fromHash} ${toHash} -- '${oldFilePath}'`;
}

export function viewGitDiffByPath(filePath: string): string {
	return `git diff -- '${filePath}'`;
}

export function viewGitDiffForRepo(): string {
	const filePath = ".";

	return `git add -N --no-all ${filePath}; git diff ${filePath}`;
}

export function viewStagedDiffForRepo(): string {
	return `git diff --cached .`;
}

// %x01 as field separator -- safe since git disallows control chars in commit messages
export function getGitLogCmd(offset: number, limit: number): string {
	return `git --no-pager log --all --topo-order --skip=${offset} --max-count=${limit} --pretty=format:'%H%x01%h%x01%P%x01%s%x01%an%x01%ar%x01%D'`;
}

export function execShell(cmd: string): string {
	const preCmd = `cd '${repo}';`;
	try {
		return cp.execSync(`${preCmd} ${cmd}`, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
	} catch (e) {
		throwError(`cannot get output from [[ ${cmd} ]]`);
	}
}

export function getRepoPath(): string {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0) {
		// Assuming the first workspace folder represents the root of the repository
		return workspaceFolders[0].uri.fsPath;
	} else {
		throwError("cannot get repo path");
	}
}

export function throwError(message: string): never {
	vscode.window.showInformationMessage(message);
	throw new Error(message);
}

export function getAbsolutePath(relativePath: string) {
	return path.join(gitRoot, relativePath);
}

export function createTempFile(filename: string, fileContent: string) {
	const tempPath = path.join(extensionPath, tempFolderName);
	if (!fs.existsSync(tempPath)) {
		fs.mkdirSync(tempPath, { recursive: true });
	}
	const filePath = path.join(tempPath, filename);
	fs.writeFileSync(filePath, fileContent);
	return filePath;
}

export function clearTempFolder() {
	const tempPath = path.join(extensionPath, tempFolderName);
	if (fs.existsSync(tempPath)) {
		for (const file of fs.readdirSync(tempPath)) {
			fs.unlinkSync(path.join(tempPath, file));
		}
	}
}

export function initUtils(context: vscode.ExtensionContext) {
	extensionPath = context.extensionPath;
	clearTempFolder();
}

// Strips raw binary patch data and truncates oversized file sections so the
// renderer doesn't choke on large or binary diffs.
export function sanitizeDiffContent(content: string, maxLinesPerFile: number): string {
	const sections = content.split(/(?=^diff --git )/m);

	return sections
		.map(section => {
			if (!section.trim()) { return section; }

			// Replace GIT binary patch data with a standard "Binary files differ" line
			if (/^GIT binary patch/m.test(section)) {
				const headerMatch = /diff --git a\/(.+?) b\/(.+)/.exec(section);
				const header = section.split(/^GIT binary patch/m)[0].trimEnd();
				if (headerMatch) {
					return `${header}\nBinary files a/${headerMatch[1]} and b/${headerMatch[2]} differ\n`;
				}
				return '';
			}

			// Truncate file sections that exceed the line limit
			const lines = section.split('\n');
			if (lines.length > maxLinesPerFile) {
				return lines.slice(0, maxLinesPerFile).join('\n') + '\n';
			}

			return section;
		})
		.join('');
}
