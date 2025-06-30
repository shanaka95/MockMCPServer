# MockMCP - Model Context Protocol Server Builder

> Create mock MCP servers in under 30 seconds with minimal configuration.

[![Website](https://img.shields.io/badge/🌐_Website-mockmcp.com-blue?style=for-the-badge)](https://www.mockmcp.com)
[![Create Server](https://img.shields.io/badge/🚀_Create_Server-Start_Now-green?style=for-the-badge)](https://www.mockmcp.com/create-server)
[![View Servers](https://img.shields.io/badge/📊_My_Servers-Dashboard-orange?style=for-the-badge)](https://www.mockmcp.com/servers)
[![Demo](https://img.shields.io/badge/🎮_Demo-Try_It_Live-purple?style=for-the-badge)](https://www.mockmcp.com/demo)

![License](https://img.shields.io/badge/license-NonCommercial-blue.svg)
![AWS](https://img.shields.io/badge/AWS-Serverless-orange.svg)
![Python](https://img.shields.io/badge/Python-3.12-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)

---

<div align="center">

### 🎯 **Try MockMCP Now - No Setup Required!**

**Skip the complexity. Start building agentic AI workflows in seconds.**

**[🌐 Visit MockMCP.com](https://www.mockmcp.com)** • **[🚀 Create Your First Server](https://www.mockmcp.com/create-server)** • **[🎮 View Live Demo](https://www.mockmcp.com/demo)**

</div>

---

## 🚀 Overview

As agentic AI grows in popularity, agent capabilities have become a cornerstone of modern AI development. In today's landscape, MCP (Model Context Protocol) servers provide essential capabilities to AI agents. However, when developing agent workflows, using actual MCP servers can be problematic since agents might cause unintended side effects during testing and development.

The practical solution is to create mock MCP servers for development purposes. Unfortunately, building these mock servers from scratch is time-consuming and technically challenging. **MockMCP.com** solves this problem by enabling developers to create fully functional mock MCP servers instantly, streamlining the development process and allowing teams to focus on building great agentic experiences.

## 🔗 Quick Access

| Action | Link | Description |
|--------|------|-------------|
| 🏠 **Main Website** | [mockmcp.com](https://www.mockmcp.com) | Landing page and platform overview |
| 🚀 **Create Server** | [Create New Server](https://www.mockmcp.com/create-server) | Build your first mock MCP server |
| 📊 **Server Dashboard** | [My Servers](https://www.mockmcp.com/servers) | Manage and monitor your servers |
| 🎮 **Live Demo** | [Try Demo](https://www.mockmcp.com/demo) | Test the platform with examples |
| 📖 **GitHub Repository** | [Source Code](https://github.com/shanaka95/MockMCPServer) | View and contribute to the code |

### Key Features

- ✅ **Instant Creation** - Create Mock MCP servers in under 30 seconds
- ✅ **Protocol Compliant** - Fully adheres to the original MCP protocol specifications
- ✅ **Multi-Format Support** - Supports both text and image outputs for comprehensive testing
- ✅ **Cloud-Native** - Fully AWS-hosted solution with enterprise-grade reliability
- ✅ **Competition Ready** - Developed specifically for the AWS Lambda Hackathon 2025

## 🏗️ Architecture

![Architecture Diagram](diagrams/architecture.png)

MockMCP is a fully AWS-hosted serverless solution built around two core Lambda functions. The first handles user authorization and authentication, while the second manages the complete MCP server lifecycle - from creation to execution.

**Authentication Flow**: Users authenticate through AWS Cognito, gaining access to create MCP servers via our Amplify-hosted frontend. All requests - both from users and MCP clients - flow through API Gateway, where our Authorizer Lambda validates and authorizes every interaction before forwarding approved requests to the Server Lambda and generates a policy for the API Gateway.

**Domain & Storage**: The entire system operates under the MockMCP.com domain with DNS managed by Route 53. User-uploaded images and MCP server outputs are securely stored in S3 buckets, while the complete state of every MCP server is tracked in a DynamoDB table that the Server Lambda connects to as needed.

This architecture ensures scalability, security, and reliability while maintaining the simplicity that makes MockMCP so effective for rapid development.

### Tech Stack

**Frontend:**
- React 18 with Vite
- AWS Amplify (Hosting)
- AWS Cognito (Authentication)

**Backend:**
- AWS Lambda (Python 3.12)
- API Gateway
- DynamoDB
- S3

**Infrastructure:**
- AWS SAM (Infrastructure as Code)
- Route 53 (DNS)
- CloudFront (CDN)

## 📋 Prerequisites

### Required
- AWS Account with appropriate permissions
- Node.js (Latest LTS version recommended)
- Python 3.12+
- AWS CLI
- SAM CLI

### Optional
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - For testing and debugging MCP servers

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone git@github.com:shanaka95/MockMCPServer.git
cd MockMCPServer
```

### 2. Setup AWS Infrastructure
```bash
aws configure --profile=mockmcp
export AWS_PROFILE=mockmcp
sam build && sam deploy --no-confirm-changeset
```

### 3. Configure Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Deploy Frontend
The frontend should be configured manually with AWS Amplify. Once set up, it will automatically update with commits to the git repository.

> **Important**: The AWS SAM template automatically configures all backend resources with necessary permissions. Only Amplify needs to be configured separately.

## 📚 Usage

### Creating an MCP Server

Creating a mock MCP server is incredibly straightforward:

1. Navigate to [https://www.mockmcp.com/create-server](https://www.mockmcp.com/create-server)
2. Fill in the details about your server and define the tools you need
3. Click the "Create Server" button and you're done!

Your server will be ready to use immediately with a unique URL and authentication token.

### Using MCP Servers

Once created, you can easily integrate your mock MCP server into your development workflow. Simply copy the server URL and token, or grab the complete server configuration from the [servers page](https://www.mockmcp.com/servers).

#### Example MCP Client Configuration
```json
{
  "mcpServers": {
    "DemoMCPServer": {
      "type": "streamable-http",
      "url": "https://app.mockmcp.com/servers/vdbFM-A-IT2X/mcp",
      "headers": {
        "Authorization": "Bearer mcp_m2m_wlDTpbFkVk8ynm9gKh9g7KrXFGPOYL87f279fhZab9k_60d6c23accbc6ad0"
      },
      "note": "For Streamable HTTP connections, add this URL and Authorization header to your MCP Client"
    }
  }
}
```

### API Examples

#### Create Server
```bash
POST app.mockmcp.com/servers
```

#### List Servers
```bash
GET app.mockmcp.com/servers
```

#### Delete a Server
```bash
DELETE app.mockmcp.com/servers/<server_id>
```

#### Upload an Image
```bash
POST app.mockmcp.com/images
```

#### Call MCP Tool
```bash
GET app.mockmcp.com/servers/<server_id>/mcp
```

## 🔌 API Reference

### Authentication

MockMCP implements a robust dual-authentication system to ensure security and proper access control:

**User Authentication**: Managed through AWS Cognito User Pool, providing secure access to the frontend application and server management functions.

**MCP Server-Client Authentication**: Handled by custom-generated machine-to-machine (M2M) tokens that are unique to each server instance and provide secure access to MCP protocol endpoints.

> **Security Note**: User tokens cannot access MCP endpoints, and M2M tokens cannot access user management functions. This separation ensures proper access control.

### Code Structure

```
MockMCPServer/
├── frontend/           # React frontend application
├── server/            # Lambda server application  
├── authorizer/        # Lambda authorizer
├── template.yaml      # SAM infrastructure template
└── amplify.yml       # Amplify build configuration
```

#### Key Files
- **`template.yaml`** - Contains the complete SAM template with details about all backend AWS resources
- **`amplify.yml`** - Amplify build configuration for frontend deployment

## 🔒 Security

### Security Considerations

MockMCP prioritizes security through multiple layers of protection:

**Authentication & Authorization**: All resources are protected with either Cognito user tokens or M2M tokens, ensuring that only authorized users and systems can access the platform.

#### Data Protection
Data security is ensured through AWS's enterprise-grade managed services. However, it's crucial to protect your M2M tokens as they are long-lived tokens that provide access to your MCP servers.

**Best Practices**:
- Store M2M tokens securely in your development environment
- Rotate tokens regularly for production-like environments
- Never commit tokens to version control systems

## 📊 Performance

### Performance Characteristics

**Cold Start Considerations**: Lambda functions may experience initial cold start delays when first accessed. However, once warmed up, the system efficiently restores MCP servers on demand, providing quick response times for subsequent requests.

**Scalability**: The serverless architecture automatically scales based on demand, ensuring consistent performance regardless of usage patterns.

## 🤝 Contributing

### How to Contribute

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes MockMCP better for everyone.

### Code Standards

Please follow the established architecture and file structure when contributing. Consistency helps maintain code quality and makes the project more accessible to new contributors.

### Pull Request Process

We encourage pull requests of all kinds. Please ensure your changes align with the project's goals and maintain the existing code quality standards.

## 🙏 Attribution

This project builds upon the excellent work of the open source community. We gratefully acknowledge the following projects:

- **[AWS Labs MCP Lambda Handler](https://github.com/awslabs/mcp/tree/main/src/mcp-lambda-handler)** - Core MCP lambda handler implementation and protocol support
- **[Lambda MCP Server](https://github.com/mikegc-aws/Lambda-MCP-Server)** - Reference implementation and architecture patterns for MCP servers on AWS Lambda

These projects provided essential foundation and inspiration for MockMCP's serverless architecture and MCP protocol implementation.

## 📝 Changelog

**Version 0.2**: Enhanced functionality with custom JavaScript flows
**Version 0.1**: MVP release featuring text and image outputs

## 📄 License

This project is licensed under a Non-Commercial License with attribution required. Please see the license file for full details.

## 🎯 Get Started Today

Ready to streamline your agentic AI development? Join thousands of developers who are already using MockMCP to accelerate their workflows.

**🚀 [Start Creating Servers](https://www.mockmcp.com/create-server)** | **📊 [View Dashboard](https://www.mockmcp.com/servers)** | **🎮 [Try Demo](https://www.mockmcp.com/demo)**

---

## 🌐 Links & Resources

- **🏠 Website**: [https://www.mockmcp.com](https://www.mockmcp.com)
- **🔧 Create Server**: [https://www.mockmcp.com/create-server](https://www.mockmcp.com/create-server)
- **📊 Server Dashboard**: [https://www.mockmcp.com/servers](https://www.mockmcp.com/servers)
- **🎮 Live Demo**: [https://www.mockmcp.com/demo](https://www.mockmcp.com/demo)
- **💻 GitHub**: [https://github.com/shanaka95/MockMCPServer](https://github.com/shanaka95/MockMCPServer)
- **📚 MCP Inspector**: [https://github.com/modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector)

---

**Built with ❤️ using AWS Serverless technologies**

*Empowering developers to build better agentic AI experiences, one mock server at a time.*

