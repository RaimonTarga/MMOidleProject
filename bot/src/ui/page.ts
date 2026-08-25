/**
 * The dashboard page. Deliberately one self-contained string: no build step, no
 * dependencies, no network fetches beyond its own `/api/bots`.
 */
export const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bot Harness</title>
<style>
  :root{
    --bg:#0e1116; --panel:#161b22; --panel2:#1c232c; --line:#2a323d;
    --ink:#e6edf3; --dim:#8b949e; --accent:#58a6ff;
    --good:#3fb950; --warn:#d29922; --bad:#f85149; --mag:#bc8cff;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  header{position:sticky;top:0;z-index:5;background:var(--panel);
    border-bottom:1px solid var(--line);padding:10px 16px;
    display:flex;gap:14px;align-items:baseline;flex-wrap:wrap}
  header h1{margin:0;font-size:14px;letter-spacing:.08em;text-transform:uppercase}
  .muted{color:var(--dim)}
  .grid{display:grid;gap:14px;padding:14px;
    grid-template-columns:repeat(auto-fill,minmax(400px,1fr))}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden}
  .card>h2{margin:0;padding:9px 12px;font-size:13px;background:var(--panel2);
    border-bottom:1px solid var(--line);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .pill{font-size:10px;padding:1px 7px;border-radius:10px;border:1px solid var(--line);
    color:var(--dim);text-transform:uppercase;letter-spacing:.05em}
  .pill.alive{color:var(--good);border-color:var(--good)}
  .pill.dead{color:var(--bad);border-color:var(--bad)}
  .pill.done{color:var(--accent);border-color:var(--accent)}
  .pill.taint{color:var(--warn);border-color:var(--warn)}
  .body{padding:10px 12px;display:flex;flex-direction:column;gap:10px}
  .bar{height:7px;background:#0b0e13;border-radius:4px;overflow:hidden}
  .bar>i{display:block;height:100%}
  .row{display:flex;justify-content:space-between;gap:10px}
  table{width:100%;border-collapse:collapse}
  td{padding:1px 0;vertical-align:top}
  td.k{color:var(--dim);white-space:nowrap;padding-right:10px;width:1%}
  .kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:2px 10px}
  .kv span b{color:var(--ink);font-weight:600}
  .kv span{color:var(--dim)}
  .sect{border-top:1px solid var(--line);padding-top:8px}
  .sect>h3{margin:0 0 5px;font-size:10px;letter-spacing:.09em;color:var(--dim);
    text-transform:uppercase;font-weight:600}
  .log{max-height:170px;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:1px}
  /* flex-shrink:0 is load-bearing: without it 60 lines compress to 2px each
     inside the capped-height flex column and the feed renders as blank space. */
  .log div{flex:0 0 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px}
  .t{color:var(--dim)}
  .e-death{color:var(--bad)} .e-milestone{color:var(--mag)}
  .e-boss-attempt{color:var(--warn)} .e-stall{color:var(--bad)}
  .e-craft,.e-upgrade,.e-equip,.e-build-change{color:var(--good)}
  .watch{margin-left:auto;display:flex;gap:8px;align-items:center}
  a.watch-btn{font-size:10px;padding:2px 9px;border-radius:10px;text-decoration:none;
    border:1px solid var(--accent);color:var(--accent);text-transform:uppercase;letter-spacing:.05em}
  a.watch-btn:hover{background:var(--accent);color:#0b0e13}
  .view{border-top:1px solid var(--line);background:#080b10}
  .view canvas{display:block;width:100%;height:auto;image-rendering:auto}
  .view-off{display:none}
  button.tog{font-size:10px;padding:2px 9px;border-radius:10px;cursor:pointer;
    background:transparent;border:1px solid var(--line);color:var(--dim);
    text-transform:uppercase;letter-spacing:.05em;font-family:inherit}
  button.tog:hover{border-color:var(--accent);color:var(--accent)}
  button.tog.on{border-color:var(--accent);color:var(--accent)}
  .empty{padding:60px 20px;text-align:center;color:var(--dim)}
  code{color:var(--accent)}
</style>
</head>
<body>
<header>
  <h1>Bot Harness</h1>
  <span class="muted" id="count">connecting…</span>
  <span class="muted" id="clock"></span>
</header>
<div class="grid" id="grid"></div>
<div class="empty" id="empty">No bots running. Start one with <code>pnpm bot:run --ui</code>.</div>

<script>
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dur = ms => {
  const s = Math.max(0, Math.round(ms/1000));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  return (h ? h+'h' : '') + String(m).padStart(h?2:1,'0') + 'm' + String(s%60).padStart(2,'0') + 's';
};
const nz = o => Object.entries(o || {}).filter(([,v]) => v > 0);

function slotRows(p){
  const slots = ['weapon','armor','recovery','mobility','core','relic'];
  return slots.map(s => {
    const id = p.equipment[s];
    if (!id) return '';
    const plus = p.upgrades[id] || 0;
    return '<tr><td class="k">'+s+'</td><td>'+esc(id)+
      (plus ? ' <b style="color:var(--good)">+'+plus+'</b>' : '') + '</td></tr>';
  }).join('');
}

function card(b){
  const p = b.player;
  const state = b.finished
    ? '<span class="pill done">'+esc(b.completion || 'ended')+'</span>'
    : p ? (p.alive ? '<span class="pill alive">alive</span>' : '<span class="pill dead">dead</span>')
        : '<span class="pill">connecting</span>';
  const taints = (b.taints||[]).map(t => '<span class="pill taint">'+esc(t.replace('NON_CANONICAL_',''))+'</span>').join('');

  let inner = '';
  if (p) {
    const hpPct = p.maxHp ? Math.max(0, Math.min(100, p.hp/p.maxHp*100)) : 0;
    const hpCol = hpPct > 50 ? 'var(--good)' : hpPct > 25 ? 'var(--warn)' : 'var(--bad)';
    inner += '<div>'
      + '<div class="row"><span class="muted">HP</span><span>'+Math.round(p.hp)+' / '+Math.round(p.maxHp)+'</span></div>'
      + '<div class="bar"><i style="width:'+hpPct+'%;background:'+hpCol+'"></i></div>';
    if (p.barrierMax > 0) {
      const bp = Math.max(0, Math.min(100, p.barrier/p.barrierMax*100));
      inner += '<div class="bar" style="margin-top:2px"><i style="width:'+bp+'%;background:var(--accent)"></i></div>';
    }
    inner += '</div>';

    inner += '<div class="kv">'
      + '<span>tier <b>'+p.playerTier+'</b></span>'
      + '<span>GM <b>'+p.globalMastery+'</b></span>'
      + '<span>atk <b>'+Math.round(p.attack)+'</b></span>'
      + '<span>plate <b>'+Math.round(p.plating)+'</b></span>'
      + '<span>DR <b>'+Math.round(p.damageReduction*100)+'%</b></span>'
      + '<span>dodge <b>'+Math.round(p.dodgeRate*100)+'%</b></span>'
      + '</div>';

    inner += '<div class="sect"><h3>Where</h3><div class="kv">'
      + '<span>node <b>'+esc(p.nodeId)+'</b></span>'
      + '<span>biome <b>'+esc(p.biomeGroup||'—')+'</b></span>'
      + '<span>mod <b>'+esc(p.nodeModifier||'—')+'</b></span>'
      + '<span>target <b>'+esc(p.attackTargetName||'—')+'</b></span>'
      + '<span>attackers <b>'+p.attackersOnSelf+'</b></span>'
      + '<span>mobs <b>'+p.monstersInNode+'</b></span>'
      + '<span>players <b>'+p.otherPlayersInNode+'</b></span>'
      + '</div></div>';

    inner += '<div class="sect"><h3>Equipment</h3><table>'+slotRows(p)+'</table></div>';

    const ess = nz(p.essences).map(([k,v]) => '<span>'+k+' <b>'+v+'</b></span>').join('');
    const cat = nz(p.catalysts).map(([k,v]) => '<span>'+k+' <b>'+v+'</b></span>').join('');
    inner += '<div class="sect"><h3>Resources</h3><div class="kv">'+(ess||'<span>—</span>')+'</div>'
      + (cat ? '<div class="kv" style="margin-top:4px">'+cat+'</div>' : '') + '</div>';

    const lv = nz(p.biomeLevels).map(([k,v]) => '<span>'+k+' <b>'+v+'</b></span>').join('');
    inner += '<div class="sect"><h3>Mastery</h3><div class="kv">'+(lv||'<span>—</span>')+'</div>'
      + '<div class="muted" style="margin-top:4px">bosses: '+(p.bossesCleared.length ? esc(p.bossesCleared.join(', ')) : 'none')+'</div></div>';

    const abil = [].concat(p.techniques.map(a=>'T:'+a), p.guards.map(a=>'G:'+a));
    inner += '<div class="sect"><h3>Build</h3>'
      + '<div class="muted">'+(abil.length ? esc(abil.join('  ')) : 'no abilities')+'</div>'
      + '<div class="muted" style="margin-top:3px">'
      + (p.runes.length ? p.runes.map(r=>esc(r.conditionId)+'&rarr;'+esc(r.actionId)).join(' &middot; ') : 'no runes')
      + '</div></div>';
  }

  inner += '<div class="sect"><h3>Route</h3>'
    + '<div class="row"><span>step '+b.route.stepIndex+' / '+b.route.stepTotal+'</span>'
    + '<span class="muted">'+b.route.milestones.length+' milestones</span></div>'
    + '<div class="bar" style="margin:3px 0"><i style="width:'
    + (b.route.stepTotal ? Math.min(100, b.route.stepIndex/b.route.stepTotal*100) : 0)
    + '%;background:var(--accent)"></i></div>'
    + '<div>'+esc(b.route.stepLabel || '—')+'</div>'
    + (b.stallReason ? '<div class="e-stall" style="margin-top:4px">'+esc(b.stallReason)+'</div>' : '')
    + '</div>';

  const s = b.stats;
  inner += '<div class="sect"><h3>Run</h3><div class="kv">'
    + '<span>kills <b>'+s.kills+'</b></span>'
    + '<span>deaths <b>'+s.deaths+'</b></span>'
    + '<span>dealt <b>'+Math.round(s.damageDealt)+'</b></span>'
    + '<span>taken <b>'+Math.round(s.damageTaken)+'</b></span>'
    + '<span>boss <b>'+s.bossVictories+'/'+s.bossAttempts+'</b></span>'
    + '<span>switches <b>'+s.targetSwitches+'</b></span>'
    + '</div></div>';

  inner += '<div class="sect"><h3>Recent</h3><div class="log">'
    + b.recent.slice().reverse().map(e => '<div class="e-'+esc(e.kind)+'"><span class="t">'+dur(e.atMs)+'</span> '+esc(e.text)+'</div>').join('')
    + '</div></div>';

  const watch = b.watchUrl && !b.finished
    ? '<a class="watch-btn" href="'+esc(b.watchUrl)+'" target="_blank" rel="noopener">world</a>'
    : '';
  const on = viewOpen.has(b.botId);

  return '<div class="card" data-bot="'+esc(b.botId)+'"><h2>'+esc(b.botId)+' '+state+' '+taints
    + '<span class="pill">'+esc(b.policyId)+'</span>'
    + '<span class="watch">'
    + '<button class="tog'+(on?' on':'')+'" data-view="'+esc(b.botId)+'">view</button>'
    + watch + '<span class="muted">'+dur(b.elapsedMs)+'</span></span></h2>'
    + '<div class="view'+(on?'':' view-off')+'" data-host="'+esc(b.botId)+'"></div>'
    + '<div class="body">'+inner+'</div></div>';
}

// Which cards have the schematic viewport open. Survives re-renders.
const viewOpen = new Set(JSON.parse(localStorage.getItem('botViewOpen') || '[]'));

document.addEventListener('click', e => {
  const btn = e.target.closest('button.tog');
  if (!btn) return;
  const id = btn.dataset.view;
  if (viewOpen.has(id)) viewOpen.delete(id); else viewOpen.add(id);
  try { localStorage.setItem('botViewOpen', JSON.stringify([...viewOpen])); } catch {}
  btn.classList.toggle('on');
  const card = btn.closest('.card');
  card?.querySelector('.view')?.classList.toggle('view-off');
  attachCanvases();
  if (viewOpen.has(id)) drawWorld(id);
});

const COLORS = { self:'#3fb950', monster:'#f85149', minion:'#58a6ff', player:'#8b949e' };

/**
 * Canvas elements are kept OUTSIDE the card markup and re-attached after each
 * render. The dashboard replaces the grid's innerHTML once a second; a canvas
 * living inside that markup is destroyed and recreated blank every time, which
 * reads as a viewport that never draws.
 */
const canvases = new Map();

function attachCanvases(){
  for (const host of document.querySelectorAll('.view[data-host]')) {
    const id = host.dataset.host;
    let cv = canvases.get(id);
    if (!cv) {
      cv = document.createElement('canvas');
      cv.width = 800; cv.height = 800;
      canvases.set(id, cv);
    }
    if (cv.parentElement !== host) host.appendChild(cv);
  }
}

function drawWorld(botId){
  const cv = canvases.get(botId);
  if (!cv || !cv.isConnected) return;
  fetch('/api/world?bot=' + encodeURIComponent(botId))
    .then(r => r.ok ? r.json() : null)
    .then(w => {
      if (!w || !w.width) return;
      const ctx = cv.getContext('2d');
      const S = cv.width / w.width;          // world units -> canvas px
      ctx.fillStyle = '#080b10';
      ctx.fillRect(0, 0, cv.width, cv.height);

      // Node bounds + quarter grid, so distances are readable at a glance.
      ctx.strokeStyle = '#1c232c'; ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const q = (cv.width / 4) * i;
        ctx.beginPath(); ctx.moveTo(q, 0); ctx.lineTo(q, cv.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, q); ctx.lineTo(cv.width, q); ctx.stroke();
      }
      ctx.strokeStyle = '#2a323d';
      ctx.strokeRect(0.5, 0.5, cv.width - 1, cv.height - 1);

      const self = w.entities.find(e => e.kind === 'self');
      const byId = new Map(w.entities.map(e => [e.id, e]));

      // Aggro: every line INTO the bot is something currently hitting it. This
      // is the concurrency that kills runs, drawn rather than counted.
      if (self) {
        for (const e of w.entities) {
          if (e.id === self.id || e.targetId !== self.id) continue;
          ctx.strokeStyle = 'rgba(248,81,73,0.55)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(e.x*S, e.y*S); ctx.lineTo(self.x*S, self.y*S); ctx.stroke();
        }
        const tgt = self.targetId ? byId.get(self.targetId) : null;
        if (tgt) {
          ctx.strokeStyle = 'rgba(63,185,80,0.9)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(self.x*S, self.y*S); ctx.lineTo(tgt.x*S, tgt.y*S); ctx.stroke();
        }
      }

      for (const e of w.entities) {
        const x = e.x * S, y = e.y * S, r = Math.max(5, e.radius * S * 1.6);
        ctx.fillStyle = COLORS[e.kind] || '#8b949e';
        ctx.globalAlpha = e.kind === 'self' ? 1 : 0.9;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        if (e.isBoss) {
          ctx.strokeStyle = '#d29922'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.stroke();
        }
        if (e.kind === 'self') {
          // The one dot you are looking for; keep it findable in a crowd.
          ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.stroke();
        }
        // HP bar
        const bw = Math.max(14, r * 2.2), frac = e.maxHp ? Math.max(0, e.hp / e.maxHp) : 0;
        ctx.fillStyle = '#0b0e13'; ctx.fillRect(x - bw/2, y - r - 9, bw, 4);
        ctx.fillStyle = frac > .5 ? '#3fb950' : frac > .25 ? '#d29922' : '#f85149';
        ctx.fillRect(x - bw/2, y - r - 9, bw * frac, 4);
        if (e.kind === 'self' || e.isBoss) {
          ctx.fillStyle = '#e6edf3'; ctx.font = '11px ui-monospace,monospace';
          ctx.textAlign = 'center';
          // Keep the label on-canvas when the entity hugs a node edge.
          const lx = Math.min(cv.width - 60, Math.max(60, x));
          ctx.fillText(e.name, lx, Math.max(12, y - r - 13));
        }
      }

      ctx.fillStyle = '#8b949e'; ctx.font = '12px ui-monospace,monospace';
      ctx.textAlign = 'left';
      ctx.fillText(w.nodeId + (w.nodeModifier ? '  ·  ' + w.nodeModifier : ''), 8, cv.height - 10);
      const atk = self ? w.entities.filter(e => e.targetId === self.id).length : 0;
      ctx.textAlign = 'right';
      ctx.fillStyle = atk > 2 ? '#f85149' : '#8b949e';
      ctx.fillText(atk + ' on you  ·  ' + w.entities.length + ' entities', cv.width - 8, cv.height - 10);
    })
    .catch(() => {});
}

setInterval(() => { for (const id of viewOpen) drawWorld(id); }, 250);

let failures = 0;
async function tick(){
  try {
    const res = await fetch('/api/bots');
    const bots = await res.json();
    failures = 0;
    document.getElementById('count').textContent =
      bots.length + (bots.length === 1 ? ' bot' : ' bots');
    document.getElementById('empty').style.display = bots.length ? 'none' : '';
    document.getElementById('grid').innerHTML = bots.map(card).join('');
    attachCanvases();
    for (const id of viewOpen) drawWorld(id);
  } catch {
    failures++;
    document.getElementById('count').textContent =
      failures > 2 ? 'runner not responding' : 'reconnecting…';
  }
  document.getElementById('clock').textContent = new Date().toLocaleTimeString();
}
tick();
setInterval(tick, 1000);
</script>
</body>
</html>`;
