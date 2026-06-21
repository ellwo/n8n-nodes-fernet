import type { IDataObject } from 'n8n-workflow';

type FernetOperation = 'decrypt' | 'encrypt';
type JsonResult = IDataObject | IDataObject[] | string | number | boolean | null;

function parseJsonIfPossible(value: string): JsonResult {
	try {
		return JSON.parse(value) as JsonResult;
	} catch {
		return value;
	}
}

export function getResultJson(operation: FernetOperation, value: string): IDataObject {
	return {
		result: operation === 'decrypt' ? parseJsonIfPossible(value) : value,
	};
}
