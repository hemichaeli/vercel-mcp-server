const VERCEL_API_BASE = 'https://api.vercel.com';

export interface VercelApiOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function vercelRequest<T>(
  path: string,
  options: VercelApiOptions = {}
): Promise<T> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('VERCEL_TOKEN environment variable is not set');
  }

  const { method = 'GET', body, params = {} } = options;

  const teamId = process.env.VERCEL_TEAM_ID;
  if (teamId) params['teamId'] = teamId;

  const filteredParams = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null
  );
  const queryString =
    filteredParams.length > 0
      ? '?' + new URLSearchParams(filteredParams.map(([k, v]) => [k, String(v)])).toString()
      : '';

  const url = `${VERCEL_API_BASE}${path}${queryString}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    let errorMessage = `Vercel API error ${response.status}: ${response.statusText}`;
    try {
      const errBody = await response.json() as { error?: { message?: string } };
      if (errBody?.error?.message) {
        errorMessage += ` - ${errBody.error.message}`;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
