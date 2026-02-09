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
			displayName: 'Authentication Type',
			name: 'authType',
			type: 'options',
			options: [
				{
					name: 'API Key',
					value: 'apiKey',
				},
				{
					name: 'Username / Password',
					value: 'usernamePassword',
				},
			],
			default: 'apiKey',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					authType: ['usernamePassword'],
				},
			},
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			displayOptions: {
				show: {
					authType: ['usernamePassword'],
				},
			},
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			displayOptions: {
				show: {
					authType: ['apiKey'],
				},
			},
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '={{$credentials.authType === "apiKey" ? "/api/auth/user" : "/api/auth/login"}}',
			method: '={{$credentials.authType === "apiKey" ? "GET" : "POST"}}' as any,
			headers: {
				'X-Authorization': '={{$credentials.authType === "apiKey" ? "ApiKey " + $credentials.apiKey : ""}}',
			},
			body: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};
}
