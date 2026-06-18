import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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

const VERSION = '1.3.0';
const PORT = parseInt(process.env.PORT || '3000', 10);
const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : (process.env.BASE_URL || 'https://vercel-mcp-server-production-a2d9.up.railway.app');

const transports: Record<string, SSEServerTransport> = {};

function buildMcpServer(): McpServer {
  const server = new McpServer({ name: 'vercel-mcp-server', version: VERSION });
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

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(json);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let b = '';
    req.setEncoding('utf8');
    req.on('data', (c) => { b += c; });
    req.on('end', () => resolve(b));
    req.on('error', () => resolve(b));
  });
}

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const path = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Health
  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, {
      status: 'ok', version: VERSION, service: 'vercel-mcp-server',
      activeSessions: Object.keys(transports).length,
    });
    return;
  }

  // ── OAuth 2.1 auto-approve surface ────────────────────────────────────────

  if (req.method === 'GET' && (
    path === '/.well-known/oauth-protected-resource' ||
    path === '/.well-known/oauth-protected-resource/mcp'
  )) {
    sendJson(res, 200, {
      resource: BASE_URL,
      authorization_servers: [BASE_URL],
      bearer_methods_supported: ['header'],
      scopes_supported: ['mcp'],
    });
    return;
  }

  if (req.method === 'GET' && (
    path === '/.well-known/oauth-authorization-server' ||
    path === '/.well-known/openid-configuration'
  )) {
    sendJson(res, 200, {
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
    return;
  }

  if (req.method === 'POST' && path === '/register') {
    let meta: Record<string, unknown> = {};
    try { meta = JSON.parse(await readBody(req) || '{}'); } catch { /* ignore */ }
    sendJson(res, 201, {
      client_id: 'vercel-mcp-client',
      client_id_issued_at: Math.floor(Date.now() / 1000),
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      redirect_uris: Array.isArray(meta.redirect_uris) ? meta.redirect_uris : [],
    });
    return;
  }

  if (req.method === 'GET' && path === '/authorize') {
    const redirectUri = url.searchParams.get('redirect_uri');
    const state = url.searchParams.get('state') || '';
    if (!redirectUri) { sendJson(res, 400, { error: 'invalid_request', error_description: 'redirect_uri required' }); return; }
    const loc = new URL(redirectUri);
    loc.searchParams.set('code', 'vercel-mcp-auth-code');
    if (state) loc.searchParams.set('state', state);
    res.writeHead(302, { Location: loc.toString(), 'Cache-Control': 'no-store' });
    res.end();
    return;
  }

  if (req.method === 'POST' && path === '/token') {
    await readBody(req);
    sendJson(res, 200, {
      access_token: 'vercel-mcp-token',
      token_type: 'Bearer',
      expires_in: 315360000,
      refresh_token: 'vercel-mcp-refresh',
      scope: 'mcp',
    });
    return;
  }

  // ── SSE transport ─────────────────────────────────────────────────────────

  if (req.method === 'GET' && path === '/sse') {
    console.error('[Vercel MCP] New SSE connection');
    try {
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;
      transports[sessionId] = transport;
      console.error(`[Vercel MCP] Transport created: ${sessionId}`);

      req.on('close', () => {
        console.error(`[Vercel MCP] Request closed: ${sessionId}`);
        delete transports[sessionId];
      });

      const server = buildMcpServer();
      await server.connect(transport);
      console.error(`[Vercel MCP] Connected: ${sessionId}`);
    } catch (error) {
      console.error('[Vercel MCP] SSE error:', error instanceof Error ? error.message : String(error));
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'SSE connection failed' });
      }
    }
    return;
  }

  if (req.method === 'POST' && path === '/messages') {
    const sessionId = url.searchParams.get('sessionId') || '';
    const transport = transports[sessionId];
    if (!transport) { sendJson(res, 404, { error: `No session: ${sessionId}` }); return; }
    try {
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error('[Vercel MCP] Post error:', error instanceof Error ? error.message : String(error));
      if (!res.headersSent) sendJson(res, 500, { error: 'Message handling failed' });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

httpServer.listen(PORT, () => {
  console.error(`[Vercel MCP] v${VERSION} on port ${PORT}`);
  console.error(`[Vercel MCP] SSE: ${BASE_URL}/sse`);
});
