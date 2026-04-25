# 🤖 Agents & AI Integration

Central Dashboard is designed to be the "Command Center" for AI Agents running on Cloudflare.

## 🏗 Current Agent Context

### 🧠 Intelligence Stack
Each project now includes an **Intelligence** metadata layer:
- **Coding Agents**: Track which agents (e.g., OpenCode, Gemini, Cursor) are active on the project.
- **AI Models**: Record the primary large language models (e.g., GPT-4o, Claude 3.5 Sonnet) used for the codebase.
- **Agent Instructions**: A specialized field for linking to the project's "System Instructions" or "Agent Rules" (typically stored in R2 or as a `.md` file in the repo).

### 📡 API for Agents
The following endpoints are optimized for agent consumption (JSON formatted, strict schemas):
- `GET /api/projects`: List available project context and infrastructure mappings.
- `GET /api/projects/:id/docs`: Fetch project knowledge base from R2.
- `POST /api/projects/:id/docs`: Allow agents to update project notes or technical debt logs.
- `GET /api/projects/:id/docker-context`: Retrieve real-time container status and hashes for agent-led troubleshooting.

## 🏗 Planned Integrations

### 1. Cloudflare Agents SDK
Each "Project" in Central can be mapped to a stateful agent using the **Cloudflare Agents SDK**.
- **State Persistence**: The dashboard provides a UI to inspect the `Durable Object` state of an agent.
- **Tools Configuration**: Agents can fetch their "Quick Links" or "Documentation" via the Central API to use as context for tool-calling.

### 2. Workers AI & Vectorize
- **RAG for Docs**: The documentation stored in R2 can be automatically indexed into **Cloudflare Vectorize**.
- **Chat Interface**: Each project can have an AI assistant that has read access to the project's documentation and metadata.

### 3. Agentic Workflows
- **Deployment Triggers**: Agents can trigger new deployments or database migrations via the Central dashboard API.
- **Log Analysis**: Integration with Portainer Logs and Cloudflare Logpush to allow agents to monitor and troubleshoot project health autonomously.
