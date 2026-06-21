import type { IDataObject } from 'n8n-workflow';

export type FernetInputSource = 'field' | 'json' | 'text';

function stringifyInputValue(value: unknown): string {
	if (value === undefined || value === null || value === '') {
		throw new Error('Input value is empty');
	}

	return typeof value === 'string' ? value : JSON.stringify(value);
}

function getValueByPath(itemJson: IDataObject, path: string): unknown {
	const parts = path.split('.').filter((part) => part.length > 0);
	let current: unknown = itemJson;

	for (const part of parts) {
		if (current === null || current === undefined || typeof current !== 'object') {
			return undefined;
		}

		current = (current as IDataObject)[part];
	}

	return current;
}

function looksLikeFernetToken(value: string): boolean {
	return value.startsWith('gAAAA');
}

function looksLikeInlineValue(value: string): boolean {
	if (value.length === 0) {
		return false;
	}

	// Long values, base64-like payloads, or fernet tokens are almost certainly
	// resolved expressions rather than real JSON field names.
	return value.length > 40 || looksLikeFernetToken(value);
}

function formatFieldLabel(value: string): string {
	if (value.length <= 80) {
		return value;
	}

	return `${value.slice(0, 80)}...`;
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

	if (typeof inputField !== 'string') {
		return stringifyInputValue(inputField);
	}

	let fieldValue: unknown = itemJson[inputField];

	if (
		(fieldValue === undefined || fieldValue === null || fieldValue === '') &&
		inputField.includes('.')
	) {
		fieldValue = getValueByPath(itemJson, inputField);
	}

	// n8n resolved an expression into this parameter and put the actual payload
	// here instead of a field name. Treat the resolved value as the input.
	if (
		(fieldValue === undefined || fieldValue === null || fieldValue === '') &&
		looksLikeInlineValue(inputField)
	) {
		fieldValue = inputField;
	}

	if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
		throw new Error(
			`Input field "${formatFieldLabel(inputField)}" is empty. Use dot notation like body.secrets_envelope.encrypted_data, or switch Input Source to Text Value for expressions.`,
		);
	}

	return stringifyInputValue(fieldValue);
}
