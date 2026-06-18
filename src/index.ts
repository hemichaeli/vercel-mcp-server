import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerDeploymentTools } from './tools/deployments.js';
import { registerProjectTools } from './tools/projects.js';
import { registerDomainTools } from './tools/domains.js';
import { registerDnsTools } from './tools/dns.js';
import { registerEnvTools } from './tools/environment.js';
import { registerTeamTools } from './tools/teams.js';
import { registerWebhookTools } from './tools/webhooks.js';
import { registerEdgeConfigTools } from './tools/edgeConfig.js';
import { registerAliasTools } from './tools/aliases.js';
import { registerUserTools } from './tools/user.js';
import { registerLogTools } from './tools/logs.js';
import { registerCheckTools } from './tools/checks.js';
import { registerCertTools } from './tools/certs.js';

const VERSION = '1.1.0';
const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : process.env.BASE_URL || 'https://vercel-mcp-server-production-a2d9.up.railway.app';

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'vercel-mcp-server',
    version: VERSION,
  });

  registerDeploymentTools(server);
  registerProjectTools(server);
  registerDomainTools(server);
  registerDnsTools(server);
  registerEnvTools(server);
  registerTeamTools(server);
  registerWebhookTools(server);
  registerEdgeConfigTools(server);
  registerAliasTools(server);
  registerUserTools(server);
  registerLogTools(server);
  registerCheckTools(server);
  registerCertTools(server);

  return server;
}

const app = express();

// Parse JSON for non-SSE/MCP routes
app.use((req, _res, next) => {
  if (req.path === '/mcp' || req.path === '/sse') return next();
  express.json()(req, _res, next);
});

// CORS headers for all routes
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
  next();
});

app.options('*', (_req, res) => res.sendStatus(204));

// OAuth protected resource metadata - required by Claude.ai
app.get('/.well-known/oauth-protected-resource', (_req, res) => {
  res.json({
    resource: BASE_URL,
    authorization_servers: [],
    bearer_methods_supported: ['header'],
    resource_documentation: `${BASE_URL}/health`,
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: VERSION, service: 'vercel-mcp-server' });
});

// Streamable HTTP transport (modern MCP)
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on('close', () => transport.close());
  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// SSE transport (legacy - required by Claude.ai connectors)
const sseTransports: Record<string, SSEServerTransport> = {};

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  sseTransports[transport.sessionId] = transport;
  res.on('close', () => {
    delete sseTransports[transport.sessionId];
  });
  const server = createMcpServer();
  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = sseTransports[sessionId];
  if (!transport) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.error(`Vercel MCP Server v${VERSION} running on port ${PORT}`);
  console.error(`SSE endpoint: ${BASE_URL}/sse`);
  console.error(`MCP endpoint: ${BASE_URL}/mcp`);
});
