import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
export const UNCOMMITTED = "*";
export let extensionPath: string;

const tempFolderName = "temp";
const repo: string = getRepoPath();

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

export function execShell(cmd: string): string {
	const preCmd = `cd '${repo}';`;
	try {
		//use cat to stop pager
		return cp.execSync(`${preCmd} ${cmd}`, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }).toString();
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
	return path.join(getRepoPath(), relativePath);
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
		fs.readdirSync;
		for (const file of fs.readdirSync(tempPath)) {
			fs.unlinkSync(path.join(tempPath, file));
		}
	}
}

export function initUtils(context: vscode.ExtensionContext) {
	extensionPath = context.extensionPath;
	clearTempFolder();
}
