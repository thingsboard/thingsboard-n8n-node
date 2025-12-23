/**
 * Resource registry for ThingsBoard node
 * Maps resource names to their handlers
 */
import { IResourceHandler, ThingsBoardResource } from './types';
import { DeviceResource } from '../resources/DeviceResource';
import { AssetResource } from '../resources/AssetResource';
import { CustomerResource } from '../resources/CustomerResource';
import { AlarmResource } from '../resources/AlarmResource';
import { TelemetryResource } from '../resources/TelemetryResource';
import { RelationResource } from '../resources/RelationResource';
import { EntityGroupResource } from '../resources/EntityGroupResource';
import { DashboardResource } from '../resources/DashboardResource';

/**
 * Resource handler registry
 * Provides a centralized way to get resource handlers
 */
export class ResourceRegistry {
	private static handlers: Map<ThingsBoardResource, IResourceHandler> = new Map<
		ThingsBoardResource,
		IResourceHandler
	>([
		['device', new DeviceResource()],
		['asset', new AssetResource()],
		['customer', new CustomerResource()],
		['alarm', new AlarmResource()],
		['telemetry', new TelemetryResource()],
		['relation', new RelationResource()],
		['entityGroup', new EntityGroupResource()],
		['dashboard', new DashboardResource()],
	]);

	/**
	 * Get resource handler by resource name
	 */
	static getHandler(resource: string): IResourceHandler {
		const handler = this.handlers.get(resource as ThingsBoardResource);

		if (!handler) {
			throw new Error(`Unknown resource: ${resource}`);
		}

		return handler;
	}
}
