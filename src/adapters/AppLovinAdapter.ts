import { AdNetworkAdapter, BannerOptions, loadScript } from './AdNetworkAdapter';

declare const applovin: any;

const APPLOVIN_SRC = 'https://s.amazon-adsystem.com/aax2/apstag.js'; // AppLovin Exchange uses APS
// For AppLovin MAX Web display: load via their tag endpoint

export class AppLovinAdapter implements AdNetworkAdapter {
  private sdkKey = '';
  private _interstitialReady = false;

  get isInterstitialReady() { return this._interstitialReady; }

  async initialize(config: Record<string, string>) {
    this.sdkKey = config.sdkKey ?? '';
    // AppLovin Exchange for web publishers — inject tag
    await loadScript(
      `https://s.adtelligent.com/prebid/applovin/${encodeURIComponent(this.sdkKey)}.js`,
      'peerads-applovin',
    ).catch(() => {
      // Non-fatal — SDK will render PeerAds creative as fallback
    });
  }

  async loadBanner({ container, adUnitId, size }: BannerOptions) {
    const [w, h] = size.split('x').map(Number);
    // Inject AppLovin MAX display ad via their JS ad tag
    const div = document.createElement('div');
    div.setAttribute('data-applovin-unit', adUnitId);
    div.setAttribute('data-applovin-size', size);
    div.style.width = `${w}px`;
    div.style.height = `${h}px`;
    container.appendChild(div);

    // Signal AppLovin to fill the slot if SDK loaded
    if (typeof applovin !== 'undefined') {
      applovin.display(div);
    }
  }

  async loadInterstitial(adUnitId: string) {
    if (typeof applovin !== 'undefined') {
      await applovin.loadInterstitial?.({ adUnitId });
      this._interstitialReady = true;
    }
  }

  showInterstitial() {
    if (typeof applovin !== 'undefined') {
      applovin.showInterstitial?.();
    }
    this._interstitialReady = false;
  }
}
