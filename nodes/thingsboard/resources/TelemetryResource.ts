import { IOperationContext, IResourceHandler, QueryString } from '../utils/types';
import { makeThingsBoardRequest } from '../utils/requestHandler';
import { getOptionalParam, validateRequired, parseJsonInput } from '../utils/helpers';

export class TelemetryResource implements IResourceHandler {
	async execute(context: IOperationContext, operation: string): Promise<any> {
		switch (operation) {
			case 'getTimeseries':
				return await this.getTimeseries(context);

			case 'getTimeseriesKeys':
				return await this.getTimeseriesKeys(context);

			case 'getLatestTimeseries':
				return await this.getLatestTimeseries(context);

			case 'getAttributes':
				return await this.getAttributes(context);

			case 'getAttributeKeys':
				return await this.getAttributeKeys(context);

			case 'getAttributeKeysByScope':
				return await this.getAttributeKeysByScope(context);

			case 'saveEntityAttributes':
				return await this.saveEntityAttributes(context);

			case 'saveDeviceAttributes':
				return await this.saveDeviceAttributes(context);

			case 'saveEntityTelemetry':
				return await this.saveEntityTelemetry(context);

			case 'saveEntityTelemetryWithTTL':
				return await this.saveEntityTelemetryWithTTL(context);

			case 'deleteEntityAttributes':
				return await this.deleteEntityAttributes(context);

			case 'deleteDeviceAttributes':
				return await this.deleteDeviceAttributes(context);

			case 'deleteEntityTimeseries':
				return await this.deleteEntityTimeseries(context);

			default:
				throw new Error(`Unknown telemetry operation: ${operation}`);
		}
	}

	private async getTimeseries(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);
		const keys = validateRequired(executeFunctions, 'keys', itemIndex);
		const startTs = Math.trunc(Number(getOptionalParam(executeFunctions, 'startTs', itemIndex, 0)));
		const endTsParam = getOptionalParam(executeFunctions, 'endTs', itemIndex, '');
		const endTs =
			!endTsParam || endTsParam === '' || endTsParam === '0'
				? Math.trunc(Date.now())
				: Math.trunc(Number(endTsParam));
		const agg = getOptionalParam(executeFunctions, 'agg', itemIndex, 'NONE');
		const interval = getOptionalParam(executeFunctions, 'interval', itemIndex, '0');
		const intervalType = getOptionalParam(
			executeFunctions,
			'intervalType',
			itemIndex,
			'MILLISECONDS',
		);
		const timeZone = getOptionalParam(executeFunctions, 'timeZone', itemIndex, '');
		const orderBy = getOptionalParam(executeFunctions, 'orderBy', itemIndex, 'DESC');
		const limit = getOptionalParam<number>(executeFunctions, 'limit', itemIndex, 50);
		const useStrictDataTypes = getOptionalParam<boolean>(
			executeFunctions,
			'useStrictDataTypes',
			itemIndex,
			false,
		);

		const qs: QueryString = {
			keys,
			startTs,
			endTs,
			interval,
			orderBy,
			limit,
			useStrictDataTypes,
		};

		if (agg) qs.agg = agg;
		if (intervalType) qs.intervalType = intervalType;
		if (timeZone) qs.timeZone = timeZone;

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`,
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getTimeseriesKeys(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);

		const result = await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/keys/timeseries`,
			},
			baseUrl,
			token,
		);

		return { timeseriesKeys: result };
	}

	private async getLatestTimeseries(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);
		const keys = validateRequired(executeFunctions, 'keys', itemIndex);
		const useStrictDataTypes = getOptionalParam<boolean>(
			executeFunctions,
			'useStrictDataTypes',
			itemIndex,
			false,
		);

		const qs: QueryString = {
			keys,
			useStrictDataTypes,
		};

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`,
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getAttributes(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);
		const keys = validateRequired(executeFunctions, 'keys', itemIndex);

		const qs: QueryString = {};
		if (keys) qs.keys = keys;

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/values/attributes`,
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getAttributeKeys(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);

		const result = await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/keys/attributes`,
			},
			baseUrl,
			token,
		);

		return { attributeKeys: result };
	}

	private async getAttributeKeysByScope(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);
		const scope = getOptionalParam(executeFunctions, 'scope', itemIndex, 'SERVER_SCOPE');

		const result = await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/keys/attributes/${scope}`,
			},
			baseUrl,
			token,
		);

		return { attributeKeys: result };
	}

	private async saveEntityAttributes(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);
		const scope = getOptionalParam(executeFunctions, 'scope', itemIndex, 'SERVER_SCOPE');
		const attributesJson = parseJsonInput(executeFunctions, 'attributesJson', itemIndex);

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'POST',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/attributes/${scope}`,
				body: attributesJson,
			},
			baseUrl,
			token,
		);

		return { status: 'Entity attributes saved successfully' };
	}

	private async saveDeviceAttributes(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const deviceId = validateRequired(executeFunctions, 'deviceId', itemIndex);
		const scope = getOptionalParam(executeFunctions, 'scope', itemIndex, 'SERVER_SCOPE');
		const attributesJson = parseJsonInput(executeFunctions, 'attributesJson', itemIndex);

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'POST',
				endpoint: `/api/plugins/telemetry/DEVICE/${deviceId}/${scope}`,
				body: attributesJson,
			},
			baseUrl,
			token,
		);

		return { status: 'Device attributes saved successfully' };
	}

	private async saveEntityTelemetry(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);
		const telemetryJson = parseJsonInput(executeFunctions, 'telemetryJson', itemIndex);

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'POST',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/timeseries/ANY`,
				body: telemetryJson,
			},
			baseUrl,
			token,
		);

		return { status: 'Telemetry submitted successfully' };
	}

	private async saveEntityTelemetryWithTTL(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);
		const ttl = getOptionalParam<number>(executeFunctions, 'ttl', itemIndex, 0);
		const telemetryJson = parseJsonInput(executeFunctions, 'telemetryJson', itemIndex);

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'POST',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/timeseries/ANY/${ttl}`,
				body: telemetryJson,
			},
			baseUrl,
			token,
		);

		return { status: 'Telemetry with TTL submitted successfully' };
	}

	private async deleteEntityAttributes(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);
		const scope = getOptionalParam(executeFunctions, 'scope', itemIndex, 'SERVER_SCOPE');
		const attributeKeys = validateRequired(executeFunctions, 'attributeKeys', itemIndex);

		const qs: QueryString = {
			keys: attributeKeys,
		};

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'DELETE',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/${scope}`,
				qs,
			},
			baseUrl,
			token,
		);

		return { status: 'Entity attributes deleted successfully' };
	}

	private async deleteDeviceAttributes(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const deviceId = validateRequired(executeFunctions, 'deviceId', itemIndex);
		const scope = getOptionalParam(executeFunctions, 'scope', itemIndex, 'SERVER_SCOPE');
		const attributeKeys = validateRequired(executeFunctions, 'attributeKeys', itemIndex);

		const qs: QueryString = {
			keys: attributeKeys,
		};

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'DELETE',
				endpoint: `/api/plugins/telemetry/DEVICE/${deviceId}/${scope}`,
				qs,
			},
			baseUrl,
			token,
		);

		return { status: 'Device attributes deleted successfully' };
	}

	private async deleteEntityTimeseries(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const entityType = getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);
		const timeseriesKeys = validateRequired(executeFunctions, 'timeseriesKeys', itemIndex);
		const deleteAllDataForKeys = getOptionalParam<boolean>(
			executeFunctions,
			'deleteAllDataForKeys',
			itemIndex,
			false,
		);
		const deleteLatest = getOptionalParam<boolean>(
			executeFunctions,
			'deleteLatest',
			itemIndex,
			true,
		);
		const rewriteLatestIfDeleted = getOptionalParam<boolean>(
			executeFunctions,
			'rewriteLatestIfDeleted',
			itemIndex,
			false,
		);

		const qs: QueryString = {
			keys: timeseriesKeys,
			deleteAllDataForKeys,
			deleteLatest,
			rewriteLatestIfDeleted,
		};

		// Add timestamps only if not deleting all data
		if (!deleteAllDataForKeys) {
			const startTs = getOptionalParam(executeFunctions, 'deleteStartTs', itemIndex, '');
			const endTs = getOptionalParam(executeFunctions, 'deleteEndTs', itemIndex, '');

			if (startTs) {
				qs.startTs = Number(startTs);
			}
			if (endTs) {
				qs.endTs = Number(endTs);
			}
		}

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'DELETE',
				endpoint: `/api/plugins/telemetry/${entityType}/${entityId}/timeseries/delete`,
				qs,
			},
			baseUrl,
			token,
		);

		return { status: 'Entity timeseries deleted successfully' };
	}
}
