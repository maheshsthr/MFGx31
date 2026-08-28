const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function api(pathname, options = {}) {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export default api;
