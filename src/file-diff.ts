import * as utils from "./utils";

export default class FileDiff {
	content: string = "";
	header: string[] = [];
	hunks: string[][] = [];

	public getRawFileDiff(): string {
		return `${this.getHeader()}
${this.getHunks()}
`;
	}

	//A usable hunk diff means use selected hunk to make a diff file
	getUsableHunkDiffByHunkHeader(hunkHeader: string): string {
		for (const hunk of this.hunks) {
			if (hunk.length > 0 && hunk[0].trim() === hunkHeader.trim()) {
				return this.getHeader() + "\n" + hunk.join("\n") + "\n"; //usable hunk diff
			}
		}
		utils.throwError("Cannot find hunk by " + hunkHeader);
	}

	getHeader(): string {
		return this.header.join("\n");
	}

	getHunks(): string {
		return this.hunks.map((hunk) => hunk.join("\n")).join("\n");
	}

	constructor(rawDiffContent: string | undefined, targetFilePathA: string, targetFilePathB: string) {
		if (!rawDiffContent) {
			utils.throwError("rawDiffContent is undefined");
		} else {
			const diffLines = rawDiffContent.split("\n");
			let inScopeOfFile: boolean = false;
			for (let i = 0; i < diffLines.length; i++) {
				const line = diffLines[i];
				if (line.startsWith("diff --git")) {
					const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
					if (match && inScopeOfFile) {
						//reach next diff file - stop searching
						break;
					} else if (match) {
						const filePathA = match[1];
						const filePathB = match[2];
						inScopeOfFile = filePathA === targetFilePathA && filePathB === targetFilePathB;
						if (inScopeOfFile) {
							this.header.push(line);
						}
					}
				} else if (line.startsWith("@@")) {
					if (inScopeOfFile) {
						this.hunks.push([line]);
					}
				} else {
					if (inScopeOfFile) {
						if (this.hunks.length > 0) {
							this.hunks[this.hunks.length - 1].push(line);
						} else {
							this.header.push(line);
						}
					}
				}
			}
		}
	}
}
