/**
 * PolyON Portal — Keycloak OIDC 인증
 * polyon realm / polyon-portal client (PKCE public)
 */
import Keycloak from 'keycloak-js';

let _kc: Keycloak | null = null;
let _token: string | null = null;
let _refreshInterval: number | null = null;

export function getToken(): string | null {
  return _token;
}

export async function initAuth(): Promise<{ authenticated: boolean; error?: string }> {
  try {
    // Core API에서 auth-config 조회 (하드코딩 제거)
    const res = await fetch('/api/v1/system/auth-config');
    if (!res.ok) throw new Error(`auth-config 실패: ${res.status}`);
    const cfg = await res.json();

    _kc = new Keycloak({
      url: cfg.keycloak_url || 'https://sso.cmars.com',
      realm: 'polyon',
      clientId: 'polyon-portal',
    });

    const authenticated = await _kc.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    if (authenticated && _kc.token) {
      _token = _kc.token;
      startTokenRefresh();
    }

    return { authenticated };
  } catch (e) {
    return { authenticated: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function startTokenRefresh() {
  if (_refreshInterval) clearInterval(_refreshInterval);
  _refreshInterval = setInterval(async () => {
    if (!_kc) return;
    try {
      const refreshed = await _kc.updateToken(30);
      if (refreshed && _kc.token) _token = _kc.token;
    } catch {
      console.warn('[Portal] Token refresh failed');
    }
  }, 60000);
}

export function logout() {
  if (_refreshInterval) clearInterval(_refreshInterval);
  _kc?.logout({ redirectUri: window.location.origin });
}
