import * as cp from "child_process";
import * as vscode from "vscode";
export const UNCOMMITTED = "*";

const repo: string = getRepoPath();

export function viewDiffInFile(fromHash: string, toHash: string, oldFilePath: string, newFilePath: string): string {
	if (fromHash === UNCOMMITTED) fromHash = "HEAD";

	fromHash = fromHash === toHash ? fromHash + "^" : fromHash;

	if (toHash === "*") {
		toHash = "";
	}
	return `cd '${repo}';git diff ${fromHash} ${toHash} -- '${oldFilePath}'`;
}

export function viewGitDiffByPath(filePath: string): string {
	return `cd '${repo}';git diff -- '${filePath}'`;
}

export function viewGitDiffForRepo(): string {
	const filePath = ".";

	return `cd '${repo}'; git add -N --no-all ${filePath}; git diff ${filePath}`;
}

export function execShell(cmd: string): string {
	try {
		return cp.execSync(cmd).toString();
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
	return getRepoPath() + "/" + relativePath;
}
