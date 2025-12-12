/**
 * TypeScript interfaces and types for ThingsBoard node
 */

import { IExecuteFunctions } from 'n8n-workflow';

/**
 * ThingsBoard credentials structure
 */
export interface IThingsBoardCredentials {
	baseUrl: string;
	username: string;
	password: string;
}

/**
 * Pagination query parameters
 */
export interface IPaginationParams {
	pageSize?: number;
	page?: number;
	textSearch?: string;
	sortProperty?: string;
	sortOrder?: 'ASC' | 'DESC';
}

/**
 * Common query string type
 */
export type QueryString = Record<string, string | number | boolean | undefined>;

/**
 * HTTP request options
 */
export interface IThingsBoardRequestOptions {
	method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
	endpoint: string;
	qs?: QueryString;
	body?: Record<string, unknown>;
}

/**
 * Resource operation context
 */
export interface IOperationContext {
	executeFunctions: IExecuteFunctions;
	itemIndex: number;
	baseUrl: string;
	token: string;
}

/**
 * Resource handler interface
 */
export interface IResourceHandler {
	execute(context: IOperationContext, operation: string): Promise<any>;
}

/**
 * Supported ThingsBoard resources
 */
export type ThingsBoardResource =
	| 'device'
	| 'asset'
	| 'customer'
	| 'alarm'
	| 'dashboard'
	| 'telemetry'
	| 'relation'
	| 'entityGroup';

/**
 * Entity with customerId structure
 */
export interface IEntityWithCustomer {
	name: string;
	type?: string;
	label?: string;
	customerId?: {
		id: string;
	};
}

/**
 * Dashboard structure
 */
export interface IDashboard {
	title: string;
	[key: string]: any;
}
