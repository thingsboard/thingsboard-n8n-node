import type {
	IAuthenticate,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

export class ThingsBoardUsernamePasswordApi implements ICredentialType {
	name = 'thingsBoardUsernamePasswordApi';
	displayName = 'ThingsBoard Username / Password API';
	documentationUrl = 'https://thingsboard.io/docs/reference/rest-api/';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://thingsboard.cloud',
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
		{
			displayName: 'Token',
			name: 'token',
			type: 'hidden',
			typeOptions: { expirable: true },
			default: '',
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const baseUrl = (credentials.baseUrl as string).replace(/\/+$/g, '');
		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}/api/auth/login`,
			body: {
				username: credentials.username,
				password: credentials.password,
			},
			json: true,
		})) as { token: string };

		return { token: response.token };
	}

	authenticate: IAuthenticate = async function (
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		requestOptions.headers = requestOptions.headers || {};
		(requestOptions.headers as Record<string, string>)['X-Authorization'] =
			`Bearer ${credentials.token}`;
		return requestOptions;
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/auth/user',
			method: 'GET',
		},
	};
}
