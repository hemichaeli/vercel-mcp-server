import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerAliasTools(server: McpServer): void {

  server.registerTool(
    'vercel_list_aliases',
    {
      title: 'List Aliases',
      description: 'List all aliases (custom domains/URLs) for the authenticated user or a specific deployment.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(20).describe('Number of aliases to return'),
        projectId: z.string().optional().describe('Filter by project ID'),
        domain: z.string().optional().describe('Filter by domain'),
        since: z.number().optional().describe('Pagination cursor (timestamp)'),
        until: z.number().optional().describe('End pagination cursor (timestamp)'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await vercelRequest('/v4/aliases', { params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_alias',
    {
      title: 'Get Alias',
      description: 'Get details of a specific alias by ID or alias hostname.',
      inputSchema: {
        idOrAlias: z.string().describe('Alias ID or hostname (e.g. my-app.vercel.app)'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ idOrAlias }) => {
      const data = await vercelRequest(`/v4/aliases/${encodeURIComponent(idOrAlias)}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_assign_alias',
    {
      title: 'Assign Alias to Deployment',
      description: 'Assign an alias to a specific deployment.',
      inputSchema: {
        deploymentId: z.string().describe('Deployment ID to assign the alias to'),
        alias: z.string().describe('Alias hostname to assign (e.g. my-app.com or my-app.vercel.app)'),
        redirect: z.string().optional().describe('Target URL to redirect to instead'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ deploymentId, ...body }) => {
      const data = await vercelRequest(`/v2/deployments/${deploymentId}/aliases`, {
        method: 'POST',
        body,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_delete_alias',
    {
      title: 'Delete Alias',
      description: 'Delete an alias.',
      inputSchema: {
        aliasId: z.string().describe('Alias ID to delete'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ aliasId }) => {
      await vercelRequest(`/v2/aliases/${aliasId}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: `Alias "${aliasId}" deleted successfully.` }] };
    }
  );

  server.registerTool(
    'vercel_list_deployment_aliases',
    {
      title: 'List Deployment Aliases',
      description: 'List all aliases assigned to a specific deployment.',
      inputSchema: {
        deploymentId: z.string().describe('Deployment ID'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ deploymentId }) => {
      const data = await vercelRequest(`/v2/deployments/${deploymentId}/aliases`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );
}
