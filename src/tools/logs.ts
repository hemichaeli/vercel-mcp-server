import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerLogTools(server: McpServer): void {

  server.registerTool(
    'vercel_get_deployment_logs',
    {
      title: 'Get Deployment Runtime Logs',
      description: 'Retrieve runtime logs for a deployment via the Vercel Logs API.',
      inputSchema: {
        deploymentId: z.string().describe('Deployment ID to retrieve logs for'),
        limit: z.number().int().min(1).max(5000).default(100).describe('Number of log entries to return'),
        since: z.number().optional().describe('Unix timestamp in ms - return logs after this time'),
        until: z.number().optional().describe('Unix timestamp in ms - return logs before this time'),
        statusCode: z.string().optional().describe('Filter by HTTP status code'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ deploymentId, ...params }) => {
      const data = await vercelRequest(`/v2/deployments/${deploymentId}/events`, { params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );
}
