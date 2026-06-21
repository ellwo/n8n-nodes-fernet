import type { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class FernetKeyApi implements ICredentialType {
	name = 'fernetKeyApi';

	displayName = 'Fernet Key API';

	documentationUrl = 'https://cryptography.io/en/latest/fernet/';

	icon = 'file:fernet.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Key',
			name: 'key',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'A URL-safe base64-encoded 32-byte Fernet key',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://cryptography.io',
			url: '/en/latest/fernet/',
		},
	};
}
