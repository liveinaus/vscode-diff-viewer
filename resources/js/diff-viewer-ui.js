const vscode = acquireVsCodeApi();
const diff2htmlContainerId = "#diff2html-container";
let diff2htmlUi;
let data = {};

window.addEventListener("message", (event) => {
	const uiMessage = event.data;
	if (uiMessage.command === "showDiffContent") {
		if (uiMessage?.data) {
			data = uiMessage?.data;
			showDiff2HtmlUi();
		}
	}
});

jQuery(function () {
	refresh(true);
	addButtonListeners();
});

function addButtonListeners() {
	jQuery("#refresh-btn").on("click", () => {
		refresh(true);
	});

	jQuery("#show-cmd-btn").on("click", () => {
		setShowCmd(true);
	});

	jQuery("#hide-cmd-btn").on("click", () => {
		setShowCmd(false);
	});

	jQuery("#diff2html-container").on("click", ".custom-git-btn", clickedCustomGitBtn);

	jQuery("#zoom-in-btn").on("click", () => {
		setZoom(true);
	});
	jQuery("#zoom-out-btn").on("click", () => {
		setZoom(false);
	});
}

function setShowCmd(showCmd) {
	const command = "setShowCmd";
	displayShowCmd(showCmd);
	vscode.postMessage({ command, showCmd });
}

function displayShowCmd(showCmd) {
	jQuery("#cmd-viewer").toggle(showCmd);
	jQuery("#show-cmd-btn").toggle(!showCmd);
	jQuery("#hide-cmd-btn").toggle(showCmd);
}

function setZoom(isIn) {
	const step = 0.1;
	const command = "setZoomNum";
	let zoomNum = data.zoomNum;
	if (isIn) {
		zoomNum += step;
	} else if (data.zoomNum > step) {
		zoomNum -= step;
	}
	displayZoomNum(zoomNum);
	vscode.postMessage({ command, zoomNum });
}

function displayZoomNum(zoomNum) {
	jQuery("#diff2html-container").css("zoom", zoomNum).css("transform", `scale${zoomNum}`).css("-moz-transform", `scale${zoomNum}`);
	data.zoomNum = zoomNum;
}

function displayNoCmd() {
	jQuery("#show-cmd-btn").toggle(false);
	jQuery("#hide-cmd-btn").toggle(false);
}

function showDiff2HtmlUi() {
	const { diffContent, config, cmd, userAction } = data;
	jQuery("#custom-css-style").html(config.customCssStyle);

	if (cmd) {
		displayShowCmd(Boolean(userAction?.showCmd));
	} else {
		displayNoCmd(); //No CMD is applicable
	}

	displayZoomNum(userAction?.zoomNum ? userAction.zoomNum : 0.9);

	displayColorScheme(config["diff2html-ui"].colorScheme);

	diff2htmlUi = new Diff2HtmlUI(jQuery(diff2htmlContainerId)[0], diffContent, config["diff2html-ui"]);
	diff2htmlUi.draw();
	if (cmd) {
		jQuery("#cmd-content").html(cmd); //update cmd
	} else {
		jQuery("#cmd-content").html(""); //clear cmd
	}

	addUiElementsToDiff2HtmlUi();
	jQuery(".custom-git-btn .btn-icon").toggle(config.showBtnIcon);
	jQuery(".custom-git-btn .btn-long-desc").toggle(config.showBtnLongDesc);
	jQuery(".custom-git-btn .btn-short-desc").toggle(config.showBtnShortDesc);

	if (config.preserveViewedFileState) {
		prepareFileViewed();
	}
}

function displayColorScheme(colorScheme) {
	jQuery("#bdv-body")
		.removeClass(function (index, className) {
			return (className.match(/(^|\s)bdv-cs-\S+/g) || []).join(" ");
		})
		.addClass(`bdv-cs-${colorScheme}`);

	jQuery("#bdv-highlight-js").prop("media", colorScheme === "dark" ? "screen and (prefers-color-scheme: dark)" : "");
}

function prepareFileViewed() {
	//Restore viewed file status
	jQuery(".d2h-file-collapse-input").each(function () {
		const relativeFilePath = jQuery(this).closest(".d2h-file-wrapper").find(".d2h-file-name").html();
		if (data && data.userAction && data.userAction.viewedFiles && data.userAction.viewedFiles.indexOf(relativeFilePath) > -1) {
			jQuery(this).prop("checked", true);
			jQuery(this).closest(".d2h-file-collapse").addClass("d2h-selected");
			jQuery(this).closest(".d2h-file-wrapper").find(".d2h-file-diff").addClass("d2h-d-none");
		}
	});

	//Add event listener
	jQuery(".d2h-file-collapse-input").change(function (evt) {
		const command = "toggleViewedFile";
		const isViewed = this.checked;
		const relativeFilePath = jQuery(this).closest(".d2h-file-wrapper").find(".d2h-file-name").html();
		vscode.postMessage({ command, relativeFilePath, isViewed });
	});
}

function clickedCustomGitBtn(evt) {
	const command = jQuery(this).data("command");
	const fileState = jQuery(this).data("fileState");
	const relativeFilePath = jQuery(this).data("relativeFilePath");
	vscode.postMessage({ command, fileState, relativeFilePath });
}

function refresh(isForced = false) {
	const command = "refresh";
	vscode.postMessage({ command, isForced });
}

function addUiElementsToDiff2HtmlUi() {
	jQuery(".d2h-file-name-wrapper").each(function () {
		const relativeFilePath = jQuery(this).find(".d2h-file-name").html();
		const fileState = getFileState(this);
		addCustomGitBtn({ selector: this, action: "openFile", title: "Open File", relativeFilePath: relativeFilePath, fileState: fileState, iconClass: "fa-solid fa-folder-open", shortDesc: "O", longDesc: "Open" });
		addCustomGitBtn({ selector: this, action: "copyFilePath", title: "Copy File Path", relativeFilePath: relativeFilePath, fileState: fileState, iconClass: "fa-solid fa-copy", shortDesc: "C", longDesc: "Copy" });
		addCustomGitBtn({ selector: this, btnClass: "custom-git-danger-btn", action: "revertFile", title: "Revert File", relativeFilePath: relativeFilePath, fileState: fileState, iconClass: "fa-solid fa-rotate-left", shortDesc: "R", longDesc: "Revert" });
	});
}

function getFileState(selector) {
	let fileState = "U"; //unknown
	if (jQuery(selector).find(".d2h-deleted").length) {
		fileState = "D";
	} else if (jQuery(selector).find(".d2h-changed").length) {
		fileState = "C";
	} else if (jQuery(selector).find(".d2h-added").length) {
		fileState = "A";
	}
	return fileState;
}

function addCustomGitBtn(options) {
	const { selector, action, title, relativeFilePath, fileState, iconClass, shortDesc, longDesc, btnClass } = options;
	jQuery(selector).prepend(
		`<button class="custom-git-btn ${btnClass}" data-command="${action}" title="${title}" data-relative-file-path="${relativeFilePath}" data-file-state="${fileState}" ><span class="btn-icon"><i class="${iconClass}"></i></span><span class="btn-short-desc">${shortDesc}</span><span class="btn-long-desc">${longDesc}</span></button>`
	);
}
