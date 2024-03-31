import * as vscode from "vscode";
import * as diffViewer from "./diff-viewer-view";

export function activate(context: vscode.ExtensionContext) {
	diffViewer.activate(context);
}

export function deactivate() {
	diffViewer.deactivate();
}
