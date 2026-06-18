# Vercel MCP Server

Full-featured MCP (Model Context Protocol) server for the [Vercel REST API](https://vercel.com/docs/rest-api), covering all major resource types.

## Tools (57 total)

### Deployments (7)
- `vercel_list_deployments` - List deployments with filtering
- `vercel_get_deployment` - Get deployment details
- `vercel_create_deployment` - Create a new deployment from Git
- `vercel_cancel_deployment` - Cancel a running deployment
- `vercel_delete_deployment` - Delete a deployment
- `vercel_get_deployment_events` - Get build logs/events
- `vercel_get_deployment_files` - List deployment files

### Projects (8)
- `vercel_list_projects` - List all projects
- `vercel_get_project` - Get project details
- `vercel_create_project` - Create a new project
- `vercel_update_project` - Update project settings
- `vercel_delete_project` - Delete a project
- `vercel_list_project_domains` - List project domains
- `vercel_add_project_domain` - Add domain to project
- `vercel_remove_project_domain` - Remove domain from project

### Environment Variables (5)
- `vercel_list_env_vars` - List env vars for a project
- `vercel_get_env_var` - Get specific env var
- `vercel_create_env_var` - Create env var
- `vercel_update_env_var` - Update env var
- `vercel_delete_env_var` - Delete env var

### Domains (9)
- `vercel_list_domains` - List all domains
- `vercel_get_domain` - Get domain details
- `vercel_add_domain` - Add domain to account
- `vercel_delete_domain` - Delete domain
- `vercel_check_domain_config` - Check DNS/certificate status
- `vercel_verify_domain` - Verify domain ownership
- `vercel_transfer_domain` - Transfer domain in
- `vercel_buy_domain` - Purchase domain
- `vercel_check_domain_price` - Check domain pricing

### DNS (4)
- `vercel_list_dns_records` - List DNS records for a domain
- `vercel_create_dns_record` - Create DNS record (A, CNAME, MX, TXT, etc.)
- `vercel_update_dns_record` - Update DNS record
- `vercel_delete_dns_record` - Delete DNS record

### Teams (6)
- `vercel_list_teams` - List teams
- `vercel_get_team` - Get team details
- `vercel_list_team_members` - List team members
- `vercel_invite_team_member` - Invite member to team
- `vercel_remove_team_member` - Remove member from team
- `vercel_update_team_member` - Update member role

### Webhooks (4)
- `vercel_list_webhooks` - List webhooks
- `vercel_get_webhook` - Get webhook details
- `vercel_create_webhook` - Create webhook
- `vercel_delete_webhook` - Delete webhook

### Edge Config (9)
- `vercel_list_edge_configs` - List Edge Config stores
- `vercel_get_edge_config` - Get Edge Config details
- `vercel_create_edge_config` - Create Edge Config store
- `vercel_list_edge_config_items` - List items in Edge Config
- `vercel_get_edge_config_item` - Get specific item by key
- `vercel_update_edge_config_items` - Batch create/update/delete items
- `vercel_delete_edge_config` - Delete Edge Config store
- `vercel_list_edge_config_tokens` - List Edge Config tokens
- `vercel_create_edge_config_token` - Create read-only token

### Aliases (5)
- `vercel_list_aliases` - List aliases
- `vercel_get_alias` - Get alias details
- `vercel_assign_alias` - Assign alias to deployment
- `vercel_delete_alias` - Delete alias
- `vercel_list_deployment_aliases` - List aliases for a deployment

### User (4)
- `vercel_get_user` - Get current user
- `vercel_list_auth_tokens` - List auth tokens
- `vercel_get_auth_token` - Get auth token
- `vercel_delete_auth_token` - Revoke auth token

### Logs (1)
- `vercel_get_deployment_logs` - Get runtime logs

### Checks (5)
- `vercel_list_checks` - List deployment checks
- `vercel_get_check` - Get check details
- `vercel_create_check` - Create check (for integrations)
- `vercel_update_check` - Update check status/conclusion
- `vercel_rerequest_check` - Re-run a check

### Certificates (4)
- `vercel_get_cert` - Get SSL certificate
- `vercel_issue_cert` - Issue new SSL certificate
- `vercel_upload_cert` - Upload custom certificate
- `vercel_delete_cert` - Delete SSL certificate

## Setup

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VERCEL_TOKEN` | Yes | Vercel API access token |
| `VERCEL_TEAM_ID` | No | Team ID - automatically appended to all requests |
| `PORT` | No | HTTP port (default: 3000) |

### Railway Deployment

1. Deploy from GitHub to Railway
2. Set `VERCEL_TOKEN` environment variable
3. Optionally set `VERCEL_TEAM_ID` for team-scoped access

### SSE Endpoint

```
https://your-server.up.railway.app/sse
```

Connect in Claude.ai Settings under Connectors.
