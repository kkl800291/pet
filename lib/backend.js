import { cookies } from 'next/headers';

export function getBackendBaseUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
}

export async function backendFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.withCookies) {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      headers.set('cookie', cookieHeader);
    }
  }

  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body,
    cache: options.cache || 'no-store',
    redirect: options.redirect || 'manual'
  });
  return response;
}

export async function backendJson(path, options = {}) {
  const response = await backendFetch(path, options);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  return { response, payload };
}
