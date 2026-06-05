import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import * as vscode from "vscode";
import * as config from "./config";
import FileDiff from "./file-diff";
import * as Types from "./types";
import * as utils from "./utils";

let extensionPath: string;
let webviewPanel: vscode.WebviewPanel | undefined;
let webviewView: vscode.WebviewView | undefined;
let data: Types.DiffViewerData = {};
let lastUserCustomCmd: string;
let lastActiveFilePath: string | undefined;
export const componentCode: string = "diffViewer";

export function activate(context: vscode.ExtensionContext) {
	addToolbarBtns(context);
	extensionPath = context.extensionPath;
	updateDataForConfig();

	const provider = new DiffViewerProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.commands.registerCommand("better-diff-viewer.viewDiffFile", viewDiffFile),
		vscode.commands.registerCommand("better-diff-viewer.viewRepoGitDiff", viewRepoGitDiff),
		vscode.commands.registerCommand("better-diff-viewer.viewStagedChanges", viewStagedChanges),
		vscode.commands.registerCommand("better-diff-viewer.viewGitDiffForFile", viewGitDiffForFile),
		vscode.commands.registerCommand("better-diff-viewer.viewCustomDiffFromCmd", viewCustomDiffFromCmd),
		vscode.commands.registerCommand("better-diff-viewer.viewChangesInCommit", viewChangesInCommit),
		vscode.commands.registerCommand("better-diff-viewer.viewChangesBetweenCommits", viewChangesBetweenCommits),
		vscode.commands.registerCommand("better-diff-viewer.toggleFileDiff", toggleFileDiff)
	);
	vscode.workspace.onDidSaveTextDocument(autoRefresh);
	vscode.workspace.onDidOpenTextDocument(actionWhenFileExtensionDetected);
	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor) {
			lastActiveFilePath = editor.document.uri.fsPath;
		}
	});

	context.subscriptions.push(vscode.window.registerWebviewViewProvider(DiffViewerProvider.viewType, provider));
}

export function deactivate() {
	webviewPanel = undefined;
	webviewView = undefined;
	data = {};
}

function addToolbarBtns(context: vscode.ExtensionContext) {
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.text = "Uncommitted";
	statusBarItem.tooltip = "View Uncommitted Changes";
	statusBarItem.command = "better-diff-viewer.viewRepoGitDiff";
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);
}

function actionWhenFileExtensionDetected(document: vscode.TextDocument) {
	if (document.languageId === "diff" || document.languageId === "plaintext") {
		if (document.fileName.endsWith("diff") || document.fileName.endsWith(".patch")) {
			viewDiffDocument(document);
		}
	}
}

function updateDataByDiffContent(diffContent: string) {
	data.cmd = undefined;
	updateDataForConfig();
	data.diffContent = utils.sanitizeDiffContent(diffContent, data.config?.maxDiffLinesPerFile ?? 3000);
}

function updateDataByCmd(cmd: string) {
	data.cmd = cmd;
	updateDataForConfig();
	data.diffContent = utils.sanitizeDiffContent(utils.execShell(cmd), data.config?.maxDiffLinesPerFile ?? 3000);
}

function viewGitDiffForFile() {
	prepareViewerWebview();
	const editor = vscode.window.activeTextEditor;
	const filePath = editor?.document.uri.fsPath;
	if (filePath) {
		updateDataByCmd(utils.viewGitDiffByPath(filePath));
		data.viewMode = "file";
		doAction("showDiffContent", data);
	} else {
		utils.throwError("cannot find file path from current active text editor");
	}
}

async function viewCustomDiffFromCmd() {
	const customCmd = await vscode.window.showInputBox({
		prompt: "Enter your custom diff command",
		placeHolder: "For example: git diff HEAD <file_name>",
		value: lastUserCustomCmd, //default to last custom cmd
	});

	if (customCmd) {
		prepareViewerWebview();
		updateDataByCmd(customCmd);
		data.viewMode = "custom";
		doAction("showDiffContent", data);
		lastUserCustomCmd = customCmd;
	} else {
		vscode.window.showWarningMessage("No diff command provided.");
	}
}

async function viewChangesInCommit() {
	const selectedCommit: any = await vscode.window.showQuickPick(getSelectableCommits(), {
		placeHolder: "Select a commit",
	});

	const commitHash = getCommitHash(selectedCommit);
	const customCmd = `git diff ${commitHash}~ ${commitHash}`;
	prepareViewerWebview();
	updateDataByCmd(customCmd);
	data.viewMode = "commit";
	doAction("showDiffContent", data);
}

function getSelectableCommits(): string[] {
	const cmd = "git --no-pager log --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset'";
	return utils.execShell(cmd).split("\n");
}

function getCommitHash(commit: string) {
	return commit.substring(0, 7);
}

async function viewChangesBetweenCommits() {
	const selectedCommit1: any = await vscode.window.showQuickPick(getSelectableCommits(), {
		placeHolder: "Select 1st commit",
	});

	const selectedCommit2: any = await vscode.window.showQuickPick(getSelectableCommits(), {
		placeHolder: "Select 2nd commit",
	});

	const customCmd = `git diff ${getCommitHash(selectedCommit1)} ${getCommitHash(selectedCommit2)}`;
	prepareViewerWebview();
	updateDataByCmd(customCmd);
	data.viewMode = "commits";
	doAction("showDiffContent", data);
}

function viewRepoGitDiff() {
	prepareViewerWebview();
	updateDataByCmd(utils.viewGitDiffForRepo());
	data.viewMode = "unstaged";
	doAction("showDiffContent", data);
}

function viewStagedChanges() {
	prepareViewerWebview();
	updateDataByCmd(utils.viewStagedDiffForRepo());
	data.viewMode = "staged";
	doAction("showDiffContent", data);
}

function viewDiffFile() {
	// Get the active text editor
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("No active text editor found.");
		return;
	}
	viewDiffDocument(editor.document);
}

function viewDiffDocument(document: vscode.TextDocument) {
	prepareViewerWebview();
	updateDataByDiffContent(document.getText());
	data.viewMode = "diffFile";
	doAction("showDiffContent", data);
}

function getTargetViewColumn(): vscode.ViewColumn {
	const groups = vscode.window.tabGroups.all;
	// Use the highest-numbered column (rightmost split) if more than one exists, otherwise create a new split
	if (groups.length > 1) {
		return Math.max(...groups.map(g => g.viewColumn)) as vscode.ViewColumn;
	}
	return vscode.ViewColumn.Beside;
}

function prepareViewerWebview() {
	if (config.getAppConfig().componentsDisplayAtEditor?.includes(componentCode)) {
		if (!webviewPanel) {
			webviewPanel = vscode.window.createWebviewPanel("diffViewer", "Diff Viewer", { viewColumn: getTargetViewColumn(), preserveFocus: true }, { enableScripts: true, enableFindWidget: true });
			webviewPanel.onDidDispose(() => {
				webviewPanel = undefined;
			});
			prepareWebviewInner(webviewPanel.webview);
		} else {
			webviewPanel.reveal(getTargetViewColumn(), true);
		}
	} else {
		webviewPanel = undefined;
	}

	if (config.getAppConfig().componentsDisplayAtPanel?.includes(componentCode)) {
		if (webviewView?.webview && !webviewView?.webview.html) {
			prepareWebviewInner(webviewView?.webview);
		}
	} else if (webviewView?.webview && !webviewView?.webview.html) {
		prepareWebviewInner(webviewView?.webview, '<br/>You need to adjust setting to enable it. For example: <br/><br/><br/><b>"better-diff-viewer.componentsDisplayAtPanel": ["diffViewer"]<b/>');
	}
}

function prepareWebviewInner(webview: vscode.Webview, overwriteHtml?: string) {
	webview.onDidReceiveMessage(handleMessageFromWebview);
	if (!webview?.options?.enableScripts) {
		webview.options = {
			enableScripts: true,
		};
	}
	const htmlContent =
		overwriteHtml ??
		`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Diff Viewer</title>

            <link rel="stylesheet" type="text/css" href="${getResourcesUri(webview, "css", "fontawesome.all.min.css")}"/>
            <link id="bdv-highlight-js" rel="stylesheet" type="text/css" href="${getResourcesUri(webview, "css", "highlight.js-github.min.css")}"/>
            <link rel="stylesheet" type="text/css" href="${getResourcesUri(webview, "css", "diff2html.min.css")}"/>
            <link rel="stylesheet" type="text/css" href="${getResourcesUri(webview, "css", "custom-style.css")}"/>

            <script type="text/javascript" src="${getResourcesUri(webview, "js", "fontawesome.all.min.js")}"></script>
            <script type="text/javascript" src="${getResourcesUri(webview, "js", "jquery.min.js")}"></script>
            <script type="text/javascript" src="${getResourcesUri(webview, "js", "diff2html-ui.min.js")}"></script>
            <script type="text/javascript" src="${getResourcesUri(webview, "js", "diff-viewer-ui.js")}"></script>

            <style id="custom-css-style"></style>
        </head>
        <body id="bdv-body">
            <div id="main-container">
              <div id="diff2html-header">
                <button id="refresh-btn">Refresh</button>
                <select id="diff-mode-select" style="display:none"></select>
                <button id="show-cmd-btn">Show CMD</button><button id="hide-cmd-btn">Hide CMD</button>
                <span class="btn-group"><button id="zoom-in-btn"><i class="fa-solid fa-plus"></i></button>
                <button id="zoom-out-btn"><i class="fa-solid fa-minus"></i></button></span>
                <span id="file-filter-wrap">
                  <input id="file-filter-input" type="text" placeholder="Filter files..." autocomplete="off" spellcheck="false" />
                  <div id="file-filter-dropdown"></div>
                </span>
              </div>
              <div id="diff2html-container"></div>
              <div id="diff2html-footer">
                <div id="cmd-viewer"><span id="cmd-content"></span></div>
              </div>
            </div>
        </body>
        </html>
    `;
	webview.html = htmlContent;
}

function doAction(action: string, actionData: any) {
	webviewPanel?.webview.postMessage({ command: action, data: actionData });
	webviewView?.webview.postMessage({ command: action, data: actionData });
}

function handleMessageFromWebview(message: any) {
	// Handle messages received from the webview
	if (message.command === "refresh") {
		refresh(message.isForced);
	} else if (message.command === "openFile") {
		openFile(message.relativeFilePath);
	} else if (message.command === "revertFile") {
		revertFile(message.relativeFilePath, message.fileChangeState as Types.FileChangeState, data.config?.showRevertFileWarning);
	} else if (message.command === "revertHunk") {
		revertHunk(message.relativeFilePath, message.hunkHeader, message.fileChangeState as Types.FileChangeState, data.config?.showRevertFileWarning);
	} else if (message.command === "copyFilePath") {
		copyFilePath(message.relativeFilePath);
	} else if (message.command === "toggleViewedFile") {
		toggleViewedFile(message.relativeFilePath, message.isViewed);
	} else if (message.command === "setZoomNum") {
		setZoomNum(message.zoomNum);
	} else if (message.command === "setShowCmd") {
		setShowCmd(message.showCmd);
	} else if (message.command === "gitAdd") {
		gitAdd(message.relativeFilePath, message.fileChangeState as Types.FileChangeState);
	} else if (message.command === "gitUnstage") {
		gitUnstage(message.relativeFilePath, message.fileChangeState as Types.FileChangeState);
	} else if (message.command === "switchDiffMode") {
		switchDiffMode(message.viewMode as "unstaged" | "staged");
	} else if (message.command === "showLog") {
		showLog(message.relativeFilePath);
	}
}

function refreshData() {
	if (data.cmd) {
		updateDataByCmd(data.cmd);
	}
}

function autoRefresh() {
	if (data.config?.isAutoRefresh) {
		refresh(false);
	}
}

function refresh(isForced: boolean) {
	const oldDataStr = JSON.stringify(data);
	refreshData();
	if (isForced || oldDataStr !== JSON.stringify(data)) {
		doAction("showDiffContent", data);
	}
}

function getResourcesUri(webview: vscode.Webview, ...pathComps: string[]): vscode.Uri {
	if (webview) {
		return webview.asWebviewUri(getUri("resources", ...pathComps));
	} else {
		utils.throwError("Cannot get panel when getting resources URI" + pathComps);
	}
}

function getUri(...pathComps: string[]): vscode.Uri {
	return vscode.Uri.file(path.join(extensionPath, ...pathComps));
}

function copyFilePath(path: string) {
	const filePath = utils.getAbsolutePath(path);
	vscode.env.clipboard.writeText(filePath);
}

function toggleViewedFile(relativeFilePath: string, isViewed: boolean) {
	if (!data.userAction) {
		data.userAction = { viewedFiles: [] };
	}

	if (isViewed) {
		data.userAction.viewedFiles = data.userAction.viewedFiles ? data.userAction.viewedFiles.concat([relativeFilePath]) : [relativeFilePath];
	} else {
		data.userAction.viewedFiles = data.userAction.viewedFiles ? data.userAction.viewedFiles.filter((x) => x !== relativeFilePath) : [];
	}
}

function setZoomNum(zoomNum: number) {
	if (!data.userAction) {
		data.userAction = { zoomNum };
	} else {
		data.userAction.zoomNum = zoomNum;
	}
}

function setShowCmd(showCmd: boolean) {
	if (!data.userAction) {
		data.userAction = { showCmd };
	} else {
		data.userAction.showCmd = showCmd;
	}
}

function openFile(relativePath: string) {
	const filePath = vscode.Uri.file(utils.getAbsolutePath(relativePath));
	vscode.workspace.openTextDocument(filePath).then((doc) => {
		vscode.window.showTextDocument(doc);
	});
}

function revertFile(relativePath: string, fileChangeState: Types.FileChangeState, withWarning: boolean | undefined) {
	const fileDiff: FileDiff | undefined = getFileDiff(relativePath, fileChangeState);
	if (!fileDiff) {
		return;
	} else {
		revertAction(fileDiff.getRawFileDiff(), "file", withWarning, `Path: ${relativePath}`);
	}
}

function getFileDiff(relativePath: string, fileChangeState: Types.FileChangeState): FileDiff | undefined {
	let targetFilePathA: string;
	let targetFilePathB: string;

	if (fileChangeState === "CHANGED" || fileChangeState === "ADDED" || fileChangeState === "DELETED") {
		targetFilePathA = relativePath;
		targetFilePathB = relativePath;
	} else if (fileChangeState === "MOVED") {
		[targetFilePathA, targetFilePathB] = getFilepathsForMovedAction(relativePath);
	} else {
		vscode.window.showErrorMessage(`Cannot revert a file for [${fileChangeState}]`);
		return;
	}

	return new FileDiff(data.diffContent, targetFilePathA, targetFilePathB);
}

function revertHunk(relativePath: string, hunkHeader: string, fileChangeState: Types.FileChangeState, withWarning: boolean | undefined) {
	const fileDiff: FileDiff | undefined = getFileDiff(relativePath, fileChangeState);
	if (!fileDiff) {
		return;
	} else {
		revertAction(fileDiff.getUsableHunkDiffByHunkHeader(hunkHeader), "hunk", withWarning, `Hunk Header: ${hunkHeader}`);
	}
}

function toggleFileDiff() {
	if (data.viewMode === "file" && webviewPanel) {
		webviewPanel.dispose();
		return;
	}
	const filePath = vscode.window.activeTextEditor?.document.uri.fsPath ?? lastActiveFilePath;
	if (!filePath) {
		vscode.window.showWarningMessage("No active file to view diff for.");
		return;
	}
	prepareViewerWebview();
	updateDataByCmd(utils.viewGitDiffByPath(filePath));
	data.viewMode = "file";
	doAction("showDiffContent", data);
}

async function showLog(relativePath: string) {
	const logCmd = `git --no-pager log --follow --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' -- '${relativePath}'`;
	const commits = utils.execShell(logCmd).split("\n").filter(Boolean);

	if (!commits.length) {
		vscode.window.showInformationMessage(`No commits found for ${relativePath}`);
		return;
	}

	const selected = await vscode.window.showQuickPick(commits, { placeHolder: `Select a commit for ${relativePath}` });
	if (!selected) { return; }

	const hash = getCommitHash(selected);
	updateDataByCmd(`git diff ${hash}~ ${hash} -- '${relativePath}'`);
	data.viewMode = "commit";
	doAction("showDiffContent", data);
}

function switchDiffMode(viewMode: "unstaged" | "staged") {
	if (viewMode === "staged") {
		updateDataByCmd(utils.viewStagedDiffForRepo());
		data.viewMode = "staged";
	} else {
		updateDataByCmd(utils.viewGitDiffForRepo());
		data.viewMode = "unstaged";
	}
	doAction("showDiffContent", data);
}

function gitUnstage(relativePath: string, fileChangeState: Types.FileChangeState) {
	let cmd: string;
	if (fileChangeState === "MOVED") {
		const [pathA, pathB] = getFilepathsForMovedAction(relativePath);
		cmd = `git restore --staged -- '${utils.getAbsolutePath(pathA)}' '${utils.getAbsolutePath(pathB)}'`;
	} else {
		cmd = `git restore --staged -- '${utils.getAbsolutePath(relativePath)}'`;
	}
	utils.execShell(cmd);
	refresh(true);
}

function gitAdd(relativePath: string, fileChangeState: Types.FileChangeState) {
	let cmd: string;
	if (fileChangeState === "MOVED") {
		const [pathA, pathB] = getFilepathsForMovedAction(relativePath);
		cmd = `git add -A -- '${utils.getAbsolutePath(pathA)}' '${utils.getAbsolutePath(pathB)}'`;
	} else {
		cmd = `git add -A -- '${utils.getAbsolutePath(relativePath)}'`;
	}
	utils.execShell(cmd);
	refresh(true);
}

function revertAction(diffContent: string, type: "file" | "hunk", withWarning: boolean | undefined, extraInfo: string) {
	const tmpDiffFilePath = utils.createTempFile(`${uuidv4()}.diff`, diffContent);
	const cmd = `git apply -R -- ${tmpDiffFilePath}`;

	const revertJob = () => {
		utils.execShell(cmd);
		refresh(true);
	};

	if (withWarning) {
		vscode.window.showInformationMessage(`Do you want to revert selected ${type}? - [${extraInfo}]`, "Yes", "No").then((answer) => {
			if (answer === "Yes") {
				revertJob();
			}
		});
	} else {
		revertJob();
	}
}

function getFilepathsForMovedAction(str: string): string[] {
	const match = str.match(/^(?:([^{}]*)\{)?([^{}]*) → ([^{}]*)\}?$/);
	if (!match) {
		throw new Error('Invalid format: Expected "filename1 → filename2 or sharePath/{filename1 → filename2}"');
	}
	const sharedPath = match[1] ? match[1].trim() : "";
	return [`${sharedPath}${match[2].trim()}`, `${sharedPath}${match[3].trim()}`];
}

class DiffViewerProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = "better-diff-viewer.bdvView";

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(inWebviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
		webviewView = inWebviewView;
	}
}

function updateDataForConfig() {
	data.config = config.getAppConfig();
}
