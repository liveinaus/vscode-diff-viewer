# Change Log

All notable changes to the "better-diff-viewer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.1.0]

### Added

- **Stage file** - "Add" button on each file header stages that file (`git add -A`) directly from the diff view
- **View Changes to be Committed** command - shows staged changes (`git diff --cached`) with its own dedicated button set
- **Unstage file** - "Remove" button in the staged view unstages a file (`git restore --staged`) back to uncommitted
- **Diff mode switcher** - dropdown in the toolbar switches between Uncommitted and To be Committed without leaving the viewer; read-only label shown for other modes (file diff, commit diff, custom)
- **File Log** - "Log" button on each file header shows the commit history for that specific file; selecting a commit displays its diff scoped to that file
- **Binary file protection** - raw `GIT binary patch` data is automatically stripped and replaced with a safe "Binary files differ" line so the renderer never hangs on binary changes
- **Max diff lines per file** - new `better-diff-viewer.maxDiffLinesPerFile` setting (default 3000) truncates oversized file sections before rendering
- **Right-aligned file action buttons** - Open, Copy, Log, Add/Remove, Revert buttons are now pinned to the right side of each file header

## [1.0.1]

- Fix big diff problem

## [Unreleased]

- Initial release
