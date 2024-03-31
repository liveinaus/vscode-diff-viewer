import * as path from "path";
import * as vscode from "vscode";
import * as utils from "./utils";
import * as Types from "./types";
import * as config from "./config";

let extensionPath: string;
let webviewPanel: vscode.WebviewPanel | undefined;
let webviewView: vscode.WebviewView | undefined;
let data: Types.DiffViewerData = {};
let lastUserCustomCmd: string;

export function activate(context: vscode.ExtensionContext) {
	addToolbarBtns(context);
	extensionPath = context.extensionPath;
	updateDataForConfig();

	const provider = new DiffViewerProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.commands.registerCommand("better-diff-viewer.viewDiffFile", viewDiffFile),
		vscode.commands.registerCommand("better-diff-viewer.viewRepoGitDiff", viewRepoGitDiff),
		vscode.commands.registerCommand("better-diff-viewer.viewGitDiffForFile", viewGitDiffForFile),
		vscode.commands.registerCommand("better-diff-viewer.viewCustomDiffFromCmd", viewCustomDiffFromCmd)
	);
	vscode.workspace.onDidSaveTextDocument(autoRefresh);
	vscode.workspace.onDidOpenTextDocument(actionWhenFileExtensionDetected);

	context.subscriptions.push(vscode.window.registerWebviewViewProvider(DiffViewerProvider.viewType, provider));
}

export function deactivate() {
	webviewPanel = undefined;
	webviewView = undefined;
	data = {};
}

function addToolbarBtns(context: vscode.ExtensionContext) {
	// Create a status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

	// Set the text and tooltip for the status bar item
	statusBarItem.text = "Uncommitted";
	statusBarItem.tooltip = "View Uncommitted Changes";

	// Assign a command to the status bar item
	statusBarItem.command = "better-diff-viewer.viewRepoGitDiff";

	// Show the status bar item
	statusBarItem.show();

	// Register a disposable to dispose the status bar item when the extension is deactivated
	context.subscriptions.push(statusBarItem);
}

function actionWhenFileExtensionDetected(document: any) {
	if (document.languageId === "diff" || document.languageId === "plaintext") {
		if (document.fileName.endsWith("diff") || document.fileName.endsWith(".patch")) {
			const textDoc: vscode.TextDocument = document as vscode.TextDocument;
			viewDiffDocument(textDoc);
		}
	}
}

function updateDataByDiffContent(diffContent: string) {
	data.cmd = undefined;
	data.diffContent = diffContent;
	updateDataForConfig();
}

function updateDataByCmd(cmd: string) {
	data.cmd = cmd;
	data.diffContent = utils.execShell(cmd);
	updateDataForConfig();
}

function viewGitDiffForFile() {
	prepareViewerWebview();
	const editor = vscode.window.activeTextEditor;
	const filePath = editor?.document.uri.fsPath;
	if (filePath) {
		updateDataByCmd(utils.viewGitDiffByPath(filePath));
		doAction("showDiffContent", data);
	} else {
		utils.throwError("cannot find file path from current active text editor");
	}
}

async function viewCustomDiffFromCmd() {
	const preCmd = `cd ${utils.getRepoPath()};`;
	const customCmd = await vscode.window.showInputBox({
		prompt: "Enter your custom diff command",
		placeHolder: "For example: git diff HEAD <file_name>",
		value: lastUserCustomCmd, //default to last custom cmd
	});

	if (customCmd) {
		prepareViewerWebview();
		updateDataByCmd(`${preCmd} ${customCmd}`);
		doAction("showDiffContent", data);
		lastUserCustomCmd = customCmd;
	} else {
		vscode.window.showWarningMessage("No diff command provided.");
	}
}

function viewRepoGitDiff() {
	prepareViewerWebview();
	updateDataByCmd(utils.viewGitDiffForRepo());
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
	doAction("showDiffContent", data);
}

function prepareViewerWebview() {
	if (!webviewPanel) {
		webviewPanel = vscode.window.createWebviewPanel("diffViewer", "Diff Viewer", { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, { enableScripts: true, enableFindWidget: true });
		webviewPanel.onDidDispose(() => {
			webviewPanel = undefined;
		});
		prepareWebviewInner(webviewPanel.webview);
	} else {
		webviewPanel.reveal(vscode.ViewColumn.Beside, true);
	}

	if (webviewView?.webview && !webviewView?.webview.html) {
		prepareWebviewInner(webviewView?.webview);
	}
}

function prepareWebviewInner(webview: vscode.Webview) {
	webview.onDidReceiveMessage(handleMessageFromWebview);
	if (!webview?.options?.enableScripts) {
		webview.options = {
			enableScripts: true,
		};
	}
	const htmlContent = `
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
                <button id="show-cmd-btn">Show CMD</button><button id="hide-cmd-btn">Hide CMD</button>
                <span class="btn-group"><button id="zoom-in-btn"><i class="fa-solid fa-plus"></i></button>
                <button id="zoom-out-btn"><i class="fa-solid fa-minus"></i></button></span>
              </div>
              <div id="diff2html-container"></div>
              <div id="diff2html-footer">
                <div id="cmd-viewer"><span id="cmd-content"></span></div>
              </div>
            </div>
        </body>
        </html>
    `;
	//update htmlContent by settings
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
		revertFile(message.relativeFilePath, data.config?.showRevertFileWarning);
	} else if (message.command === "copyFilePath") {
		copyFilePath(message.relativeFilePath);
	} else if (message.command === "toggleViewedFile") {
		toggleViewedFile(message.relativeFilePath, message.isViewed);
	} else if (message.command === "setZoomNum") {
		setZoomNum(message.zoomNum);
	} else if (message.command === "setShowCmd") {
		setShowCmd(message.showCmd);
	}
}

function refreshData() {
	if (data?.cmd) {
		updateDataByCmd(data.cmd);
	}
}

function autoRefresh() {
	if (data?.config?.isAutoRefresh) {
		refresh(false);
	}
}

function refresh(isForced: any) {
	const oldDataStr = JSON.stringify(data);
	refreshData();
	if (isForced || !oldDataStr || oldDataStr !== JSON.stringify(data)) {
		doAction("showDiffContent", data);
	} else {
		//do nothing - there is no change to the data or config
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
	if (!data) {
		data = {};
	}

	if (!data?.userAction) {
		data.userAction = { viewedFiles: [] };
	}

	if (isViewed) {
		//add
		data.userAction.viewedFiles = data.userAction.viewedFiles ? data.userAction.viewedFiles.concat([relativeFilePath]) : [relativeFilePath];
	} else {
		//remove
		data.userAction.viewedFiles = data.userAction.viewedFiles ? data.userAction.viewedFiles.filter((x) => x !== relativeFilePath) : [];
	}
}

function setZoomNum(zoomNum: number) {
	if (!data) {
		data = {};
	}

	if (!data?.userAction) {
		data.userAction = { zoomNum: zoomNum };
	} else {
		data.userAction.zoomNum = zoomNum;
	}
}

function setShowCmd(showCmd: boolean) {
	if (!data) {
		data = {};
	}

	if (!data?.userAction) {
		data.userAction = { showCmd: showCmd };
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

function revertFile(relativePath: string, withWarning: boolean | undefined) {
	const filePath = utils.getAbsolutePath(relativePath);
	const revertFileAction = () => {
		const cmd = "cd " + utils.getRepoPath() + "; git restore " + filePath;
		utils.execShell(cmd);
		refresh(true);
	};
	if (withWarning) {
		vscode.window.showInformationMessage("Do you want to revert selected file?" + relativePath, "Yes", "No").then((answer) => {
			if (answer === "Yes") {
				revertFileAction();
			}
		});
	} else {
		revertFileAction();
	}
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
