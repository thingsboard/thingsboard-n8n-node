# ThingsBoard n8n Community Node

![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

ThingsBoard is an open-source IoT platform for data collection, processing, visualization, and device management.

This community node for n8n enables you to seamlessly manage devices, assets, telemetry, dashboards, customers, relations, alarms, and entity groups directly within your n8n workflows — or use it as a Tool for AI Agents.

Works with both **ThingsBoard Community Edition (CE)** and **Professional Edition (PE)**. PE-only operations are automatically detected and display clear error messages in CE.

## 🚀 Quick Start

### Installation

```bash
npm install n8n-nodes-thingsboard
```

### Configuration

1. Get your ThingsBoard credentials (URL, username, password)
2. In n8n, add ThingsBoard credentials:
   - **Base URL**: `https://demo.thingsboard.io`, `https://thingsboard.cloud` or your instance URL
   - **Username**: Your ThingsBoard login
   - **Password**: Your ThingsBoard password
3. Add the ThingsBoard node to your workflow
4. Select a resource (Device, Asset, etc.) and operation

### Usage

The ThingsBoard node supports multiple usage patterns to fit your automation needs:

**🤖 AI Agent Tool** - Use as a tool for AI Agents to enable conversational IoT control
*Example*: "Show me all devices" → Agent calls ThingsBoard → Natural language response

**💡 Direct Operations** - Configure operations with fixed values in the node interface
*Example*: Save specific attributes to device `abc-123` on a schedule

**🔄 Dynamic Operations** - Pass data from previous nodes using expressions
*Example*: Process alarm webhook → Extract entity ID → Get attributes → Send notification

See [Usage Examples](#-usage-examples) below for detailed walkthroughs with screenshots.

**Operation Modes**: For create operations (Device, Asset, Dashboard), you can choose:
- **Params Mode**: Use simple form fields (name, type, label, customer ID)
- **JSON Mode**: Paste a complete ThingsBoard entity JSON object

## 📦 Installation Methods

### Local n8n Instance

**Via npm**

```bash
# In your n8n instance directory
npm install n8n-nodes-thingsboard

# Or install a specific version
npm install n8n-nodes-thingsboard@1.0.0
```

### Docker Installation

Add to your `docker-compose.yml`:

```yaml
version: "3.8"
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
    volumes:
      - n8n_data:/home/node/.n8n
    command: >
      sh -c "
        npm install n8n-nodes-thingsboard &&
        n8n start
      "

volumes:
  n8n_data:
```

### n8n Cloud

❌ Not yet available
- Currently under review by n8n team
- Will be available in the n8n marketplace once approved

## 🔧 After Installation

1. **Restart n8n**:
   ```bash
   # Local installation
   n8n restart

   # Docker
   docker-compose restart n8n
   ```

2. **Verify installation**:
   - Open n8n in your browser
   - Create a new workflow
   - Search for "ThingsBoard" in the node picker
   - The ThingsBoard node should appear

3. **Set up credentials**:
   - Go to **Credentials** → **New Credential**
   - Search for "ThingsBoard API"
   - Enter your Base URL, Username, and Password
   - Click **Save**

4. **Use the node**:
   - Create a new workflow
   - Add a node
   - Search for "ThingsBoard"
   - Configure with your credentials

## 📋 Supported Operations

### Device (8 operations)
- ✅ Create Device (Params/JSON mode)
- ✅ Delete Device
- ✅ Get Device by ID
- ✅ Get Device by Name
- ✅ Get Tenant Devices
- ✅ Get Customer Devices
- ✅ Get Devices by Entity Group (PE only)
- ✅ Get User Devices (PE only)

### Asset (7 operations)
- ✅ Create Asset (Params/JSON mode)
- ✅ Delete Asset
- ✅ Get Asset by ID
- ✅ Get Asset by Name
- ✅ Get Tenant Assets
- ✅ Get Customer Assets
- ✅ Get Assets by Entity Group (PE only)
- ✅ Get User Assets (PE only)

### Customer (7 operations)
- ✅ Create Customer (Params/JSON mode)
- ✅ Delete Customer
- ✅ Get Customer by ID
- ✅ Get Customer by Title
- ✅ Get Customers
- ✅ Get Customers by Entity Group (PE only)
- ✅ Get User Customers (PE only)

### Dashboard (5 operations)
- ✅ Create Dashboard (JSON mode)
- ✅ Delete Dashboard
- ✅ Get Dashboard by ID
- ✅ Get Dashboards
- ✅ Get Customer Dashboards

### Telemetry (14 operations)
- ✅ Get Attributes
- ✅ Get Attribute Keys
- ✅ Get Attribute Keys (by Scope)
- ✅ Get Latest Timeseries
- ✅ Get Timeseries (Time Range)
- ✅ Get Timeseries Keys
- ✅ Save Entity Attributes
- ✅ Save Device Attributes
- ✅ Save Entity Telemetry
- ✅ Save Entity Telemetry with TTL
- ✅ Delete Entity Attributes
- ✅ Delete Device Attributes
- ✅ Delete Entity Timeseries

### Alarm (6 operations)
- ✅ Get All Alarms
- ✅ Get Alarm by ID
- ✅ Get Alarm Info by ID
- ✅ Get Alarms by Originator
- ✅ Get Highest Severity Alarm
- ✅ Get Alarm Types

### Relation (7 operations)
- ✅ Get Relation
- ✅ Find by From
- ✅ Find by From with Relation Type
- ✅ Find by To
- ✅ Find by To with Relation Type
- ✅ Find Info by From
- ✅ Find Info by To

### Entity Group (5 operations - PE only)
- ✅ Get Entity Group by ID
- ✅ Get Entity Groups by Type
- ✅ Get Entity Groups by Owner and Type
- ✅ Get Entity Group by Owner/Name/Type
- ✅ Get Entity Groups for Entity

**Total: 61 operations across 8 resources**

## 🛠️ Development

### Quick Start

```bash
# Clone the repository
git clone https://github.com/thingsboard/thingsboard-n8n-node.git
cd thingsboard-n8n-node

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode (watch)
npm run dev
```

### Testing Locally

```bash
# Link the package
npm link

# In your n8n directory
npm link n8n-nodes-thingsboard

# Start n8n
n8n start
```

## 💡 Usage Examples

### 1. 🤖 AI Agent Tool - Conversational IoT Control

Use the ThingsBoard node as a **tool for AI Agents** to enable intelligent, natural language IoT automation.

![AI Agent Use Case](images/ai-agent-usecase.png)

**How it works**:
1. User sends a chat message: *"What devices do I have and what's their status?"*
2. AI Agent (powered by Google Gemini) has access to ThingsBoard tools
3. Agent autonomously calls:
   - `Get devices in ThingsBoard` → Retrieves device list
   - `Get timeseries in ThingsBoard` → Fetches latest telemetry
4. Agent responds in natural language with the actual data

**Natural language commands**:
- *"Show me the temperature of my living room sensor"*
- *"Which devices are offline right now?"*
- *"Update the threshold on device X to 30 degrees"*
- *"Send me an alert if any temperature exceeds 25°C"*

The AI agent understands context and calls the appropriate ThingsBoard operations automatically!

---

### 2. 💡 Direct Operations - Fixed Values

Configure operations with **hardcoded values** directly in the node interface. Perfect for scheduled tasks and testing.

![Save Entity Attributes](images/save-entity-attributes.png)

**Example**: Save configuration attributes to a specific device

**Configuration**:
- **Resource**: Telemetry
- **Operation**: Save Entity Attributes
- **Entity Type**: DEVICE
- **Entity ID**: `2d2c8cc0-d75a-11f0-9e9b-db8ef79a21ad` *(hardcoded)*
- **Scope**: SERVER_SCOPE
- **Attributes JSON**: Direct JSON input

```json
{
  "stringKey": "value1",
  "booleanKey": true,
  "doubleKey": 42.0,
  "longKey": 73,
  "jsonKey": {
    "someNumber": 42,
    "someArray": [1, 2, 3],
    "someNestedObject": {"key": "value"}
  }
}
```

**Use cases**:
- Daily configuration updates on a schedule
- Testing API operations during development
- One-time bulk data migrations

---

### 3. 🔄 Dynamic Operations - Flow-Based Automation

Pass data from previous nodes using **expressions** to create dynamic, data-driven workflows.

![Rule Chain Use Case](images/rule-chain-usecase.png)

**Example**: Process ThingsBoard alarm and fetch device attributes

**Workflow**:
1. **Input**: Alarm webhook from ThingsBoard rule chain
2. **Extract**: Entity ID using `{{ $json.data[0].originator.id }}`
3. **Extract**: Entity Type using `{{ $json.data[0].originator.entityType }}`
4. **Operation**: Get attribute keys for that entity
5. **Output**: Attribute keys passed to downstream nodes

**Real-world scenario**: When a temperature alarm triggers, automatically fetch all device configuration attributes and include them in a Slack/email notification to help operators debug the issue.

**Use cases**:
- Processing ThingsBoard webhooks and rule engine outputs
- Dynamic device operations based on alarm triggers
- Building complex IoT automation pipelines
- Integrating with external systems (Slack, email, databases)

### Common Integration Patterns

#### Pattern 1: IoT Data Pipeline
```
Webhook → ThingsBoard (Save Telemetry) → Process Data → Save Attributes
```
Receive sensor data via webhook, save to ThingsBoard, process it, and update device attributes.

#### Pattern 2: Device Management
```
Schedule Trigger → Get Tenant Devices → Filter Inactive → Send Alert
```
Daily check for inactive devices and send notifications.

#### Pattern 3: Data Export
```
ThingsBoard (Get Timeseries) → Transform Data → Google Sheets / Database
```
Export telemetry data for reporting and analysis.

#### Pattern 4: Intelligent Monitoring
```
AI Agent ← Chat Interface
    ↓
ThingsBoard Tools (Get/Save/Delete operations)
    ↓
Automated device management based on natural language commands
```

## 🔗 Links

- **ThingsBoard Website**: [thingsboard.io](https://thingsboard.io/)
- **ThingsBoard Documentation**: [thingsboard.io/docs](https://thingsboard.io/docs/)
- **n8n Documentation**: [docs.n8n.io](https://docs.n8n.io/)
- **npm Package**: [npmjs.com/package/n8n-nodes-thingsboard](https://www.npmjs.com/package/n8n-nodes-thingsboard)
- **GitHub Repository**: [github.com/thingsboard/thingsboard-n8n-node](https://github.com/thingsboard/thingsboard-n8n-node)
- **ThingsBoard Demo**: [demo.thingsboard.io](https://demo.thingsboard.io/)

## 🫶 Support

- **Issues**: [GitHub Issues](https://github.com/thingsboard/thingsboard-n8n-node/issues)
- **ThingsBoard Community**: [thingsboard.io/community](https://thingsboard.io/community/)

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md) file for details.

---

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.
