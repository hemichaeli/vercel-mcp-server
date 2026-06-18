import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerCheckTools(server: McpServer): void {

  server.registerTool(
    'vercel_list_checks',
    {
      title: 'List Deployment Checks',
      description: 'List all checks associated with a deployment.',
      inputSchema: {
        deploymentId: z.string().describe('Deployment ID'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ deploymentId }) => {
      const data = await vercelRequest(`/v1/deployments/${deploymentId}/checks`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_check',
    {
      title: 'Get Deployment Check',
      description: 'Get details of a specific check for a deployment.',
      inputSchema: {
        deploymentId: z.string().describe('Deployment ID'),
        checkId: z.string().describe('Check ID'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ deploymentId, checkId }) => {
      const data = await vercelRequest(`/v1/deployments/${deploymentId}/checks/${checkId}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_create_check',
    {
      title: 'Create Deployment Check',
      description: 'Create a new check for a deployment (used by integrations).',
      inputSchema: {
        deploymentId: z.string().describe('Deployment ID'),
        name: z.string().describe('Check name'),
        path: z.string().optional().describe('Path or URL associated with the check'),
        detailsUrl: z.string().url().optional().describe('URL for more details about this check'),
        blocking: z.boolean().optional().describe('If true, this check blocks the deployment from completing'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ deploymentId, ...body }) => {
      const data = await vercelRequest(`/v1/deployments/${deploymentId}/checks`, {
        method: 'POST',
        body,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_update_check',
    {
      title: 'Update Deployment Check',
      description: 'Update the status or conclusion of a deployment check.',
      inputSchema: {
        deploymentId: z.string().describe('Deployment ID'),
        checkId: z.string().describe('Check ID to update'),
        status: z.enum(['running', 'completed']).optional().describe('Check status'),
        conclusion: z.enum(['succeeded', 'failed', 'skipped', 'canceled']).optional().describe('Check conclusion (when status=completed)'),
        detailsUrl: z.string().url().optional().describe('URL for check details'),
        output: z.object({
          title: z.string().optional(),
          summary: z.string().optional(),
          text: z.string().optional(),
          metrics: z.record(z.unknown()).optional(),
        }).optional().describe('Check output data'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ deploymentId, checkId, ...body }) => {
      const data = await vercelRequest(`/v1/deployments/${deploymentId}/checks/${checkId}`, {
        method: 'PATCH',
        body,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_rerequest_check',
    {
      title: 'Re-request Deployment Check',
      description: 'Request a check to be re-run for a deployment.',
      inputSchema: {
        deploymentId: z.string().describe('Deployment ID'),
        checkId: z.string().describe('Check ID to re-run'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ deploymentId, checkId }) => {
      const data = await vercelRequest(`/v1/deployments/${deploymentId}/checks/${checkId}/rerequest`, {
        method: 'POST',
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );
}
