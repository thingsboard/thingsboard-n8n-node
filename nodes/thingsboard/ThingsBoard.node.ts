import {
	ICredentialTestFunctions,
	ICredentialsDecrypted,
	IExecuteFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// Import refactored utilities and handlers
import {
	getAuthToken,
	getThingsBoardCredentials,
	checkEditionSupport,
} from './utils/requestHandler';
import { IOperationContext } from './utils/types';
import { ResourceRegistry } from './utils/resourceRegistry';

/**
 * -------------------------------
 * Constants & Types
 * -------------------------------
 */
const PE_ONLY_OPERATIONS = new Set<string>([
	'entityGroup:getEntityGroupById',
	'entityGroup:getEntityGroupsByType',
	'entityGroup:getEntityGroupByOwnerAndNameAndType',
	'entityGroup:getEntityGroupsByOwnerAndType',
	'entityGroup:getEntityGroupsForEntity',
	'customer:getCustomersByEntityGroupId',
	'customer:getUserCustomers',
	'device:getUserDevices',
	'device:getDevicesByEntityGroupId',
	'asset:getUserAssets',
	'asset:getAssetsByEntityGroupId',
]);

export class ThingsBoard implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ThingsBoard',
		name: 'thingsBoard',
		icon: {
			light: 'file:thingsboard-black.svg',
			dark: 'file:thingsboard-white.svg',
		},
		group: ['transform'],
		version: 1,
		description: 'Interact with ThingsBoard REST API',
		defaults: { name: 'ThingsBoard' },
		inputs: ['main'] as any,
		outputs: ['main'] as any,
		credentials: [{ name: 'thingsBoardApi', required: true }],
		usableAsTool: true,
		documentationUrl: 'https://thingsboard.io/docs/samples/analytics/n8n-node/',
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Alarm', value: 'alarm' },
					{ name: 'Asset', value: 'asset' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Dashboard', value: 'dashboard' },
					{ name: 'Device', value: 'device' },
					{ name: 'Entity Group', value: 'entityGroup' },
					{ name: 'Relation', value: 'relation' },
					{ name: 'Telemetry', value: 'telemetry' },
				],
				default: 'device',
				description: 'Select which ThingsBoard resource to work with',
			},

			// -------- Device operations --------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['device'] } },

				options: [
					{
						name: 'Create',
						value: 'createDevice',
						action: 'Create a device',
						description: 'Create a device',
					},
					{
						name: 'Delete',
						value: 'deleteDevice',
						action: 'Delete a device',
						description: 'Delete a device',
					},
					{
						name: 'Get by ID',
						value: 'getDeviceById',
						action: 'Get a device by ID',
						description: 'Fetch a device based on the provided Device ID',
					},
					{
						name: 'Get by Name',
						value: 'getTenantDevice',
						action: 'Get a device by name',
						description: 'Fetch a device by name',
					},
					{
						name: 'Get Many',
						value: 'getTenantDevices',
						action: 'Get devices',
						description: 'Returns a page of devices',
					},
					{
						name: 'Get Many by Customer',
						value: 'getCustomerDevices',
						action: 'Get customer devices',
						description: 'Returns a page of devices assigned to the customer',
					},
					{
						name: 'Get Many by Entity Group',
						value: 'getDevicesByEntityGroupId',
						action: 'Get entity group devices',
						description: 'Returns a page of devices that belongs to the specified Entity Group ID',
					},
					{
						name: 'Get Many for Current User',
						value: 'getUserDevices',
						action: 'Get user devices',
						description: 'Returns a page of devices accessible to the current user',
					},
				],

				default: 'getDeviceById',
			},
			// ------- Common parameters --------
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1 },
				description: 'Maximum amount of entities in a one page',
				displayOptions: {
					show: {
						resource: ['device', 'asset', 'customer', 'alarm', 'dashboard'],
						operation: [
							'getTenantDevices',
							'getCustomerDevices',
							'getUserDevices',
							'getDevicesByEntityGroupId',
							'getTenantAssets',
							'getCustomerAssets',
							'getUserAssets',
							'getAssetsByEntityGroupId',
							'getCustomers',
							'getCustomersByEntityGroupId',
							'getUserCustomers',
							'getAlarms',
							'getAllAlarms',
							'getAlarmTypes',
							'getDashboards',
							'getCustomerDashboards',
							'getUserDashboards',
						],
					},
				},
			},
			{
				displayName: 'Page Number',
				name: 'page',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Sequence number of page starting from 0',
				displayOptions: {
					show: {
						resource: ['device', 'asset', 'customer', 'alarm', 'dashboard'],
						operation: [
							'getTenantDevices',
							'getCustomerDevices',
							'getUserDevices',
							'getDevicesByEntityGroupId',
							'getTenantAssets',
							'getCustomerAssets',
							'getUserAssets',
							'getAssetsByEntityGroupId',
							'getCustomers',
							'getCustomersByEntityGroupId',
							'getUserCustomers',
							'getAlarms',
							'getAllAlarms',
							'getAlarmTypes',
							'getDashboards',
							'getCustomerDashboards',
							'getUserDashboards',
						],
					},
				},
			},
			{
				displayName: 'Sort Order',
				name: 'sortOrder',
				type: 'options',
				options: [
					{ name: 'ASC', value: 'ASC' },
					{ name: 'DESC', value: 'DESC' },
				],
				default: 'DESC',
				description: 'Sort order. ASC (ASCENDING) or DESC (DESCENDING).',
				displayOptions: {
					show: {
						resource: ['device', 'asset', 'customer', 'alarm', 'dashboard'],
						operation: [
							'getTenantDevices',
							'getCustomerDevices',
							'getUserDevices',
							'getDevicesByEntityGroupId',
							'getTenantAssets',
							'getCustomerAssets',
							'getUserAssets',
							'getAssetsByEntityGroupId',
							'getCustomers',
							'getCustomersByEntityGroupId',
							'getUserCustomers',
							'getAlarms',
							'getAllAlarms',
							'getAlarmTypes',
							'getDashboards',
							'getCustomerDashboards',
							'getUserDashboards',
						],
					},
				},
			},

			// Device params:
			{
				displayName: 'Input Mode',
				name: 'deviceInputMode',
				type: 'options',
				default: 'params',
				options: [
					{
						name: 'Params',
						value: 'params',
						description: 'Use the fields below (name, type, label, etc.)',
					},
					{
						name: 'Full JSON',
						value: 'json',
						description: 'Provide a full ThingsBoard device JSON object',
					},
				],
				displayOptions: { show: { resource: ['device'], operation: ['createDevice'] } },
			},
			{
				displayName: 'Device JSON',
				name: 'deviceJson',
				type: 'json',
				required: true,
				default: '{ "name": "My device", "type": "default" }',
				description: 'Full ThingsBoard device JSON object. Include "ID" to update existing device.',
				displayOptions: {
					show: { resource: ['device'], operation: ['createDevice'], deviceInputMode: ['json'] },
				},
			},
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'string',
				required: true,
				default: '',
				description:
					'A string value representing the device ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: { resource: ['device'], operation: ['getDeviceById', 'deleteDevice'] },
				},
			},
			{
				displayName: 'Name',
				name: 'deviceName',
				type: 'string',
				required: true,
				default: '',
				description: 'A string value representing the device name. For example, "My device".',
				displayOptions: { show: { resource: ['device'], operation: ['getTenantDevice'] } },
			},
			{
				displayName: 'Name',
				name: 'deviceNameCreate',
				type: 'string',
				required: true,
				default: '',
				description: 'A string value representing the device name. For example, "My device".',
				displayOptions: {
					show: { resource: ['device'], operation: ['createDevice'], deviceInputMode: ['params'] },
				},
			},
			{
				displayName: 'Label',
				name: 'deviceLabel',
				type: 'string',
				default: '',
				description: 'An optional label for the device',
				displayOptions: {
					show: { resource: ['device'], operation: ['createDevice'], deviceInputMode: ['params'] },
				},
			},
			{
				displayName: 'Access Token',
				name: 'deviceAccessToken',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Device access token. If not provided it will be autogenerated.',
				displayOptions: { show: { resource: ['device'], operation: ['createDevice'] } },
			},
			{
				displayName: 'Type',
				name: 'deviceType',
				type: 'string',
				default: '',
				description: 'Device type as the name of the device profile',
				displayOptions: {
					show: {
						resource: ['device'],
						operation: ['getTenantDevices', 'getCustomerDevices', 'getUserDevices'],
					},
				},
			},
			{
				displayName: 'Type',
				name: 'deviceTypeCreate',
				type: 'string',
				default: '',
				description: 'Device type as the name of the device profile',
				displayOptions: {
					show: { resource: ['device'], operation: ['createDevice'], deviceInputMode: ['params'] },
				},
			},
			{
				displayName: 'Text Search',
				name: 'deviceTextSearch',
				type: 'string',
				default: '',
				description: 'The case insensitive "substring" filter based on the device name',
				displayOptions: {
					show: {
						resource: ['device'],
						operation: [
							'getTenantDevices',
							'getCustomerDevices',
							'getUserDevices',
							'getDevicesByEntityGroupId',
						],
					},
				},
			},
			{
				displayName: 'Sort Property',
				name: 'deviceSortProperty',
				type: 'options',
				options: [
					{ name: 'createdTime', value: 'createdTime' },
					{ name: 'customerTitle', value: 'customerTitle' },
					{ name: 'Label', value: 'label' },
					{ name: 'Name', value: 'name' },
					{ name: 'Type', value: 'type' },
				],
				default: 'createdTime',
				description: 'Property of entity to sort by',
				displayOptions: {
					show: {
						resource: ['device'],
						operation: [
							'getTenantDevices',
							'getCustomerDevices',
							'getUserDevices',
							'getDevicesByEntityGroupId',
						],
					},
				},
			},

			// -------- Asset operations --------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['asset'] } },
				options: [
					{
						name: 'Create',
						value: 'createAsset',
						action: 'Create an asset',
						description: 'Create an asset',
					},
					{
						name: 'Delete',
						value: 'deleteAsset',
						action: 'Delete an asset',
						description: 'Delete an asset',
					},
					{
						name: 'Get by ID',
						value: 'getAssetById',
						action: 'Get asset by id',
						description: 'Fetch an asset based on the provided Asset ID',
					},
					{
						name: 'Get by Name',
						value: 'getTenantAsset',
						action: 'Get asset by name',
						description: 'Fetch an asset by name',
					},
					{
						name: 'Get Many',
						value: 'getTenantAssets',
						action: 'Get tenant assets',
						description: 'Returns a page of assets',
					},
					{
						name: 'Get Many by Customer',
						value: 'getCustomerAssets',
						action: 'Get customer assets',
						description: 'Returns a page of assets assigned to the customer',
					},
					{
						name: 'Get Many by Entity Group',
						value: 'getAssetsByEntityGroupId',
						action: 'Get assets by entity group',
						description: 'Returns a page of devices that belongs to the specified Entity Group ID',
					},
					{
						name: 'Get Many for Current User',
						value: 'getUserAssets',
						action: 'Get user assets',
						description: 'Returns a page of assets accessible to the current user',
					},
				],
				default: 'getAssetById',
			},
			// Asset params:
			{
				displayName: 'Input Mode',
				name: 'assetInputMode',
				type: 'options',
				default: 'params',
				options: [
					{
						name: 'Params',
						value: 'params',
						description: 'Use the fields below (name, type, label, etc.)',
					},
					{
						name: 'Full JSON',
						value: 'json',
						description: 'Provide a full ThingsBoard asset JSON object',
					},
				],
				displayOptions: { show: { resource: ['asset'], operation: ['createAsset'] } },
			},
			{
				displayName: 'Asset JSON',
				name: 'assetJson',
				type: 'json',
				required: true,
				default: '{ "name": "My Asset", "type": "default" }',
				description: 'Full ThingsBoard asset JSON object. Include "ID" to update existing asset.',
				displayOptions: {
					show: { resource: ['asset'], operation: ['createAsset'], assetInputMode: ['json'] },
				},
			},
			{
				displayName: 'Asset ID',
				name: 'assetId',
				type: 'string',
				required: true,
				default: '',
				description:
					'A string value representing the asset ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: { resource: ['asset'], operation: ['getAssetById', 'deleteAsset'] },
				},
			},
			{
				displayName: 'Asset Name',
				name: 'assetName',
				type: 'string',
				required: true,
				default: '',
				description: 'A string value representing the asset name. For example, "My Asset".',
				displayOptions: { show: { resource: ['asset'], operation: ['getTenantAsset'] } },
			},
			{
				displayName: 'Asset Name',
				name: 'assetNameCreate',
				type: 'string',
				required: true,
				default: '',
				description: 'A string value representing the asset name. For example, "My Asset".',
				displayOptions: {
					show: { resource: ['asset'], operation: ['createAsset'], assetInputMode: ['params'] },
				},
			},
			{
				displayName: 'Label',
				name: 'assetLabel',
				type: 'string',
				default: '',
				description: 'Optional label',
				displayOptions: { show: { resource: ['asset'], operation: ['createAsset'] } },
			},
			{
				displayName: 'Type',
				name: 'assetType',
				type: 'string',
				default: '',
				description: 'Asset type as the name of the asset profile',
				displayOptions: {
					show: {
						resource: ['asset'],
						operation: [
							'getTenantAssets',
							'getCustomerAssets',
							'getUserAssets',
							'getAssetsByEntityGroupId',
							'createAsset',
						],
					},
				}, // added getUserAssets & getAssetsByEntityGroupId
			},
			{
				displayName: 'Type',
				name: 'assetTypeCreate',
				type: 'string',
				default: '',
				description: 'Asset type as the name of the asset profile',
				displayOptions: {
					show: { resource: ['asset'], operation: ['createAsset'], assetInputMode: ['params'] },
				},
			},
			{
				displayName: 'Text Search',
				name: 'assetTextSearch',
				type: 'string',
				default: '',
				description: 'The case insensitive "substring" filter based on the asset name',
				displayOptions: {
					show: {
						resource: ['asset'],
						operation: [
							'getTenantAssets',
							'getCustomerAssets',
							'getUserAssets',
							'getAssetsByEntityGroupId',
						],
					},
				},
			},
			{
				displayName: 'Sort Property',
				name: 'assetSortProperty',
				type: 'options',
				options: [
					{ name: 'createdTime', value: 'createdTime' },
					{ name: 'customerTitle', value: 'customerTitle' },
					{ name: 'Label', value: 'label' },
					{ name: 'Name', value: 'name' },
					{ name: 'Type', value: 'type' },
				],
				default: 'createdTime',
				description: 'Property of entity to sort by',
				displayOptions: {
					show: {
						resource: ['asset'],
						operation: [
							'getTenantAssets',
							'getCustomerAssets',
							'getUserAssets',
							'getAssetsByEntityGroupId',
						],
					},
				},
			},

			// -------- Alarm operations --------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['alarm'] } },
				options: [
					{
						name: 'Get All',
						value: 'getAllAlarms',
						action: 'Get all alarms',
						description: 'Returns a page of alarms that belongs to the current owner',
					},
					{
						name: 'Get by ID',
						value: 'getAlarmById',
						action: 'Get alarm by id',
						description: 'Fetch an alarm based on the provided Alarm ID',
					},
					{
						name: 'Get by originator',
						value: 'getAlarms',
						action: 'Get alarms by originator',
						description: 'Returns a page of alarms for the selected entity',
					},
					{
						name: 'Get Highest Severity',
						value: 'getHighestAlarmSeverity',
						action: 'Get alarm highest severity',
						description:
							'Search the alarms by originator and return the highest AlarmSeverity(CRITICAL, MAJOR, MINOR, WARNING or INDETERMINATE)',
					},
					{
						name: 'Get Info by ID',
						value: 'getAlarmInfoById',
						action: 'Get alarm info by id',
						description: 'Fetch an alarm Info based on the provided Alarm ID',
					},
					{
						name: 'Get Types',
						value: 'getAlarmTypes',
						action: 'Get alarm types',
						description: 'Returns a set of unique alarm types',
					},
				],
				default: 'getAlarmById',
			},
			// ------- Customer operations --------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['customer'] } },
				options: [
					{
						name: 'Create',
						value: 'createCustomer',
						action: 'Create a customer',
						description: 'Create a customer',
					},
					{
						name: 'Delete',
						value: 'deleteCustomer',
						action: 'Delete a customer',
						description: 'Delete a customer',
					},
					{
						name: 'Get by ID',
						value: 'getCustomerById',
						action: 'Get customer by id',
						description: 'Fetch a customer based on the provided Customer ID',
					},
					{
						name: 'Get by Title',
						value: 'getTenantCustomer',
						action: 'Get customer by title',
						description: 'Fetch a customer by title',
					},
					{
						name: 'Get Many',
						value: 'getCustomers',
						action: 'Get customers',
						description: 'Returns a page of customers',
					},
					{
						name: 'Get Many by Entity Group',
						value: 'getCustomersByEntityGroupId',
						action: 'Get customers by entity group',
						description: 'Returns a list of customers based on the provided Entity ID',
					},
					{
						name: 'Get Many for Current User',
						value: 'getUserCustomers',
						action: 'Get user customers',
						description: 'Returns a page of customers available for the current user',
					},
				],
				default: 'getCustomerById',
			},
			// Customer params:
			{
				displayName: 'Customer ID',
				name: 'customerIdAssetCreate',
				type: 'string',
				default: '',
				description:
					'A string value representing the customer ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: { resource: ['asset'], operation: ['createAsset'], assetInputMode: ['params'] },
				},
			},
			{
				displayName: 'Customer ID',
				name: 'customerIdDeviceCreate',
				type: 'string',
				default: '',
				description:
					'A string value representing the customer ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: { resource: ['device'], operation: ['createDevice'], deviceInputMode: ['params'] },
				},
			},
			{
				displayName: 'Customer ID',
				name: 'customerIdRequired',
				type: 'string',
				default: '',
				required: true,
				description:
					'A string value representing the customer ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: {
						resource: ['customer', 'device', 'asset', 'dashboard'],
						operation: [
							'getCustomerById',
							'getCustomerDevices',
							'getCustomerAssets',
							'getCustomerDashboards',
							'deleteCustomer',
						],
					},
				},
			},
			{
				displayName: 'Text Search',
				name: 'customerTextSearch',
				type: 'string',
				default: '',
				description: 'The case insensitive "substring" filter based on the customer title',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['getCustomers', 'getCustomersByEntityGroupId', 'getUserCustomers'],
					},
				},
			},
			{
				displayName: 'Sort Property',
				name: 'customerSortProperty',
				type: 'options',
				options: [
					{ name: 'City', value: 'city' },
					{ name: 'Country', value: 'country' },
					{ name: 'createdTime', value: 'createdTime' },
					{ name: 'Email', value: 'email' },
					{ name: 'Title', value: 'title' },
				],
				default: 'createdTime',
				description: 'Property of entity to sort by',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['getCustomers', 'getCustomersByEntityGroupId', 'getUserCustomers'],
					},
				},
			},
			{
				displayName: 'Customer Title',
				name: 'customerTitle',
				type: 'string',
				default: '',
				description: 'A string value representing the Customer title',
				displayOptions: {
					show: { resource: ['customer'], operation: ['getTenantCustomer', 'createCustomer'] },
				},
			},
			// Alarm params:
			{
				displayName: 'Alarm ID',
				name: 'alarmId',
				type: 'string',
				required: true,
				default: '',
				description:
					'A string value representing the alarm ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: { resource: ['alarm'], operation: ['getAlarmById', 'getAlarmInfoById'] },
				},
			},
			{
				displayName: 'Entity Type',
				name: 'alarmEntityType',
				type: 'string',
				required: true,
				default: '',
				description:
					'A string value representing the entity type. For example, DEVICE, ASSET, ENTITY_VIEW, CUSTOMER, DASHBOARD, USER, DATA_CONVERTER, INTEGRATION, SCHEDULER_EVENT.',
				displayOptions: {
					show: { resource: ['alarm'], operation: ['getAlarms', 'getHighestAlarmSeverity'] },
				},
			},
			{
				displayName: 'Entity ID',
				name: 'entityId',
				type: 'string',
				required: true,
				default: '',
				description:
					'A string value representing the entity ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: {
						resource: ['alarm', 'telemetry', 'entityGroup'],
						operation: [
							'getAlarms',
							'getHighestAlarmSeverity',
							'getTimeseries',
							'getLatestTimeseries',
							'getTimeseriesKeys',
							'getAttributes',
							'getAttributeKeys',
							'getAttributeKeysByScope',
							'saveEntityAttributes',
							'saveEntityTelemetry',
							'saveEntityTelemetryWithTTL',
							'deleteEntityAttributes',
							'deleteEntityTimeseries',
							'getEntityGroupsForEntity',
						],
					},
				},
			},
			{
				displayName: 'Search Status',
				name: 'searchStatus',
				type: 'string',
				default: '',
				description:
					'A string value representing one of the AlarmSearchStatus enumeration value. Allowed values: "ANY", "ACTIVE", "CLEARED", "ACK", "UNACK".',
				displayOptions: {
					show: {
						resource: ['alarm'],
						operation: ['getAlarms', 'getAllAlarms', 'getHighestAlarmSeverity'],
					},
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'string',
				default: '',
				description:
					'A string value representing one of the AlarmStatus enumeration value. Allowed values: "ACTIVE_UNACK", "ACTIVE_ACK", "CLEARED_UNACK", "CLEARED_ACK".',
				displayOptions: {
					show: {
						resource: ['alarm'],
						operation: ['getAlarms', 'getAllAlarms', 'getHighestAlarmSeverity'],
					},
				},
			},
			{
				displayName: 'Assignee ID',
				name: 'assigneeId',
				type: 'string',
				default: '',
				description:
					'A string value representing the assignee user ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: { show: { resource: ['alarm'], operation: ['getAllAlarms'] } },
			},
			{
				displayName: 'Text Search',
				name: 'alarmTextSearch',
				type: 'string',
				default: '',
				description:
					'The case insensitive "substring" filter based on of next alarm fields: type, severity or status',
				displayOptions: {
					show: { resource: ['alarm'], operation: ['getAlarms', 'getAllAlarms', 'getAlarmTypes'] },
				},
			},
			{
				displayName: 'Sort Property',
				name: 'alarmSortProperty',
				type: 'options',
				options: [
					{ name: 'ackTs', value: 'ackTs' },
					{ name: 'clearTs', value: 'clearTs' },
					{ name: 'createdTime', value: 'createdTime' },
					{ name: 'endTs', value: 'endTs' },
					{ name: 'Severity', value: 'severity' },
					{ name: 'startTs', value: 'startTs' },
					{ name: 'Status', value: 'status' },
				],
				default: 'createdTime',
				description: 'Property of entity to sort by',
				displayOptions: {
					show: { resource: ['alarm'], operation: ['getAlarms', 'getAllAlarms', 'getAlarmTypes'] },
				},
			},
			{
				displayName: 'Start Time',
				name: 'startTs',
				type: 'string',
				default: '',
				description:
					'A long value representing the start timestamp of the time range in milliseconds, UTC',
				displayOptions: {
					show: {
						resource: ['alarm', 'telemetry'],
						operation: ['getAlarms', 'getAllAlarms', 'getTimeseries'],
					},
				},
			},
			{
				displayName: 'End Time',
				name: 'endTs',
				type: 'string',
				default: '',
				description:
					'A long value representing the end timestamp of the time range in milliseconds, UTC',
				displayOptions: {
					show: {
						resource: ['alarm', 'telemetry'],
						operation: ['getAlarms', 'getAllAlarms', 'getTimeseries'],
					},
				},
			},
			{
				displayName: 'Fetch Originator',
				name: 'fetchOriginator',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch the originator of the alarm',
				displayOptions: { show: { resource: ['alarm'], operation: ['getAlarms', 'getAllAlarms'] } },
			},
			// -------- Relation operations --------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['relation'] } },
				options: [
					{
						name: 'By From',
						value: 'findByFrom',
						action: 'Get relation by from',
						description:
							'Returns list of relation objects for the specified entity by the "from" direction',
					},
					{
						name: 'By From (with Relation Type)',
						value: 'findByFromWithRelationType',
						action: 'Get relation by from with relation type',
						description:
							'Returns list of relation objects for the specified entity by the "from" direction with relation type',
					},
					{
						name: 'By To',
						value: 'findByTo',
						action: 'Get relation by to',
						description:
							'Returns list of relation objects for the specified entity by the "to" direction',
					},
					{
						name: 'By to (with Relation Type)',
						value: 'findByToWithRelationType',
						action: 'Get relation by to with relation type',
						description:
							'Returns list of relation objects for the specified entity by the "to" direction with relation type',
					},
					{
						name: 'Get',
						value: 'getRelation',
						action: 'Get a relation',
						description: 'Fetch a specific relation based on the provided parameters',
					},
					{
						name: 'Info by From',
						value: 'findInfoByFrom',
						action: 'Get relation info by from',
						description:
							'Fetch relation information for the specified entity by the "from" direction',
					},
					{
						name: 'Info by To',
						value: 'findInfoByTo',
						action: 'Get relation info by to',
						description:
							'Fetch relation information for the specified entity by the "to" direction',
					},
				],
				default: 'getRelation',
			},
			{
				displayName: 'From ID',
				name: 'fromId',
				type: 'string',
				default: '',
				required: true,
				description:
					'A string value representing the entity ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: {
						resource: ['relation'],
						operation: [
							'getRelation',
							'findByFrom',
							'findInfoByFrom',
							'findByFromWithRelationType',
						],
					},
				},
			},
			{
				displayName: 'From Type',
				name: 'fromType',
				type: 'string',
				required: true,
				default: 'DEVICE',
				description: 'A string value representing the entity type. For example, "DEVICE".',
				displayOptions: {
					show: {
						resource: ['relation'],
						operation: [
							'getRelation',
							'findByFrom',
							'findInfoByFrom',
							'findByFromWithRelationType',
						],
					},
				},
			},
			{
				displayName: 'Relation Type',
				name: 'relationType',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['relation'],
						operation: ['getRelation', 'findByFromWithRelationType', 'findByToWithRelationType'],
					},
				},
			},
			{
				displayName: 'To ID',
				name: 'toId',
				type: 'string',
				default: '',
				required: true,
				description:
					'A string value representing the entity ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: {
						resource: ['relation'],
						operation: ['getRelation', 'findByTo', 'findInfoByTo', 'findByToWithRelationType'],
					},
				},
			},
			{
				displayName: 'To Type',
				name: 'toType',
				type: 'string',
				default: 'DEVICE',
				required: true,
				description: 'A string value representing the entity type. For example, "DEVICE".',
				displayOptions: {
					show: {
						resource: ['relation'],
						operation: ['getRelation', 'findByTo', 'findInfoByTo', 'findByToWithRelationType'],
					},
				},
			},
			// -------- Telemetry operations --------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['telemetry'] } },
				options: [
					{
						name: 'Attribute Keys',
						value: 'getAttributeKeys',
						action: 'Get attribute keys',
						description: 'Returns a set of unique attribute key names for the selected entity',
					},
					{
						name: 'Attribute Keys (by Scope)',
						value: 'getAttributeKeysByScope',
						action: 'Get attribute keys by scope',
						description:
							'Returns a set of unique attribute key names for the selected entity and scope',
					},
					{
						name: 'Attributes',
						value: 'getAttributes',
						action: 'Get attributes',
						description: 'Returns a list of attributes for the selected entity',
					},
					{
						name: 'Delete Device Attributes',
						value: 'deleteDeviceAttributes',
						action: 'Delete device attributes',
						description: 'Delete device attributes by keys',
					},
					{
						name: 'Delete Entity Attributes',
						value: 'deleteEntityAttributes',
						action: 'Delete entity attributes',
						description: 'Delete entity attributes by keys',
					},
					{
						name: 'Delete Entity Timeseries',
						value: 'deleteEntityTimeseries',
						action: 'Delete entity timeseries',
						description: 'Delete entity time series data',
					},
					{
						name: 'Save Device Attributes',
						value: 'saveDeviceAttributes',
						action: 'Save device attributes',
						description: 'Creates or updates device attributes',
					},
					{
						name: 'Save Entity Attributes',
						value: 'saveEntityAttributes',
						action: 'Save entity attributes',
						description: 'Creates or updates entity attributes for any entity type',
					},
					{
						name: 'Save Entity Telemetry',
						value: 'saveEntityTelemetry',
						action: 'Save entity telemetry',
						description: 'Creates or updates entity time series data',
					},
					{
						name: 'Save Entity Telemetry with TTL',
						value: 'saveEntityTelemetryWithTTL',
						action: 'Save entity telemetry with ttl',
						description: 'Creates or updates entity time series data with TTL',
					},
					{
						name: 'Timeseries (Latest)',
						value: 'getLatestTimeseries',
						action: 'Get latest timeseries',
						description: 'Returns the latest timeseries data for the selected entity',
					},
					{
						name: 'Timeseries (Range)',
						value: 'getTimeseries',
						action: 'Get timeseries',
						description: 'Returns timeseries data for the selected entity within a specified range',
					},
					{
						name: 'Timeseries Keys',
						value: 'getTimeseriesKeys',
						action: 'Get timeseries keys',
						description: 'Returns a set of unique timeseries key names for the selected entity',
					},
				],
				default: 'getTimeseries',
			},
			{
				displayName: 'Entity Type',
				name: 'entityType',
				type: 'string',
				default: 'DEVICE',
				description: 'A string value representing the entity type. For example, "DEVICE".',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: [
							'getTimeseries',
							'getLatestTimeseries',
							'getTimeseriesKeys',
							'getAttributes',
							'getAttributeKeys',
							'getAttributeKeysByScope',
							'saveEntityAttributes',
							'saveEntityTelemetry',
							'saveEntityTelemetryWithTTL',
							'deleteEntityAttributes',
							'deleteEntityTimeseries',
						],
					},
				},
			},
			{
				displayName: 'Use Strict Data Types',
				name: 'useStrictDataTypes',
				type: 'boolean',
				default: false,
				description:
					'Whether to convert telemetry values to strings. Conversion is enabled by default; set to "true" to disable conversion.',
				displayOptions: {
					show: { resource: ['telemetry'], operation: ['getLatestTimeseries', 'getTimeseries'] },
				},
			},
			{
				displayName: 'Attributes Scope',
				name: 'scope',
				type: 'options',
				options: [
					{ name: 'CLIENT_SCOPE', value: 'CLIENT_SCOPE' },
					{ name: 'SERVER_SCOPE', value: 'SERVER_SCOPE' },
					{ name: 'SHARED_SCOPE', value: 'SHARED_SCOPE' },
				],
				default: 'SERVER_SCOPE',
				description:
					'Attribute scope for reading attributes. CLIENT_SCOPE is only supported for devices.',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: ['getAttributesByScope', 'getAttributeKeysByScope'],
					},
				},
			},
			{
				displayName: 'Attributes Scope',
				name: 'scope',
				type: 'options',
				options: [
					{ name: 'SERVER_SCOPE', value: 'SERVER_SCOPE' },
					{ name: 'SHARED_SCOPE', value: 'SHARED_SCOPE' },
				],
				default: 'SERVER_SCOPE',
				description:
					'Attribute scope for saving attributes. Only SERVER_SCOPE and SHARED_SCOPE are supported for save operations.',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: ['saveEntityAttributes', 'saveDeviceAttributes'],
					},
				},
			},
			{
				displayName: 'Attributes Scope',
				name: 'scope',
				type: 'options',
				options: [
					{ name: 'CLIENT_SCOPE', value: 'CLIENT_SCOPE' },
					{ name: 'SERVER_SCOPE', value: 'SERVER_SCOPE' },
					{ name: 'SHARED_SCOPE', value: 'SHARED_SCOPE' },
				],
				default: 'SERVER_SCOPE',
				description:
					'Attribute scope for deleting attributes. All scopes are supported for delete operations.',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: ['deleteEntityAttributes', 'deleteDeviceAttributes'],
					},
				},
			},
			{
				displayName: 'Keys (Comma Separated)',
				name: 'keys',
				type: 'string',
				required: true,
				default: 'temperature',
				description: 'Comma-separated telemetry keys or attribute keys',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: [
							'getTimeseries',
							'getAttributes',
							'getLatestTimeseries',
							'getAttributes',
							'getAttributesByScope',
						],
					},
				},
			},
			{
				displayName: 'Aggregation',
				name: 'agg',
				type: 'options',
				options: [
					{ name: 'AVG', value: 'AVG' },
					{ name: 'COUNT', value: 'COUNT' },
					{ name: 'MAX', value: 'MAX' },
					{ name: 'MIN', value: 'MIN' },
					{ name: 'NONE', value: 'NONE' },
					{ name: 'SUM', value: 'SUM' },
				],
				default: 'NONE',
				displayOptions: { show: { resource: ['telemetry'], operation: ['getTimeseries'] } },
			},
			{
				displayName: 'Interval (Ms)',
				name: 'interval',
				type: 'string',
				default: '0',
				displayOptions: { show: { resource: ['telemetry'], operation: ['getTimeseries'] } },
			},
			{
				displayName: 'Interval Type',
				name: 'intervalType',
				type: 'options',
				options: [
					{ name: 'MILLISECONDS', value: 'MILLISECONDS' },
					{ name: 'MONTH', value: 'MONTH' },
					{ name: 'QUARTER', value: 'QUARTER' },
					{ name: 'WEEK', value: 'WEEK' },
					{ name: 'WEEK_ISO', value: 'WEEK_ISO' },
				],
				default: 'MILLISECONDS',
				displayOptions: { show: { resource: ['telemetry'], operation: ['getTimeseries'] } },
			},
			{
				displayName: 'Time Zone',
				name: 'timeZone',
				type: 'string',
				default: '',
				description: 'Timezone used for WEEK/WEEK_ISO/MONTH/QUARTER interval types',
				displayOptions: { show: { resource: ['telemetry'], operation: ['getTimeseries'] } },
			},
			{
				displayName: 'Order',
				name: 'orderBy',
				type: 'options',
				options: [
					{ name: 'ASC', value: 'ASC' },
					{ name: 'DESC', value: 'DESC' },
				],
				default: 'DESC',
				description: 'Sort order. ASC (ASCENDING) or DESC (DESCENDING).',
				displayOptions: { show: { resource: ['telemetry'], operation: ['getTimeseries'] } },
			},
			{
				displayName: 'Limit (only if agg=NONE)',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				description: 'Max number of results to return',
				displayOptions: { show: { resource: ['telemetry'], operation: ['getTimeseries'] } },
			},
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'string',
				required: true,
				default: '',
				description:
					'A string value representing the device ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: ['saveDeviceAttributes', 'deleteDeviceAttributes'],
					},
				},
			},
			{
				displayName: 'Attributes JSON',
				name: 'attributesJson',
				type: 'json',
				required: true,
				default: '{"stringKey": "value1", "booleanKey": true, "doubleKey": 42.0, "longKey": 73}',
				description:
					'JSON object with key-value format of attributes to create or update. Supports string, boolean, number, and nested JSON values.',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: ['saveEntityAttributes', 'saveDeviceAttributes'],
					},
				},
			},
			{
				displayName: 'Telemetry JSON',
				name: 'telemetryJson',
				type: 'json',
				required: true,
				default: '{"temperature": 26}',
				description:
					'Telemetry data in JSON format. Supports: 1) Simple format: {"temperature": 26}, 2) With timestamp: {"ts":1634712287000,"values":{"temperature":26}}, 3) Array: [{"ts":1634712287000,"values":{"temperature":26}}].',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: ['saveEntityTelemetry', 'saveEntityTelemetryWithTTL'],
					},
				},
			},
			{
				displayName: 'TTL (Time to Live)',
				name: 'ttl',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description:
					'Time to Live in milliseconds. Only affects Cassandra DB installations. Set to 0 for no TTL.',
				displayOptions: {
					show: { resource: ['telemetry'], operation: ['saveEntityTelemetryWithTTL'] },
				},
			},
			{
				displayName: 'Attribute Keys (Comma Separated)',
				name: 'attributeKeys',
				type: 'string',
				required: true,
				default: '',
				description:
					'Comma-separated list of attribute keys to delete. For example: "temperature,humidity,status".',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: ['deleteEntityAttributes', 'deleteDeviceAttributes'],
					},
				},
			},
			{
				displayName: 'Timeseries Keys (Comma Separated)',
				name: 'timeseriesKeys',
				type: 'string',
				required: true,
				default: '',
				description:
					'Comma-separated list of timeseries keys to delete. For example: "temperature,humidity,voltage".',
				displayOptions: {
					show: { resource: ['telemetry'], operation: ['deleteEntityTimeseries'] },
				},
			},
			{
				displayName: 'Delete All Data for Keys',
				name: 'deleteAllDataForKeys',
				type: 'boolean',
				default: false,
				description:
					'Whether to delete all data for selected keys. If false, only data in the specified time range will be deleted.',
				displayOptions: {
					show: { resource: ['telemetry'], operation: ['deleteEntityTimeseries'] },
				},
			},
			{
				displayName: 'Start Timestamp',
				name: 'deleteStartTs',
				type: 'string',
				default: '',
				description:
					'Start timestamp in milliseconds (UTC). Required when deleteAllDataForKeys is false.',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: ['deleteEntityTimeseries'],
						deleteAllDataForKeys: [false],
					},
				},
			},
			{
				displayName: 'End Timestamp',
				name: 'deleteEndTs',
				type: 'string',
				default: '',
				description:
					'End timestamp in milliseconds (UTC). Required when deleteAllDataForKeys is false.',
				displayOptions: {
					show: {
						resource: ['telemetry'],
						operation: ['deleteEntityTimeseries'],
						deleteAllDataForKeys: [false],
					},
				},
			},
			{
				displayName: 'Delete Latest',
				name: 'deleteLatest',
				type: 'boolean',
				default: true,
				description:
					'Whether to delete the latest telemetry value if its timestamp matches the time range',
				displayOptions: {
					show: { resource: ['telemetry'], operation: ['deleteEntityTimeseries'] },
				},
			},
			{
				displayName: 'Rewrite Latest If Deleted',
				name: 'rewriteLatestIfDeleted',
				type: 'boolean',
				default: false,
				description:
					'Whether to rewrite the latest value with the most recent value before the time range if the latest value was deleted',
				displayOptions: {
					show: { resource: ['telemetry'], operation: ['deleteEntityTimeseries'] },
				},
			},
			// -------- Entity Group operations --------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['entityGroup'] } },
				options: [
					{
						name: 'Get by ID',
						value: 'getEntityGroupById',
						action: 'Get entity group by id',
						description: 'Fetch an entity group based on the provided Entity Group ID',
					},
					{
						name: 'Get by Owner/Name/Type',
						value: 'getEntityGroupByOwnerAndNameAndType',
						action: 'Get entity group by owner name and type',
						description: 'Fetch an entity group based on the provided owner, name, and type',
					},
					{
						name: 'Get Many by Entity',
						value: 'getEntityGroupsForEntity',
						action: 'Get entity groups for entity',
						description: 'Fetch entity groups associated with the provided entity',
					},
					{
						name: 'Get Many by Owner and Type',
						value: 'getEntityGroupsByOwnerAndType',
						action: 'Get entity groups by owner and type',
						description: 'Fetch entity groups based on the provided owner and type',
					},
					{
						name: 'Get Many by Type',
						value: 'getEntityGroupsByType',
						action: 'Get entity groups by type',
						description: 'Fetch entity groups based on the provided type',
					},
				],
				default: 'getEntityGroupById',
			},
			{
				displayName: 'Entity Group ID',
				name: 'entityGroupId',
				type: 'string',
				required: true,
				default: '',
				description:
					'A string value representing the Entity Group ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: {
						resource: ['entityGroup', 'customer', 'device', 'asset'],
						operation: [
							'getEntityGroupById',
							'getCustomersByEntityGroupId',
							'getDevicesByEntityGroupId',
							'getAssetsByEntityGroupId',
						],
					},
				},
			},
			{
				displayName: 'Group Type',
				name: 'groupType',
				type: 'options',
				options: [
					{ name: 'ASSET', value: 'ASSET' },
					{ name: 'CUSTOMER', value: 'CUSTOMER' },
					{ name: 'DASHBOARD', value: 'DASHBOARD' },
					{ name: 'DEVICE', value: 'DEVICE' },
					{ name: 'EDGE', value: 'EDGE' },
					{ name: 'ENTITY_VIEW', value: 'ENTITY_VIEW' },
					{ name: 'USER', value: 'USER' },
				],
				default: 'DEVICE',
				required: true,
				description: 'Entity group type',
				displayOptions: {
					show: {
						resource: ['entityGroup'],
						operation: [
							'getEntityGroupsForEntity',
							'getEntityGroupsByType',
							'getEntityGroupByOwnerAndNameAndType',
							'getEntityGroupsByOwnerAndType',
						],
					},
				},
			},
			{
				displayName: 'Owner Type',
				name: 'ownerType',
				type: 'string',
				default: '',
				required: true,
				description: 'Owner entity type (e.g. TENANT, CUSTOMER)',
				displayOptions: {
					show: {
						resource: ['entityGroup'],
						operation: ['getEntityGroupByOwnerAndNameAndType', 'getEntityGroupsByOwnerAndType'],
					},
				},
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				required: true,
				description:
					'A string value representing the Owner ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: {
						resource: ['entityGroup'],
						operation: ['getEntityGroupByOwnerAndNameAndType', 'getEntityGroupsByOwnerAndType'],
					},
				},
			},
			{
				displayName: 'Group Name',
				name: 'groupName',
				type: 'string',
				default: '',
				required: true,
				description: 'Entity Group name',
				displayOptions: {
					show: { resource: ['entityGroup'], operation: ['getEntityGroupByOwnerAndNameAndType'] },
				},
			},
			// ------- Dashboard operations --------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['dashboard'] } },
				options: [
					{
						name: 'Create',
						value: 'createDashboard',
						action: 'Create a dashboard',
						description: 'Create a dashboard',
					},
					{
						name: 'Delete',
						value: 'deleteDashboard',
						action: 'Delete a dashboard',
						description: 'Delete a dashboard',
					},
					{
						name: 'Get by ID',
						value: 'getDashboardById',
						action: 'Get dashboard by id',
						description: 'Fetch a dashboard based on the provided Dashboard ID',
					},
					{
						name: 'Get Customer Dashboards',
						value: 'getCustomerDashboards',
						action: 'Get customer dashboards',
						description: 'Returns a page of dashboards based on the provided Customer ID',
					},
					{
						name: 'Get Dashboards',
						value: 'getDashboards',
						action: 'Get dashboards',
						description: 'Returns a page of dashboards owned by the tenant of a current user',
					},
					{
						name: 'Get User Dashboards',
						value: 'getUserDashboards',
						action: 'Get user dashboards',
						description: 'Returns a page of dashboards available for the current user',
					},
				],
				default: 'getDashboardById',
			},
			// Dashboard params:
			{
				displayName: 'Dashboard ID',
				name: 'dashboardId',
				type: 'string',
				default: '',
				required: true,
				description:
					'A string value representing the dashboard ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: {
					show: { resource: ['dashboard'], operation: ['getDashboardById', 'deleteDashboard'] },
				},
			},
			{
				displayName: 'Input Mode',
				name: 'dashboardInputMode',
				type: 'options',
				default: 'title',
				options: [
					{ name: 'Title Only', value: 'title', description: 'Provide just the dashboard title' },
					{
						name: 'Full JSON',
						value: 'json',
						description: 'Provide full ThingsBoard dashboard JSON',
					},
				],
				displayOptions: { show: { resource: ['dashboard'], operation: ['createDashboard'] } },
			},
			{
				displayName: 'Dashboard Title',
				name: 'dashboardTitle',
				type: 'string',
				required: true,
				default: '',
				description: 'Title for the new dashboard',
				displayOptions: {
					show: {
						resource: ['dashboard'],
						operation: ['createDashboard'],
						dashboardInputMode: ['title'],
					},
				},
			},
			{
				displayName: 'Dashboard JSON',
				name: 'dashboardJson',
				type: 'json',
				required: true,
				default: '{ "title": "My dashboard" }',
				typeOptions: { alwaysOpenEditWindow: true },
				description:
					'Full ThingsBoard dashboard object. Include "ID" to update existing dashboard.',
				displayOptions: {
					show: {
						resource: ['dashboard'],
						operation: ['createDashboard'],
						dashboardInputMode: ['json'],
					},
				},
			},
			{
				displayName: 'Text Search',
				name: 'dashboardTextSearch',
				type: 'string',
				default: '',
				description: 'The case insensitive "substring" filter based on the dashboard title',
				displayOptions: {
					show: {
						resource: ['dashboard'],
						operation: ['getDashboards', 'getCustomerDashboards', 'getUserDashboards'],
					},
				},
			},
			{
				displayName: 'Sort Property',
				name: 'dashboardSortProperty',
				type: 'options',
				options: [
					{ name: 'createdTime', value: 'createdTime' },
					{ name: 'Title', value: 'title' },
				],
				default: 'createdTime',
				description: 'Property of entity to sort by',
				displayOptions: {
					show: {
						resource: ['dashboard'],
						operation: ['getDashboards', 'getCustomerDashboards', 'getUserDashboards'],
					},
				},
			},
			{
				displayName: 'Mobile',
				name: 'isMobileDashboard',
				type: 'boolean',
				default: false,
				description: 'Whether to exclude dashboards that are hidden for mobile',
				displayOptions: {
					show: { resource: ['dashboard'], operation: ['getDashboards', 'getUserDashboards'] },
				},
			},
			{
				displayName: 'Dashboard Operation',
				name: 'dashboardOperation',
				type: 'string',
				default: '',
				description: 'Filter by allowed operations for the current user',
				displayOptions: { show: { resource: ['dashboard'], operation: ['getUserDashboards'] } },
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				description:
					'A string value representing the user ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
				displayOptions: { show: { resource: ['dashboard'], operation: ['getUserDashboards'] } },
			},
			{
				displayName: 'Include Customers',
				name: 'includeCustomers',
				type: 'boolean',
				default: false,
				description: 'Whether to include customer or sub-customer entities',
				displayOptions: { show: { resource: ['dashboard'], operation: ['getCustomerDashboards'] } },
			},
		],
	};

	methods = {
		credentialTest: {
			async thingsBoardApiTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const { baseUrl, authType, username, password, apiKey } =
					credential.data as Record<string, string>;
				const normalizedBaseUrl = (baseUrl || '').replace(/\/+$/g, '');

				try {
					if (authType === 'apiKey') {
						await this.helpers.request({
							method: 'GET',
							uri: `${normalizedBaseUrl}/api/auth/user`,
							headers: { 'X-Authorization': `ApiKey ${apiKey}` },
							json: true,
						});
					} else {
						await this.helpers.request({
							method: 'POST',
							uri: `${normalizedBaseUrl}/api/auth/login`,
							body: { username, password },
							json: true,
						});
					}
				} catch (error: any) {
					return {
						status: 'Error',
						message: `Connection failed: ${error.message}`,
					};
				}

				return {
					status: 'OK',
					message: 'Connection successful',
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				// Get credentials and validate
				const credentials = await getThingsBoardCredentials(this);
				const baseUrl = credentials.baseUrl;

				// Get access token (with caching)
				const token = await getAuthToken(this);

				// Check if operation is supported in current edition
				checkEditionSupport(this, resource, operation, PE_ONLY_OPERATIONS);

				// Create operation context
				const context: IOperationContext = {
					executeFunctions: this,
					itemIndex: i,
					baseUrl,
					token,
				};

				// Get resource handler and execute operation
				const handler = ResourceRegistry.getHandler(resource);
				const result = await handler.execute(context, operation);

				results.push({ json: result, pairedItem: { item: i } });
			} catch (error) {
				// Re-throw errors to be handled by n8n's error handling
				if (this.continueOnFail()) {
					results.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
				} else {
					throw error;
				}
			}
		}

		return [results];
	}
}
