import { AdNetworkAdapter, BannerOptions, loadScript } from './AdNetworkAdapter';

declare const googletag: any;

const GPT_SRC = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
let slotCounter = 0;

export class AdMobAdapter implements AdNetworkAdapter {
  private publisherId = '';
  private interstitialSlot: any = null;
  private _interstitialReady = false;

  get isInterstitialReady() { return this._interstitialReady; }

  async initialize(config: Record<string, string>) {
    this.publisherId = config.publisherId ?? '';
    await loadScript(GPT_SRC, 'peerads-gpt');
    window['googletag'] = window['googletag'] || { cmd: [] };
    googletag.cmd.push(() => {
      googletag.pubads().enableSingleRequest();
      googletag.enableServices();
    });
  }

  async loadBanner({ container, adUnitId, size }: BannerOptions) {
    const [w, h] = size.split('x').map(Number);
    const divId = `pa-gpt-${++slotCounter}`;
    const div = document.createElement('div');
    div.id = divId;
    container.appendChild(div);

    return new Promise<void>((resolve) => {
      googletag.cmd.push(() => {
        const slot = googletag.defineSlot(adUnitId, [w, h], divId);
        if (!slot) { resolve(); return; }
        slot.addService(googletag.pubads());
        googletag.pubads().addEventListener('slotRenderEnded', (e: any) => {
          if (e.slot === slot) resolve();
        });
        googletag.display(divId);
      });
    });
  }

  async loadInterstitial(adUnitId: string) {
    return new Promise<void>((resolve) => {
      googletag.cmd.push(() => {
        // GPT interstitials use out-of-page slots
        this.interstitialSlot = googletag.defineOutOfPageSlot(
          adUnitId,
          googletag.enums.OutOfPageFormat.INTERSTITIAL,
        );
        if (this.interstitialSlot) {
          this.interstitialSlot.addService(googletag.pubads());
          googletag.pubads().addEventListener('slotRenderEnded', (e: any) => {
            if (e.slot === this.interstitialSlot) {
              this._interstitialReady = true;
              resolve();
            }
          });
          googletag.display(this.interstitialSlot);
        } else {
          resolve();
        }
      });
    });
  }

  showInterstitial() {
    // GPT interstitials display automatically on slot render — nothing to call
    this._interstitialReady = false;
  }
}
