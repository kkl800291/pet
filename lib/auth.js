import { backendJson } from './backend.js';

export async function getCurrentOwner() {
  try {
    const { response, payload } = await backendJson('/api/me', { withCookies: true });
    if (!response.ok) return null;
    return payload?.owner || null;
  } catch {
    return null;
  }
}

export async function getCurrentAdmin() {
  try {
    const { response, payload } = await backendJson('/api/me', { withCookies: true });
    if (!response.ok) return null;
    return payload?.admin || null;
  } catch {
    return null;
  }
}

export function ownerCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  };
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  };
}
