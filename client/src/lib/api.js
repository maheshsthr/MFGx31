const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'mfgx31_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors */
  }
}

export function clearToken() {
  setToken(null);
}

/**
 * Thin fetch wrapper that:
 *  - prefixes the API base URL from VITE_API_BASE_URL,
 *  - attaches the stored JWT automatically,
 *  - throws a descriptive Error (with .status) on non-2xx.
 */
export async function api(pathname, options = {}) {
  const { headers, ...rest } = options;
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    if (response.status === 401) clearToken();
    throw error;
  }

  return response.json();
}

export default api;
