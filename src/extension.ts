import { ExtensionContext, window, workspace } from 'vscode';
import { updateCommandPalette } from './commandPalette';
import { registerExtensionCommands } from './commands';
import { updateDocumentLinkProvider } from './documentLinksProvider';
import { VSCodeCommandWithoutCategory } from './quickPick';
import { updateUserCommands } from './registerUserCommands';
import { updateStatusBarItems, updateStatusBarItemsVisibilityByGlob } from './statusBar';
import { CommandsTreeViewProvider } from './TreeViewProvider';
import { ExtensionConfig, Runnable, TopLevelCommands } from './types';
import { addWorkspaceIdToCommands, getWorkspaceId, setWorkspaceIdToContext } from './workspaceCommands';

export const enum Constants {
	ExtensionId = 'usernamehw.commands',
	ExtensionName = 'commands',
	CommandsSettingId = 'commands.commands',
	WorkspaceCommandsSettingId = 'commands.workspaceCommands',

	CommandPaletteWasPopulatedStorageKey = 'was_populated',
}

export let $config: ExtensionConfig;
export class $state {
	static lastExecutedCommand: Runnable = { command: 'noop' };
	static extensionContext: ExtensionContext;
	/**
	 * Cache all Command Palette commands for `quickPickIncludeAllCommands` feature.
	 */
	static allCommandPaletteCommands: VSCodeCommandWithoutCategory[] = [];
}

export async function activate(extensionContext: ExtensionContext) {
	$state.extensionContext = extensionContext;

	updateConfig();

	const commandsTreeViewProvider = new CommandsTreeViewProvider({});
	const commandsTreeView = window.createTreeView(`${Constants.ExtensionName}.tree`, {
		treeDataProvider: commandsTreeViewProvider,
		showCollapseAll: true,
	});


	registerExtensionCommands();

	await setWorkspaceIdToContext(extensionContext);
	updateEverything();

	function updateConfig() {
		$config = workspace.getConfiguration(Constants.ExtensionName) as any as ExtensionConfig;
	}

	function updateEverything() {
		const commands = allCommands();
		commandsTreeViewProvider.updateCommands(commands);
		commandsTreeViewProvider.refresh();
		updateUserCommands(commands);
		updateStatusBarItems(commands);
		updateCommandPalette(commands, extensionContext);
		updateDocumentLinkProvider();
	}

	extensionContext.subscriptions.push(commandsTreeView);
	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (!e.affectsConfiguration(Constants.ExtensionName)) {
			return;
		}
		updateConfig();
		updateEverything();
	}));

	extensionContext.subscriptions.push(window.onDidChangeActiveTextEditor(editor => {
		updateStatusBarItemsVisibilityByGlob(editor);
	}));
}

/**
 * Merge global and workspace commands.
 */
export function allCommands(): TopLevelCommands {
	const workspaceId = getWorkspaceId($state.extensionContext);
	const workspaceCommands = workspace.getConfiguration(Constants.ExtensionName).inspect('workspaceCommands')?.workspaceValue as ExtensionConfig['workspaceCommands'] | undefined;
	if (workspaceId && workspaceCommands) {
		return {
			...$config.commands,
			...addWorkspaceIdToCommands(workspaceCommands, workspaceId),
		};
	} else {
		return $config.commands;
	}
}

export function deactivate() { }
