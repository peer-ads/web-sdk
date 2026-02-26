import { PeerAds } from '../PeerAds';
import { AdResponse } from '../types';

export class InterstitialAd {
  private ad: AdResponse | null = null;

  async load(): Promise<void> {
    this.ad = await PeerAds.requestAd({ slotId: 'interstitial', type: 'interstitial' });

    // If third-party network, pre-load via adapter now
    if (this.ad.source === 'self' && this.ad.network) {
      const manager = PeerAds.getAdapterManager();
      if (manager) {
        await manager.loadInterstitial(this.ad.network, this.ad.adUnitId ?? '');
      }
    }
  }

  async show(): Promise<void> {
    if (!this.ad) throw new Error('[PeerAds] Call load() before show()');

    // Third-party interstitial
    if (this.ad.source === 'self' && this.ad.network) {
      const manager = PeerAds.getAdapterManager();
      if (manager && manager.isInterstitialReady(this.ad.network)) {
        manager.showInterstitial(this.ad.network);
        await PeerAds.track(this.ad.id, 'impression');
        return;
      }
    }

    // PeerAds peer/bid creative overlay
    const overlay = this.createOverlay(this.ad);
    document.body.appendChild(overlay);
    await PeerAds.track(this.ad.id, 'impression');
  }

  private createOverlay(ad: AdResponse): HTMLElement {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;';
    overlay.innerHTML = `
      <div style="background:white;border-radius:16px;padding:32px;max-width:400px;width:90%;text-align:center;position:relative;">
        <button id="pa-close" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:18px;cursor:pointer;color:#6b7280;">✕</button>
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#111827;">${ad.creative.title}</h2>
        <p style="color:#6b7280;margin-bottom:24px;font-size:14px;">${ad.creative.description ?? ''}</p>
        <a href="${ad.creative.clickUrl}" target="_blank" rel="noopener"
           style="display:inline-block;background:#4f46e5;color:white;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;">
          ${ad.creative.ctaText}
        </a>
      </div>`;
    overlay.querySelector('#pa-close')?.addEventListener('click', () => {
      overlay.remove();
      if (this.ad) PeerAds.track(this.ad.id, 'close');
    });
    overlay.querySelector('a')?.addEventListener('click', () => {
      if (this.ad) PeerAds.track(this.ad.id, 'click');
    });
    return overlay;
  }
}
