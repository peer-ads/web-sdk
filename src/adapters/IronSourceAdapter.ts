import { AdNetworkAdapter, BannerOptions } from './AdNetworkAdapter';

/**
 * IronSource — mobile-only network, no web SDK available.
 * This adapter is a no-op stub so the SDK doesn't crash when
 * the server assigns network='ironsource' on a web placement.
 * The caller should handle the empty render and show a house ad.
 */
export class IronSourceAdapter implements AdNetworkAdapter {
  readonly isInterstitialReady = false;

  async initialize(_config: Record<string, string>) {
    console.warn('[PeerAds/IronSource] IronSource does not support web — skipping initialization');
  }

  async loadBanner(_options: BannerOptions) {
    console.warn('[PeerAds/IronSource] Banner not supported on web');
  }

  async loadInterstitial(_adUnitId: string) {
    console.warn('[PeerAds/IronSource] Interstitial not supported on web');
  }

  showInterstitial() {
    // no-op
  }
}
