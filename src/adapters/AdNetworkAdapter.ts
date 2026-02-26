export interface BannerOptions {
  container: HTMLElement;
  adUnitId: string;
  size: string; // '320x50' | '728x90' | '300x250'
}

export interface AdNetworkAdapter {
  /** Called once during PeerAds.init() — load third-party script, set credentials */
  initialize(config: Record<string, string>): Promise<void>;
  /** Render a banner ad into container */
  loadBanner(options: BannerOptions): Promise<void>;
  /** Pre-load an interstitial — call before show */
  loadInterstitial(adUnitId: string): Promise<void>;
  /** Display a previously loaded interstitial */
  showInterstitial(): void;
  /** True when an interstitial is ready to show */
  readonly isInterstitialReady: boolean;
}

/** Load a remote script tag once — idempotent */
export function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement('script');
    s.id = id; s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}
