import { AdNetworkAdapter, BannerOptions } from './AdNetworkAdapter';
import { AdMobAdapter } from './AdMobAdapter';
import { MetaAdapter } from './MetaAdapter';
import { AppLovinAdapter } from './AppLovinAdapter';
import { UnityAdapter } from './UnityAdapter';
import { IronSourceAdapter } from './IronSourceAdapter';

export type NetworkName = 'admob' | 'meta' | 'applovin' | 'unity' | 'ironsource';

export class AdapterManager {
  private adapters = new Map<NetworkName, AdNetworkAdapter>();

  private getOrCreate(name: NetworkName): AdNetworkAdapter {
    if (!this.adapters.has(name)) {
      const map: Record<NetworkName, AdNetworkAdapter> = {
        admob: new AdMobAdapter(),
        meta: new MetaAdapter(),
        applovin: new AppLovinAdapter(),
        unity: new UnityAdapter(),
        ironsource: new IronSourceAdapter(),
      };
      this.adapters.set(name, map[name]);
    }
    return this.adapters.get(name)!;
  }

  async initializeAll(networksConfig: Record<string, Record<string, string>>) {
    const names = Object.keys(networksConfig) as NetworkName[];
    await Promise.all(
      names.map((name) => this.getOrCreate(name).initialize(networksConfig[name] ?? {})),
    );
  }

  async loadBanner(network: string, options: BannerOptions) {
    const adapter = this.getOrCreate(network as NetworkName);
    await adapter.loadBanner(options);
  }

  async loadInterstitial(network: string, adUnitId: string) {
    const adapter = this.getOrCreate(network as NetworkName);
    await adapter.loadInterstitial(adUnitId);
  }

  showInterstitial(network: string) {
    const adapter = this.getOrCreate(network as NetworkName);
    adapter.showInterstitial();
  }

  isInterstitialReady(network: string): boolean {
    const adapter = this.adapters.get(network as NetworkName);
    return adapter?.isInterstitialReady ?? false;
  }
}
