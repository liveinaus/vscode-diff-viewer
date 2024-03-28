// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as diff2html from "diff2html";
import { type Diff2HtmlConfig } from "diff2html";

import * as fs from "fs";
import * as path from "path";

let extensionPath: string;
let panel: vscode.WebviewPanel;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "better-diff-viewer" is now active!');
	extensionPath = context.extensionPath;
	let disposable = vscode.commands.registerCommand("better-diff-viewer.viewDiff", () => {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage("No active text editor found.");
			return;
		}

		// Show diff in a webview
		panel = vscode.window.createWebviewPanel("diffViewer", "Diff Viewer", vscode.ViewColumn.One, {});

		// Read the content of the document
		const content = editor.document.getText();

		const configuration: Diff2HtmlConfig = {
			drawFileList: true,
			matching: "lines",
			outputFormat: "line-by-line",
			renderNothingWhenEmpty: false,
		};

		// Convert diff content to HTML using diff2html
		const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <title>Diff Viewer</title>
                <link rel="stylesheet" type="text/css" href="${getResourcesUri("out.min.css")}">
                <link rel="stylesheet" type="text/css" href="${getResourcesUri("highlight_11.6.0_github.min.css")}" />
                <link rel="stylesheet" type="text/css" href="${getResourcesUri("diff2html.min.css")}" />
            </head>
            <body>
                <!-- Your HTML content here -->
                ${diff2html.html(content, configuration)}
            </body>
            </html>
        `;

		// Set the HTML content
		panel.webview.html = htmlContent;
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getResourcesUri(file: string): vscode.Uri {
	return panel.webview.asWebviewUri(getUri("resources", file));
}

function getUri(...pathComps: string[]): vscode.Uri {
	return vscode.Uri.file(path.join(extensionPath, ...pathComps));
}
