import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { vercelRequest, formatJson } from '../services/vercel.js';

export function registerTeamTools(server: McpServer): void {

  server.registerTool(
    'vercel_list_teams',
    {
      title: 'List Teams',
      description: 'List all teams the authenticated user belongs to.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(20).describe('Number of teams to return'),
        since: z.number().optional().describe('Pagination cursor'),
        until: z.number().optional().describe('End pagination cursor'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (params) => {
      const data = await vercelRequest('/v2/teams', { params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_get_team',
    {
      title: 'Get Team',
      description: 'Get details of a specific team by ID.',
      inputSchema: {
        teamId: z.string().describe('Team ID'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ teamId }) => {
      const data = await vercelRequest(`/v2/teams/${teamId}`);
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_list_team_members',
    {
      title: 'List Team Members',
      description: 'List members of a team.',
      inputSchema: {
        teamId: z.string().describe('Team ID'),
        limit: z.number().int().min(1).max(100).default(20).describe('Number of members to return'),
        search: z.string().optional().describe('Search by member name or email'),
        role: z.enum(['OWNER', 'MEMBER', 'DEVELOPER', 'BILLING', 'VIEWER', 'CONTRIBUTOR']).optional().describe('Filter by role'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ teamId, ...params }) => {
      const data = await vercelRequest(`/v2/teams/${teamId}/members`, { params });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_invite_team_member',
    {
      title: 'Invite Team Member',
      description: 'Invite a user to join a team.',
      inputSchema: {
        teamId: z.string().describe('Team ID'),
        email: z.string().email().describe('Email address to invite'),
        role: z.enum(['OWNER', 'MEMBER', 'DEVELOPER', 'BILLING', 'VIEWER', 'CONTRIBUTOR']).default('MEMBER').describe('Role to assign'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ teamId, ...body }) => {
      const data = await vercelRequest(`/v1/teams/${teamId}/members`, {
        method: 'POST',
        body,
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );

  server.registerTool(
    'vercel_remove_team_member',
    {
      title: 'Remove Team Member',
      description: 'Remove a member from a team.',
      inputSchema: {
        teamId: z.string().describe('Team ID'),
        userId: z.string().describe('User ID to remove'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ teamId, userId }) => {
      await vercelRequest(`/v1/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
      return { content: [{ type: 'text', text: `User "${userId}" removed from team "${teamId}".` }] };
    }
  );

  server.registerTool(
    'vercel_update_team_member',
    {
      title: 'Update Team Member Role',
      description: 'Update the role of a team member.',
      inputSchema: {
        teamId: z.string().describe('Team ID'),
        userId: z.string().describe('User ID to update'),
        role: z.enum(['OWNER', 'MEMBER', 'DEVELOPER', 'BILLING', 'VIEWER', 'CONTRIBUTOR']).describe('New role to assign'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ teamId, userId, role }) => {
      const data = await vercelRequest(`/v1/teams/${teamId}/members/${userId}`, {
        method: 'PATCH',
        body: { role },
      });
      return { content: [{ type: 'text', text: formatJson(data) }] };
    }
  );
}
