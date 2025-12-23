import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { IPaginationParams, QueryString } from './types';

export function buildPaginationQuery(
	executeFunctions: IExecuteFunctions,
	itemIndex: number,
	resource: string,
): IPaginationParams {
	const pageSize = executeFunctions.getNodeParameter('pageSize', itemIndex, 10) as number;
	const page = executeFunctions.getNodeParameter('page', itemIndex, 0) as number;
	const textSearch = executeFunctions.getNodeParameter(
		`${resource}TextSearch`,
		itemIndex,
		'',
	) as string;
	const sortProperty = executeFunctions.getNodeParameter(
		`${resource}SortProperty`,
		itemIndex,
		'',
	) as string;
	const sortOrder = executeFunctions.getNodeParameter('sortOrder', itemIndex, 'DESC') as
		| 'ASC'
		| 'DESC';

	const params: IPaginationParams = {
		pageSize,
		page,
		sortProperty,
		sortOrder,
	};

	if (textSearch) {
		params.textSearch = textSearch;
	}

	return params;
}

export function paginationToQueryString(params: IPaginationParams): QueryString {
	const qs: QueryString = {};

	if (params.pageSize !== undefined) qs.pageSize = params.pageSize;
	if (params.page !== undefined) qs.page = params.page;
	if (params.textSearch) qs.textSearch = params.textSearch;
	if (params.sortProperty) qs.sortProperty = params.sortProperty;
	if (params.sortOrder) qs.sortOrder = params.sortOrder;

	return qs;
}

export function parseJsonInput(
	executeFunctions: IExecuteFunctions,
	paramName: string,
	itemIndex: number,
): Record<string, unknown> {
	const raw = executeFunctions.getNodeParameter(paramName, itemIndex) as unknown;

	if (typeof raw === 'string') {
		try {
			return JSON.parse(raw) as Record<string, unknown>;
		} catch (e) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`${paramName} must be valid JSON. ${(e as Error).message}`,
			);
		}
	} else if (raw && typeof raw === 'object') {
		return raw as Record<string, unknown>;
	} else {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`${paramName} must be a JSON object or JSON string.`,
		);
	}
}

export function buildEntityWithCustomer(
	name: string,
	type: string,
	label?: string,
	customerId?: string,
): Record<string, unknown> {
	const entity: Record<string, unknown> = {
		name,
		type,
	};

	if (label) {
		entity.label = label;
	}

	if (customerId) {
		entity.customerId = { id: customerId };
	}

	return entity;
}

export function cleanQueryString(qs: QueryString): QueryString {
	const cleaned: QueryString = {};

	for (const [key, value] of Object.entries(qs)) {
		if (value !== undefined && value !== '' && value !== null) {
			cleaned[key] = value;
		}
	}

	return cleaned;
}

export function validateRequired(
	executeFunctions: IExecuteFunctions,
	paramName: string,
	itemIndex: number,
): string {
	const value = executeFunctions.getNodeParameter(paramName, itemIndex, '') as string;

	if (!value || value.trim() === '') {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Required parameter "${paramName}" is missing or empty.`,
		);
	}

	return value;
}

export function getOptionalParam<T = string>(
	executeFunctions: IExecuteFunctions,
	paramName: string,
	itemIndex: number,
	defaultValue: T = '' as T,
): T {
	return executeFunctions.getNodeParameter(paramName, itemIndex, defaultValue) as T;
}

export function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.replace(/\/+$/g, '');
}
