import * as vscode from "vscode";
import * as Types from "./types";
import * as diffViewerView from "./diff-viewer-view";
let userConfig: vscode.WorkspaceConfiguration;

export function getAppConfig(): Types.BetterDiffViewerOptions {
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

	const defaultConfigObj: Types.BetterDiffViewerOptions = {
		"diff2html-ui": mergeConfig(defaultDiff2HtmlUiOptions, userDiff2HtmlUiConfigObj),
		isAutoRefresh: true,
		showBtnIcon: true,
		showBtnLongDesc: true,
		showBtnShortDesc: false,
		customCssStyle: "",
		preserveViewedFileState: true,
		showCmd: true,
		zoomNum: 0.9,
		showRevertFileWarning: true,
		componentsDisplayAtEditor: [diffViewerView.componentCode],
		componentsDisplayAtPanel: [],
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
		showRevertFileWarning: getBooleanUserConfig("showRevertFileWarning"),
		componentsDisplayAtEditor: getArrayUserConfig("componentsDisplayAtEditor"),
		componentsDisplayAtPanel: getArrayUserConfig("componentsDisplayAtPanel"),
	};

	return mergeConfig(defaultConfigObj, userConfigObj);
}

function getArrayUserConfig(key: string): string[] | undefined {
	if (typeof userConfig.get(key) === "undefined") {
		return undefined;
	} else {
		return userConfig.get(key);
	}
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

function getUserDefinedViewMode(): "dark" | "light" {
	const userConfigColorSchema = userConfig.get("diff2html-ui.colorScheme");
	if (userConfigColorSchema && (userConfigColorSchema === "dark" || userConfigColorSchema === "light")) {
		return userConfigColorSchema;
	} else {
		return getDefaultViewMode();
	}
}

function getDefaultViewMode(): "dark" | "light" {
	return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? "dark" : "light";
}

function mergeConfig(inDefaultConfig: any, inUserConfig: any) {
	const mergedObject = {
		...inDefaultConfig,
		...Object.fromEntries(Object.entries(inUserConfig).map(([key, value]) => [key, value ?? inDefaultConfig[key]])),
	};
	return mergedObject;
}
