import { AdNetworkAdapter, BannerOptions, loadScript } from './AdNetworkAdapter';

declare const UnityAds: any;

/** Unity Ads Web SDK — available for HTML5 / WebGL game publishers */
export class UnityAdapter implements AdNetworkAdapter {
  private gameId = '';
  private _interstitialReady = false;

  get isInterstitialReady() { return this._interstitialReady; }

  async initialize(config: Record<string, string>) {
    this.gameId = config.gameId ?? '';
    await loadScript('https://sdk.unityads.unity.com/UnityAds.js', 'peerads-unity');
    await new Promise<void>((resolve) => {
      if (typeof UnityAds !== 'undefined') {
        UnityAds.initialize(this.gameId, (success: boolean) => resolve());
      } else {
        resolve();
      }
    });
  }

  async loadBanner({ container, adUnitId, size }: BannerOptions) {
    const [w, h] = size.split('x').map(Number);
    if (typeof UnityAds === 'undefined') return;

    const div = document.createElement('div');
    div.style.width = `${w}px`;
    div.style.height = `${h}px`;
    container.appendChild(div);

    await new Promise<void>((resolve) => {
      UnityAds.loadBanner(adUnitId, {
        loaded: (banner: any) => { div.appendChild(banner); resolve(); },
        failed: () => resolve(),
      });
    });
  }

  async loadInterstitial(adUnitId: string) {
    if (typeof UnityAds === 'undefined') return;
    await new Promise<void>((resolve) => {
      UnityAds.load(adUnitId, {
        complete: () => { this._interstitialReady = true; resolve(); },
        failed: () => resolve(),
      });
    });
  }

  showInterstitial() {
    // Unity calls this a "video" — show it
    if (typeof UnityAds !== 'undefined' && this._interstitialReady) {
      UnityAds.show();
    }
    this._interstitialReady = false;
  }
}
