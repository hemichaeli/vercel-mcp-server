import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerDeploymentTools(server: McpServer): void {

  server.registerTool(
    'vercel_list_deployments',
    {
      title: 'List Deployments',
      description: 'List deployments for the authenticated user or a specific project. Supports filtering by project name, state, and target environment.',
      inputSchema: {
        app: z.string().optional().describe('Project name filter'),
        limit: z.number().int().min(1).max(100).default(20).describe('Number of results (max 100)'),
        projectId: z.string().optional().describe('Filter by project ID'),
        state: z.enum(['BUILDING', 'ERROR', 'INITIALIZING', 'QUEUED', 'READY', 'CANCELED']).optional().describe('Filter by deployment state'),
        target: z.enum(['production', 'staging', 'preview']).optional().describe('Filter by target environment'),
        since: z.number().optional().describe('Unix timestamp in ms - deployments created after this time'),
        until: z.number().optional().describe('Unix timestamp in ms - deployments created before this time'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (params) => {
      const data = await vercelRequest('/v6/deployments', {
        params: {
          app: params.app,
          limit: params.limit,
          projectId: params.projectId,
          state: params.state,
          target: params.target,
          since: params.since,
          until: params.until,
        },
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_deployment',
    {
      title: 'Get Deployment',
      description: 'Get details of a specific deployment by ID or URL.',
      inputSchema: {
        idOrUrl: z.string().describe('Deployment ID (e.g. dpl_xxx) or deployment URL'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ idOrUrl }) => {
      const data = await vercelRequest(`/v13/deployments/${encodeURIComponent(idOrUrl)}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_cancel_deployment',
    {
      title: 'Cancel Deployment',
      description: 'Cancel a deployment that is currently building or queued.',
      inputSchema: {
        id: z.string().describe('Deployment ID to cancel'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ id }) => {
      const data = await vercelRequest(`/v12/deployments/${id}/cancel`, { method: 'PATCH' });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_delete_deployment',
    {
      title: 'Delete Deployment',
      description: 'Delete a specific deployment by ID.',
      inputSchema: {
        id: z.string().describe('Deployment ID to delete'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ id }) => {
      const data = await vercelRequest(`/v13/deployments/${id}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_deployment_events',
    {
      title: 'Get Deployment Build Events',
      description: 'Retrieve the build logs/events for a specific deployment.',
      inputSchema: {
        id: z.string().describe('Deployment ID'),
        limit: z.number().int().min(1).max(2000).default(100).describe('Number of log entries'),
        since: z.number().optional().describe('Unix timestamp in ms for pagination'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ id, limit, since }) => {
      const data = await vercelRequest(`/v2/deployments/${id}/events`, {
        params: { limit, since },
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_deployment_files',
    {
      title: 'List Deployment Files',
      description: 'List all files of a specific deployment.',
      inputSchema: {
        id: z.string().describe('Deployment ID'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ id }) => {
      const data = await vercelRequest(`/v6/deployments/${id}/files`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_create_deployment',
    {
      title: 'Create Deployment',
      description: 'Create a new deployment from a Git repository or file uploads. Provide name and gitSource for git-based deployments.',
      inputSchema: {
        name: z.string().describe('Project name for the deployment'),
        target: z.enum(['production', 'staging', 'preview']).optional().describe('Target environment'),
        regions: z.array(z.string()).optional().describe('Deployment regions (e.g. ["iad1"])'),
        gitSource: z.object({
          type: z.enum(['github', 'gitlab', 'bitbucket']),
          repoId: z.string().optional(),
          ref: z.string().optional().describe('Branch or commit ref'),
          sha: z.string().optional(),
        }).optional().describe('Git source configuration'),
        projectSettings: z.object({
          buildCommand: z.string().optional(),
          outputDirectory: z.string().optional(),
          framework: z.string().optional(),
          installCommand: z.string().optional(),
        }).optional().describe('Override project build settings'),
        meta: z.record(z.string()).optional().describe('Metadata key-value pairs'),
        forceNew: z.boolean().optional().describe('Force a new deployment even if identical exists'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (params) => {
      const data = await vercelRequest('/v13/deployments', {
        method: 'POST',
        body: params,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );
}
