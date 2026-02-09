import { IOperationContext, IResourceHandler } from '../utils/types';
import { makeThingsBoardRequest } from '../utils/requestHandler';
import { buildPaginationQuery, paginationToQueryString, validateRequired } from '../utils/helpers';

export class CustomerResource implements IResourceHandler {
	async execute(context: IOperationContext, operation: string): Promise<any> {
		switch (operation) {
			case 'getCustomerById':
				return await this.getCustomerById(context);

			case 'createCustomer':
				return await this.createCustomer(context);

			case 'deleteCustomer':
				return await this.deleteCustomer(context);

			case 'getCustomers':
				return await this.getCustomers(context);

			case 'getTenantCustomer':
				return await this.getTenantCustomer(context);

			case 'getCustomersByEntityGroupId':
				return await this.getCustomersByEntityGroupId(context);

			case 'getUserCustomers':
				return await this.getUserCustomers(context);

			default:
				throw new Error(`Unknown customer operation: ${operation}`);
		}
	}

	private async getCustomerById(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;
		const customerId = validateRequired(executeFunctions, 'customerIdRequired', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/customer/${customerId}`,
			},
			baseUrl,
			credentialType,
		);
	}

	private async createCustomer(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;
		const title = validateRequired(executeFunctions, 'customerTitle', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'POST',
				endpoint: '/api/customer',
				body: { title },
			},
			baseUrl,
			credentialType,
		);
	}

	private async deleteCustomer(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;
		const customerId = validateRequired(executeFunctions, 'customerIdRequired', itemIndex);

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'DELETE',
				endpoint: `/api/customer/${customerId}`,
			},
			baseUrl,
			credentialType,
		);

		return { deleted: true };
	}

	private async getCustomers(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'customer');
		const qs = paginationToQueryString(paginationParams);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/customers',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async getTenantCustomer(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;
		const customerTitle = validateRequired(executeFunctions, 'customerTitle', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/tenant/customers',
				qs: { customerTitle },
			},
			baseUrl,
			credentialType,
		);
	}

	private async getCustomersByEntityGroupId(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;
		const entityGroupId = validateRequired(executeFunctions, 'entityGroupId', itemIndex);

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'customer');
		const qs = paginationToQueryString(paginationParams);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/entityGroup/${entityGroupId}/customers`,
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async getUserCustomers(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'customer');
		const qs = paginationToQueryString(paginationParams);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/user/customers',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}
}
