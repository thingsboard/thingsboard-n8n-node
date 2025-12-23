import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ThingsBoardApi implements ICredentialType {
	name = 'thingsBoardApi';
	displayName = 'ThingsBoard API';
	documentationUrl = 'https://thingsboard.io/docs/reference/rest-api/';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://demo.thingsboard.io/',
			required: true,
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/auth/login',
			method: 'POST',
			body: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};
}
