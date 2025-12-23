import { IOperationContext, IResourceHandler } from '../utils/types';
import { makeThingsBoardRequest } from '../utils/requestHandler';
import {
	buildPaginationQuery,
	paginationToQueryString,
	parseJsonInput,
	buildEntityWithCustomer,
	getOptionalParam,
	validateRequired,
} from '../utils/helpers';

export class AssetResource implements IResourceHandler {
	async execute(context: IOperationContext, operation: string): Promise<any> {
		switch (operation) {
			case 'getAssetById':
				return await this.getAssetById(context);

			case 'createAsset':
				return await this.createAsset(context);

			case 'deleteAsset':
				return await this.deleteAsset(context);

			case 'getTenantAsset':
				return await this.getTenantAsset(context);

			case 'getTenantAssets':
				return await this.getTenantAssets(context);

			case 'getCustomerAssets':
				return await this.getCustomerAssets(context);

			case 'getUserAssets':
				return await this.getUserAssets(context);

			case 'getAssetsByEntityGroupId':
				return await this.getAssetsByEntityGroupId(context);

			default:
				throw new Error(`Unknown asset operation: ${operation}`);
		}
	}

	private async getAssetById(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const assetId = validateRequired(executeFunctions, 'assetId', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/asset/${assetId}`,
			},
			baseUrl,
			token,
		);
	}

	private async createAsset(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const mode = getOptionalParam(
			executeFunctions,
			'assetInputMode',
			itemIndex,
			'params',
		) as string;

		let body: Record<string, unknown>;

		if (mode === 'json') {
			body = parseJsonInput(executeFunctions, 'assetJson', itemIndex);
		} else {
			const name = validateRequired(executeFunctions, 'assetNameCreate', itemIndex);
			const type = getOptionalParam(executeFunctions, 'assetTypeCreate', itemIndex, '');
			const label = getOptionalParam(executeFunctions, 'assetLabel', itemIndex, '');
			const customerId = getOptionalParam(executeFunctions, 'customerIdAssetCreate', itemIndex, '');

			body = buildEntityWithCustomer(name, type, label, customerId);
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'POST',
				endpoint: '/api/asset',
				body,
			},
			baseUrl,
			token,
		);
	}

	private async deleteAsset(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const assetId = validateRequired(executeFunctions, 'assetId', itemIndex);

		await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'DELETE',
				endpoint: `/api/asset/${assetId}`,
			},
			baseUrl,
			token,
		);

		return { deleted: true };
	}

	private async getTenantAsset(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const assetName = validateRequired(executeFunctions, 'assetName', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/tenant/assets',
				qs: { assetName },
			},
			baseUrl,
			token,
		);
	}

	private async getTenantAssets(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'asset');
		const qs = paginationToQueryString(paginationParams);

		const type = getOptionalParam(executeFunctions, 'assetType', itemIndex, '');
		if (type) {
			qs.type = type;
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/tenant/assets',
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getCustomerAssets(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const customerId = validateRequired(executeFunctions, 'customerIdRequired', itemIndex);

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'asset');
		const qs = paginationToQueryString(paginationParams);

		const type = getOptionalParam(executeFunctions, 'assetType', itemIndex, '');
		if (type) {
			qs.type = type;
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/customer/${customerId}/assets`,
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getUserAssets(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'asset');
		const qs = paginationToQueryString(paginationParams);

		const type = getOptionalParam(executeFunctions, 'assetType', itemIndex, '');
		if (type) {
			qs.type = type;
		}

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/user/assets',
				qs,
			},
			baseUrl,
			token,
		);
	}

	private async getAssetsByEntityGroupId(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const entityGroupId = validateRequired(executeFunctions, 'entityGroupId', itemIndex);

		const paginationParams = buildPaginationQuery(executeFunctions, itemIndex, 'asset');
		const qs = paginationToQueryString(paginationParams);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/entityGroup/${entityGroupId}/assets`,
				qs,
			},
			baseUrl,
			token,
		);
	}
}
