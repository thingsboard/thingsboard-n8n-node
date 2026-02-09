import { IOperationContext, IResourceHandler, QueryString } from '../utils/types';
import { makeThingsBoardRequest } from '../utils/requestHandler';
import { validateRequired } from '../utils/helpers';

export class RelationResource implements IResourceHandler {
	async execute(context: IOperationContext, operation: string): Promise<any> {
		switch (operation) {
			case 'getRelation':
				return await this.getRelation(context);

			case 'findByFrom':
				return await this.findByFrom(context);

			case 'findByFromWithRelationType':
				return await this.findByFromWithRelationType(context);

			case 'findByTo':
				return await this.findByTo(context);

			case 'findByToWithRelationType':
				return await this.findByToWithRelationType(context);

			case 'findInfoByFrom':
				return await this.findInfoByFrom(context);

			case 'findInfoByTo':
				return await this.findInfoByTo(context);

			default:
				throw new Error(`Unknown relation operation: ${operation}`);
		}
	}

	private async getRelation(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const fromId = validateRequired(executeFunctions, 'fromId', itemIndex);
		const fromType = validateRequired(executeFunctions, 'fromType', itemIndex);
		const relationType = validateRequired(executeFunctions, 'relationType', itemIndex);
		const toId = validateRequired(executeFunctions, 'toId', itemIndex);
		const toType = validateRequired(executeFunctions, 'toType', itemIndex);

		const qs: QueryString = {
			fromId,
			fromType,
			relationType,
			relationTypeGroup: 'COMMON',
			toId,
			toType,
		};

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/relation',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async findByFrom(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const fromId = validateRequired(executeFunctions, 'fromId', itemIndex);
		const fromType = validateRequired(executeFunctions, 'fromType', itemIndex);

		const qs: QueryString = {
			fromId,
			fromType,
			relationTypeGroup: 'COMMON',
		};

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/relations',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async findByFromWithRelationType(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const fromId = validateRequired(executeFunctions, 'fromId', itemIndex);
		const fromType = validateRequired(executeFunctions, 'fromType', itemIndex);
		const relationType = validateRequired(executeFunctions, 'relationType', itemIndex);

		const qs: QueryString = {
			fromId,
			fromType,
			relationType,
			relationTypeGroup: 'COMMON',
		};

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/relations',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async findByTo(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const toId = validateRequired(executeFunctions, 'toId', itemIndex);
		const toType = validateRequired(executeFunctions, 'toType', itemIndex);

		const qs: QueryString = {
			toId,
			toType,
			relationTypeGroup: 'COMMON',
		};

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/relations',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async findByToWithRelationType(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const toId = validateRequired(executeFunctions, 'toId', itemIndex);
		const toType = validateRequired(executeFunctions, 'toType', itemIndex);
		const relationType = validateRequired(executeFunctions, 'relationType', itemIndex);

		const qs: QueryString = {
			toId,
			toType,
			relationType,
			relationTypeGroup: 'COMMON',
		};

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/relations',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async findInfoByFrom(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const fromId = validateRequired(executeFunctions, 'fromId', itemIndex);
		const fromType = validateRequired(executeFunctions, 'fromType', itemIndex);

		const qs: QueryString = {
			fromId,
			fromType,
			relationTypeGroup: 'COMMON',
		};

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/relations/info',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}

	private async findInfoByTo(context: IOperationContext): Promise<any> {
		const { executeFunctions, itemIndex, baseUrl, credentialType } = context;

		const toId = validateRequired(executeFunctions, 'toId', itemIndex);
		const toType = validateRequired(executeFunctions, 'toType', itemIndex);

		const qs: QueryString = {
			toId,
			toType,
			relationTypeGroup: 'COMMON',
		};

		return await makeThingsBoardRequest(
			executeFunctions,
			{
				method: 'GET',
				endpoint: '/api/relations/info',
				qs,
			},
			baseUrl,
			credentialType,
		);
	}
}
