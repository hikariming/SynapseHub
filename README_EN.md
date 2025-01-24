# 🧠 SynapseHub - Next Generation LLM Intelligence Router

[简体中文](README.md) | [日本語](README_JP.md) | English

### Enterprise-grade intelligent API gateway: Unified access to OpenAI/Dify-style large models, implementing intelligent scheduling/cost optimization/security control LLM hub system

<div align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blueviolet?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/License-Apache%202.0-ff69b4?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/OpenAI-Compatible-success?style=for-the-badge&logo=openai" alt="OpenAI Compatible">
  <br><br>
  
[![GitHub Stars](https://img.shields.io/github/stars/hikariming/synapsehub?style=social)](https://github.com/hikariming/synapsehub)

</div>

![SynapseHub Dashboard](view.png)

> **Making LLM management as simple as breathing**  
> Enterprise LLM API Intelligent Scheduling System | OpenAI/Dify Compatible Interface | Multi-Model Hybrid Orchestration Expert

## 🚀 Why Choose SynapseHub?

1. **Enterprise-level Concurrency Solution** - Intelligent model orchestration supporting thousands of QPS
2. **300% Efficiency Improvement** - Multi-model parallel response + dynamic cache acceleration
3. **Full-dimensional AI Hub** - Conversation audit/intelligent load/multi-tenant isolation/circuit breaker alarm integrated platform

### 💡 Enterprise Core Values
✅ **Security Audit**  
✅ **Intelligent QPS Control**  
✅ **Multi-tenant Isolation System**  
✅ **Real-time Cost Dashboard**

## 🌟 Feature Matrix

| Feature Matrix | Core Advantages |
|---------------|-----------------|
| **Intelligent Routing** | Model dynamic selection based on Token |
| **Traffic Orchestration(WIP)** | Request splitting/merging/retry strategies |
| **Key Circuit Breaker** | Automatic circuit breaking for abnormal API Key traffic |
| **Cost Optimization(WIP)** | Real-time billing by token + predictive analysis |
| **Observability System** | Multi-dimensional monitoring + intelligent alerting + trace tracking |
| **Extended Protocols** | Native support for OpenAI/Dify |

## 🌟 Introduction

SynapseHub is a powerful LLM API gateway and management platform designed to simplify how enterprises and developers interact with various large language models. Whether you need to manage multiple API keys, balance loads across different models, or unify monitoring and logging of model calls, SynapseHub meets your needs.

## ✨ Core Features

### 🚀 Smart Routing & Load Balancing
- **Multi-Model Integration**: Support for OpenAI-style and Dify-style LLM unified access
- **Intelligent Load Distribution**: Support for multiple load balancing strategies including round-robin and random

### 🔒 Security & Access Control
- **Fine-grained Permission Management**: Comprehensive user role and permission control system
- **API Key Management**: Secure API key storage and management
- **Request Authentication**: Support for multiple authentication methods
- **Access Audit Logging**: Detailed request logging and audit functionality

### 📊 Monitoring & Analytics
- **Real-time Monitoring**: Monitor model performance, response time, error rates
- **Usage Statistics**: Detailed API call statistics and cost analysis
- **Log Management**: Centralized log collection and query
- **Alert System**: Configurable alert rules and notification methods

### 🔌 Usability & Integration
- **Simple Deployment**: Docker quick deployment support
- **User-friendly Interface**: Intuitive web management console
- **Standardized API**: OpenAI API format compatibility
- **Extensibility**: Support for custom model integration

## 🎯 Use Cases

### Enterprise Applications
- **Unified Model Management**: Centrally manage various LLM models used within the enterprise
- **Cost Control**: Optimize model usage costs through intelligent scheduling and monitoring
- **Security Compliance**: Meet enterprise requirements for data security and access control

### Development Teams
- **API Key Management**: Centrally manage and monitor team API key usage
- **Development Testing**: Easily switch between different models for development and testing
- **Usage Analysis**: Track and analyze team API usage

### Service Providers
- **Service Aggregation**: Provide unified LLM service access points for clients
- **Resource Scheduling**: Intelligent allocation and management of computing resources
- **Service Monitoring**: Comprehensive monitoring of service quality and usage

## 🚀 Quick Start

### Requirements
- Docker and Docker Compose
- Or standalone installation:
  - Node.js 16+
  - MongoDB 4.4+
  - Redis 6+

### Docker Deployment
```bash
# Clone repository
git clone https://github.com/hikariming/SynapseHub.git

# Enter project directory
cd synapsehub

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

Service Ports:
- Web UI: http://localhost:3000
- API Service: http://localhost:3088
- MongoDB: localhost:26889
- Redis: localhost:6390

### Manual Installation
```bash
# Clone repository
git clone https://github.com/hikariming/SynapseHub.git

# Install dependencies
cd synapsehub

cd web
npm install
npm run dev

cd api

# Configure environment variables
cp .env.example .env
# Edit .env file to configure necessary parameters

npm install
npm run dev

# Start service
npm run dev
```

## 🤝 Contributing

We welcome all forms of contributions, including but not limited to:
- Submitting issues and suggestions
- Improving documentation
- Contributing code
- Sharing usage experiences

## 📄 License

This project is licensed under the Apache 2.0 License.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=hikariming/SynapseHub&type=Date)](https://star-history.com/#hikariming/SynapseHub&Date)

---

<div align="center">
  <strong>If this project helps you, please give us a Star ⭐️</strong>
</div> 