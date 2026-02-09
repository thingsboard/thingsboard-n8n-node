/**
 * Centralized HTTP request handler for ThingsBoard API
 * Uses httpRequestWithAuthentication for n8n-managed auth
 */
import { IExecuteFunctions, IHttpRequestOptions, NodeOperationError } from 'n8n-workflow';
import { IThingsBoardRequestOptions } from './types';
import { cleanQueryString } from './helpers';

export async function makeThingsBoardRequest(
	executeFunctions: IExecuteFunctions,
	options: IThingsBoardRequestOptions,
	baseUrl: string,
	credentialType: string,
): Promise<any> {
	const { method, endpoint, qs, body } = options;

	const cleanedQs = qs ? cleanQueryString(qs) : undefined;

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
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
		const response = await executeFunctions.helpers.httpRequestWithAuthentication.call(
			executeFunctions,
			credentialType,
			requestOptions,
		);

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

		return response.body;
	} catch (error: any) {
		if (error.message?.includes('ThingsBoard API error')) {
			throw error;
		}

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
 * Detect ThingsBoard edition (CE or PE) via /api/system/info
 * Result is cached in workflow static data for the lifetime of the execution.
 */
export async function detectEdition(
	executeFunctions: IExecuteFunctions,
	credentialType: string,
	baseUrl: string,
): Promise<void> {
	const staticData = executeFunctions.getWorkflowStaticData('node');

	if (staticData.edition) {
		return;
	}

	try {
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/api/system/info`,
			json: true,
		};

		const systemInfo = await executeFunctions.helpers.httpRequestWithAuthentication.call(
			executeFunctions,
			credentialType,
			requestOptions,
		);

		const edition = systemInfo.edition || 'CE';
		staticData.edition = edition === 'PAAS' ? 'PE' : edition;
	} catch {
		staticData.edition = 'CE';
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
