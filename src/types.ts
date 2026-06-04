export type DiffViewerData = {
	cmd?: string;
	diffContent?: string;
	config?: BetterDiffViewerOptions;
	userAction?: UserAction;
	viewMode?: "unstaged" | "staged";
};

export type UserAction = {
	viewedFiles?: string[];
	zoomNum?: number;
	showCmd?: boolean;
};

export type BetterDiffViewerOptions = {
	isAutoRefresh?: boolean;
	showBtnIcon?: boolean;
	showBtnLongDesc?: boolean;
	showBtnShortDesc?: boolean;
	customCssStyle?: string;
	preserveViewedFileState?: boolean;
	enableRevertHunk?: boolean;
	showCmd?: boolean;
	zoomNum?: number;
	showRevertFileWarning?: boolean;
	maxDiffLinesPerFile?: number;
	componentsDisplayAtEditor?: string[];
	componentsDisplayAtPanel?: string[];
	"diff2html-ui": {};
};

export type FileChangeState = "ADDED" | "MOVED" | "CHANGED" | "DELETED" | "UNKNOWN";
