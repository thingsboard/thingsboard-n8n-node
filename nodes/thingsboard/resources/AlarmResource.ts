import { IOperationContext, IResourceHandler, QueryString } from '../utils/types';
import { makeThingsBoardRequest } from '../utils/requestHandler';
import { getOptionalParam, validateRequired } from '../utils/helpers';
import { buildPaginationQuery, paginationToQueryString } from '../utils/helpers';

export class AlarmResource implements IResourceHandler {
	async execute(context: IOperationContext, operation: string): Promise<any> {
		switch (operation) {
			case 'getAlarmById':
				return await this.getAlarmById(context);

			case 'getAlarmInfoById':
				return await this.getAlarmInfoById(context);

			case 'getAlarms':
				return await this.getAlarms(context);

			case 'getAllAlarms':
				return await this.getAllAlarms(context);

			case 'getHighestAlarmSeverity':
				return await this.getHighestAlarmSeverity(context);

			case 'getAlarmTypes':
				return await this.getAlarmTypes(context);

			default:
				throw new Error(`Unknown alarm operation: ${operation}`);
		}
	}

	private async getAlarmById(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;
		const alarmId = validateRequired(executeFunctions, 'alarmId', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/alarm/${alarmId}`,
			},
			baseUrl,
			credentialType,
		);
	}

	private async getAlarmInfoById(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;
		const alarmId = validateRequired(executeFunctions, 'alarmId', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/alarm/info/${alarmId}`,
			},
			baseUrl,
			credentialType,
		);
	}

	private async getAlarms(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const entityType = validateRequired(executeFunctions, 'alarmEntityType', itemIndex);
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'alarm');
		const qs = paginationToQueryString(paginationParams);

		const searchStatus = getOptionalParam(executeFunctions, 'searchStatus', itemIndex, '');
		const status = getOptionalParam(executeFunctions, 'status', itemIndex, '');
		const startTs = getOptionalParam(executeFunctions, 'startTs', itemIndex, '');
		const endTs = getOptionalParam(executeFunctions, 'endTs', itemIndex, '');
		const fetchOriginator = getOptionalParam<boolean>(
			executeFunctions,
			'fetchOriginator',
			itemIndex,
			false,
		);

		if (searchStatus) qs.searchStatus = searchStatus;
		if (status) qs.status = status;
		if (startTs) qs.startTime = startTs;
		if (endTs) qs.endTime = endTs;
		if (fetchOriginator !== undefined) qs.fetchOriginator = fetchOriginator;

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/alarm/${entityType}/${entityId}`,
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async getAllAlarms(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'alarm');
		const qs = paginationToQueryString(paginationParams);

		const searchStatus = getOptionalParam(executeFunctions, 'searchStatus', itemIndex, '');
		const status = getOptionalParam(executeFunctions, 'status', itemIndex, '');
		const assigneeId = getOptionalParam(executeFunctions, 'assigneeId', itemIndex, '');
		const startTs = getOptionalParam(executeFunctions, 'startTs', itemIndex, '');
		const endTs = getOptionalParam(executeFunctions, 'endTs', itemIndex, '');
		const fetchOriginator = getOptionalParam<boolean>(
			executeFunctions,
			'fetchOriginator',
			itemIndex,
			false,
		);

		if (searchStatus) qs.searchStatus = searchStatus;
		if (status) qs.status = status;
		if (assigneeId) qs.assigneeId = assigneeId;
		if (startTs) qs.startTime = startTs;
		if (endTs) qs.endTime = endTs;
		if (fetchOriginator !== undefined) qs.fetchOriginator = fetchOriginator;

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/alarms',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async getHighestAlarmSeverity(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const alarmEntityType = getOptionalParam(executeFunctions, 'alarmEntityType', itemIndex, '');
		const entityType =
			alarmEntityType || getOptionalParam(executeFunctions, 'entityType', itemIndex, 'DEVICE');
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);

		const qs: QueryString = {};
		const searchStatus = getOptionalParam(executeFunctions, 'searchStatus', itemIndex, '');
		const status = getOptionalParam(executeFunctions, 'status', itemIndex, '');

		if (searchStatus) qs.searchStatus = searchStatus;
		if (status) qs.status = status;

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/alarm/highestSeverity/${entityType}/${entityId}`,
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async getAlarmTypes(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'alarm');
		const qs = paginationToQueryString(paginationParams);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/alarm/types',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}
}
