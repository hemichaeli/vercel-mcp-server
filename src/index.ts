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

const VERSION = '1.2.0';
const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : (process.env.BASE_URL || 'https://vercel-mcp-server-production-a2d9.up.railway.app');

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

// CORS for all routes
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
  next();
});

app.options('*', (_req, res) => res.sendStatus(204));

// Body parser - skip for raw MCP/SSE endpoints
app.use((req, _res, next) => {
  if (req.path === '/mcp' || req.path === '/sse' || req.path === '/messages') return next();
  express.json()(req, _res, next);
});

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: VERSION, service: 'vercel-mcp-server' });
});

// ── Full OAuth 2.1 surface (auto-approve, token-based passthrough) ──────────

// OAuth Protected Resource Metadata
app.get('/.well-known/oauth-protected-resource', (_req, res) => {
  res.json({
    resource: BASE_URL,
    authorization_servers: [BASE_URL],
    bearer_methods_supported: ['header'],
    scopes_supported: ['mcp'],
  });
});

// OAuth Authorization Server Metadata
app.get('/.well-known/oauth-authorization-server', (_req, res) => {
  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/authorize`,
    token_endpoint: `${BASE_URL}/token`,
    registration_endpoint: `${BASE_URL}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256', 'plain'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['mcp'],
  });
});

// OpenID Connect discovery (some clients check this)
app.get('/.well-known/openid-configuration', (_req, res) => {
  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/authorize`,
    token_endpoint: `${BASE_URL}/token`,
    registration_endpoint: `${BASE_URL}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    scopes_supported: ['mcp'],
  });
});

// Dynamic Client Registration
app.post('/register', (req, res) => {
  const meta = req.body || {};
  res.status(201).json({
    client_id: 'vercel-mcp-client',
    client_id_issued_at: Math.floor(Date.now() / 1000),
    token_endpoint_auth_method: 'none',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    redirect_uris: Array.isArray(meta.redirect_uris) ? meta.redirect_uris : [],
  });
});

// Authorization endpoint - auto-approve, bounce back with code
app.get('/authorize', (req, res) => {
  const redirectUri = req.query.redirect_uri as string;
  const state = (req.query.state as string) || '';
  if (!redirectUri) {
    res.status(400).json({ error: 'invalid_request', error_description: 'redirect_uri required' });
    return;
  }
  const loc = new URL(redirectUri);
  loc.searchParams.set('code', 'vercel-mcp-auth-code');
  if (state) loc.searchParams.set('state', state);
  res.redirect(302, loc.toString());
});

// Token endpoint - issue long-lived bearer
app.post('/token', (_req, res) => {
  res.json({
    access_token: 'vercel-mcp-token',
    token_type: 'Bearer',
    expires_in: 315360000,
    refresh_token: 'vercel-mcp-refresh',
    scope: 'mcp',
  });
});

// ── MCP Transports ──────────────────────────────────────────────────────────

// Streamable HTTP (modern MCP)
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

// SSE transport (Claude.ai connectors)
const sseTransports: Record<string, SSEServerTransport> = {};

app.get('/sse', async (_req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  sseTransports[transport.sessionId] = transport;
  res.on('close', () => {
    delete sseTransports[transport.sessionId];
  });
  const server = createMcpServer();
  await server.connect(transport);
});

app.post('/messages', express.json(), async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = sseTransports[sessionId];
  if (!transport) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  await transport.handlePostMessage(req, res);
});

// ────────────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.error(`Vercel MCP Server v${VERSION} running on port ${PORT}`);
  console.error(`SSE: ${BASE_URL}/sse`);
  console.error(`MCP: ${BASE_URL}/mcp`);
});
