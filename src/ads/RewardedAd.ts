import { PeerAds } from '../PeerAds';
import type { AdResponse } from '../types';
import { buildRewardedAdHtml } from './rewardedAdHtml';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PAReward {
  type:   string;
  amount: number;
}

export interface RewardedAdCallbacks {
  /**
   * Fired the instant the user finishes watching — they are now eligible.
   * Use this to pre-unlock the reward in your state management so there is
   * zero delay when the user clicks "Claim Reward".
   */
  onRewardAvailable?: (reward: PAReward) => void;
  /** Fired when the user explicitly clicks "Claim Reward". */
  onRewardEarned?: (reward: PAReward) => void;
  /** Fired after the overlay is removed from the DOM. */
  onAdClosed?: () => void;
  /** Fired if the ad fails to load. */
  onAdFailed?: (error: string) => void;
  /** Seconds the user must watch before becoming eligible. Defaults to 30. */
  duration?: number;
}

// ── Bridge (web iframe uses postMessage) ──────────────────────────────────────

const WEB_BRIDGE =
  `window.parent.postMessage({source:'peerads',event:e,data:d},'*')`;

// ── RewardedAd ────────────────────────────────────────────────────────────────

/**
 * Full-page rewarded ad overlay for web.
 *
 * The ad creative is rendered inside an `<iframe>` using the shared HTML
 * template. The iframe communicates back via `postMessage`.
 *
 * Behaviour:
 * - Covers the full viewport. No close button until the countdown completes.
 * - Timer pauses when the tab is hidden and resumes on focus (handled inside
 *   the iframe via `document.visibilitychange`).
 * - `onRewardAvailable` fires immediately when eligible (timer = 0).
 * - `onRewardEarned` fires when the user clicks "Claim Reward".
 *
 * Usage:
 * ```ts
 * const ad = new RewardedAd({
 *   duration: 30,
 *   onRewardAvailable: reward => console.log('Eligible:', reward),
 *   onRewardEarned:    reward => { coins += reward.amount; },
 *   onAdClosed:        ()     => console.log('Ad closed'),
 * });
 * await ad.load();
 * await ad.show();
 * ```
 */
export class RewardedAd {
  private ad:      AdResponse | null = null;
  private overlay: HTMLElement | null = null;

  private readonly duration:  number;
  private readonly callbacks: RewardedAdCallbacks;

  constructor(callbacks: RewardedAdCallbacks = {}) {
    this.callbacks = callbacks;
    this.duration  = callbacks.duration ?? 30;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Pre-fetch the ad creative. Optional — `show()` will load if needed. */
  async load(): Promise<void> {
    try {
      this.ad = await PeerAds.requestAd({ slotId: 'rewarded', type: 'interstitial' });
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Failed to load rewarded ad';
      this.callbacks.onAdFailed?.(msg);
      throw e;
    }
  }

  /** Show the full-screen rewarded ad overlay. */
  async show(): Promise<void> {
    if (!this.ad) await this.load();
    if (!this.ad) return;

    this.buildOverlay(this.ad);
    window.addEventListener('message', this.onMessage);
  }

  // ── iframe bridge ─────────────────────────────────────────────────────────

  private readonly onMessage = (e: MessageEvent): void => {
    if (!e.data || e.data.source !== 'peerads') return;
    const { event, data } = e.data as { event: string; data: PAReward & { adId?: string } };

    switch (event) {
      case 'impression':
        if (this.ad) void PeerAds.track(this.ad.id, 'impression');
        break;
      case 'rewardAvailable':
        this.callbacks.onRewardAvailable?.(data);
        break;
      case 'rewardEarned':
        this.callbacks.onRewardEarned?.(data);
        break;
      case 'closed':
        this.destroy();
        break;
    }
  };

  // ── DOM ───────────────────────────────────────────────────────────────────

  private buildOverlay(ad: AdResponse): void {
    this.overlay?.remove();

    // Full-viewport container
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      inset:    '0',
      zIndex:   '2147483647',
    });

    // iframe renders the shared HTML page (scripts execute inside it)
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      width:  '100%',
      height: '100%',
      border: 'none',
    });
    iframe.srcdoc = buildRewardedAdHtml(
      {
        adId:        ad.id,
        title:       ad.creative.title,
        description: ad.creative.description ?? '',
        imageUrl:    ad.creative.imageUrl    ?? '',
        duration:    this.duration,
      },
      WEB_BRIDGE,
    );

    this.overlay.appendChild(iframe);
    document.body.appendChild(this.overlay);
  }

  private destroy(): void {
    window.removeEventListener('message', this.onMessage);
    this.overlay?.remove();
    this.overlay = null;
    this.callbacks.onAdClosed?.();
  }
}
