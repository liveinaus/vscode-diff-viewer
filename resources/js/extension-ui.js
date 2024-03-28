const vscode = acquireVsCodeApi();

const testVariableA = "test";
const diff2htmlContainerId = "#diff2html-container";
let diff2htmlUi;

let data = {};

window.addEventListener("message", (event) => {
	const uiMessage = event.data;
	if (uiMessage.command === "showDiffContent") {
		if (uiMessage?.data?.diffContent) {
			data = uiMessage?.data;
			showDiff2HtmlUi();
		} else {
			data = uiMessage?.data;
			jQuery(diff2htmlContainerId).html("<span id='no-diff-available'>No Diff Available.</span>");
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
	jQuery("#show-cmd-btn").on("click", toggleCmdViewer);
	jQuery("#diff2html-container").on("click", ".custom-git-btn", clickedCustomGitBtn);
}

function showDiff2HtmlUi() {
	const { diffContent, config, cmd } = data;
	console.log("config", config);
	jQuery("#custom-css-style").html(config.customCssStyle);
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

function toggleCmdViewer() {
	jQuery("#cmd-viewer").toggle();
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
