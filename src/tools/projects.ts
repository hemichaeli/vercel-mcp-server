import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerProjectTools(server: McpServer): void {

  server.registerTool(
    'vercel_list_projects',
    {
      title: 'List Projects',
      description: 'List all projects for the authenticated user or team.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(20).describe('Number of projects to return'),
        from: z.number().optional().describe('Timestamp for pagination cursor'),
        search: z.string().optional().describe('Search query to filter projects'),
        repoUrl: z.string().optional().describe('Filter by connected git repository URL'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await vercelRequest('/v9/projects', { params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_project',
    {
      title: 'Get Project',
      description: 'Get details of a specific project by ID or name.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ idOrName }) => {
      const data = await vercelRequest(`/v9/projects/${encodeURIComponent(idOrName)}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_create_project',
    {
      title: 'Create Project',
      description: 'Create a new Vercel project with optional Git repository integration.',
      inputSchema: {
        name: z.string().min(1).max(100).describe('Project name'),
        framework: z.string().optional().describe('Framework preset (e.g. nextjs, gatsby, nuxtjs)'),
        buildCommand: z.string().optional().describe('Custom build command'),
        outputDirectory: z.string().optional().describe('Custom output directory'),
        installCommand: z.string().optional().describe('Custom install command'),
        devCommand: z.string().optional().describe('Custom dev command'),
        rootDirectory: z.string().optional().describe('Root directory of the project in the repository'),
        gitRepository: z.object({
          type: z.enum(['github', 'gitlab', 'bitbucket']),
          repo: z.string().describe('Repository name (owner/repo)'),
        }).optional().describe('Git repository to connect'),
        publicSource: z.boolean().optional().describe('Allow public access to source code'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (params) => {
      const data = await vercelRequest('/v9/projects', { method: 'POST', body: params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_update_project',
    {
      title: 'Update Project',
      description: 'Update a project settings including framework, build configuration, and more.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name to update'),
        name: z.string().optional().describe('New project name'),
        framework: z.string().optional().describe('Framework preset'),
        buildCommand: z.string().nullable().optional().describe('Custom build command (null to reset)'),
        outputDirectory: z.string().nullable().optional().describe('Custom output directory (null to reset)'),
        installCommand: z.string().nullable().optional().describe('Custom install command (null to reset)'),
        devCommand: z.string().nullable().optional().describe('Custom dev command (null to reset)'),
        rootDirectory: z.string().nullable().optional().describe('Root directory (null to reset)'),
        publicSource: z.boolean().optional().describe('Allow public access to source code'),
        serverlessFunctionRegion: z.string().optional().describe('Default region for serverless functions'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ idOrName, ...body }) => {
      const data = await vercelRequest(`/v9/projects/${encodeURIComponent(idOrName)}`, {
        method: 'PATCH',
        body,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_delete_project',
    {
      title: 'Delete Project',
      description: 'Delete a project and all its deployments.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name to delete'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ idOrName }) => {
      await vercelRequest(`/v9/projects/${encodeURIComponent(idOrName)}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: `Project "${idOrName}" deleted successfully.` }] };
    }
  );

  server.registerTool(
    'vercel_list_project_domains',
    {
      title: 'List Project Domains',
      description: 'List all domains assigned to a specific project.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name'),
        limit: z.number().int().min(1).max(100).default(20).describe('Number of domains to return'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ idOrName, limit }) => {
      const data = await vercelRequest(`/v9/projects/${encodeURIComponent(idOrName)}/domains`, {
        params: { limit },
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_add_project_domain',
    {
      title: 'Add Domain to Project',
      description: 'Add a domain to a project.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name'),
        name: z.string().describe('Domain name to add (e.g. my-app.com)'),
        gitBranch: z.string().optional().describe('Git branch to assign this domain to'),
        redirect: z.string().optional().describe('Target domain if this domain should redirect'),
        redirectStatusCode: z.number().optional().describe('HTTP redirect status code (301, 302, 307, 308)'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ idOrName, ...body }) => {
      const data = await vercelRequest(`/v9/projects/${encodeURIComponent(idOrName)}/domains`, {
        method: 'POST',
        body,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_remove_project_domain',
    {
      title: 'Remove Domain from Project',
      description: 'Remove a domain from a project.',
      inputSchema: {
        idOrName: z.string().describe('Project ID or name'),
        domain: z.string().describe('Domain name to remove'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ idOrName, domain }) => {
      await vercelRequest(`/v9/projects/${encodeURIComponent(idOrName)}/domains/${domain}`, {
        method: 'DELETE',
      });
      return { content: [{ type: 'text', text: `Domain "${domain}" removed from project "${idOrName}".` }] };
    }
  );
}
