import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';

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
        icon: 'file:thingsboard.svg',
        group: ['transform'],
        version: 1,
        description: 'Interact with ThingsBoard REST API',
        defaults: { name: 'ThingsBoard' },
        inputs: (['main'] as any),
        outputs: (['main'] as any),
        credentials: [{ name: 'thingsBoardApi', required: true }],
        usableAsTool: true,
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
                    { name: 'Telemetry', value: 'telemetry' }
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
                    { name: 'Create', value: 'createDevice', action: 'Create a device', description: 'Create a device' },
                    { name: 'Delete', value: 'deleteDevice', action: 'Delete a device', description: 'Delete a device' },
                    { name: 'Get by ID', value: 'getDeviceById', action: 'Get a device by ID', description: 'Fetch a device based on the provided Device ID' },
                    { name: 'Get by Name', value: 'getTenantDevice', action: 'Get a device by name', description: 'Fetch a device by name' },
                    { name: 'Get Many', value: 'getTenantDevices', action: 'Get devices', description: 'Returns a page of devices' },
                    { name: 'Get Many by Customer', value: 'getCustomerDevices', action: 'Get customer devices', description: 'Returns a page of devices assigned to the customer' },
                    { name: 'Get Many by Entity Group', value: 'getDevicesByEntityGroupId', action: 'Get entity group devices', description: 'Returns a page of devices that belongs to the specified Entity Group ID' },
                    { name: 'Get Many for Current User', value: 'getUserDevices', action: 'Get user devices', description: 'Returns a page of devices accessible to the current user' }
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
                        resource: ['device', 'asset', 'customer', 'alarm', 'dashboard'], operation: ['getTenantDevices', 'getCustomerDevices', 'getUserDevices',
                            'getDevicesByEntityGroupId', 'getTenantAssets', 'getCustomerAssets', 'getUserAssets', 'getAssetsByEntityGroupId', 'getCustomers',
                            'getCustomersByEntityGroupId', 'getUserCustomers', 'getAlarms', 'getAllAlarms', 'getAlarmTypes', 'getDashboards', 'getCustomerDashboards', 'getUserDashboards']
                    }
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
                        resource: ['device', 'asset', 'customer', 'alarm', 'dashboard'], operation: ['getTenantDevices', 'getCustomerDevices', 'getUserDevices',
                            'getDevicesByEntityGroupId', 'getTenantAssets', 'getCustomerAssets', 'getUserAssets', 'getAssetsByEntityGroupId', 'getCustomers',
                            'getCustomersByEntityGroupId', 'getUserCustomers', 'getAlarms', 'getAllAlarms', 'getAlarmTypes', 'getDashboards', 'getCustomerDashboards', 'getUserDashboards']
                    }
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
                        resource: ['device', 'asset', 'customer', 'alarm', 'dashboard'], operation: ['getTenantDevices', 'getCustomerDevices', 'getUserDevices',
                            'getDevicesByEntityGroupId', 'getTenantAssets', 'getCustomerAssets', 'getUserAssets', 'getAssetsByEntityGroupId', 'getCustomers',
                            'getCustomersByEntityGroupId', 'getUserCustomers', 'getAlarms', 'getAllAlarms', 'getAlarmTypes', 'getDashboards', 'getCustomerDashboards', 'getUserDashboards']
                    }
                },
            },

            // Device params:
            {
                displayName: 'Input Mode',
                name: 'deviceInputMode',
                type: 'options',
                default: 'params',
                options: [
                    { name: 'Params', value: 'params', description: 'Use the fields below (name, type, label, etc.)' },
                    { name: 'Full JSON', value: 'json', description: 'Provide a full ThingsBoard device JSON object' },
                ],
                displayOptions: { show: { resource: ['device'], operation: ['createDevice'] } }
            },
            {
                displayName: 'Device JSON',
                name: 'deviceJson',
                type: 'json',
                required: true,
                default: '{ "name": "My device", "type": "default" }',
                description: 'Full ThingsBoard device JSON object. Include "ID" to update existing device.',
                displayOptions: { show: { resource: ['device'], operation: ['createDevice'], deviceInputMode: ['json'] } },
            },
            {
                displayName: 'Device ID',
                name: 'deviceId',
                type: 'string',
                required: true,
                default: '',
                description: 'A string value representing the device ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['device'], operation: ['getDeviceById', 'deleteDevice'] } },
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
                displayOptions: { show: { resource: ['device'], operation: ['createDevice'], deviceInputMode: ['params'] } },
            },
            {
                displayName: 'Label',
                name: 'deviceLabel',
                type: 'string',
                default: '',
                description: 'An optional label for the device',
                displayOptions: { show: { resource: ['device'], operation: ['createDevice'], deviceInputMode: ['params'] } },
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
                displayOptions: { show: { resource: ['device'], operation: ['getTenantDevices', 'getCustomerDevices', 'getUserDevices'] } },
            },
            {
                displayName: 'Type',
                name: 'deviceTypeCreate',
                type: 'string',
                default: '',
                description: 'Device type as the name of the device profile',
                displayOptions: { show: { resource: ['device'], operation: ['createDevice'], deviceInputMode: ['params'] } },
            },
            {
                displayName: 'Text Search',
                name: 'deviceTextSearch',
                type: 'string',
                default: '',
                description: 'The case insensitive "substring" filter based on the device name',
                displayOptions: { show: { resource: ['device'], operation: ['getTenantDevices', 'getCustomerDevices', 'getUserDevices', 'getDevicesByEntityGroupId'] } },
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
                    { name: 'Type', value: 'type' }
                ],
                default: 'createdTime',
                description: 'Property of entity to sort by',
                displayOptions: { show: { resource: ['device'], operation: ['getTenantDevices', 'getCustomerDevices', 'getUserDevices', 'getDevicesByEntityGroupId'] } },
            },

            // -------- Asset operations --------
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['asset'] } },
                options: [
                    { name: 'Create', value: 'createAsset', action: 'Create an asset', description: 'Create an asset' },
                    { name: 'Delete', value: 'deleteAsset', action: 'Delete an asset', description: 'Delete an asset' },
                    { name: 'Get by ID', value: 'getAssetById', action: 'Get asset by id', description: 'Fetch an asset based on the provided Asset ID' },
                    { name: 'Get by Name', value: 'getTenantAsset', action: 'Get asset by name', description: 'Fetch an asset by name' },
                    { name: 'Get Many', value: 'getTenantAssets', action: 'Get tenant assets', description: 'Returns a page of assets' },
                    { name: 'Get Many by Customer', value: 'getCustomerAssets', action: 'Get customer assets', description: 'Returns a page of assets assigned to the customer' },
                    { name: 'Get Many by Entity Group', value: 'getAssetsByEntityGroupId', action: 'Get assets by entity group', description: 'Returns a page of devices that belongs to the specified Entity Group ID' },
                    { name: 'Get Many for Current User', value: 'getUserAssets', action: 'Get user assets', description: 'Returns a page of assets accessible to the current user' },
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
                    { name: 'Params', value: 'params', description: 'Use the fields below (name, type, label, etc.)' },
                    { name: 'Full JSON', value: 'json', description: 'Provide a full ThingsBoard asset JSON object' },
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
                displayOptions: { show: { resource: ['asset'], operation: ['createAsset'], assetInputMode: ['json'] } },
            },
            {
                displayName: 'Asset ID',
                name: 'assetId',
                type: 'string',
                required: true,
                default: '',
                description: 'A string value representing the asset ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['asset'], operation: ['getAssetById', 'deleteAsset'] } },
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
                displayOptions: { show: { resource: ['asset'], operation: ['createAsset'], assetInputMode: ['params'] } },
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
                displayOptions: { show: { resource: ['asset'], operation: ['getTenantAssets', 'getCustomerAssets', 'getUserAssets', 'getAssetsByEntityGroupId', 'createAsset'] } }, // added getUserAssets & getAssetsByEntityGroupId
            },
            {
                displayName: 'Type',
                name: 'assetTypeCreate',
                type: 'string',
                default: '',
                description: 'Asset type as the name of the asset profile',
                displayOptions: { show: { resource: ['asset'], operation: ['createAsset'], assetInputMode: ['params'] } },
            },
            {
                displayName: 'Text Search',
                name: 'assetTextSearch',
                type: 'string',
                default: '',
                description: 'The case insensitive "substring" filter based on the asset name',
                displayOptions: { show: { resource: ['asset'], operation: ['getTenantAssets', 'getCustomerAssets', 'getUserAssets', 'getAssetsByEntityGroupId'] } },
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
                displayOptions: { show: { resource: ['asset'], operation: ['getTenantAssets', 'getCustomerAssets', 'getUserAssets', 'getAssetsByEntityGroupId'] } },
            },

            // -------- Alarm operations --------
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['alarm'] } },
                options: [
                    { name: 'Get All', value: 'getAllAlarms', action: 'Get all alarms', description: 'Returns a page of alarms that belongs to the current owner' },
                    { name: 'Get by ID', value: 'getAlarmById', action: 'Get alarm by id', description: 'Fetch an alarm based on the provided Alarm ID' },
                    { name: 'Get by originator', value: 'getAlarms', action: 'Get alarms by originator', description: 'Returns a page of alarms for the selected entity' },
                    { name: 'Get Highest Severity', value: 'getHighestAlarmSeverity', action: 'Get alarm highest severity', description: 'Search the alarms by originator and return the highest AlarmSeverity(CRITICAL, MAJOR, MINOR, WARNING or INDETERMINATE)' },
                    { name: 'Get Info by ID', value: 'getAlarmInfoById', action: 'Get alarm info by id', description: 'Fetch an alarm Info based on the provided Alarm ID' },
                    { name: 'Get Types', value: 'getAlarmTypes', action: 'Get alarm types', description: 'Returns a set of unique alarm types' },
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
                    { name: 'Create', value: 'createCustomer', action: 'Create a customer', description: 'Create a customer' },
                    { name: 'Delete', value: 'deleteCustomer', action: 'Delete a customer', description: 'Delete a customer' },
                    { name: 'Get by ID', value: 'getCustomerById', action: 'Get customer by id', description: 'Fetch a customer based on the provided Customer ID' },
                    { name: 'Get by Title', value: 'getTenantCustomer', action: 'Get customer by title', description: 'Fetch a customer by title' },
                    { name: 'Get Many', value: 'getCustomers', action: 'Get customers', description: 'Returns a page of customers' },
                    { name: 'Get Many by Entity Group', value: 'getCustomersByEntityGroupId', action: 'Get customers by entity group', description: 'Returns a list of customers based on the provided Entity ID' },
                    { name: 'Get Many for Current User', value: 'getUserCustomers', action: 'Get user customers', description: 'Returns a page of customers available for the current user' },
                ],
                default: 'getCustomerById',
            },
            // Customer params:
            {
                displayName: 'Customer ID',
                name: 'customerIdAssetCreate',
                type: 'string',
                default: '',
                description: 'A string value representing the customer ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['asset'], operation: ['createAsset'], assetInputMode: ['params'] } },
            },
            {
                displayName: 'Customer ID',
                name: 'customerIdDeviceCreate',
                type: 'string',
                default: '',
                description: 'A string value representing the customer ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['device'], operation: ['createDevice'], deviceInputMode: ['params'] } },
            },
            {
                displayName: 'Customer ID',
                name: 'customerIdRequired',
                type: 'string',
                default: '',
                required: true,
                description: 'A string value representing the customer ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['customer', 'device', 'asset'], operation: ['getCustomerById', 'getCustomerDevices', 'getCustomerAssets', 'getCustomerDashboards', 'deleteCustomer'] } },
            },
            {
                displayName: 'Text Search',
                name: 'customerTextSearch',
                type: 'string',
                default: '',
                description: 'The case insensitive "substring" filter based on the customer title',
                displayOptions: { show: { resource: ['customer'], operation: ['getCustomers', 'getCustomersByEntityGroupId', 'getUserCustomers'] } },
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
                displayOptions: { show: { resource: ['customer'], operation: ['getCustomers', 'getCustomersByEntityGroupId', 'getUserCustomers'] } },
            },
            {
                displayName: 'Customer Title',
                name: 'customerTitle',
                type: 'string',
                default: '',
                description: 'A string value representing the Customer title',
                displayOptions: { show: { resource: ['customer'], operation: ['getTenantCustomer', 'createCustomer'] } },
            },
            // Alarm params:
            {
                displayName: 'Alarm ID',
                name: 'alarmId',
                type: 'string',
                required: true,
                default: '',
                description: 'A string value representing the alarm ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['alarm'], operation: ['getAlarmById', 'getAlarmInfoById'] } },
            },
            {
                displayName: 'Entity Type',
                name: 'alarmEntityType',
                type: 'string',
                required: true,
                default: '',
                description: 'A string value representing the entity type. For example, DEVICE, ASSET, ENTITY_VIEW, CUSTOMER, DASHBOARD, USER, DATA_CONVERTER, INTEGRATION, SCHEDULER_EVENT.',
                displayOptions: { show: { resource: ['alarm'], operation: ['getAlarms', 'getHighestAlarmSeverity'] } },
            },
            {
                displayName: 'Entity ID',
                name: 'entityId',
                type: 'string',
                required: true,
                default: '',
                description: 'A string value representing the entity ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['alarm', 'telemetry', 'entityGroup'], operation: ['getAlarms', 'getHighestAlarmSeverity', 'getTimeseries', 'getLatestTimeseries', 'getTimeseriesKeys', 'getAttributes', 'getAttributeKeys', 'getAttributeKeysByScope', 'getEntityGroupsForEntity'] } },
            },
            {
                displayName: 'Search Status',
                name: 'searchStatus',
                type: 'string',
                default: '',
                description: 'A string value representing one of the AlarmSearchStatus enumeration value. Allowed values: "ANY", "ACTIVE", "CLEARED", "ACK", "UNACK".',
                displayOptions: { show: { resource: ['alarm'], operation: ['getAlarms', 'getAllAlarms', 'getHighestAlarmSeverity'] } },
            },
            {
                displayName: 'Status',
                name: 'status',
                type: 'string',
                default: '',
                description: 'A string value representing one of the AlarmStatus enumeration value. Allowed values: "ACTIVE_UNACK", "ACTIVE_ACK", "CLEARED_UNACK", "CLEARED_ACK".',
                displayOptions: { show: { resource: ['alarm'], operation: ['getAlarms', 'getAllAlarms', 'getHighestAlarmSeverity'] } },
            },
            {
                displayName: 'Assignee ID',
                name: 'assigneeId',
                type: 'string',
                default: '',
                description: 'A string value representing the assignee user ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['alarm'], operation: ['getAllAlarms'] } },
            },
            {
                displayName: 'Text Search',
                name: 'alarmTextSearch',
                type: 'string',
                default: '',
                description: 'The case insensitive "substring" filter based on of next alarm fields: type, severity or status',
                displayOptions: { show: { resource: ['alarm'], operation: ['getAlarms', 'getAllAlarms', 'getAlarmTypes'] } },
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
                displayOptions: { show: { resource: ['alarm'], operation: ['getAlarms', 'getAllAlarms', 'getAlarmTypes'] } },
            },
            {
                displayName: 'Start Time',
                name: 'startTs',
                type: 'string',
                default: '',
                description: 'The start timestamp in milliseconds of the search time range over the Alarm class field: "createdTime"',
                displayOptions: { show: { resource: ['alarm'], operation: ['getAlarms', 'getAllAlarms'] } },
            },
            {
                displayName: 'End Time',
                name: 'endTs',
                type: 'string',
                default: '',
                description: 'The end timestamp in milliseconds of the search time range over the Alarm class field: "createdTime"',
                displayOptions: { show: { resource: ['alarm'], operation: ['getAlarms', 'getAllAlarms'] } },
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
                    { name: 'By From', value: 'findByFrom', action: 'Get relation by from', description: 'Returns list of relation objects for the specified entity by the "from" direction' },
                    { name: 'By From (with Relation Type)', value: 'findByFromWithRelationType', action: 'Get relation by from with relation type', description: 'Returns list of relation objects for the specified entity by the "from" direction with relation type' },
                    { name: 'By To', value: 'findByTo', action: 'Get relation by to', description: 'Returns list of relation objects for the specified entity by the "to" direction' },
                    { name: 'By to (with Relation Type)', value: 'findByToWithRelationType', action: 'Get relation by to with relation type', description: 'Returns list of relation objects for the specified entity by the "to" direction with relation type' },
                    { name: 'Get', value: 'getRelation', action: 'Get a relation', description: 'Fetch a specific relation based on the provided parameters' },
                    { name: 'Info by From', value: 'findInfoByFrom', action: 'Get relation info by from', description: 'Fetch relation information for the specified entity by the "from" direction' },
                    { name: 'Info by To', value: 'findInfoByTo', action: 'Get relation info by to', description: 'Fetch relation information for the specified entity by the "to" direction' },
                ],
                default: 'getRelation',
            },
            {
                displayName: 'From ID',
                name: 'fromId',
                type: 'string',
                default: '',
                required: true,
                description: 'A string value representing the entity ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['relation'], operation: ['getRelation', 'findByFrom', 'findInfoByFrom', 'findByFromWithRelationType'] } },
            },
            {
                displayName: 'From Type',
                name: 'fromType',
                type: 'string',
                required: true,
                default: 'DEVICE',
                description: 'A string value representing the entity type. For example, "DEVICE".',
                displayOptions: { show: { resource: ['relation'], operation: ['getRelation', 'findByFrom', 'findInfoByFrom', 'findByFromWithRelationType'] } },
            },
            {
                displayName: 'Relation Type',
                name: 'relationType',
                type: 'string',
                required: true,
                default: '',
                displayOptions: { show: { resource: ['relation'], operation: ['getRelation', 'findByFromWithRelationType', 'findByToWithRelationType'] } },
            },
            {
                displayName: 'To ID',
                name: 'toId',
                type: 'string',
                default: '',
                required: true,
                description: 'A string value representing the entity ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['relation'], operation: ['getRelation', 'findByTo', 'findInfoByTo', 'findByToWithRelationType'] } },
            },
            {
                displayName: 'To Type',
                name: 'toType',
                type: 'string',
                default: 'DEVICE',
                required: true,
                description: 'A string value representing the entity type. For example, "DEVICE".',
                displayOptions: { show: { resource: ['relation'], operation: ['getRelation', 'findByTo', 'findInfoByTo', 'findByToWithRelationType'] } },
            },
            // -------- Telemetry operations --------
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['telemetry'] } },
                options: [
                    { name: 'Attribute Keys', value: 'getAttributeKeys', action: 'Get attribute keys', description: 'Returns a set of unique attribute key names for the selected entity' },
                    { name: 'Attribute Keys (by Scope)', value: 'getAttributeKeysByScope', action: 'Get attribute keys by scope', description: 'Returns a set of unique attribute key names for the selected entity and scope' },
                    { name: 'Attributes', value: 'getAttributes', action: 'Get attributes', description: 'Returns a list of attributes for the selected entity' },
                    { name: 'Timeseries (Latest)', value: 'getLatestTimeseries', action: 'Get latest timeseries', description: 'Returns the latest timeseries data for the selected entity' },
                    { name: 'Timeseries (Range)', value: 'getTimeseries', action: 'Get timeseries', description: 'Returns timeseries data for the selected entity within a specified range' },
                    { name: 'Timeseries Keys', value: 'getTimeseriesKeys', action: 'Get timeseries keys', description: 'Returns a set of unique timeseries key names for the selected entity' },
                ],
                default: 'getTimeseries',
            },
            {
                displayName: 'Entity Type',
                name: 'entityType',
                type: 'string',
                default: 'DEVICE',
                description: 'A string value representing the entity type. For example, "DEVICE".',
                displayOptions: { show: { resource: ['telemetry'], operation: ['getTimeseries', 'getLatestTimeseries', 'getTimeseriesKeys', 'getAttributes', 'getAttributeKeys', 'getAttributeKeysByScope'] } },
            },
            {
                displayName: 'Use Strict Data Types',
                name: 'useStrictDataTypes',
                type: 'boolean',
                default: false,
                description: 'Whether to convert telemetry values to strings. Conversion is enabled by default; set to "true" to disable conversion.',
                displayOptions: { show: { resource: ['telemetry'], operation: ['getLatestTimeseries', 'getTimeseries'] } },
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
                displayOptions: { show: { resource: ['telemetry'], operation: ['getAttributesByScope', 'getAttributeKeysByScope'] } },
            },
            {
                displayName: 'Keys (Comma Separated)',
                name: 'keys',
                type: 'string',
                required: true,
                default: 'temperature',
                description: 'Comma-separated telemetry keys or attribute keys',
                displayOptions: { show: { resource: ['telemetry'], operation: ['getTimeseries', 'getAttributes', 'getLatestTimeseries', 'getAttributes', 'getAttributesByScope'] } },
            },
            {
                displayName: 'Start Ts',
                name: 'startTs',
                type: 'string',
                required: true,
                default: '0',
                description: 'A long value representing the start timestamp of the time range in milliseconds, UTC',
                displayOptions: { show: { resource: ['telemetry'], operation: ['getTimeseries'] } },
            },
            {
                displayName: 'End Timestamp',
                name: 'endTs',
                type: 'string',
                required: true,
                default: '',
                description: 'A long value representing the end timestamp of the time range in milliseconds, UTC',
                displayOptions: { show: { resource: ['telemetry'], operation: ['getTimeseries'] } },
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
            // -------- Entity Group operations --------
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['entityGroup'] } },
                options: [
                    { name: 'Get by ID', value: 'getEntityGroupById', action: 'Get entity group by id', description: 'Fetch an entity group based on the provided Entity Group ID' },
                    { name: 'Get by Owner/Name/Type', value: 'getEntityGroupByOwnerAndNameAndType', action: 'Get entity group by owner name and type', description: 'Fetch an entity group based on the provided owner, name, and type' },
                    { name: 'Get Many by Entity', value: 'getEntityGroupsForEntity', action: 'Get entity groups for entity', description: 'Fetch entity groups associated with the provided entity' },
                    { name: 'Get Many by Owner and Type', value: 'getEntityGroupsByOwnerAndType', action: 'Get entity groups by owner and type', description: 'Fetch entity groups based on the provided owner and type' },
                    { name: 'Get Many by Type', value: 'getEntityGroupsByType', action: 'Get entity groups by type', description: 'Fetch entity groups based on the provided type' },
                ],
                default: 'getEntityGroupById',
            },
            {
                displayName: 'Entity Group ID',
                name: 'entityGroupId',
                type: 'string',
                required: true,
                default: '',
                description: 'A string value representing the Entity Group ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['entityGroup', 'customer', 'device', 'asset'], operation: ['getEntityGroupById', 'getCustomersByEntityGroupId', 'getDevicesByEntityGroupId', 'getAssetsByEntityGroupId'] } },
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
                displayOptions: { show: { resource: ['entityGroup'], operation: ['getEntityGroupsForEntity', 'getEntityGroupsByType', 'getEntityGroupByOwnerAndNameAndType', 'getEntityGroupsByOwnerAndType'] } },
            },
            {
                displayName: 'Owner Type',
                name: 'ownerType',
                type: 'string',
                default: '',
                required: true,
                description: 'Owner entity type (e.g. TENANT, CUSTOMER)',
                displayOptions: { show: { resource: ['entityGroup'], operation: ['getEntityGroupByOwnerAndNameAndType', 'getEntityGroupsByOwnerAndType'] } },
            },
            {
                displayName: 'Owner ID',
                name: 'ownerId',
                type: 'string',
                default: '',
                required: true,
                description: 'A string value representing the Owner ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['entityGroup'], operation: ['getEntityGroupByOwnerAndNameAndType', 'getEntityGroupsByOwnerAndType'] } },
            },
            {
                displayName: 'Group Name',
                name: 'groupName',
                type: 'string',
                default: '',
                required: true,
                description: 'Entity Group name',
                displayOptions: { show: { resource: ['entityGroup'], operation: ['getEntityGroupByOwnerAndNameAndType'] } },
            },
            // ------- Dashboard operations --------
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['dashboard'] } },
                options: [
                    { name: 'Create', value: 'createDashboard', action: 'Create a dashboard', description: 'Create a dashboard' },
                    { name: 'Delete', value: 'deleteDashboard', action: 'Delete a dashboard', description: 'Delete a dashboard' },
                    { name: 'Get by ID', value: 'getDashboardById', action: 'Get dashboard by id', description: 'Fetch a dashboard based on the provided Dashboard ID' },
                    { name: 'Get Customer Dashboards', value: 'getCustomerDashboards', action: 'Get customer dashboards', description: 'Returns a page of dashboards based on the provided Customer ID' },
                    { name: 'Get Dashboards', value: 'getDashboards', action: 'Get dashboards', description: 'Returns a page of dashboards owned by the tenant of a current user' },
                    { name: 'Get User Dashboards', value: 'getUserDashboards', action: 'Get user dashboards', description: 'Returns a page of dashboards available for the current user' },
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
                description: 'A string value representing the dashboard ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
                displayOptions: { show: { resource: ['dashboard'], operation: ['getDashboardById', 'deleteDashboard'] } },
            },
            {
                displayName: 'Input Mode',
                name: 'dashboardInputMode',
                type: 'options',
                default: 'title',
                options: [
                    { name: 'Title Only', value: 'title', description: 'Provide just the dashboard title' },
                    { name: 'Full JSON', value: 'json', description: 'Provide full ThingsBoard dashboard JSON' },
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
                displayOptions: { show: { resource: ['dashboard'], operation: ['createDashboard'], dashboardInputMode: ['title'] } },
            },
            {
                displayName: 'Dashboard JSON',
                name: 'dashboardJson',
                type: 'json',
                required: true,
                default: '{ "title": "My dashboard" }',
                typeOptions: { alwaysOpenEditWindow: true },
                description: 'Full ThingsBoard dashboard object. Include "ID" to update existing dashboard.',
                displayOptions: { show: { resource: ['dashboard'], operation: ['createDashboard'], dashboardInputMode: ['json'] } },
            },
            {
                displayName: 'Text Search',
                name: 'dashboardTextSearch',
                type: 'string',
                default: '',
                description: 'The case insensitive "substring" filter based on the dashboard title',
                displayOptions: { show: { resource: ['dashboard'], operation: ['getDashboards', 'getCustomerDashboards', 'getUserDashboards'] } },
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
                displayOptions: { show: { resource: ['dashboard'], operation: ['getDashboards', 'getCustomerDashboards', 'getUserDashboards'] } },
            },
            {
                displayName: 'Mobile',
                name: 'isMobileDashboard',
                type: 'boolean',
                default: false,
                description: 'Whether to exclude dashboards that are hidden for mobile',
                displayOptions: { show: { resource: ['dashboard'], operation: ['getDashboards', 'getUserDashboards'] } },
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
                description: 'A string value representing the user ID. For example, "784f394c-42b6-435a-983c-b7beff2784f9".',
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


    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const results: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            const resource = this.getNodeParameter('resource', i) as string;
            const operation = this.getNodeParameter('operation', i) as string;

            const creds = await this.getCredentials('thingsBoardApi') as { baseUrl: string };
            if (!creds || !creds.baseUrl) {
                throw new NodeOperationError(this.getNode(), 'ThingsBoard credential `baseUrl` is missing. Open the node credentials and set the base URL (e.g. http://localhost:8080)');
            }
            creds.baseUrl = (creds.baseUrl as string).replace(/\/+$/g, '');
            const token = await getAccessToken.call(this);

            const edition = await getEdition.call(this);
            if (edition === 'CE') {
                const key = `${resource}:${operation}`;
                if (PE_ONLY_OPERATIONS.has(key)) {
                    throw new NodeOperationError(this.getNode(), `Operation "${operation}" for resource "${resource}" is available only in ThingsBoard PE edition.`);
                }
            }

            if (resource === 'device' && operation === 'getDeviceById') {
                const deviceId = this.getNodeParameter('deviceId', i) as string;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/device/${deviceId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'device' && operation === 'createDevice') {
                const mode = this.getNodeParameter('deviceInputMode', i) as string;

                let body: Record<string, unknown>;
                const qs: Record<string, any> = {};

                const accessTokenParam = this.getNodeParameter('deviceAccessToken', i, '') as string;
                if (accessTokenParam) qs.accessToken = accessTokenParam;

                if (mode === 'json') {
                    const raw = this.getNodeParameter('deviceJson', i) as unknown;

                    if (typeof raw === 'string') {
                        try {
                            body = JSON.parse(raw) as Record<string, unknown>;
                        } catch (e) {
                            throw new NodeOperationError(this.getNode(), `deviceJson must be valid JSON. ${(e as Error).message}`);
                        }
                    } else if (raw && typeof raw === 'object') {
                        body = raw as Record<string, unknown>;
                    } else {
                        throw new NodeOperationError(this.getNode(), 'deviceJson must be a JSON object or JSON string.');
                    }

                } else {
                    const name = this.getNodeParameter('deviceNameCreate', i) as string;
                    const type = this.getNodeParameter('deviceTypeCreate', i) as string;
                    const label = this.getNodeParameter('deviceLabel', i) as string;
                    const customerId = this.getNodeParameter('customerIdDeviceCreate', i) as string;

                    body = {
                        name,
                        type,
                        ...(label ? { label } : {}),
                        ...(customerId ? { customerId: { id: customerId } } : {}),
                    };
                }

                const res = await this.helpers.request!({
                    method: 'POST',
                    uri: `${creds.baseUrl}/api/device`,
                    qs,
                    body,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'dashboard' && operation === 'createDashboard') {
                const mode = this.getNodeParameter('dashboardInputMode', i) as string;

                let body: Record<string, unknown>;

                if (mode === 'json') {
                    const raw = this.getNodeParameter('dashboardJson', i) as unknown;

                    if (typeof raw === 'string') {
                        try {
                            body = JSON.parse(raw) as Record<string, unknown>;
                        } catch (e) {
                            throw new NodeOperationError(this.getNode(), `dashboardJson must be valid JSON. ${(e as Error).message}`);
                        }
                    } else if (raw && typeof raw === 'object') {
                        body = raw as Record<string, unknown>;
                    } else {
                        throw new NodeOperationError(this.getNode(), 'dashboardJson must be a JSON object or JSON string.');
                    }

                } else {
                    const title = this.getNodeParameter('dashboardTitle', i) as string;
                    body = { title };
                }

                const res = await this.helpers.request!({
                    method: 'POST',
                    uri: `${creds.baseUrl}/api/dashboard`,
                    body,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'device' && operation === 'deleteDevice') {
                const deviceId = this.getNodeParameter('deviceId', i) as string;

                await this.helpers.request!({
                    method: 'DELETE',
                    uri: `${creds.baseUrl}/api/device/${deviceId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: { deleted: true } });
            }

            if (resource === 'device' && operation === 'getTenantDevice') {
                const deviceName = this.getNodeParameter('deviceName', i) as string;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/tenant/devices`,
                    qs: { deviceName },
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'device' && operation === 'getTenantDevices') {
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const type = this.getNodeParameter('deviceType', i) as string;
                const textSearch = this.getNodeParameter('deviceTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('deviceSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (type) qs.type = type;
                qs.pageSize = pageSize;
                qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/tenant/devices`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'device' && operation === 'getCustomerDevices') {
                const customerId = this.getNodeParameter('customerIdRequired', i) as string;
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const type = this.getNodeParameter('deviceType', i) as string;
                const textSearch = this.getNodeParameter('deviceTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('deviceSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (type) qs.type = type;
                qs.pageSize = pageSize;
                qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/customer/${customerId}/devices`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'device' && operation === 'getUserDevices') {
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const type = this.getNodeParameter('deviceType', i) as string;
                const textSearch = this.getNodeParameter('deviceTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('deviceSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (pageSize !== undefined) qs.pageSize = pageSize;
                if (page !== undefined) qs.page = page;
                if (type) qs.type = type;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/user/devices`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'device' && operation === 'getDevicesByEntityGroupId') {
                const entityGroupId = this.getNodeParameter('entityGroupId', i) as string;
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('deviceTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('deviceSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (pageSize !== undefined) qs.pageSize = pageSize;
                if (page !== undefined) qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/entityGroup/${entityGroupId}/devices`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'asset' && operation === 'getAssetById') {
                const assetId = this.getNodeParameter('assetId', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/asset/${assetId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'asset' && operation === 'getTenantAsset') {
                const assetName = this.getNodeParameter('assetName', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/tenant/assets?assetName=${encodeURIComponent(assetName)}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'asset' && operation === 'getTenantAssets') {
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const type = this.getNodeParameter('assetType', i) as string;
                const textSearch = this.getNodeParameter('assetTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('assetSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (type) qs.type = type;
                qs.pageSize = pageSize;
                qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/tenant/assets`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'asset' && operation === 'createAsset') {
                const mode = this.getNodeParameter('assetInputMode', i) as string;

                let body: Record<string, unknown>;

                if (mode === 'json') {
                    const raw = this.getNodeParameter('assetJson', i) as unknown;

                    if (typeof raw === 'string') {
                        try {
                            body = JSON.parse(raw) as Record<string, unknown>;
                        } catch (e) {
                            throw new NodeOperationError(this.getNode(), `assetJson must be valid JSON. ${(e as Error).message}`);
                        }
                    } else if (raw && typeof raw === 'object') {
                        body = raw as Record<string, unknown>;
                    } else {
                        throw new NodeOperationError(this.getNode(), 'assetJson must be a JSON object or JSON string.');
                    }

                } else {
                    const name = this.getNodeParameter('assetNameCreate', i) as string;
                    const type = this.getNodeParameter('assetTypeCreate', i) as string;
                    const label = this.getNodeParameter('assetLabel', i) as string;
                    const customerId = this.getNodeParameter('customerIdAssetCreate', i) as string;

                    body = {
                        name,
                        type,
                        ...(label ? { label } : {}),
                        ...(customerId ? { customerId: { id: customerId } } : {}),
                    };
                }
                const qs: Record<string, any> = {};

                const res = await this.helpers.request!({
                    method: 'POST',
                    uri: `${creds.baseUrl}/api/asset`,
                    qs,
                    body,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'asset' && operation === 'deleteAsset') {
                const assetId = this.getNodeParameter('assetId', i) as string;
                await this.helpers.request!({
                    method: 'DELETE',
                    uri: `${creds.baseUrl}/api/asset/${assetId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: { deleted: true } });
            }

            if (resource === 'asset' && operation === 'getCustomerAssets') {
                const customerId = this.getNodeParameter('customerIdRequired', i) as string;
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const assetType = this.getNodeParameter('assetType', i) as string;
                const textSearch = this.getNodeParameter('assetTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('assetSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (assetType) qs.assetType = assetType;
                qs.pageSize = pageSize;
                qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/customer/${customerId}/assets`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'asset' && operation === 'getUserAssets') {
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const type = this.getNodeParameter('assetType', i) as string; // stays consistent with property name
                const textSearch = this.getNodeParameter('assetTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('assetSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (pageSize !== undefined) qs.pageSize = pageSize;
                if (page !== undefined) qs.page = page;
                if (type) qs.type = type;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/user/assets`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'asset' && operation === 'getAssetsByEntityGroupId') {
                const entityGroupId = this.getNodeParameter('entityGroupId', i) as string;
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('assetTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('assetSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (pageSize !== undefined) qs.pageSize = pageSize;
                if (page !== undefined) qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/entityGroup/${entityGroupId}/assets`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'customer' && operation === 'getCustomerById') {
                const customerId = this.getNodeParameter('customerIdRequired', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/customer/${customerId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'customer' && operation === 'createCustomer') {
                const title = this.getNodeParameter('customerTitle', i) as string;
                if (!title) {
                    throw new NodeOperationError(this.getNode(), 'customerTitle is required to create a customer');
                }

                const body: any = { title };

                const res = await this.helpers.request!({
                    method: 'POST',
                    uri: `${creds.baseUrl}/api/customer`,
                    body,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'customer' && operation === 'deleteCustomer') {
                const customerId = this.getNodeParameter('customerIdRequired', i) as string;
                if (!customerId) {
                    throw new NodeOperationError(this.getNode(), 'customerId is required to delete a customer');
                }
                await this.helpers.request!({
                    method: 'DELETE',
                    uri: `${creds.baseUrl}/api/customer/${customerId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: { deleted: true } });
            }

            if (resource === 'customer' && operation === 'getCustomers') {
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('customerTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('customerSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (pageSize !== undefined) qs.pageSize = pageSize;
                if (page !== undefined) qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/customers`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'customer' && operation === 'getTenantCustomer') {
                const customerTitle = this.getNodeParameter('customerTitle', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/tenant/customers?customerTitle=${encodeURIComponent(customerTitle)}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'customer' && operation === 'getCustomersByEntityGroupId') {
                const entityGroupId = this.getNodeParameter('entityGroupId', i) as string;
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('customerTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('customerSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (pageSize !== undefined) qs.pageSize = pageSize;
                if (page !== undefined) qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/entityGroup/${entityGroupId}/customers`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'customer' && operation === 'getUserCustomers') {
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('customerTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('customerSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (pageSize !== undefined) qs.pageSize = pageSize;
                if (page !== undefined) qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/user/customers`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'telemetry' && operation === 'getTimeseries') {
                const entityType = this.getNodeParameter('entityType', i) as string;
                const entityId = this.getNodeParameter('entityId', i) as string;
                const keys = this.getNodeParameter('keys', i) as string;
                const startTs = this.getNodeParameter('startTs', i) as string;
                const endTs = this.getNodeParameter('endTs', i) as string;
                const agg = this.getNodeParameter('agg', i) as string;
                const interval = this.getNodeParameter('interval', i) as string;
                const intervalType = this.getNodeParameter('intervalType', i) as string;
                const timeZone = this.getNodeParameter('timeZone', i) as string;
                const orderBy = this.getNodeParameter('orderBy', i) as string;
                const limit = this.getNodeParameter('limit', i) as number;
                const useStrictDataTypes = this.getNodeParameter('useStrictDataTypes', i) as boolean;

                const qs: Record<string, string | number | boolean> = { keys, startTs, endTs, interval };
                if (agg) qs.agg = agg;
                if (orderBy) qs.orderBy = orderBy;
                if (limit !== undefined && limit !== null) qs.limit = limit;
                if (intervalType) qs.intervalType = intervalType;
                if (timeZone) qs.timeZone = timeZone;
                if (useStrictDataTypes !== undefined) qs.useStrictDataTypes = useStrictDataTypes;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'telemetry' && operation === 'getTimeseriesKeys') {
                const entityType = this.getNodeParameter('entityType', i) as string;
                const entityId = this.getNodeParameter('entityId', i) as string;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/plugins/telemetry/${entityType}/${entityId}/keys/timeseries`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: { timeseriesKeys: res } });
            }

            if (resource === 'telemetry' && operation === 'getLatestTimeseries') {
                const entityType = this.getNodeParameter('entityType', i) as string;
                const entityId = this.getNodeParameter('entityId', i) as string;
                const keys = this.getNodeParameter('keys', i) as string;
                const useStrictDataTypes = this.getNodeParameter('useStrictDataTypes', i) as boolean;

                const qs: Record<string, string | boolean> = {};
                if (keys) qs.keys = keys;
                qs.useStrictDataTypes = useStrictDataTypes;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'telemetry' && operation === 'getAttributes') {
                const entityType = this.getNodeParameter('entityType', i) as string;
                const entityId = this.getNodeParameter('entityId', i) as string;
                const keys = this.getNodeParameter('keys', i) as string;

                const qs: Record<string, string> = {};
                if (keys) qs.keys = keys;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/plugins/telemetry/${entityType}/${entityId}/values/attributes`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'telemetry' && operation === 'getAttributeKeys') {
                const entityType = this.getNodeParameter('entityType', i) as string;
                const entityId = this.getNodeParameter('entityId', i) as string;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/plugins/telemetry/${entityType}/${entityId}/keys/attributes`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: { attributeKeys: res } });
            }

            if (resource === 'telemetry' && operation === 'getAttributeKeysByScope') {
                const entityType = this.getNodeParameter('entityType', i) as string;
                const entityId = this.getNodeParameter('entityId', i) as string;
                const scope = this.getNodeParameter('scope', i) as string;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/plugins/telemetry/${entityType}/${entityId}/keys/attributes/${scope}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: { attributeKeys: res } });
            }
            if (resource === 'alarm' && operation === 'getAlarmById') {
                const alarmId = this.getNodeParameter('alarmId', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/alarm/${alarmId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }
            if (resource === 'relation' && operation === 'getRelation') {
                const fromId = this.getNodeParameter('fromId', i) as string;
                const fromType = this.getNodeParameter('fromType', i) as string;
                const relationType = this.getNodeParameter('relationType', i) as string;
                const relationTypeGroup = "COMMON";
                const toId = this.getNodeParameter('toId', i) as string;
                const toType = this.getNodeParameter('toType', i) as string;

                const qs: Record<string, string> = {
                    fromId,
                    fromType,
                    relationType,
                    relationTypeGroup,
                    toId,
                    toType,
                };

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/relation`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'relation' && operation === 'findByFrom') {
                const fromId = this.getNodeParameter('fromId', i) as string;
                const fromType = this.getNodeParameter('fromType', i) as string;
                const relationTypeGroup = "COMMON";
                const qs: Record<string, string> = { fromId, fromType, relationTypeGroup };

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/relations`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'relation' && operation === 'findInfoByFrom') {
                const fromId = this.getNodeParameter('fromId', i) as string;
                const fromType = this.getNodeParameter('fromType', i) as string;
                const relationTypeGroup = "COMMON";
                const qs: Record<string, string> = { fromId, fromType, relationTypeGroup };

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/relations/info`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'relation' && operation === 'findByFromWithRelationType') {
                const fromId = this.getNodeParameter('fromId', i) as string;
                const fromType = this.getNodeParameter('fromType', i) as string;
                const relationType = this.getNodeParameter('relationType', i) as string;
                const relationTypeGroup = "COMMON";
                const qs: Record<string, string> = { fromId, fromType, relationType, relationTypeGroup };

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/relations`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'relation' && operation === 'findByTo') {
                const toId = this.getNodeParameter('toId', i) as string;
                const toType = this.getNodeParameter('toType', i) as string;
                const relationTypeGroup = "COMMON";
                const qs: Record<string, string> = { toId, toType, relationTypeGroup };

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/relations`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'relation' && operation === 'findInfoByTo') {
                const toId = this.getNodeParameter('toId', i) as string;
                const toType = this.getNodeParameter('toType', i) as string;
                const relationTypeGroup = "COMMON";
                const qs: Record<string, string> = { toId, toType, relationTypeGroup };

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/relations/info`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'relation' && operation === 'findByToWithRelationType') {
                const toId = this.getNodeParameter('toId', i) as string;
                const toType = this.getNodeParameter('toType', i) as string;
                const relationType = this.getNodeParameter('relationType', i) as string;
                const relationTypeGroup = "COMMON"
                const qs: Record<string, string> = { toId, toType, relationType, relationTypeGroup };
                if (relationTypeGroup) qs.relationTypeGroup = relationTypeGroup;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/relations`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'alarm' && operation === 'getAlarmInfoById') {
                const alarmId = this.getNodeParameter('alarmId', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/alarm/info/${alarmId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'alarm' && operation === 'getAlarms') {
                const entityType = this.getNodeParameter('alarmEntityType', i) as string;
                if (!entityType) {
                    throw new NodeOperationError(this.getNode(), '"alarmEntityType" is required for getAlarms (e.g. "DEVICE" or "ASSET")');
                }
                const entityId = this.getNodeParameter('entityId', i) as string;
                const searchStatus = this.getNodeParameter('searchStatus', i) as string;
                const status = this.getNodeParameter('status', i) as string;
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('alarmTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('alarmSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;
                const startTs = this.getNodeParameter('startTs', i) as string;
                const endTs = this.getNodeParameter('endTs', i) as string;
                const fetchOriginator = this.getNodeParameter('fetchOriginator', i) as boolean as unknown as boolean;

                const qs: Record<string, string | number | boolean> = {};
                if (pageSize !== undefined) qs.pageSize = pageSize;
                if (page !== undefined) qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;
                if (fetchOriginator !== undefined) qs.fetchOriginator = fetchOriginator;
                if (searchStatus) qs.searchStatus = searchStatus;
                if (status) qs.status = status;
                if (startTs) qs.startTime = startTs;
                if (endTs) qs.endTime = endTs;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/alarm/${entityType}/${entityId}`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'alarm' && operation === 'getAllAlarms') {
                const searchStatus = this.getNodeParameter('searchStatus', i) as string;
                const status = this.getNodeParameter('status', i) as string;
                const assigneeId = this.getNodeParameter('assigneeId', i) as string;
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('alarmTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('alarmSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;
                const startTs = this.getNodeParameter('startTs', i) as string;
                const endTs = this.getNodeParameter('endTs', i) as string;
                const fetchOriginator = this.getNodeParameter('fetchOriginator', i) as boolean as unknown as boolean;

                const qs: Record<string, string | number | boolean> = {};
                if (pageSize !== undefined) qs.pageSize = pageSize;
                if (page !== undefined) qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;
                if (fetchOriginator !== undefined) qs.fetchOriginator = fetchOriginator;
                if (searchStatus) qs.searchStatus = searchStatus;
                if (status) qs.status = status;
                if (assigneeId) qs.assigneeId = assigneeId;
                if (startTs) qs.startTime = startTs;
                if (endTs) qs.endTime = endTs;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/alarms`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'alarm' && operation === 'getHighestAlarmSeverity') {
                const alarmEntityType = this.getNodeParameter('alarmEntityType', i) as string;
                const entityType = alarmEntityType || (this.getNodeParameter('entityType', i) as string);
                const entityId = this.getNodeParameter('entityId', i) as string;
                const searchStatus = this.getNodeParameter('searchStatus', i) as string;
                const status = this.getNodeParameter('status', i) as string;

                const qs: Record<string, string> = {};
                if (searchStatus) qs.searchStatus = searchStatus;
                if (status) qs.status = status;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/alarm/highestSeverity/${entityType}/${entityId}`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'alarm' && operation === 'getAlarmTypes') {
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('alarmTextSearch', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number> = {};
                if (pageSize !== undefined) qs.pageSize = pageSize;
                if (page !== undefined) qs.page = page;
                if (textSearch) qs.textSearch = textSearch;
                if (sortOrder) qs.sortOrder = sortOrder;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/alarm/types`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'entityGroup' && operation === 'getEntityGroupById') {
                const entityGroupId = this.getNodeParameter('entityGroupId', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/entityGroup/${entityGroupId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'entityGroup' && operation === 'getEntityGroupsByType') {
                const groupType = this.getNodeParameter('groupType', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/entityGroups/${groupType}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'entityGroup' && operation === 'getEntityGroupByOwnerAndNameAndType') {
                const ownerType = this.getNodeParameter('ownerType', i) as string;
                const ownerId = this.getNodeParameter('ownerId', i) as string;
                const groupType = this.getNodeParameter('groupType', i) as string;
                const groupName = this.getNodeParameter('groupName', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/entityGroups/${ownerType}/${ownerId}/${groupType}/${encodeURIComponent(groupName)}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'entityGroup' && operation === 'getEntityGroupsByOwnerAndType') {
                const ownerType = this.getNodeParameter('ownerType', i) as string;
                const ownerId = this.getNodeParameter('ownerId', i) as string;
                const groupType = this.getNodeParameter('groupType', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/entityGroups/${ownerType}/${ownerId}/${groupType}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'entityGroup' && operation === 'getEntityGroupsForEntity') {
                const groupType = this.getNodeParameter('groupType', i) as string;
                const entityId = this.getNodeParameter('entityId', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/entityGroups/${groupType}/${entityId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });
                results.push({ json: res });
            }

            if (resource === 'dashboard' && operation === 'createDashboard') {
                const mode = this.getNodeParameter('dashboardInputMode', i) as string;

                let body: Record<string, unknown>;

                if (mode === 'json') {
                    const raw = this.getNodeParameter('dashboardJson', i) as unknown;

                    if (typeof raw === 'string') {
                        try {
                            body = JSON.parse(raw) as Record<string, unknown>;
                        } catch (e) {
                            throw new NodeOperationError(this.getNode(), `dashboardJson must be valid JSON. ${(e as Error).message}`);
                        }
                    } else if (raw && typeof raw === 'object') {
                        body = raw as Record<string, unknown>;
                    } else {
                        throw new NodeOperationError(this.getNode(), 'dashboardJson must be a JSON object or JSON string.');
                    }

                } else {
                    const title = this.getNodeParameter('dashboardTitle', i) as string;
                    body = { title };
                }

                const res = await this.helpers.request!({
                    method: 'POST',
                    uri: `${creds.baseUrl}/api/dashboard`,
                    body,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'dashboard' && operation === 'getDashboardById') {
                const dashboardId = this.getNodeParameter('dashboardId', i) as string;
                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/dashboard/${dashboardId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'dashboard' && operation === 'deleteDashboard') {
                const dashboardId = this.getNodeParameter('dashboardId', i) as string;

                await this.helpers.request!({
                    method: 'DELETE',
                    uri: `${creds.baseUrl}/api/dashboard/${dashboardId}`,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: { deleted: true } });
            }

            if (resource === 'dashboard' && operation === 'getDashboards') {
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('dashboardTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('dashboardSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;
                const isMobileDashboard = this.getNodeParameter('isMobileDashboard', i, false) as boolean;

                const qs: Record<string, string | number | boolean> = {
                    pageSize, page,
                };
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;

                if (typeof isMobileDashboard === 'boolean') qs.mobile = isMobileDashboard;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/tenant/dashboards`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'dashboard' && operation === 'getCustomerDashboards') {
                const customerId = this.getNodeParameter('customerId', i) as string;
                const includeCustomers = this.getNodeParameter('includeCustomers', i, false) as boolean;
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('dashboardTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('dashboardSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number | boolean> = { pageSize, page };
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;
                if (typeof includeCustomers === 'boolean') qs.includeCustomers = includeCustomers;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/customer/${customerId}/dashboards`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }

            if (resource === 'dashboard' && operation === 'getUserDashboards') {
                const isMobileDashboard = this.getNodeParameter('isMobileDashboard', i, false) as boolean;
                const allowedOperation = this.getNodeParameter('dashboardOperation', i, '') as string;
                const userId = this.getNodeParameter('userId', i, '') as string;
                const pageSize = this.getNodeParameter('pageSize', i) as number;
                const page = this.getNodeParameter('page', i) as number;
                const textSearch = this.getNodeParameter('dashboardTextSearch', i) as string;
                const sortProperty = this.getNodeParameter('dashboardSortProperty', i) as string;
                const sortOrder = this.getNodeParameter('sortOrder', i) as string;

                const qs: Record<string, string | number | boolean> = { pageSize, page };
                if (textSearch) qs.textSearch = textSearch;
                if (sortProperty) qs.sortProperty = sortProperty;
                if (sortOrder) qs.sortOrder = sortOrder;
                if (typeof isMobileDashboard === 'boolean') qs.mobile = isMobileDashboard;
                if (allowedOperation) qs.operation = allowedOperation;
                if (userId) qs.userId = userId;

                const res = await this.helpers.request!({
                    method: 'GET',
                    uri: `${creds.baseUrl}/api/user/dashboards`,
                    qs,
                    json: true,
                    headers: { 'X-Authorization': `Bearer ${token}` },
                });

                results.push({ json: res });
            }
        }

        return this.prepareOutputData(results);
    }
}

async function getEdition(this: IExecuteFunctions): Promise<string> {
    const cache = this.getWorkflowStaticData('node') as {
        tbToken?: string; tbTokenAt?: number;
        tbEdition?: string; tbVersion?: string;
    };
    return cache.tbEdition || 'CE';
}

async function getAccessToken(this: IExecuteFunctions): Promise<string> {
    const creds = await this.getCredentials('thingsBoardApi') as {
        baseUrl: string; username: string; password: string;
    };
    if (!creds || !creds.baseUrl) {
        throw new NodeOperationError(this.getNode(), 'ThingsBoard credential `baseUrl` is missing. Open the node credentials and set the base URL (e.g. http://localhost:8080)');
    }
    creds.baseUrl = (creds.baseUrl as string).replace(/\/+$/g, '');
    const cache = this.getWorkflowStaticData('node') as {
        tbToken?: string; tbTokenAt?: number;
        tbEdition?: string; tbVersion?: string;
    };

    const now = Date.now();
    if (cache.tbToken && cache.tbTokenAt && now - cache.tbTokenAt < 20 * 60 * 1000) {
        return cache.tbToken;
    }

    const resp = await this.helpers.request!({
        method: 'POST',
        uri: `${creds.baseUrl}/api/auth/login`,
        json: true,
        body: { username: creds.username, password: creds.password },
    });

    const token = resp?.token as string;
    if (!token) throw new NodeOperationError(this.getNode(), 'ThingsBoard login failed: no token in response');

    cache.tbToken = token;
    cache.tbTokenAt = Date.now();

    if (!cache.tbEdition) {
        try {
            const sys = await this.helpers.request!({
                method: 'GET',
                uri: `${creds.baseUrl}/api/system/info`,
                json: true,
                headers: { 'X-Authorization': `Bearer ${token}` },
            });
            cache.tbEdition = sys?.type || 'CE';
            cache.tbVersion = sys?.version || 'latest';
        } catch {
            cache.tbEdition = 'CE';
            cache.tbVersion = 'latest';
        }
    }
    return token;
}
