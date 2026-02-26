import { AdNetworkAdapter, BannerOptions } from './AdNetworkAdapter';

/**
 * Meta Audience Network — web banner support via their Audience Network
 * HTML5 ad tag format. Interstitial is not supported on web.
 */
export class MetaAdapter implements AdNetworkAdapter {
  private placementId = '';
  readonly isInterstitialReady = false;

  async initialize(config: Record<string, string>) {
    this.placementId = config.placementId ?? '';
  }

  async loadBanner({ container, adUnitId, size }: BannerOptions) {
    const [w, h] = size.split('x').map(Number);
    // Meta Audience Network delivers web ads via iframe ad tags
    const placement = adUnitId || this.placementId;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.facebook.com/adnw_request?placement=${encodeURIComponent(placement)}&sdk=5.5.web`;
    iframe.width = String(w);
    iframe.height = String(h);
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.style.border = 'none';
    iframe.allow = 'autoplay';
    container.appendChild(iframe);
  }

  async loadInterstitial(_adUnitId: string) {
    // Meta Audience Network interstitials are not available on web
    console.warn('[PeerAds/Meta] Interstitial not supported on web — falling back to self creative');
  }

  showInterstitial() {
    // no-op
  }
}
