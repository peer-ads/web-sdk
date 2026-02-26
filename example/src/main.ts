/**
 * PeerAds Web SDK — Demo entry point
 *
 * Covers: SDK init, anonymous auth, banner, interstitial, manual request, DAU reporting.
 */

import { PeerAds, BannerAd, InterstitialAd } from '@peerads/web';
import type { AdResponse } from '@peerads/web';

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------
const $  = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const $$ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

function log(level: 'ok' | 'err' | 'info', msg: string) {
  const logEl = $('log');
  const div   = document.createElement('div');
  div.className = `log-entry ${level}`;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.prepend(div);
  // trim to 50 entries
  while (logEl.children.length > 50) logEl.lastElementChild?.remove();
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let banner: BannerAd | null = null;

// ---------------------------------------------------------------------------
// 1. SDK Initialisation
// ---------------------------------------------------------------------------
$('btn-init').addEventListener('click', async () => {
  const apiKey = $<HTMLInputElement>('api-key').value.trim();
  if (!apiKey) { log('err', 'API key is required'); return; }

  try {
    await PeerAds.init({
      apiKey,
      environment: 'test',
      debug: true,
      peerPromotionPercent: 90,
    });
    log('ok', `SDK initialised  env=test  key=${apiKey.slice(0, 16)}…`);
    $('auth-status').textContent = 'SDK ready — no user';
  } catch (e: unknown) {
    log('err', `Init failed: ${(e as Error).message}`);
  }
});

// ---------------------------------------------------------------------------
// 2. Anonymous sign-in / sign-out
// ---------------------------------------------------------------------------
$('btn-anon-signin').addEventListener('click', async () => {
  try {
    const { user } = await PeerAds.signInAnonymously();
    $('auth-status').textContent = `Signed in anonymously  id=${user.id.slice(0, 8)}…`;
    $<HTMLButtonElement>('btn-anon-signin').style.display = 'none';
    $<HTMLButtonElement>('btn-signout').style.display     = '';
    log('ok', `Anonymous sign-in  uid=${user.id}`);
  } catch (e: unknown) {
    log('err', `Sign-in failed: ${(e as Error).message}`);
  }
});

$('btn-signout').addEventListener('click', () => {
  PeerAds.signOut();
  $('auth-status').textContent = 'Signed out';
  $<HTMLButtonElement>('btn-anon-signin').style.display = '';
  $<HTMLButtonElement>('btn-signout').style.display     = 'none';
  log('info', 'User signed out');
});

// ---------------------------------------------------------------------------
// 3. Banner Ad
// ---------------------------------------------------------------------------
$('btn-banner').addEventListener('click', async () => {
  banner?.destroy();
  const sizeEl  = $<HTMLSelectElement>('banner-size');
  const size    = sizeEl.value as '320x50' | '728x90' | '300x250';

  banner = new BannerAd('#banner-container', {
    size,
    onLoad:  (ad: AdResponse) => {
      log('ok', `Banner loaded  source=${ad.source}  network=${ad.network ?? 'self'}  size=${size}`);
    },
    onError: (err: Error) => log('err', `Banner error: ${err.message}`),
    onClick: ()           => log('info', 'Banner clicked'),
  });

  try {
    await banner.load();
  } catch (e: unknown) {
    log('err', `Banner load exception: ${(e as Error).message}`);
  }
});

$('btn-banner-destroy').addEventListener('click', () => {
  banner?.destroy();
  banner = null;
  const container = $('banner-container');
  container.textContent = 'Banner will appear here';
  log('info', 'Banner destroyed');
});

// ---------------------------------------------------------------------------
// 4. Interstitial Ad
// ---------------------------------------------------------------------------
$('btn-interstitial').addEventListener('click', async () => {
  try {
    log('info', 'Loading interstitial…');
    const ad = await PeerAds.loadInterstitial();
    log('ok', `Interstitial loaded  source=${ad.source}  id=${ad.id}`);

    PeerAds.showInterstitial(ad);

    await PeerAds.track(ad.id, 'impression');
    log('info', 'Impression tracked');

    // Update source badge in the UI
    const badge = $('interstitial-source');
    badge.id        = 'source-badge';
    badge.className = `badge-${ad.source}`;
    badge.textContent = ad.source;
  } catch (e: unknown) {
    log('err', `Interstitial failed: ${(e as Error).message}`);
  }
});

// ---------------------------------------------------------------------------
// 5. Manual Ad Request
// ---------------------------------------------------------------------------
$('btn-request').addEventListener('click', async () => {
  const slotId = $<HTMLInputElement>('slot-id').value.trim();
  const type   = $<HTMLSelectElement>('ad-type').value as 'banner' | 'interstitial' | 'native';

  try {
    const ad = await PeerAds.requestAd({ slotId, type });
    $('ad-response').textContent = JSON.stringify(ad, null, 2);
    log('ok', `Ad received  source=${ad.source}  network=${ad.network ?? 'self'}`);

    // Track impression manually
    await PeerAds.track(ad.id, 'impression');
    log('info', 'Impression tracked');
  } catch (e: unknown) {
    $('ad-response').textContent = `Error: ${(e as Error).message}`;
    log('err', `Request failed: ${(e as Error).message}`);
  }
});

// ---------------------------------------------------------------------------
// 6. DAU Reporting
// ---------------------------------------------------------------------------
$('btn-dau').addEventListener('click', async () => {
  const appId = $<HTMLInputElement>('dau-app-id').value.trim();
  const dau   = parseInt($<HTMLInputElement>('dau-value').value, 10);

  if (!appId || isNaN(dau)) { log('err', 'App ID and DAU are required'); return; }

  try {
    await PeerAds.reportDau(appId, dau);
    log('ok', `DAU reported  appId=${appId}  dau=${dau.toLocaleString()}`);
  } catch (e: unknown) {
    log('err', `DAU report failed: ${(e as Error).message}`);
  }
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
log('info', 'Page loaded — fill in your API key and click "Initialize SDK"');
