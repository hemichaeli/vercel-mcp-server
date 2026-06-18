import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerUserTools(server: McpServer): void {

  server.registerTool(
    'vercel_get_user',
    {
      title: 'Get Current User',
      description: 'Get details of the currently authenticated user.',
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const data = await vercelRequest('/v2/user');
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_list_auth_tokens',
    {
      title: 'List Authentication Tokens',
      description: 'List all authentication tokens for the authenticated user.',
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const data = await vercelRequest('/v3/user/tokens');
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_auth_token',
    {
      title: 'Get Authentication Token',
      description: 'Get details of a specific authentication token.',
      inputSchema: {
        tokenId: z.string().describe('Token ID to retrieve'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ tokenId }) => {
      const data = await vercelRequest(`/v3/user/tokens/${tokenId}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_delete_auth_token',
    {
      title: 'Delete Authentication Token',
      description: 'Revoke an authentication token.',
      inputSchema: {
        tokenId: z.string().describe('Token ID to revoke'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ tokenId }) => {
      await vercelRequest(`/v3/user/tokens/${tokenId}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: `Token "${tokenId}" revoked successfully.` }] };
    }
  );
}
