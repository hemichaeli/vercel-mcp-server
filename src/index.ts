import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
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

const VERSION = '1.0.0';

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
app.use((req, _res, next) => {
  if (req.path === '/mcp') return next();
  express.json()(req, _res, next);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: VERSION, service: 'vercel-mcp-server' });
});

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

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.error(`Vercel MCP Server v${VERSION} running on port ${PORT}`);
});
