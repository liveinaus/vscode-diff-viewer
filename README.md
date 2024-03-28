# Better Diff Viewer

View Git diff in a colorful HTML page via [Diff2Html-UI](https://github.com/rtfpessoa/diff2html).

![Better Diff Viewer screenshot](images/screenshot-0.0.1.png)

## Rationale

Creating a similar diff view panel to [Source Tree](https://www.sourcetreeapp.com).
The aim is to add most of the features which [Source Tree](https://www.sourcetreeapp.com) diff viewer can do.
For example, view Diff in HTML, revert a file ...

## Features & TODOs

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
- [ ] Support custom user commands, which can be defined by user
- [ ] Store users view settings (i.e., remember viewed button for files)
- [ ] Support hunk action - e.g. revert hunk only code
- [ ] Triggering extension commands from bottom toolbar
- [ ] Specify panel location (i.e. in editor or panel)

## Available commands

- `better-diff-viewer.viewDiffFile`: view diff for current .diff/.patch file
- `better-diff-viewer.viewRepoGitDiff`: view Git diff for current repository
- `better-diff-viewer.viewGitDiffForFile`: view Git diff for current file

## Extension Settings

| Command                                                         | Example Value                            | Description                                                      |
| --------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| better-diff-viewer.isAutoRefresh                                | true                                     | toggle if the view needs to be refreshed when any file get saved |
| better-diff-viewer.customCssStyle                               | ".d2h-file-name{color:cyan !important;}" | Add custom CSS style for the diff viewer. Please add in one line |
| better-diff-viewer.showBtnIcon                                  | true                                     | show button icon                                                 |
| better-diff-viewer.showBtnLongDesc                              | true                                     | show button long description                                     |
| better-diff-viewer.showBtnShortDesc                             | false                                    | show button short description (for saving spaces)                |
| better-diff-viewer.diff2html-ui.outputFormat                    |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.drawFileList                    |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.srcPrefix                       |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.dstPrefix                       |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.diffMaxChanges                  |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.diffMaxLineLength               |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.diffTooBigMessage               |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.matching                        |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.matchWordsThreshold             |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.maxLineLengthHighlight          |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.diffStyle                       |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.renderNothingWhenEmpty          |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.matchingMaxComparisons          |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.maxLineSizeInBlockForComparison |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.compiledTemplates               |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.rawTemplates                    |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.highlightLanguages              |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.colorScheme                     |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.synchronisedScroll              |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.highlight                       |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.fileListToggle                  |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.fileListStartVisible            |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.fileContentToggle               |                                          | see diff2html-ui for available values                            |
| better-diff-viewer.diff2html-ui.stickyFileHeaders               |                                          | see diff2html-ui for available values                            |

## Installation

[Open at Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=SamWang.better-diff-viewer)

## Thanks to Diff2Html

[Goto Diff2Html](https://github.com/rtfpessoa/diff2html)

## Author

Sam Wang - [https://liveinaus.com](https://liveinaus.com)

## LICENSE

GNU General Public License v3.0

**Enjoy!**
