import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerDomainTools(server: McpServer): void {

  server.registerTool(
    'vercel_list_domains',
    {
      title: 'List Domains',
      description: 'List all domains registered for the authenticated user or team.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(20).describe('Number of domains to return'),
        since: z.number().optional().describe('Pagination cursor (timestamp)'),
        until: z.number().optional().describe('End pagination cursor (timestamp)'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await vercelRequest('/v5/domains', { params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_domain',
    {
      title: 'Get Domain',
      description: 'Get details for a specific domain.',
      inputSchema: {
        domain: z.string().describe('Domain name (e.g. example.com)'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ domain }) => {
      const data = await vercelRequest(`/v5/domains/${domain}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_add_domain',
    {
      title: 'Add Domain',
      description: 'Add a domain to the authenticated user or team account.',
      inputSchema: {
        name: z.string().describe('Domain name to add (e.g. example.com)'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ name }) => {
      const data = await vercelRequest('/v5/domains', { method: 'POST', body: { name } });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_delete_domain',
    {
      title: 'Delete Domain',
      description: 'Delete a domain from the authenticated user or team account.',
      inputSchema: {
        domain: z.string().describe('Domain name to delete'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ domain }) => {
      await vercelRequest(`/v6/domains/${domain}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: `Domain "${domain}" deleted successfully.` }] };
    }
  );

  server.registerTool(
    'vercel_check_domain_config',
    {
      title: 'Check Domain Config',
      description: 'Check the configuration status of a domain (DNS propagation, certificate status, etc.).',
      inputSchema: {
        domain: z.string().describe('Domain name to check'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ domain }) => {
      const data = await vercelRequest(`/v6/domains/${domain}/config`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_verify_domain',
    {
      title: 'Verify Domain',
      description: 'Attempt to verify domain ownership.',
      inputSchema: {
        domain: z.string().describe('Domain name to verify'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ domain }) => {
      const data = await vercelRequest(`/v5/domains/${domain}/verify`, { method: 'POST' });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_transfer_domain',
    {
      title: 'Transfer Domain In',
      description: 'Transfer in a domain from another registrar to Vercel.',
      inputSchema: {
        name: z.string().describe('Domain name to transfer'),
        authCode: z.string().describe('Transfer authorization code from current registrar'),
        expectedPrice: z.number().optional().describe('Expected price for the transfer in USD'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (params) => {
      const data = await vercelRequest('/v4/domains', { method: 'POST', body: params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_buy_domain',
    {
      title: 'Purchase Domain',
      description: 'Purchase a domain through Vercel registrar.',
      inputSchema: {
        name: z.string().describe('Domain name to purchase'),
        expectedPrice: z.number().optional().describe('Expected price to pay in USD (validation check)'),
        renew: z.boolean().optional().describe('Auto-renew the domain'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (params) => {
      const data = await vercelRequest('/v4/domains/buy', { method: 'POST', body: params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_check_domain_price',
    {
      title: 'Check Domain Price',
      description: 'Check the price to purchase or renew a domain.',
      inputSchema: {
        name: z.string().describe('Domain name to check pricing for'),
        type: z.enum(['new', 'renewal']).default('new').describe('Type: new purchase or renewal'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await vercelRequest('/v4/domains/price', { params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );
}
