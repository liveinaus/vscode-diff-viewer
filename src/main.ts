import * as vscode from "vscode";
import * as diffViewer from "./diff-viewer-view";
import * as utils from "./utils";

export function activate(context: vscode.ExtensionContext) {
	utils.initUtils(context);
	diffViewer.activate(context);
}

export function deactivate() {
	diffViewer.deactivate();
}
