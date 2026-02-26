import { PeerAds } from '../PeerAds';
import { AdResponse } from '../types';

export interface BannerAdOptions {
  size?: '320x50' | '728x90' | '300x250';
  onLoad?: (ad: AdResponse) => void;
  onError?: (err: Error) => void;
  onClick?: () => void;
}

export class BannerAd {
  private container: HTMLElement;
  private options: BannerAdOptions;
  private currentAd: AdResponse | null = null;

  constructor(container: string | HTMLElement, options: BannerAdOptions = {}) {
    this.container = typeof container === 'string'
      ? (document.querySelector(container) as HTMLElement)
      : container;
    this.options = { size: '320x50', ...options };
  }

  async load(): Promise<void> {
    try {
      const ad = await PeerAds.requestAd({ slotId: 'banner', type: 'banner' });
      this.currentAd = ad;

      if (ad.source === 'self' && ad.network) {
        // Delegate to third-party adapter (AdMob GPT, AppLovin, Unity, etc.)
        const manager = PeerAds.getAdapterManager();
        if (manager) {
          await manager.loadBanner(ad.network, {
            container: this.container,
            adUnitId: ad.adUnitId ?? '',
            size: this.options.size ?? '320x50',
          });
          await PeerAds.track(ad.id, 'impression');
          this.options.onLoad?.(ad);
          return;
        }
      }

      // Peer / bid creative — render HTML
      this.renderCreative(ad);
      this.options.onLoad?.(ad);
      await PeerAds.track(ad.id, 'impression');
    } catch (err) {
      this.options.onError?.(err as Error);
    }
  }

  private renderCreative(ad: AdResponse): void {
    const [w, h] = this.options.size!.split('x');
    this.container.style.cssText = `width:${w}px;height:${h}px;overflow:hidden;`;
    this.container.innerHTML = `
      <a href="${ad.creative.clickUrl}" target="_blank" rel="noopener"
         style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;
                background:#f8f9ff;border:1px solid #e5e7eb;border-radius:6px;
                text-decoration:none;font-family:sans-serif;font-size:13px;color:#374151;">
        ${ad.creative.title}
      </a>`;
    this.container.querySelector('a')?.addEventListener('click', () => {
      if (this.currentAd) PeerAds.track(this.currentAd.id, 'click');
      this.options.onClick?.();
    });
  }

  destroy(): void {
    this.container.innerHTML = '';
    this.currentAd = null;
  }
}
