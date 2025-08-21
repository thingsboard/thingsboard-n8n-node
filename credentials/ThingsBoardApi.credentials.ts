import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ThingsBoardApi implements ICredentialType {
	name = 'thingsBoardApi';
	displayName = 'ThingsBoard API';
	documentationUrl = 'https://example.com/docs/auth';
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
}
