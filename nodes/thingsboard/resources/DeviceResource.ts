import { IOperationContext, IResourceHandler, QueryString } from '../utils/types';
import { makeThingsBoardRequest } from '../utils/requestHandler';
import {
	buildPaginationQuery,
	paginationToQueryString,
	parseJsonInput,
	buildEntityWithCustomer,
	getOptionalParam,
	validateRequired,
} from '../utils/helpers';

export class DeviceResource implements IResourceHandler {
	async execute(context: IOperationContext, operation: string): Promise<any> {
		switch (operation) {
			case 'getDeviceById':
				return await this.getDeviceById(context);

			case 'createDevice':
				return await this.createDevice(context);

			case 'deleteDevice':
				return await this.deleteDevice(context);

			case 'getTenantDevice':
				return await this.getTenantDevice(context);

			case 'getTenantDevices':
				return await this.getTenantDevices(context);

			case 'getCustomerDevices':
				return await this.getCustomerDevices(context);

			case 'getUserDevices':
				return await this.getUserDevices(context);

			case 'getDevicesByEntityGroupId':
				return await this.getDevicesByEntityGroupId(context);

			default:
				throw new Error(`Unknown device operation: ${operation}`);
		}
	}

	private async getDeviceById(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const deviceId = validateRequired(executeFunctions, 'deviceId', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/device/${deviceId}`,
			},
			baseUrl,
			token,
		);
	}

	private async createDevice(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const mode = getOptionalParam(
			executeFunctions,
			'deviceInputMode',
			itemIndex,
			'params',
		) as string;

		let body: Record<string, unknown>;
		const qs: QueryString = {};

		// Handle access token parameter
		const accessToken = getOptionalParam(executeFunctions, 'deviceAccessToken', itemIndex, '');
		if (accessToken) {
			qs.accessToken = accessToken;
		}

		// Build request body
		if (mode === 'json') {
			body = parseJsonInput(executeFunctions, 'deviceJson', itemIndex);
		} else {
			const name = validateRequired(executeFunctions, 'deviceNameCreate', itemIndex);
			const type = getOptionalParam(executeFunctions, 'deviceTypeCreate', itemIndex, '');
			const label = getOptionalParam(executeFunctions, 'deviceLabel', itemIndex, '');
			const customerId = getOptionalParam(
				executeFunctions,
				'customerIdDeviceCreate',
				itemIndex,
				'',
			);

			body = buildEntityWithCustomer(name, type, label, customerId);
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'POST',
				endpoint: '/api/device',
				qs,
				body,
			},
			baseUrl,
			token,
		);
	}

	private async deleteDevice(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const deviceId = validateRequired(executeFunctions, 'deviceId', itemIndex);

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'DELETE',
				endpoint: `/api/device/${deviceId}`,
			},
			baseUrl,
			token,
		);

		return { deleted: true };
	}

	private async getTenantDevice(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const deviceName = validateRequired(executeFunctions, 'deviceName', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/tenant/devices',
				qs: { deviceName },
			},
			baseUrl,
			token,
		);
	}

	private async getTenantDevices(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'device');
		const qs = paginationToQueryString(paginationParams);

		// Add device-specific parameter
		const type = getOptionalParam(executeFunctions, 'deviceType', itemIndex, '');
		if (type) {
			qs.type = type;
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/tenant/devices',
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getCustomerDevices(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const customerId = validateRequired(executeFunctions, 'customerIdRequired', itemIndex);

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'device');
		const qs = paginationToQueryString(paginationParams);

		// Add device-specific parameter
		const type = getOptionalParam(executeFunctions, 'deviceType', itemIndex, '');
		if (type) {
			qs.type = type;
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/customer/${customerId}/devices`,
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getUserDevices(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'device');
		const qs = paginationToQueryString(paginationParams);

		// Add device-specific parameter
		const type = getOptionalParam(executeFunctions, 'deviceType', itemIndex, '');
		if (type) {
			qs.type = type;
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/user/devices',
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getDevicesByEntityGroupId(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const entityGroupId = validateRequired(executeFunctions, 'entityGroupId', itemIndex);

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'device');
		const qs = paginationToQueryString(paginationParams);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/entityGroup/${entityGroupId}/devices`,
				qs,
			},
			baseUrl,
			token,
		);
	}
}
