import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerWebhookTools(server: McpServer): void {

  server.registerTool(
    'vercel_list_webhooks',
    {
      title: 'List Webhooks',
      description: 'List all webhooks configured for the authenticated user or team.',
      inputSchema: {
        projectId: z.string().optional().describe('Filter webhooks by project ID'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ projectId }) => {
      const data = await vercelRequest('/v1/webhooks', { params: { projectId } });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_webhook',
    {
      title: 'Get Webhook',
      description: 'Get details of a specific webhook.',
      inputSchema: {
        webhookId: z.string().describe('Webhook ID'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ webhookId }) => {
      const data = await vercelRequest(`/v1/webhooks/${webhookId}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_create_webhook',
    {
      title: 'Create Webhook',
      description: 'Create a new webhook to receive event notifications from Vercel.',
      inputSchema: {
        url: z.string().url().describe('URL to receive webhook POST requests'),
        events: z.array(z.string()).describe('Events to subscribe to (e.g. ["deployment.created", "deployment.ready", "deployment.error"])'),
        projectIds: z.array(z.string()).optional().describe('Limit webhook to specific project IDs'),
        secret: z.string().optional().describe('Secret to verify webhook signatures'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (params) => {
      const data = await vercelRequest('/v1/webhooks', { method: 'POST', body: params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_delete_webhook',
    {
      title: 'Delete Webhook',
      description: 'Delete a webhook.',
      inputSchema: {
        webhookId: z.string().describe('Webhook ID to delete'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ webhookId }) => {
      await vercelRequest(`/v1/webhooks/${webhookId}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: `Webhook "${webhookId}" deleted successfully.` }] };
    }
  );
}
