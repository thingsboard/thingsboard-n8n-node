![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-thingsboard

This is an n8n community node. It lets you use [ThingsBoard](https://thingsboard.io/) in your n8n workflows.

ThingsBoard is an open-source IoT platform for data collection, processing, visualization, and device management. 
With this node, you can seamlessly manage devices, assets, telemetry, dashboards, customers, relations, alarms, and entity groups directly within n8n — or even use it as a Tool for AI Agents inside n8n.

Works with both ThingsBoard Community Edition (CE) and Professional Edition (PE).
PE-only operations are detected automatically and display a clear error message in CE.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)
[Usage](#usage)
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

| Resource                   | Example Operations                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Device**                 | Create, Delete, Get by ID, Get by Name, Get Tenant Devices, Get Customer Devices, Get Devices by Entity Group (PE), Get User Devices (PE) |
| **Asset**                  | Create, Delete, Get by ID, Get by Name, Get Tenant Assets, Get Customer Assets, Get Assets by Entity Group (PE), Get User Assets (PE)     |
| **Customer**               | Create, Delete, Get by ID, Get by Title, Get Customers, Get Customers by Entity Group (PE), Get User Customers (PE)                       |
| **Dashboard**              | Create, Delete, Get by ID, Get Dashboards, Get Customer Dashboards, Get User Dashboards                                                   |
| **Telemetry**              | Get Attributes, Get Attribute Keys, Get Latest Timeseries, Get Timeseries (Range), Get Timeseries Keys                                    |
| **Alarm**                  | Get All, Get by ID, Get Info by ID, Get by Originator, Get Highest Severity, Get Types                                                    |
| **Relation**               | Get, Find by From / To (with or without Relation Type), Get Info by From / To                                                             |
| **Entity Group (PE-only)** | Get by ID, Get Groups by Type, Get Groups by Owner and Type, Get by Owner/Name/Type, Get Groups for Entity                                |

## Credentials

| Field        | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| **Base URL** | Example: `https://demo.thingsboard.io/`                     |
| **Username** | Your ThingsBoard login                                      |
| **Password** | Your password                                               |

## Usage

[](/images/Node.png)

For create operations in Device, Asset and Dashboard, you can switch between![](/images/asset-creation-modes.png):

Params Mode: use simple form fields like name, type, label, customer ID
JSON Mode: paste a complete ThingsBoard entity JSON

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [ThingsBoard documentation](https://thingsboard.io/docs/)

