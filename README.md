# Better Diff Viewer

View Git diff in a colorful HTML page via [Diff2Html-UI](https://github.com/rtfpessoa/diff2html).

![Better Diff Viewer screenshot](images/screenshot-0.0.1.png)

## Rationale

Creating a similar diff view panel to [Source Tree](https://www.sourcetreeapp.com).
The aim is to add most of the features which [Source Tree](https://www.sourcetreeapp.com) diff viewer can do.
For example, view Diff in HTML, revert a file ...

## Features

- [x] View .diff/.patch or git diff in Diff2HTML-UI
- [x] View diff for uncommitted changes
- [x] Dark/light/auto mode support
- [x] Diff2Html-UI user configurable settings
- [x] Trigger content refresh manually
- [x] Open a file in editor
- [x] Revert a file
- [x] Copy file path
- [x] Toggle show/hide the command (i.e., git command), which was used to generate the diff result
- [x] Support custom styling - better support for unknown themes
- [x] Support custom user commands, which can be defined by user
- [x] Store users view actions (i.e., remember viewed button for files)
- [x] Zoom in/out
- [ ] View content of a GIT commit
- [ ] Specify panel location (i.e. in editor or panel)
- [ ] Support hunk action - e.g. revert hunk only code
- [ ] Triggering extension commands from bottom toolbar
- [ ] Show and interact with git log tree

## Commands

- `better-diff-viewer.viewDiffFile`: view diff for current .diff/.patch file
- `better-diff-viewer.viewRepoGitDiff`: view Git diff for current repository
- `better-diff-viewer.viewGitDiffForFile`: view Git diff for current file
- `better-diff-viewer.viewCustomDiffFromCmd`: View Diff from a custom command on current repository

## Settings

| Command                                                         | Default Value | Description                                                                                                                  |
| --------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| better-diff-viewer.isAutoRefresh                                | true          | toggle if the view needs to be refreshed when any file get saved                                                             |
| better-diff-viewer.showBtnIcon                                  | true          | show button icon                                                                                                             |
| better-diff-viewer.showBtnLongDesc                              | true          | show button long description                                                                                                 |
| better-diff-viewer.showBtnShortDesc                             | false         | show button short description (for saving spaces)                                                                            |
| better-diff-viewer.customCssStyle                               | ''            | Add custom CSS style for the diff viewer. Please add in one line. For example: ".d2h-file-name{color:cyan !important;}"      |
| better-diff-viewer.preserveViewedFileState                      | true          | Preserve viewed checkbox state after diff viewer refresh                                                                     |
| better-diff-viewer.showCmd                                      | true          | Set the default visibility of the command which used to generate the diff output. The cmd is shown at the bottom of the page |
| better-diff-viewer.zoomNum                                      | 0.9           | Set default zoom level for the viewer                                                                                        |
|                                                                 |               |                                                                                                                              |
| better-diff-viewer.diff2html-ui.outputFormat                    | line-by-line  | line-by-line or side-by-side; a Diff2Html option                                                                             |
| better-diff-viewer.diff2html-ui.drawFileList                    | true          | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.srcPrefix                       | ''            | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.dstPrefix                       | ''            | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.diffMaxChanges                  | undefined     | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.diffMaxLineLength               | undefined     | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.diffTooBigMessage               | N/A           | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.matching                        | lines         | lines, words or none; a Diff2Html option                                                                                     |
| better-diff-viewer.diff2html-ui.matchWordsThreshold             | 0.25          | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.maxLineLengthHighlight          | 10000         | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.diffStyle                       | word          | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.renderNothingWhenEmpty          | false         | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.matchingMaxComparisons          | 2500          | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.maxLineSizeInBlockForComparison | 200           | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.compiledTemplates               | {}            | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.rawTemplates                    | {}            | a Diff2Html option                                                                                                           |
| better-diff-viewer.diff2html-ui.highlightLanguages              | N/A           | a Diff2Html option                                                                                                           |
|                                                                 |               |                                                                                                                              |
| better-diff-viewer.diff2html-ui.colorScheme                     | light         | light, dark or auto; a Diff2Html option values                                                                               |
| better-diff-viewer.diff2html-ui.synchronisedScroll              | true          | a Diff2HtmlUI option                                                                                                         |
| better-diff-viewer.diff2html-ui.highlight                       | true          | a Diff2HtmlUI option                                                                                                         |
| better-diff-viewer.diff2html-ui.fileListToggle                  | true          | a Diff2HtmlUI option                                                                                                         |
| better-diff-viewer.diff2html-ui.fileListStartVisible            | false         | a Diff2HtmlUI option                                                                                                         |
| better-diff-viewer.diff2html-ui.fileContentToggle               | true          | a Diff2HtmlUI option                                                                                                         |
| better-diff-viewer.diff2html-ui.stickyFileHeaders               | true          | a Diff2HtmlUI option                                                                                                         |

## Installation

[Install from Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=SamWang.better-diff-viewer)

## Thanks to Diff2Html

[Goto Diff2Html](https://github.com/rtfpessoa/diff2html)

## Author

Sam Wang - [https://liveinaus.com](https://liveinaus.com)

## LICENSE

GNU General Public License v3.0

**Enjoy!**
