import { window } from 'vscode';
import { applyForTreeItem } from '../commands';
import { updateSetting } from '../settings';
import { RunCommandTreeItem } from '../TreeViewProvider';
import { TopLevelCommands } from '../types';
import { deepCopy, forEachCommand } from '../utils';

export async function deleteCommandCommand(treeItem: RunCommandTreeItem) {
	const confirmBtnName = 'Delete';
	const button = await window.showWarningMessage(`Do you want to delete "${treeItem.label}"?\n\n${JSON.stringify(treeItem.runnable, null, '    ')}`, {
		modal: true,
	}, confirmBtnName);
	if (button === confirmBtnName) {
		applyForTreeItem(async ({ treeItem, commands, settingId, configTarget }) => {
			const configCommands: TopLevelCommands = deepCopy(commands);// config is readonly, get a copy
			forEachCommand((item, key, parentElement) => {
				if (key === treeItem.label) {
					delete parentElement[key];
				}
			}, configCommands);
			await updateSetting(settingId, configCommands, configTarget);
		}, treeItem);
	}
}
