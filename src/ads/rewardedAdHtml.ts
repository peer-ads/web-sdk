// ── Shared rewarded-ad HTML template ─────────────────────────────────────────
//
// The template is loaded inside an <iframe> (web) or a WebView (native).
// Platform code prepends a tiny <script> that sets:
//   window.__PA       — ad config
//   window.__paBridge — bridge function(event, data)
//
// The ad JS calls window.PAAd.pause() / .resume() — native lifecycle code
// calls these when the app is backgrounded / foregrounded.

const PA_CSS = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden}body{background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}#pa-track{height:4px;background:rgba(255,255,255,.1);flex-shrink:0}#pa-fill{height:4px;background:#f59e0b;width:100%;transition:width 1s linear}#pa-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px 0;flex-shrink:0}.pa-badge{background:rgba(245,158,11,.15);color:#f59e0b;font-size:13px;font-weight:700;padding:7px 14px;border-radius:20px;border:1px solid rgba(245,158,11,.3)}#pa-timer{background:rgba(255,255,255,.07);color:#fff;font-size:15px;font-weight:800;padding:7px 14px;border-radius:20px;min-width:56px;text-align:center;font-variant-numeric:tabular-nums;transition:background .3s,border-color .3s,color .3s;border:1px solid transparent}#pa-timer.pa-done{background:rgba(52,211,153,.15);border-color:rgba(52,211,153,.3);color:#34d399}#pa-creative{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px;text-align:center;overflow-y:auto}#pa-img{width:100%;max-width:480px;height:200px;object-fit:cover;border-radius:16px;margin-bottom:24px;display:none}#pa-title{color:#f1f5f9;font-size:24px;font-weight:700;margin:0 0 12px;max-width:480px;line-height:1.25}#pa-desc{color:#94a3b8;font-size:15px;line-height:1.6;max-width:480px}#pa-bottom{padding:0 20px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;flex-shrink:0}#pa-claim{display:none;width:100%;max-width:480px;padding:17px 0;background:#4f46e5;color:#fff;border:none;border-radius:16px;font-size:17px;font-weight:700;cursor:pointer;transition:opacity .15s}#pa-claim:active{opacity:.8}#pa-watching{width:100%;max-width:480px;padding:15px 0;background:rgba(255,255,255,.05);border-radius:12px;text-align:center;color:#64748b;font-size:13px}.pa-attr{color:rgba(148,163,184,.3);font-size:11px}`;

const PA_BODY = `<div id="pa-track"><div id="pa-fill"></div></div><div id="pa-header"><span class="pa-badge">🎁 Earn reward</span><span id="pa-timer">…</span></div><div id="pa-creative"><img id="pa-img" alt=""><h2 id="pa-title"></h2><p id="pa-desc"></p></div><div id="pa-bottom"><button id="pa-claim">Claim Reward</button><div id="pa-watching"></div><p class="pa-attr">Ad · peerads.io</p></div>`;

const PA_JS = `(function(){var cfg=window.__PA||{},DURATION=cfg.duration||30,REWARD={type:cfg.rewardType||'coins',amount:cfg.rewardAmount||10};if(typeof window.__paBridge!=='function'){window.__paBridge=function(){};}var remaining=DURATION,eligible=false,interval=null,fillEl=document.getElementById('pa-fill'),timerEl=document.getElementById('pa-timer'),watchingEl=document.getElementById('pa-watching'),claimEl=document.getElementById('pa-claim'),imgEl=document.getElementById('pa-img'),titleEl=document.getElementById('pa-title'),descEl=document.getElementById('pa-desc');titleEl.textContent=cfg.title||'';descEl.textContent=cfg.description||'';if(cfg.imageUrl){imgEl.src=cfg.imageUrl;imgEl.style.display='block';}function fmt(s){var m=Math.floor(s/60),r=s%60;return m>0?(m+':'+(r<10?'0':'')+r):(''+s);}function updateUI(){timerEl.textContent=fmt(remaining);watchingEl.textContent='Watch for '+remaining+'s to claim your reward';fillEl.style.width=(remaining/DURATION*100)+'%';}function startTimer(){clearInterval(interval);interval=setInterval(function(){remaining--;updateUI();if(remaining<=0){clearInterval(interval);interval=null;markEligible();}},1000);}function markEligible(){if(eligible)return;eligible=true;timerEl.textContent='\u2713';timerEl.className+=' pa-done';claimEl.style.display='block';watchingEl.style.display='none';fillEl.style.width='0%';window.__paBridge('rewardAvailable',REWARD);}claimEl.addEventListener('click',function(){if(!eligible)return;window.__paBridge('rewardEarned',REWARD);window.__paBridge('closed',{});});window.PAAd={pause:function(){clearInterval(interval);interval=null;},resume:function(){if(!eligible)startTimer();}};document.addEventListener('visibilitychange',function(){if(document.hidden){window.PAAd.pause();}else if(!eligible){window.PAAd.resume();}});updateUI();window.__paBridge('impression',{adId:cfg.adId||''});startTimer();})();`;

// ── Public types ──────────────────────────────────────────────────────────────

export interface RewardedAdHtmlConfig {
  adId:        string;
  title:       string;
  description: string;
  imageUrl:    string;
  duration:    number;
}

/**
 * Build the complete rewarded-ad HTML document.
 *
 * @param cfg       Ad data written into `window.__PA`.
 * @param bridgeFn  JS body of the bridge function.
 *                  Receives `e` (event string) and `d` (data object).
 *                  Example:
 *                    "window.ReactNativeWebView.postMessage(JSON.stringify({event:e,data:d}))"
 */
export function buildRewardedAdHtml(cfg: RewardedAdHtmlConfig, bridgeFn: string): string {
  // JSON.stringify + escape </script> sequences to prevent early tag close
  const data = JSON.stringify({
    adId:        cfg.adId,
    title:       cfg.title,
    description: cfg.description,
    imageUrl:    cfg.imageUrl,
    duration:    cfg.duration,
    rewardType:  'coins',
    rewardAmount: 10,
  }).replace(/<\//g, '<\\/');

  const inject = `window.__PA=${data};window.__paBridge=function(e,d){${bridgeFn}};`;

  return (
    `<!DOCTYPE html><html lang="en"><head>` +
    `<meta charset="UTF-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">` +
    `<style>${PA_CSS}</style></head>` +
    `<body><script>${inject}</script>` +
    PA_BODY +
    `<script>${PA_JS}</script></body></html>`
  );
}
