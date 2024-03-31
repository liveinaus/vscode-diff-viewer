export type DiffViewerData = {
	cmd?: string;
	diffContent?: string;
	config?: BetterDiffViewerOptions;
	userAction?: UserAction;
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
	showCmd?: boolean;
	zoomNum?: number;
	showRevertFileWarning?: boolean;
	componentsDisplayAtEditor?: string[];
	componentsDisplayAtPanel?: string[];
	"diff2html-ui": {};
};
