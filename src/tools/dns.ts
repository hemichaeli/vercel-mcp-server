import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerDnsTools(server: McpServer): void {

  server.registerTool(
    'vercel_list_dns_records',
    {
      title: 'List DNS Records',
      description: 'List all DNS records for a domain managed by Vercel.',
      inputSchema: {
        domain: z.string().describe('Domain name'),
        limit: z.number().int().min(1).max(100).default(20).describe('Number of records to return'),
        since: z.number().optional().describe('Pagination cursor'),
        until: z.number().optional().describe('End pagination cursor'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ domain, ...params }) => {
      const data = await vercelRequest(`/v4/domains/${domain}/records`, { params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_create_dns_record',
    {
      title: 'Create DNS Record',
      description: 'Create a DNS record for a domain managed by Vercel.',
      inputSchema: {
        domain: z.string().describe('Domain name to create record for'),
        name: z.string().describe('Subdomain name (use @ for root)'),
        type: z.enum(['A', 'AAAA', 'ALIAS', 'CAA', 'CNAME', 'MX', 'SRV', 'TXT', 'NS']).describe('DNS record type'),
        value: z.string().describe('Record value (IP address for A, hostname for CNAME, etc.)'),
        ttl: z.number().int().optional().describe('Time to live in seconds (default: 60)'),
        mxPriority: z.number().int().optional().describe('MX record priority (only for MX type)'),
        srv: z.object({
          priority: z.number().int(),
          weight: z.number().int(),
          port: z.number().int(),
          target: z.string(),
        }).optional().describe('SRV record data (only for SRV type)'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ domain, ...body }) => {
      const data = await vercelRequest(`/v2/domains/${domain}/records`, {
        method: 'POST',
        body,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_update_dns_record',
    {
      title: 'Update DNS Record',
      description: 'Update an existing DNS record for a domain.',
      inputSchema: {
        domain: z.string().describe('Domain name'),
        recordId: z.string().describe('DNS record ID to update'),
        name: z.string().optional().describe('Subdomain name'),
        value: z.string().optional().describe('New record value'),
        ttl: z.number().int().optional().describe('Time to live in seconds'),
        mxPriority: z.number().int().optional().describe('MX record priority'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ domain, recordId, ...body }) => {
      const data = await vercelRequest(`/v1/domains/${domain}/records/${recordId}`, {
        method: 'PATCH',
        body,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_delete_dns_record',
    {
      title: 'Delete DNS Record',
      description: 'Delete a DNS record from a domain.',
      inputSchema: {
        domain: z.string().describe('Domain name'),
        recordId: z.string().describe('DNS record ID to delete'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ domain, recordId }) => {
      await vercelRequest(`/v2/domains/${domain}/records/${recordId}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: `DNS record "${recordId}" deleted from "${domain}".` }] };
    }
  );
}
