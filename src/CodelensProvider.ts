import * as vscode from 'vscode';

export type MatchItem = {
    Id: string;
    Name: string;
	Description: string;
	Source: string;
	URLBase: string;
}

interface AnnotationContent {
	LineComment: string;
	ToolTip: string;
	URL: string;
}

/**
 * CodelensProvider
 */
export class CodelensProvider implements vscode.CodeLensProvider {

	private codeLenses: vscode.CodeLens[] = [];
	private regex: RegExp;
	private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
	public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

	private matchData: {[key: string]: MatchItem} = {};

	constructor(matchData: {[key: string]: MatchItem}) {
		this.regex = /[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?/g;
		this.matchData = matchData;

		vscode.workspace.onDidChangeConfiguration((_) => {
			this._onDidChangeCodeLenses.fire();
		});
	}

	private matchesToTitles(line: string, match: string): AnnotationContent {
		if (match in this.matchData) {
			const item:MatchItem = this.matchData[match];
			return {
				LineComment: match + " => " + item.Name + " (" + item.Source + ")",
				ToolTip: item.Description,
				URL: item.URLBase.replace("{GUID}", item.Id)
			}
		}
		return {
			LineComment: "Unknown GUID",
			ToolTip: "(No tooltip, unknown GUID)",
			URL: ""
		}
	}

	public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

		if (vscode.workspace.getConfiguration("codelens-sample").get("enableCodeLens", true)) {
			this.codeLenses = [];
			const regex = new RegExp(this.regex);
			const text = document.getText();
			let matches;
			while ((matches = regex.exec(text)) !== null) {
				const line = document.lineAt(document.positionAt(matches.index).line);
				const indexOf = line.text.indexOf(matches[0]);
				const position = new vscode.Position(line.lineNumber, indexOf);
				const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
				if (range) {
					const annotationContent = this.matchesToTitles(line.text, matches[0])
					this.codeLenses.push(new vscode.CodeLens(range, 
					{
						title: annotationContent.LineComment,
						tooltip: annotationContent.ToolTip,
						command: "codelens-sample.codelensAction",
						arguments: [annotationContent.URL, false]
					}));
				}
			}
			return this.codeLenses;
		}
		return [];
	}

	public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
		if (vscode.workspace.getConfiguration("codelens-sample").get("enableCodeLens", true)) {
			codeLens.command = {
				title: "Codelens provided by sample extension",
				tooltip: "Tooltip provided by sample extension",
				command: "codelens-sample.codelensAction",
				arguments: ["Argument 1", false]
			};
			return codeLens;
		}
		return null;
	}
}

