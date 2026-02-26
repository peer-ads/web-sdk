# @peerads/web

[![npm version](https://img.shields.io/npm/v/@peerads/web)](https://www.npmjs.com/package/@peerads/web)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Web SDK for [PeerAds](https://peerads.io) — unified ad mediation + peer cross-promotion for web apps.

## Features

- **Peer network** — cross-promote with same-tier apps; 90 % of slots are peer ads (zero cost)
- **Paid campaigns** — CPM-bid waterfall fills remaining slots
- **Self network** — falls back to AdMob, AppLovin, Meta, Unity, or IronSource
- **SDK auth** — anonymous → registered user upgrade flow (localStorage-persisted sessions)
- **Test mode** — isolated sandbox using `pk_test_` keys; never charges real credits

## Requirements

- Modern browser (ES2017+) or bundler (Vite, webpack, esbuild, Rollup)
- Node ≥ 18 for local development / SSR

## Installation

```bash
npm install @peerads/web
# or
yarn add @peerads/web
```

## Quick Start

```ts
import { PeerAds } from '@peerads/web';

await PeerAds.init({
  apiKey: 'pk_live_YOUR_KEY',
  // Optional — only needed if you call reportDau() from a server context
  secretKey: 'sk_live_YOUR_SECRET',
});

// Show a banner ad inside any container element
await PeerAds.showBanner('#ad-banner', { size: '320x50' });
```

## Ad Formats

### Banner

```ts
await PeerAds.showBanner('#container', {
  size: '320x50', // '320x50' | '728x90' | '300x250'
});
```

### Interstitial

```ts
const ad = await PeerAds.loadInterstitial();
// show at a natural break point (level complete, screen transition, etc.)
PeerAds.showInterstitial(ad);
```

## SDK Auth

The SDK ships a lightweight user-auth layer so you can tie ad frequency and personalisation to individual users.

```ts
// Anonymous session (no email required)
const { user } = await PeerAds.signInAnonymously();
console.log(user.isAnonymous); // true

// Register / upgrade
await PeerAds.linkWithEmail('alice@example.com', 'password123');

// Return user
await PeerAds.signIn('alice@example.com', 'password123');

// Current user (restored automatically from localStorage on init)
console.log(PeerAds.currentUser);

// Sign out
PeerAds.signOut();
```

## Ad Network Adapters

Add only the networks you use. Each is loaded dynamically — no extra npm packages needed.

```ts
await PeerAds.init({
  apiKey: 'pk_live_...',
  networks: {
    admob:     { publisherId: 'pub-XXXX' },
    applovin:  { sdkKey: 'YOUR_APPLOVIN_KEY' },
    unity:     { gameId: 'YOUR_UNITY_GAME_ID' },
    meta:      { placementId: 'YOUR_META_PLACEMENT' },
    ironsource: { appKey: 'YOUR_IS_APP_KEY' }, // no-op on web; mobile-only
  },
});
```

## DAU Reporting

Call this from your **server**, not from the browser (it requires your secret key).

```ts
// Server-side only
await PeerAds.reportDau('your-app-id', 15000);
```

## Test Mode

```ts
await PeerAds.init({
  apiKey:     'pk_live_...',
  testApiKey: 'pk_test_...',
  environment: 'test', // uses testApiKey; ads are labelled [TEST]
});
```

## API Reference

| Method | Description |
|--------|-------------|
| `PeerAds.init(config)` | Initialize the SDK. Call once before any other method. |
| `PeerAds.showBanner(selector, opts?)` | Fetch and render a banner into a DOM element. |
| `PeerAds.loadInterstitial()` | Pre-load an interstitial ad. Returns `AdResponse`. |
| `PeerAds.showInterstitial(ad)` | Display a pre-loaded interstitial. |
| `PeerAds.requestAd(req)` | Low-level: fetch an ad from the server. |
| `PeerAds.track(adId, event)` | Track `'impression'`, `'click'`, or `'install'`. |
| `PeerAds.reportDau(appId, dau)` | Report DAU (server-side, secret key required). |
| `PeerAds.signInAnonymously()` | Start an anonymous session. |
| `PeerAds.signUp(email, pass, name?)` | Register a new user. |
| `PeerAds.signIn(email, pass)` | Sign in with email + password. |
| `PeerAds.linkWithEmail(email, pass, name?)` | Upgrade anonymous → registered. |
| `PeerAds.signOut()` | Clear the persisted session. |
| `PeerAds.currentUser` | The currently signed-in `SdkUser`, or `null`. |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © PeerAds
