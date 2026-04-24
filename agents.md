# 🤖 Agents & AI Integration

Central Dashboard is designed to be the "Command Center" for AI Agents running on Cloudflare.

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
- **Log Analysis**: Integrate with Axiom or Cloudflare Logpush to allow agents to monitor and troubleshoot project health.

## 📡 API for Agents
The following endpoints are optimized for agent consumption (JSON formatted, strict schemas):
- `GET /api/projects`: List available project context.
- `GET /api/projects/:id/docs`: Fetch project knowledge base.
- `POST /api/projects/:id/docs`: Allow agents to update project notes.
