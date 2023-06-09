// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, languages, commands, Disposable, workspace, window, Uri } from 'vscode';
import { CodelensProvider, MatchItem } from './CodelensProvider';

import azureRoleData from './data/azureroles.json';
import azurePolicyData from './data/azurepolicies.json';
import azureAdvisorData from './data/azureadvisorrecommendations.json';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let disposables: Disposable[] = [];

function convert(data: any, sourceString: string, urlBase?: string): { [key: string]: MatchItem } {
	const result: { [key: string]: any } = {};
	data.forEach((item: any) => {
		result[item.Id] = {
			Id: item.Id,
			Name: item.Name,
			Description: item.Description,
			Source: sourceString,
			URLBase: urlBase
		}
	})
	return result
}

export function activate(context: ExtensionContext) {
	const roleData: { [key: string]: MatchItem } = convert(azureRoleData, 'Azure Built-In Role', 'https://www.azadvertizer.net/azrolesadvertizer/{GUID}.html');
	const policyData: { [key: string]: MatchItem } = convert(azurePolicyData, 'Azure Built-In Policy definition', 'https://www.azadvertizer.net/azpolicyadvertizer/{GUID}.html');
	const advisorData: { [key: string]: MatchItem } = convert(azureAdvisorData, 'Azure Advisor Recommendation');

	const combined = Object.assign({}, roleData, policyData, advisorData);
	const codelensProvider = new CodelensProvider(combined);

	languages.registerCodeLensProvider("*", codelensProvider);
	workspace.getConfiguration("guidsniffer").update("GUIDSnifferEnabled", true, true);

	commands.registerCommand("guidsniffer.enableGUIDSniffer", () => {
		workspace.getConfiguration("guidsniffer").update("GUIDSnifferEnabled", true, true);
	});

	commands.registerCommand("guidsniffer.disableGUIDSniffer", () => {
		workspace.getConfiguration("guidsniffer").update("GUIDSnifferEnabled", false, true);
	});

	commands.registerCommand("guidsniffer.showGUIDSnifferStatus", () => {
		const status = workspace.getConfiguration("guidsniffer").get("GUIDSnifferEnabled", 'unknown');
		window.showInformationMessage(`GUID Sniffer enabled in workspace: ${status}`);
	});

	commands.registerCommand("guidsniffer.openURL", (args: any) => {
		if(args) {
			commands.executeCommand('vscode.open', Uri.parse(args));
			window.showInformationMessage(`GUID Sniffer opening URL ${args}`);
		} else {
			window.showInformationMessage(`No associated URL.`);
		}
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
	if (disposables) {
		disposables.forEach(item => item.dispose());
	}
	disposables = [];
}

