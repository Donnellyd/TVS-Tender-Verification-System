export function getPortalToken(): string | null {
  return localStorage.getItem('vendorPortalToken');
}

export function setPortalToken(token: string) {
  localStorage.setItem('vendorPortalToken', token);
}

export function clearPortalToken() {
  localStorage.removeItem('vendorPortalToken');
}

export async function portalFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getPortalToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearPortalToken();
    window.location.href = '/portal';
  }
  return res;
}

export async function portalApi(method: string, url: string, data?: unknown): Promise<Response> {
  const res = await portalFetch(url, {
    method,
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || `${res.status}: ${text}`);
    } catch (e) {
      if (e instanceof Error && e.message !== text) throw e;
      throw new Error(`${res.status}: ${text}`);
    }
  }
  return res;
}
