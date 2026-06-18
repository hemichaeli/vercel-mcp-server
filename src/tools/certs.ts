import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerCertTools(server: McpServer): void {

  server.registerTool(
    'vercel_get_cert',
    {
      title: 'Get Certificate',
      description: 'Get details of an SSL certificate by ID.',
      inputSchema: {
        certId: z.string().describe('Certificate ID'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ certId }) => {
      const data = await vercelRequest(`/v7/certs/${certId}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_issue_cert',
    {
      title: 'Issue SSL Certificate',
      description: 'Issue a new SSL certificate for one or more domains.',
      inputSchema: {
        domains: z.array(z.string()).min(1).describe('List of domains to issue certificate for'),
        caId: z.string().optional().describe('Certificate Authority ID to use'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (params) => {
      const data = await vercelRequest('/v7/certs', { method: 'PUT', body: params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_upload_cert',
    {
      title: 'Upload Custom Certificate',
      description: 'Upload a custom SSL certificate for a domain.',
      inputSchema: {
        ca: z.string().describe('CA chain (PEM format)'),
        cert: z.string().describe('Certificate (PEM format)'),
        key: z.string().describe('Private key (PEM format)'),
        skipValidation: z.boolean().optional().describe('Skip certificate validation'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (params) => {
      const data = await vercelRequest('/v7/certs', { method: 'PUT', body: params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_delete_cert',
    {
      title: 'Delete Certificate',
      description: 'Delete an SSL certificate.',
      inputSchema: {
        certId: z.string().describe('Certificate ID to delete'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ certId }) => {
      await vercelRequest(`/v7/certs/${certId}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: `Certificate "${certId}" deleted successfully.` }] };
    }
  );
}
