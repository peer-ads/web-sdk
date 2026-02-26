import { PeerAdsConfig, AdRequest, AdResponse, AdEvent, SdkUser, SdkAuthResult } from './types';
import { AdapterManager } from './adapters/AdapterManager';

const SDK_TOKEN_KEY = '_peerads_sdk_token';

export class PeerAds {
  private static config: PeerAdsConfig | null = null;
  private static adapterManager: AdapterManager | null = null;
  private static readonly DEFAULT_API = 'https://api.peerads.io/api/v1';

  /** The currently signed-in SDK user, or null if not authenticated. */
  static currentUser: SdkUser | null = null;

  static async init(config: PeerAdsConfig): Promise<void> {
    this.config = { peerPromotionPercent: 90, apiUrl: this.DEFAULT_API, environment: 'production', debug: false, ...config };

    if (config.networks && Object.keys(config.networks).length > 0) {
      this.adapterManager = new AdapterManager();
      await this.adapterManager.initializeAll(config.networks as Record<string, Record<string, string>>);
    }

    // Restore persisted SDK session
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem(SDK_TOKEN_KEY) : null;
      if (token) {
        const me = await this.sdkFetch('GET', 'sdk/auth/me', null, token);
        this.currentUser = me as SdkUser;
      }
    } catch { /* session expired — user will need to sign in again */ }

    if (this.config.debug) {
      console.log(`[PeerAds] Initialized (${this.config.environment})`, this.activeApiKey());
    }
  }

  /** The API key to use for ad requests based on the configured environment */
  private static activeApiKey(): string {
    const c = this.config!;
    if (c.environment === 'test') {
      if (!c.testApiKey) throw new Error('[PeerAds] testApiKey required when environment is "test"');
      return c.testApiKey;
    }
    return c.apiKey;
  }

  /** The secret key to use for privileged calls (if set) */
  private static activeSecretKey(): string | undefined {
    const c = this.config!;
    return c.environment === 'test' ? c.testSecretKey : c.secretKey;
  }

  private static secretHeaders(): HeadersInit {
    const sk = this.activeSecretKey();
    return sk ? { 'Content-Type': 'application/json', 'X-PeerAds-Secret-Key': sk }
              : { 'Content-Type': 'application/json' };
  }

  static async requestAd(req: AdRequest): Promise<AdResponse> {
    this.assertInitialized();
    const res = await fetch(`${this.config!.apiUrl}/ads/serve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: this.activeApiKey(), slotType: req.type, platform: 'web' }),
    });
    if (!res.ok) throw new Error(`[PeerAds] Ad request failed: ${res.status}`);
    const { ad, environment } = await res.json();
    return { ...ad, environment } as AdResponse;
  }

  static async track(adId: string, event: AdEvent): Promise<void> {
    this.assertInitialized();
    await fetch(`${this.config!.apiUrl}/ads/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId, event }),
    }).catch(() => {});
  }

  /**
   * Report your app's DAU to the PeerAds server.
   * Uses the secret key — call this from your server-side code, not the browser.
   */
  static async reportDau(appId: string, dau: number): Promise<void> {
    this.assertInitialized();
    const sk = this.activeSecretKey();
    if (!sk) throw new Error('[PeerAds] secretKey or testSecretKey required to call reportDau()');
    await fetch(`${this.config!.apiUrl}/apps/dau`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-PeerAds-Secret-Key': sk },
      body: JSON.stringify({ dau }),
    });
  }

  static async showBanner(
    selector: string,
    options?: Partial<AdRequest> & { size?: '320x50' | '728x90' | '300x250' },
  ): Promise<void> {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`[PeerAds] Element not found: ${selector}`);
    const ad = await this.requestAd({ slotId: selector, type: 'banner', ...options });

    if (ad.source === 'self' && ad.network && this.adapterManager) {
      await this.adapterManager.loadBanner(ad.network, { container: el, adUnitId: ad.adUnitId ?? '', size: options?.size ?? '320x50' });
      await this.track(ad.id, 'impression');
      return;
    }

    const [w, h] = (options?.size ?? '320x50').split('x');
    el.style.cssText = `width:${w}px;height:${h}px;overflow:hidden;`;
    el.innerHTML = `<a href="${ad.creative.clickUrl}" target="_blank" rel="noopener"
       style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;
              background:#f8f9ff;border:1px solid #e5e7eb;border-radius:6px;
              text-decoration:none;font-family:sans-serif;font-size:13px;color:#374151;">
      ${ad.creative.title}${ad.environment === 'test' ? ' [TEST]' : ''}
    </a>`;
    el.querySelector('a')?.addEventListener('click', () => this.track(ad.id, 'click'));
    await this.track(ad.id, 'impression');
  }

  static async loadInterstitial(adUnitId = ''): Promise<AdResponse> {
    const ad = await this.requestAd({ slotId: 'interstitial', type: 'interstitial' });
    if (ad.source === 'self' && ad.network && this.adapterManager) {
      await this.adapterManager.loadInterstitial(ad.network, ad.adUnitId ?? adUnitId);
    }
    return ad;
  }

  static showInterstitial(ad: AdResponse): void {
    if (ad.source === 'self' && ad.network && this.adapterManager) {
      this.adapterManager.showInterstitial(ad.network);
      this.track(ad.id, 'impression');
    }
  }

  static getAdapterManager(): AdapterManager | null { return this.adapterManager; }
  static getEnvironment() { return this.config?.environment ?? 'production'; }

  // ── Anonymous auth ────────────────────────────────────────────────────────

  /**
   * Creates an anonymous session. No email or password required.
   * The returned token is persisted in localStorage and restored on next init().
   *
   * @example
   * const { user } = await PeerAds.signInAnonymously();
   * console.log(user.isAnonymous); // true
   */
  static async signInAnonymously(): Promise<SdkAuthResult> {
    this.assertInitialized();
    const result = await this.sdkFetch('POST', 'sdk/auth/anonymous', { apiKey: this.activeApiKey() }) as SdkAuthResult;
    this.persistSession(result);
    return result;
  }

  /**
   * Register a new account with email and password.
   * If the user was previously anonymous, use linkWithEmail() instead
   * to preserve their history.
   */
  static async signUp(email: string, password: string, displayName?: string): Promise<SdkAuthResult> {
    this.assertInitialized();
    const result = await this.sdkFetch('POST', 'sdk/auth/signup', {
      apiKey: this.activeApiKey(), email, password, displayName,
    }) as SdkAuthResult;
    this.persistSession(result);
    return result;
  }

  /**
   * Sign in with an existing email/password account.
   */
  static async signIn(email: string, password: string): Promise<SdkAuthResult> {
    this.assertInitialized();
    const result = await this.sdkFetch('POST', 'sdk/auth/signin', {
      apiKey: this.activeApiKey(), email, password,
    }) as SdkAuthResult;
    this.persistSession(result);
    return result;
  }

  /**
   * Upgrade an anonymous session to a registered account.
   * The anonymous user ID and any associated data are preserved.
   * Requires that signInAnonymously() was called first (currentUser must exist).
   */
  static async linkWithEmail(email: string, password: string, displayName?: string): Promise<SdkAuthResult> {
    this.assertInitialized();
    const token = this.getSdkToken();
    if (!token) throw new Error('[PeerAds] No anonymous session — call signInAnonymously() first');
    const result = await this.sdkFetch('POST', 'sdk/auth/link', {
      apiKey: this.activeApiKey(), email, password, displayName,
    }, token) as SdkAuthResult;
    this.persistSession(result);
    return result;
  }

  /**
   * Sign out and clear the persisted session.
   */
  static signOut(): void {
    this.currentUser = null;
    if (typeof localStorage !== 'undefined') localStorage.removeItem(SDK_TOKEN_KEY);
  }

  // ── Session helpers ────────────────────────────────────────────────────────

  private static persistSession(result: SdkAuthResult) {
    this.currentUser = result.user;
    if (typeof localStorage !== 'undefined') localStorage.setItem(SDK_TOKEN_KEY, result.token);
  }

  private static getSdkToken(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(SDK_TOKEN_KEY) : null;
  }

  private static async sdkFetch(
    method: 'GET' | 'POST',
    path: string,
    body: Record<string, unknown> | null,
    token?: string,
  ): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${this.config!.apiUrl}/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? `[PeerAds] ${path} failed: ${res.status}`);
    return data;
  }

  private static assertInitialized(): void {
    if (!this.config) throw new Error('[PeerAds] Call PeerAds.init() first');
  }
}
