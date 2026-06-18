import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerEnvTools(server: McpServer): void {

  server.registerTool(
    'vercel_list_env_vars',
    {
      title: 'List Environment Variables',
      description: 'List all environment variables for a project.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name'),
        decrypt: z.boolean().optional().describe('Decrypt secret values in the response'),
        gitBranch: z.string().optional().describe('Filter by git branch'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ idOrName, decrypt, gitBranch }) => {
      const data = await vercelRequest(`/v9/projects/${encodeURIComponent(idOrName)}/env`, {
        params: { decrypt, gitBranch },
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_env_var',
    {
      title: 'Get Environment Variable',
      description: 'Get a specific environment variable by ID for a project.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name'),
        envId: z.string().describe('Environment variable ID'),
        decrypt: z.boolean().optional().describe('Decrypt secret value'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ idOrName, envId, decrypt }) => {
      const data = await vercelRequest(`/v1/projects/${encodeURIComponent(idOrName)}/env/${envId}`, {
        params: { decrypt },
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_create_env_var',
    {
      title: 'Create Environment Variable',
      description: 'Create one or more environment variables for a project.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name'),
        key: z.string().describe('Environment variable key'),
        value: z.string().describe('Environment variable value'),
        type: z.enum(['plain', 'encrypted', 'secret', 'sensitive']).default('encrypted').describe('Type of the env var'),
        target: z.array(z.enum(['production', 'preview', 'development'])).describe('Deployment targets for this variable'),
        gitBranch: z.string().optional().describe('Specific git branch (only for preview target)'),
        comment: z.string().optional().describe('Optional comment/note for the variable'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ idOrName, ...body }) => {
      const data = await vercelRequest(`/v10/projects/${encodeURIComponent(idOrName)}/env`, {
        method: 'POST',
        body,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_update_env_var',
    {
      title: 'Update Environment Variable',
      description: 'Update an existing environment variable for a project.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name'),
        envId: z.string().describe('Environment variable ID to update'),
        key: z.string().optional().describe('New key name'),
        value: z.string().optional().describe('New value'),
        type: z.enum(['plain', 'encrypted', 'secret', 'sensitive']).optional().describe('Type of the env var'),
        target: z.array(z.enum(['production', 'preview', 'development'])).optional().describe('Deployment targets'),
        gitBranch: z.string().optional().describe('Specific git branch'),
        comment: z.string().optional().describe('Optional comment/note'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ idOrName, envId, ...body }) => {
      const data = await vercelRequest(`/v9/projects/${encodeURIComponent(idOrName)}/env/${envId}`, {
        method: 'PATCH',
        body,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_delete_env_var',
    {
      title: 'Delete Environment Variable',
      description: 'Delete an environment variable from a project.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name'),
        envId: z.string().describe('Environment variable ID to delete'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ idOrName, envId }) => {
      await vercelRequest(`/v9/projects/${encodeURIComponent(idOrName)}/env/${envId}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: `Environment variable "${envId}" deleted successfully.` }] };
    }
  );
}
