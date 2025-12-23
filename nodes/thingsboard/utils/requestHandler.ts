/**
 * Centralized HTTP request handler for ThingsBoard API
 * Provides proper error handling and eliminates code duplication
 */
import { IExecuteFunctions, IHttpRequestOptions, NodeOperationError } from 'n8n-workflow';
import { IThingsBoardRequestOptions } from './types';
import { cleanQueryString } from './helpers';

export async function makeThingsBoardRequest(
	executeFunctions: IExecuteFunctions,
	options: IThingsBoardRequestOptions,
	baseUrl: string,
	token: string,
): Promise<any> {
	const { method, endpoint, qs, body } = options;

	const cleanedQs = qs ? cleanQueryString(qs) : undefined;

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: {
			'X-Authorization': `Bearer ${token}`,
		},
		json: true,
		returnFullResponse: true,
	};

	if (cleanedQs && Object.keys(cleanedQs).length > 0) {
		requestOptions.qs = cleanedQs;
	}

	if (body && Object.keys(body).length > 0) {
		requestOptions.body = body;
	}

	try {
		const response = await executeFunctions.helpers.httpRequest(requestOptions);

		if (response.statusCode >= 400) {
			const errorMessage =
				response.body?.message || response.body?.error || `HTTP ${response.statusCode} error`;

			throw new NodeOperationError(
				executeFunctions.getNode(),
				`ThingsBoard API error: ${errorMessage} (Status: ${response.statusCode})`,
				{
					description: `Endpoint: ${method} ${endpoint}`,
				},
			);
		}

		// Return the response body
		return response.body;
	} catch (error: any) {
		// Handle network errors, timeouts, etc.
		if (error.message?.includes('ThingsBoard API error')) {
			// Re-throw our formatted errors
			throw error;
		}

		// Format unexpected errors
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Failed to connect to ThingsBoard API: ${error.message}`,
			{
				description: `Endpoint: ${method} ${endpoint}`,
			},
		);
	}
}

/**
 * Get ThingsBoard credentials and validate
 */
export async function getThingsBoardCredentials(
	executeFunctions: IExecuteFunctions,
): Promise<{ baseUrl: string; username: string; password: string }> {
	const credentials = await executeFunctions.getCredentials('thingsBoardApi');

	if (!credentials || !credentials.baseUrl) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			'ThingsBoard credential `baseUrl` is missing. Open the node credentials and set the base URL (e.g. http://localhost:8080)',
		);
	}

	return {
		baseUrl: (credentials.baseUrl as string).replace(/\/+$/g, ''),
		username: credentials.username as string,
		password: credentials.password as string,
	};
}

/**
 * Get access token with caching
 */
export async function getAccessToken(executeFunctions: IExecuteFunctions): Promise<string> {
	const staticData = executeFunctions.getWorkflowStaticData('node');
	const credentials = await getThingsBoardCredentials(executeFunctions);

	// Check for cached token
	const now = Date.now();
	const cachedToken = staticData.token as string | undefined;
	const tokenExpiry = staticData.tokenExpiry as number | undefined;

	if (cachedToken && tokenExpiry && now < tokenExpiry) {
		return cachedToken;
	}

	// Fetch new token
	try {
		const authResponse = await executeFunctions.helpers.httpRequest({
			method: 'POST',
			url: `${credentials.baseUrl}/api/auth/login`,
			body: {
				username: credentials.username,
				password: credentials.password,
			},
			json: true,
		});

		const token = authResponse.token as string;

		if (!token) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				'Failed to authenticate with ThingsBoard: No token received',
			);
		}

		// Cache token (expires in 20 minutes)
		staticData.token = token;
		staticData.tokenExpiry = now + 20 * 60 * 1000;

		// Try to get edition info
		try {
			const systemInfo = await executeFunctions.helpers.httpRequest({
				method: 'GET',
				url: `${credentials.baseUrl}/api/system/info`,
				headers: { 'X-Authorization': `Bearer ${token}` },
				json: true,
			});

			const edition = systemInfo.edition || 'CE';
			// Normalize PAAS to PE
			staticData.edition = edition === 'PAAS' ? 'PE' : edition;
		} catch {
			// Default to CE if system info fails
			staticData.edition = 'CE';
		}

		return token;
	} catch (error: any) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Failed to authenticate with ThingsBoard: ${error.message}`,
			{
				description: 'Check your credentials (username and password)',
			},
		);
	}
}

/**
 * Get ThingsBoard edition (CE or PE)
 */
export function getEdition(executeFunctions: IExecuteFunctions): string {
	const staticData = executeFunctions.getWorkflowStaticData('node');
	return (staticData.edition as string) || 'CE';
}

/**
 * Check if operation is available in current edition
 */
export function checkEditionSupport(
	executeFunctions: IExecuteFunctions,
	resource: string,
	operation: string,
	peOnlyOperations: Set<string>,
): void {
	const edition = getEdition(executeFunctions);
	const key = `${resource}:${operation}`;

	if (edition === 'CE' && peOnlyOperations.has(key)) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Operation "${operation}" for resource "${resource}" is available only in ThingsBoard PE edition.`,
		);
	}
}
