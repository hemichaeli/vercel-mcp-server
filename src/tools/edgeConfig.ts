import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerEdgeConfigTools(server: McpServer): void {

  server.registerTool(
    'vercel_list_edge_configs',
    {
      title: 'List Edge Configs',
      description: 'List all Edge Config stores for the authenticated user or team.',
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const data = await vercelRequest('/v1/edge-config');
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_edge_config',
    {
      title: 'Get Edge Config',
      description: 'Get details of a specific Edge Config store.',
      inputSchema: {
        edgeConfigId: z.string().describe('Edge Config ID (e.g. ecfg_xxx)'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ edgeConfigId }) => {
      const data = await vercelRequest(`/v1/edge-config/${edgeConfigId}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_create_edge_config',
    {
      title: 'Create Edge Config',
      description: 'Create a new Edge Config store.',
      inputSchema: {
        name: z.string().describe('Name for the Edge Config store'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ name }) => {
      const data = await vercelRequest('/v1/edge-config', { method: 'POST', body: { slug: name } });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_list_edge_config_items',
    {
      title: 'List Edge Config Items',
      description: 'List all items stored in an Edge Config.',
      inputSchema: {
        edgeConfigId: z.string().describe('Edge Config ID'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ edgeConfigId }) => {
      const data = await vercelRequest(`/v1/edge-config/${edgeConfigId}/items`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_edge_config_item',
    {
      title: 'Get Edge Config Item',
      description: 'Get a specific item from an Edge Config by key.',
      inputSchema: {
        edgeConfigId: z.string().describe('Edge Config ID'),
        itemKey: z.string().describe('Item key to retrieve'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ edgeConfigId, itemKey }) => {
      const data = await vercelRequest(`/v1/edge-config/${edgeConfigId}/item/${itemKey}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_update_edge_config_items',
    {
      title: 'Update Edge Config Items',
      description: 'Create, update, or delete items in an Edge Config using a batch operation.',
      inputSchema: {
        edgeConfigId: z.string().describe('Edge Config ID'),
        items: z.array(z.object({
          operation: z.enum(['create', 'update', 'delete']).describe('Operation to perform'),
          key: z.string().describe('Item key'),
          value: z.unknown().optional().describe('Item value (for create/update)'),
          description: z.string().optional().describe('Optional description'),
        })).describe('Array of item operations to perform'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ edgeConfigId, items }) => {
      const data = await vercelRequest(`/v1/edge-config/${edgeConfigId}/items`, {
        method: 'PATCH',
        body: { items },
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_delete_edge_config',
    {
      title: 'Delete Edge Config',
      description: 'Delete an Edge Config store.',
      inputSchema: {
        edgeConfigId: z.string().describe('Edge Config ID to delete'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ edgeConfigId }) => {
      await vercelRequest(`/v1/edge-config/${edgeConfigId}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: `Edge Config "${edgeConfigId}" deleted successfully.` }] };
    }
  );

  server.registerTool(
    'vercel_list_edge_config_tokens',
    {
      title: 'List Edge Config Tokens',
      description: 'List all tokens for an Edge Config store.',
      inputSchema: {
        edgeConfigId: z.string().describe('Edge Config ID'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ edgeConfigId }) => {
      const data = await vercelRequest(`/v1/edge-config/${edgeConfigId}/tokens`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_create_edge_config_token',
    {
      title: 'Create Edge Config Token',
      description: 'Create a read-only token for an Edge Config store.',
      inputSchema: {
        edgeConfigId: z.string().describe('Edge Config ID'),
        label: z.string().describe('Label for this token'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ edgeConfigId, label }) => {
      const data = await vercelRequest(`/v1/edge-config/${edgeConfigId}/token`, {
        method: 'POST',
        body: { label },
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );
}
