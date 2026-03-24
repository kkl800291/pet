import { NextResponse } from 'next/server';
import { getBackendBaseUrl } from '../../../lib/backend.js';

function requestBase(request) {
  const host = request.headers.get('host') || '127.0.0.1:3100';
  return `http://${host}`;
}

function redirectTo(request, location) {
  return NextResponse.redirect(new URL(location, requestBase(request)));
}

function redirectBack(request, fallback = '/') {
  const referer = request.headers.get('referer');
  return NextResponse.redirect(new URL(referer || fallback, requestBase(request)));
}

async function resolveParams(context) {
  const params = await context.params;
  return params?.path || [];
}

function backendPathForSegments(segments) {
  if (segments[0] === 'upload') return '/api/uploads';
  if (segments[0] === 'chats' && segments[2] === 'message') {
    return `/api/chats/${segments[1]}/messages`;
  }
  return `/api/${segments.join('/')}`;
}

async function proxyToBackend(request, backendPath) {
  const contentType = request.headers.get('content-type') || '';
  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  if (contentType && !contentType.includes('multipart/form-data')) {
    headers.set('content-type', contentType);
  }

  const init = {
    method: request.method,
    headers,
    redirect: 'manual'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      init.body = await request.formData();
    } else {
      const raw = await request.text();
      init.body = raw || undefined;
    }
  }

  return fetch(`${getBackendBaseUrl()}${backendPath}`, init);
}

function mirrorSetCookie(source, target) {
  const setCookie = source.headers.get('set-cookie');
  if (setCookie) {
    target.headers.set('set-cookie', setCookie);
  }
}

async function passthrough(response) {
  const body = await response.arrayBuffer();
  const proxied = new NextResponse(body, { status: response.status });
  const contentType = response.headers.get('content-type');
  if (contentType) {
    proxied.headers.set('content-type', contentType);
  }
  mirrorSetCookie(response, proxied);
  return proxied;
}

function actionRedirect(request, segments, payload) {
  if (segments[0] === 'auth' && segments[1] === 'login') return '/feed';
  if (segments[0] === 'admin' && segments[1] === 'login') return '/admin';
  if (segments[0] === 'pets' && !segments[1]) return payload?.pet?.id ? `/pets/${payload.pet.id}` : '/pets';
  if (segments[0] === 'posts' && !segments[1]) return payload?.post?.id ? `/posts/${payload.post.id}` : '/feed';
  if (segments[0] === 'posts' && segments[2] === 'like') return 'back';
  if (segments[0] === 'posts' && segments[2] === 'comments') return 'back';
  if (segments[0] === 'posts' && segments[2] === 'report') return 'back';
  if (segments[0] === 'follows') return 'back';
  if (segments[0] === 'admin' && segments[1] === 'posts' && segments[3] === 'approve') return '/admin/review';
  if (segments[0] === 'admin' && segments[1] === 'posts' && segments[3] === 'reject') return '/admin/review';
  if (segments[0] === 'admin' && segments[1] === 'reports' && segments[3] === 'resolve') return '/admin/reports';
  if (segments[0] === 'admin' && segments[1] === 'owners' && segments[3] === 'ban') return '/admin/users';
  if (segments[0] === 'admin' && segments[1] === 'owners' && segments[3] === 'unban') return '/admin/users';
  return null;
}

async function handle(request, context) {
  const segments = await resolveParams(context);
  const backendPath = backendPathForSegments(segments);
  const backendResponse = await proxyToBackend(request, backendPath);

  const responseType = backendResponse.headers.get('content-type') || '';
  const payload = responseType.includes('application/json') ? await backendResponse.clone().json().catch(() => null) : null;

  if (!backendResponse.ok) {
    return passthrough(backendResponse);
  }

  const location = request.method === 'GET' ? null : actionRedirect(request, segments, payload);
  if (!location) {
    return passthrough(backendResponse);
  }

  const redirected = location === 'back' ? redirectBack(request, '/') : redirectTo(request, location);
  mirrorSetCookie(backendResponse, redirected);
  return redirected;
}

export async function GET(request, context) {
  return handle(request, context);
}

export async function POST(request, context) {
  return handle(request, context);
}

export async function PATCH(request, context) {
  return handle(request, context);
}

export async function DELETE(request, context) {
  return handle(request, context);
}
