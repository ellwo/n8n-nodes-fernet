import type { IDataObject } from 'n8n-workflow';

export type FernetInputSource = 'field' | 'json' | 'text';

function stringifyInputValue(value: unknown): string {
	if (value === undefined || value === null || value === '') {
		throw new Error('Input value is empty');
	}

	return typeof value === 'string' ? value : JSON.stringify(value);
}

export function getInputText(
	inputSource: FernetInputSource,
	itemJson: IDataObject,
	inputValue: unknown,
): string {
	if (inputSource !== 'field') {
		return stringifyInputValue(inputValue);
	}

	const inputField = inputValue as string;
	const fieldValue = itemJson[inputField];

	if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
		throw new Error(`Input field "${inputField}" is empty`);
	}

	return stringifyInputValue(fieldValue);
}
