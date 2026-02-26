export type NetworkConfig = Record<string, string>;

export type PeerAdsEnvironment = 'test' | 'production';

export interface PeerAdsConfig {
  /** Live public key: pk_live_... */
  apiKey: string;
  /** Live secret key: sk_live_... — server-side only, never embed in browser bundles */
  secretKey?: string;
  /** Test public key: pk_test_... — use in dev/staging */
  testApiKey?: string;
  /** Test secret key: sk_test_... — server-side dev use only */
  testSecretKey?: string;
  /** 'test' uses pk_test_ key and returns mock ads. Default: 'production' */
  environment?: PeerAdsEnvironment;
  apiUrl?: string;
  peerPromotionPercent?: number;
  networks?: Partial<Record<'admob' | 'meta' | 'applovin' | 'unity' | 'ironsource', NetworkConfig>>;
  debug?: boolean;
}

export interface AdRequest {
  slotId: string;
  type: 'banner' | 'interstitial' | 'native';
  targetingHints?: Record<string, string>;
}

export interface AdResponse {
  id: string;
  type: string;
  source: 'peer' | 'bid' | 'self';
  network?: string;
  adUnitId?: string;
  creative: {
    title: string;
    description?: string;
    imageUrl?: string;
    ctaText: string;
    clickUrl: string;
  };
  trackingUrl: string;
  /** 'test' when served via pk_test_ key, 'live' otherwise */
  environment?: PeerAdsEnvironment;
}

export type AdEvent = 'impression' | 'click' | 'expand' | 'collapse' | 'close';

// ─── SDK User (end-user identity) ─────────────────────────────────────────────

export interface SdkUser {
  id:          string;
  anonymousId: string;
  email:       string | null;
  displayName: string | null;
  isAnonymous: boolean;
  createdAt:   string;
}

export interface SdkAuthResult {
  token: string;
  user:  SdkUser;
}
