# Git Diff Command Cheat Sheet

- `git diff` Show changes between the working directory and the index (staging area).
- `git diff --cached` Show changes between the index (staging area) and the last commit.
- `git diff HEAD` Show changes between the working directory and the last commit.
- `git diff <commit> <commit>` Show changes between two commits.
- `git diff <branch>..<branch>` Show changes between two branches.
- `git diff --name-only` Show only the names of changed files.
- `git diff --stat` Show a summary of changes (number of lines added/removed) for each file.
- `git diff --color-words` Show changes within lines.
- `git diff --word-diff-regex=<regex>` Show changes within lines, using a custom regular expression.
- `git diff --color-words --word-diff-regex=<regex>` Show changes within lines with custom regular expression, with color highlighting.
- `git diff --ignore-all-space` Ignore changes in whitespace.
- `git diff --ignore-blank-lines` Ignore changes that only involve adding or removing blank lines.
- `git diff --ignore-space-change` Ignore changes in the amount of whitespace.
- `git diff --no-prefix` Do not show any file path/prefix information.
- `git diff --shortstat` Show a concise summary of changes.
- `git diff --submodule` Show changes in submodule references (if any).
- `git diff --color-words --word-diff=color` Show changes within lines with color highlighting.
- `git diff --word-diff-regex=.` Show changes within lines, treating each character as a word.
- `git diff --word-diff-regex=<regex>` Show changes within lines, using a custom regular expression.
- `git diff --patience` Use patience algorithm for generating diff output, useful for files with many changes.
- `git diff --histogram` Use histogram algorithm for generating diff output, useful for large files with small changes.

_Replace `<commit>` with commit hash or reference (e.g., HEAD~1), and `<branch>` with branch names._
