import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { decryptFernet, encryptFernet } from './Fernet.crypto';
import { getInputText, type FernetInputSource } from './Fernet.input';
import { getResultJson } from './Fernet.output';

async function getFernetKey(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<string> {
	const keySource = executeFunctions.getNodeParameter('keySource', itemIndex) as
		| 'credential'
		| 'nodeField';

	if (keySource === 'nodeField') {
		return executeFunctions.getNodeParameter('fernetKey', itemIndex) as string;
	}

	const credentials = await executeFunctions.getCredentials('fernetKeyApi', itemIndex);

	return credentials.key as string;
}

export class Fernet implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fernet',
		name: 'fernet',
		icon: 'file:fernet.svg',
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"]}}',
		description: 'Encrypt and decrypt data with Fernet symmetric encryption',
		defaults: {
			name: 'Fernet',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'fernetKeyApi',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Decrypt',
						value: 'decrypt',
						action: 'Decrypt data with fernet',
					},
					{
						name: 'Encrypt',
						value: 'encrypt',
						action: 'Encrypt data with fernet',
					},
				],
				default: 'encrypt',
			},
			{
				displayName: 'Input Source',
				name: 'inputSource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'JSON Field',
						value: 'field',
						description: 'Read the value from a field in the incoming item JSON',
					},
					{
						name: 'JSON Value',
						value: 'json',
						description: 'Encrypt a JSON object entered in this node',
					},
					{
						name: 'Text Value',
						value: 'text',
						description: 'Use the value entered in this node',
					},
				],
				default: 'text',
				description: 'Where to read the value to encrypt or decrypt from',
			},
			{
				displayName: 'Input Field',
				name: 'inputField',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						inputSource: ['field'],
					},
				},
				description: 'Field path in the incoming item JSON. Supports dot notation, for example body.secrets_envelope.encrypted_data.',
			},
			{
				displayName: 'Text',
				name: 'inputText',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						inputSource: ['text'],
					},
				},
				description: 'Text or Fernet token to encrypt or decrypt. Use expressions here, for example ={{ $JSON.body.secrets_envelope.encrypted_data }}.',
			},
			{
				displayName: 'JSON',
				name: 'inputJson',
				type: 'json',
				default: '{}',
				required: true,
				displayOptions: {
					show: {
						inputSource: ['json'],
						operation: ['encrypt'],
					},
				},
				description: 'JSON object to encrypt',
			},
			{
				displayName: 'Key Source',
				name: 'keySource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Credential',
						value: 'credential',
					},
					{
						name: 'Node Field',
						value: 'nodeField',
					},
				],
				default: 'credential',
				description: 'Where to read the Fernet key from',
			},
			{
				displayName: 'Fernet Key',
				name: 'fernetKey',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						keySource: ['nodeField'],
					},
				},
				description: 'A URL-safe base64-encoded 32-byte Fernet key',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as 'decrypt' | 'encrypt';
				const inputSource = this.getNodeParameter('inputSource', itemIndex) as FernetInputSource;
				const inputParameter =
					inputSource === 'field'
						? this.getNodeParameter('inputField', itemIndex)
						: this.getNodeParameter(inputSource === 'json' ? 'inputJson' : 'inputText', itemIndex);
				const key = await getFernetKey(this, itemIndex);
				const item = items[itemIndex];
				const inputText = getInputText(inputSource, item.json, inputParameter);
				const result =
					operation === 'encrypt'
						? encryptFernet(inputText, key)
						: decryptFernet(inputText, key);

				returnData.push({
					json: getResultJson(operation, result),
					pairedItem: { item: itemIndex },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [returnData];
	}
}
