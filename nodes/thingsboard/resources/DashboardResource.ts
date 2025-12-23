import { IOperationContext, IResourceHandler } from '../utils/types';
import { makeThingsBoardRequest } from '../utils/requestHandler';
import {
	buildPaginationQuery,
	paginationToQueryString,
	parseJsonInput,
	getOptionalParam,
	validateRequired,
} from '../utils/helpers';

export class DashboardResource implements IResourceHandler {
	async execute(context: IOperationContext, operation: string): Promise<any> {
		switch (operation) {
			case 'createDashboard':
				return await this.createDashboard(context);

			case 'getDashboardById':
				return await this.getDashboardById(context);

			case 'deleteDashboard':
				return await this.deleteDashboard(context);

			case 'getDashboards':
				return await this.getDashboards(context);

			case 'getCustomerDashboards':
				return await this.getCustomerDashboards(context);

			case 'getUserDashboards':
				return await this.getUserDashboards(context);

			default:
				throw new Error(`Unknown dashboard operation: ${operation}`);
		}
	}

	private async createDashboard(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const mode = getOptionalParam(
			executeFunctions,
			'dashboardInputMode',
			itemIndex,
			'title',
		) as string;

		let body: Record<string, unknown>;

		if (mode === 'json') {
			body = parseJsonInput(executeFunctions, 'dashboardJson', itemIndex);
		} else {
			const title = validateRequired(executeFunctions, 'dashboardTitle', itemIndex);
			body = { title };
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'POST',
				endpoint: '/api/dashboard',
				body,
			},
			baseUrl,
			token,
		);
	}

	private async getDashboardById(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const dashboardId = validateRequired(executeFunctions, 'dashboardId', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/dashboard/${dashboardId}`,
			},
			baseUrl,
			token,
		);
	}

	private async deleteDashboard(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const dashboardId = validateRequired(executeFunctions, 'dashboardId', itemIndex);

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'DELETE',
				endpoint: `/api/dashboard/${dashboardId}`,
			},
			baseUrl,
			token,
		);

		return { deleted: true };
	}

	private async getDashboards(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'dashboard');
		const qs = paginationToQueryString(paginationParams);

		const isMobileDashboard = getOptionalParam<boolean>(
			executeFunctions,
			'isMobileDashboard',
			itemIndex,
			false,
		);
		if (typeof isMobileDashboard === 'boolean') {
			qs.mobile = isMobileDashboard;
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/tenant/dashboards',
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getCustomerDashboards(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const customerId = validateRequired(executeFunctions, 'customerIdRequired', itemIndex);

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'dashboard');
		const qs = paginationToQueryString(paginationParams);

		const includeCustomers = getOptionalParam<boolean>(
			executeFunctions,
			'includeCustomers',
			itemIndex,
			false,
		);
		if (typeof includeCustomers === 'boolean') {
			qs.includeCustomers = includeCustomers;
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/customer/${customerId}/dashboards`,
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getUserDashboards(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'dashboard');
		const qs = paginationToQueryString(paginationParams);

		const isMobileDashboard = getOptionalParam<boolean>(
			executeFunctions,
			'isMobileDashboard',
			itemIndex,
			false,
		);
		const allowedOperation = getOptionalParam(
			executeFunctions,
			'dashboardOperation',
			itemIndex,
			'',
		);
		const userId = getOptionalParam(executeFunctions, 'userId', itemIndex, '');

		if (typeof isMobileDashboard === 'boolean') qs.mobile = isMobileDashboard;
		if (allowedOperation) qs.operation = allowedOperation;
		if (userId) qs.userId = userId;

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/user/dashboards',
				qs,
			},
			baseUrl,
			token,
		);
	}
}
