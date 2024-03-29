import * as path from "path";
import * as vscode from "vscode";
import * as utils from "./utils";

let extensionPath: string;
let panel: vscode.WebviewPanel | undefined;
let data: DiffViewerData = {};
let lastUserCustomCmd: string;

type DiffViewerData = {
	cmd?: string;
	diffContent?: string;
	config?: BetterDiffViewerOptions;
	userAction?: UserAction;
};
let userConfig: vscode.WorkspaceConfiguration;

type UserAction = {
	viewedFiles?: string[];
	zoomNum?: number;
	showCmd?: boolean;
};

type BetterDiffViewerOptions = {
	isAutoRefresh?: boolean;
	showBtnIcon?: boolean;
	showBtnLongDesc?: boolean;
	showBtnShortDesc?: boolean;
	customCssStyle?: string;
	preserveViewedFileState?: boolean;
	showCmd?: boolean;
	zoomNum?: number;
	"diff2html-ui": {};
};

export function activate(context: vscode.ExtensionContext) {
	addToolbarBtns(context);
	extensionPath = context.extensionPath;
	updateDataForConfig();
	context.subscriptions.push(
		vscode.commands.registerCommand("better-diff-viewer.viewDiffFile", viewDiffFile),
		vscode.commands.registerCommand("better-diff-viewer.viewRepoGitDiff", viewRepoGitDiff),
		vscode.commands.registerCommand("better-diff-viewer.viewGitDiffForFile", viewGitDiffForFile),
		vscode.commands.registerCommand("better-diff-viewer.viewCustomDiffFromCmd", viewCustomDiffFromCmd)
	);
	vscode.workspace.onDidSaveTextDocument(autoRefresh);
	vscode.workspace.onDidOpenTextDocument(actionWhenFileExtensionDetected);
}

function getDefaultViewMode(): "dark" | "light" {
	return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? "dark" : "light";
}

function getUserDefinedViewMode(): "dark" | "light" {
	const userConfigColorSchema = userConfig.get("diff2html-ui.colorScheme");
	if (userConfigColorSchema && (userConfigColorSchema === "dark" || userConfigColorSchema === "light")) {
		return userConfigColorSchema;
	} else {
		return getDefaultViewMode();
	}
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

function updateDataForConfig() {
	userConfig = vscode.workspace.getConfiguration("better-diff-viewer");
	const defaultDiff2HtmlUiOptions = { fileListToggle: true, fileListStartVisible: false, fileContentToggle: true, matching: "lines", outputFormat: "line-by-line", synchronisedScroll: true, highlight: true, renderNothingWhenEmpty: false };
	const userDiff2HtmlUiConfigObj = {
		outputFormat: getStringUserConfig("diff2html-ui.outputFormat"),
		drawFileList: userConfig.get("diff2html-ui.drawFileList"),
		srcPrefix: getStringUserConfig("diff2html-ui.srcPrefix"),
		dstPrefix: getStringUserConfig("diff2html-ui.dstPrefix"),
		diffMaxChanges: userConfig.get("diff2html-ui.diffMaxChanges"),
		diffMaxLineLength: userConfig.get("diff2html-ui.diffMaxLineLength"),
		diffTooBigMessage: getStringUserConfig("diff2html-ui.diffTooBigMessage"),
		matching: getStringUserConfig("diff2html-ui.matching"),
		matchWordsThreshold: userConfig.get("diff2html-ui.matchWordsThreshold"),
		maxLineLengthHighlight: userConfig.get("diff2html-ui.maxLineLengthHighlight"),
		diffStyle: userConfig.get("diff2html-ui.diffStyle"),
		renderNothingWhenEmpty: userConfig.get("diff2html-ui.renderNothingWhenEmpty"),
		matchingMaxComparisons: userConfig.get("diff2html-ui.matchingMaxComparisons"),
		maxLineSizeInBlockForComparison: userConfig.get("diff2html-ui.maxLineSizeInBlockForComparison"),
		compiledTemplates: userConfig.get("diff2html-ui.compiledTemplates"),
		rawTemplates: userConfig.get("diff2html-ui.rawTemplates"),
		highlightLanguages: userConfig.get("diff2html-ui.highlightLanguages"),
		colorScheme: getUserDefinedViewMode(),
		synchronisedScroll: userConfig.get("diff2html-ui.synchronisedScroll"),
		highlight: userConfig.get("diff2html-ui.highlight"),
		fileListToggle: userConfig.get("diff2html-ui.fileListToggle"),
		fileListStartVisible: userConfig.get("diff2html-ui.fileListStartVisible"),
		fileContentToggle: userConfig.get("diff2html-ui.fileContentToggle"),
		stickyFileHeaders: userConfig.get("diff2html-ui.stickyFileHeaders"),
	};

	const defaultConfigObj: BetterDiffViewerOptions = {
		"diff2html-ui": mergeConfig(defaultDiff2HtmlUiOptions, userDiff2HtmlUiConfigObj),
		isAutoRefresh: true,
		showBtnIcon: true,
		showBtnLongDesc: true,
		showBtnShortDesc: false,
		customCssStyle: "",
		preserveViewedFileState: true,
		showCmd: true,
		zoomNum: 0.9,
	};

	const userConfigObj = {
		isAutoRefresh: getBooleanUserConfig("isAutoRefresh"),
		showBtnIcon: getBooleanUserConfig("showBtnIcon"),
		showBtnLongDesc: getBooleanUserConfig("showBtnLongDesc"),
		showBtnShortDesc: getBooleanUserConfig("showBtnShortDesc"),
		customCssStyle: getStringUserConfig("customCssStyle"),
		preserveViewedFileState: getBooleanUserConfig("preserveViewedFileState"),
		showCmd: getBooleanUserConfig("showCmd"),
		zoomNum: getNumberUserConfig("zoomNum"),
	};

	data.config = mergeConfig(defaultConfigObj, userConfigObj);
}

function getBooleanUserConfig(key: string): boolean | undefined {
	if (typeof userConfig.get(key) === "undefined") {
		return undefined;
	} else {
		return userConfig.get(key) === "true" || userConfig.get(key) === true;
	}
}

function getNumberUserConfig(key: string): number | undefined {
	if (typeof userConfig.get(key) === "undefined") {
		return undefined;
	} else {
		return Number(userConfig.get(key));
	}
}

function getStringUserConfig(key: string): string | undefined {
	if (typeof userConfig.get(key) === "undefined") {
		return undefined;
	} else {
		return String(userConfig.get(key));
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	panel = undefined;
	data = {};
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
	getOrCreateViewPanel();
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
		getOrCreateViewPanel();
		updateDataByCmd(`${preCmd} ${customCmd}`);
		doAction("showDiffContent", data);
		lastUserCustomCmd = customCmd;
	} else {
		vscode.window.showWarningMessage("No diff command provided.");
	}
}

function viewRepoGitDiff() {
	getOrCreateViewPanel();
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
	getOrCreateViewPanel();
	updateDataByDiffContent(document.getText());
	doAction("showDiffContent", data);
}

function getOrCreateViewPanel() {
	if (!panel) {
		panel = vscode.window.createWebviewPanel("diffViewer", "Diff Viewer", { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, { enableScripts: true, enableFindWidget: true });
		panel.onDidDispose(() => {
			panel = undefined;
		});
		// Subscribe to messages from the webview
		panel.webview.onDidReceiveMessage(handleMessageFromWebview);

		const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Diff Viewer</title>

            <link rel="stylesheet" type="text/css" href="${getResourcesUri("css", "fontawesome.all.min.css")}"/>
            <link id="bdv-highlight-js" rel="stylesheet" type="text/css" href="${getResourcesUri("css", "highlight.js-github.min.css")}"/>
            <link rel="stylesheet" type="text/css" href="${getResourcesUri("css", "diff2html.min.css")}"/>
            <link rel="stylesheet" type="text/css" href="${getResourcesUri("css", "custom-style.css")}"/>

            <script type="text/javascript" src="${getResourcesUri("js", "fontawesome.all.min.js")}"></script>
            <script type="text/javascript" src="${getResourcesUri("js", "jquery.min.js")}"></script>
            <script type="text/javascript" src="${getResourcesUri("js", "diff2html-ui.min.js")}"></script>
            <script type="text/javascript" src="${getResourcesUri("js", "extension-ui.js")}"></script>

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
		panel.webview.html = htmlContent;
	}

	panel.reveal(vscode.ViewColumn.Beside, true);
	return panel;
}

function mergeConfig(inDefaultConfig: any, inUserConfig: any) {
	const mergedObject = {
		...inDefaultConfig,
		...Object.fromEntries(Object.entries(inUserConfig).map(([key, value]) => [key, value ?? inDefaultConfig[key]])),
	};
	return mergedObject;
}

function doAction(action: string, actionData: any) {
	panel?.webview.postMessage({ command: action, data: actionData });
}

function handleMessageFromWebview(message: any) {
	// Handle messages received from the webview
	if (message.command === "refresh") {
		refresh(message.isForced);
	} else if (message.command === "openFile") {
		openFile(message.relativeFilePath);
	} else if (message.command === "revertFile") {
		const showRevertFileWarning: boolean = userConfig.get("showRevertFileWarning") ? Boolean(userConfig.get("showRevertFileWarning")) : true;
		revertFile(message.relativeFilePath, showRevertFileWarning);
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

function getResourcesUri(...pathComps: string[]): vscode.Uri {
	if (panel) {
		return panel.webview.asWebviewUri(getUri("resources", ...pathComps));
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

function revertFile(relativePath: string, withWarning: boolean) {
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
