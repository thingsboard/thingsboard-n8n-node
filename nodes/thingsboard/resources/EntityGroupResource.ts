import { IOperationContext, IResourceHandler } from '../utils/types';
import { makeThingsBoardRequest } from '../utils/requestHandler';
import { validateRequired } from '../utils/helpers';

export class EntityGroupResource implements IResourceHandler {
	async execute(context: IOperationContext, operation: string): Promise<any> {
		switch (operation) {
			case 'getEntityGroupById':
				return await this.getEntityGroupById(context);

			case 'getEntityGroupsByType':
				return await this.getEntityGroupsByType(context);

			case 'getEntityGroupByOwnerAndNameAndType':
				return await this.getEntityGroupByOwnerAndNameAndType(context);

			case 'getEntityGroupsByOwnerAndType':
				return await this.getEntityGroupsByOwnerAndType(context);

			case 'getEntityGroupsForEntity':
				return await this.getEntityGroupsForEntity(context);

			default:
				throw new Error(`Unknown entity group operation: ${operation}`);
		}
	}

	private async getEntityGroupById(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const entityGroupId = validateRequired(executeFunctions, 'entityGroupId', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/entityGroup/${entityGroupId}`,
			},
			baseUrl,
			token,
		);
	}

	private async getEntityGroupsByType(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;
		const groupType = validateRequired(executeFunctions, 'groupType', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/entityGroups/${groupType}`,
			},
			baseUrl,
			token,
		);
	}

	private async getEntityGroupByOwnerAndNameAndType(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const ownerType = validateRequired(executeFunctions, 'ownerType', itemIndex);
		const ownerId = validateRequired(executeFunctions, 'ownerId', itemIndex);
		const groupType = validateRequired(executeFunctions, 'groupType', itemIndex);
		const groupName = validateRequired(executeFunctions, 'groupName', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/entityGroup/${ownerType}/${ownerId}/${groupType}/${encodeURIComponent(groupName)}`,
			},
			baseUrl,
			token,
		);
	}

	private async getEntityGroupsByOwnerAndType(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const ownerType = validateRequired(executeFunctions, 'ownerType', itemIndex);
		const ownerId = validateRequired(executeFunctions, 'ownerId', itemIndex);
		const groupType = validateRequired(executeFunctions, 'groupType', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/entityGroups/${ownerType}/${ownerId}/${groupType}`,
			},
			baseUrl,
			token,
		);
	}

	private async getEntityGroupsForEntity(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, token } = context;

		const groupType = validateRequired(executeFunctions, 'groupType', itemIndex);
		const entityId = validateRequired(executeFunctions, 'entityId', itemIndex);

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: `/api/entityGroups/${groupType}/${entityId}`,
			},
			baseUrl,
			token,
		);
	}
}
