/* Laboratorio de spots + Modo rápido (contra reloj) */
var PT = window.PT || (window.PT = {});

PT.allTags = function () {
  var m = {}; PT.SPOTS.forEach(function (s) { s.tags.forEach(function (t) { m[t] = (m[t] || 0) + 1; }); });
  return Object.keys(m).sort(function (a, b) { return a.localeCompare(b, 'es'); });
};

PT.potOddsLine = function (spot) {
  if (!spot.tc || spot.rfi) return '';
  var fin = spot.pot + spot.tc, req = spot.tc / fin;
  return 'Pagas ' + PT.fmtBB(spot.tc) + ' para un bote final de ' + PT.fmtBB(fin) + ' → necesitas <b>' + PT.pct(req, 1) + '</b> de equity.';
};

PT.analysisHTML = function (spot) {
  var alts = spot.acc.filter(function (a) { return a !== spot.ca + (spot.sz ? ':' + spot.sz : ''); }).map(function (a) {
    var p = a.split(':');
    if (p[1] === '*') return PT.ACTION_ES[p[0]] + ' (cualquier tamaño)';
    return PT.decisionText(spot, p[0], p[1] || (p[0] === 'raise' || p[0] === 'bet' ? spot.sz : null));
  });
  var po = PT.potOddsLine(spot);
  var h = '<div class="analysis">';
  if (alts.length) h += '<p class="small muted" style="margin:10px 0 0">También aceptado: ' + alts.map(PT.esc).join(' · ') + '</p>';
  h += '<section><h4>1 · Lectura de rangos</h4><p>' + spot.rng + '</p></section>';
  h += '<section><h4>2 · Análisis GTO</h4><p>' + spot.gto + '</p>' + (po ? '<p class="small muted">' + po + '</p>' : '') + '</section>';
  h += '<section><h4>3 · Enfoque explotador</h4><div class="two"><div><b class="ok">vs Fish pasivo</b>' + spot.fish + '</div><div><b class="bad">vs Maniaco</b>' + spot.man + '</div></div></section>';
  if (spot.outs || spot.eq) h += '<section><h4>4 · Outs y equity</h4>' + (spot.outs ? '<p><b>Outs:</b> ' + spot.outs + '</p>' : '') + (spot.eq ? '<p><b>Equity:</b> ' + spot.eq + '</p>' : '') + '</section>';
  else h += '<section><h4>4 · Outs y equity</h4><p class="muted">No es un spot de proyecto: decide el rango y el precio, no las outs.</p></section>';
  h += '</div>';
  return h;
};

PT.Trainer = function (root, mode, params) {
  var quick = mode === 'quick';
  var settings = PT.Store.settings();
  var S = {
    street: 'all', diff: 'all', cat: (params && params.cat) || 'all',
    queue: [], spot: null, sel: null, answered: false, t0: 0, timer: null,
    timeLimit: settings.quickTime || 12, sess: { n: 0, ok: 0, ms: 0, okMs: 0, okN: 0 }, showFull: !quick
  };

  function pool() {
    return PT.SPOTS.filter(function (s) {
      return (S.street === 'all' || s.st === S.street) && (S.diff === 'all' || s.d === S.diff) && (S.cat === 'all' || s.tags.indexOf(S.cat) >= 0);
    });
  }
  function refill() {
    var p = pool();
    // prioritise spots never answered correctly
    var res = PT.Store.results(), okSet = {};
    res.forEach(function (r) { if (r.ok) okSet[r.id] = (okSet[r.id] || 0) + 1; });
    var fresh = PT.shuffle(p.filter(function (s) { return !okSet[s.id]; })), seen = PT.shuffle(p.filter(function (s) { return okSet[s.id]; }));
    S.queue = fresh.concat(seen);
  }
  function next() {
    stopTimer();
    if (!S.queue.length) refill();
    S.spot = S.queue.shift() || null; S.sel = null; S.answered = false; S.showFull = !quick;
    S.t0 = performance.now();
    render();
    if (S.spot && quick) startTimer();
  }

  function startTimer() {
    stopTimer();
    var limit = S.timeLimit * 1000;
    S.timer = setInterval(function () {
      // re-query every tick: the panel re-renders when a sizing menu opens
      var bar = root.querySelector('.timerbar i'), num = root.querySelector('.timerbig');
      var el = performance.now() - S.t0, left = Math.max(0, limit - el);
      if (bar) { bar.style.width = (left / limit * 100) + '%'; bar.style.backgroundPosition = (100 - left / limit * 100) + '% 0'; }
      if (num) num.textContent = (left / 1000).toFixed(1).replace('.', ',') + 's';
      if (left <= 0) { stopTimer(); submit(null, null, true); }
    }, 100);
  }
  function stopTimer() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }

  function submit(action, sz, timeout) {
    if (S.answered || !S.spot) return;
    stopTimer();
    var spot = S.spot, ms = Math.round(performance.now() - S.t0);
    var j = timeout ? { ok: false, actionOk: false } : PT.judge(spot, action, sz);
    S.answered = true;
    S.last = { action: action, sz: sz, ok: j.ok, partial: !j.ok && j.actionOk, timeout: !!timeout, ms: ms };
    S.sess.n++; if (j.ok) { S.sess.ok++; S.sess.okMs += ms; S.sess.okN++; } S.sess.ms += ms;
    PT.Store.addResult({ id: spot.id, mode: mode, st: spot.st, tags: spot.tags, d: spot.d, ok: j.ok, partial: S.last.partial, timeout: !!timeout, ms: ms, ts: Date.now() });
    renderPanel();
  }

  function choose(action) {
    if (S.answered || !S.spot) return;
    var btn = root.querySelector('.act.' + action); if (!btn || btn.disabled) return;
    if (action === 'bet' || action === 'raise') { S.sel = action; renderPanel(); return; }
    submit(action, null);
  }

  /* ---------- Rendering ---------- */
  function filtersHTML() {
    function opt(v, l, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + l + '</option>'; }
    var h = '<div class="filters">';
    h += '<label>Calle<select data-f="street">' + opt('all', 'Todas', S.street) + ['preflop', 'flop', 'turn', 'river'].map(function (x) { return opt(x, PT.STREET_ES[x], S.street); }).join('') + '</select></label>';
    h += '<label>Dificultad<select data-f="diff">' + opt('all', 'Todas', S.diff) + ['p', 'i', 'a'].map(function (x) { return opt(x, PT.DIFF_ES[x], S.diff); }).join('') + '</select></label>';
    h += '<label>Categoría<select data-f="cat">' + opt('all', 'Todas', S.cat) + PT.allTags().map(function (x) { return opt(x, x, S.cat); }).join('') + '</select></label>';
    if (quick) h += '<label>Reloj<select data-f="time">' + [8, 12, 20].map(function (x) { return opt(String(x), x + ' s', String(S.timeLimit)); }).join('') + '</select></label>';
    h += '<label>&nbsp;<button class="btn" data-do="shuffle">⟲ Barajar</button></label>';
    h += '<label>&nbsp;<button class="btn gold" data-do="next">Siguiente <kbd>N</kbd></button></label>';
    h += '</div>';
    return h;
  }

  function render() {
    var n = pool().length;
    var h = '<div class="view-head"><div><div class="eyebrow">' + (quick ? 'Módulo 3' : 'Módulo 2') + '</div><h1>' + (quick ? 'Modo rápido' : 'Laboratorio de spots') + '</h1>' +
      '<p>' + (quick ? 'Decide antes de que acabe el reloj. Primero la acción; el análisis, después.' : 'Spots NLHE 6-max 100bb. Elige la acción y el sizing; recibe el análisis completo.') + ' <span class="dim">(' + n + ' spots con estos filtros)</span></p></div>' + filtersHTML() + '</div>';
    if (!S.spot) { root.innerHTML = h + '<div class="panel empty-state">No hay spots con estos filtros. Cambia calle, dificultad o categoría.</div>'; bindHead(); return; }
    var sp = S.spot;
    h += '<div class="trainer"><div class="panel">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px"><div>' +
      '<span class="chip gold">' + PT.STREET_ES[sp.st] + '</span><span class="chip ' + sp.d + '">' + PT.DIFF_ES[sp.d] + '</span>' +
      sp.tags.map(function (t) { return '<span class="chip">' + PT.esc(t) + '</span>'; }).join('') + '</div><span class="dim small mono">#' + sp.id + '</span></div>';
    h += PT.renderTable(sp);
    h += '<div class="history"><b>Acción:</b> ' + PT.esc(sp.hist) + '</div>';
    h += '<div class="infoline"><span>Posición: <b>' + sp.hp + '</b>' + (sp.vp ? ' vs <b>' + sp.vp + '</b>' : '') + '</span><span>Bote: <b>' + PT.fmtBB(sp.pot) + '</b></span>' +
      (sp.tc && !sp.rfi ? '<span>A pagar: <b>' + PT.fmtBB(sp.tc) + '</b></span>' : '') + '<span>Stack efectivo: <b>' + PT.fmtBB(sp.stk) + '</b></span>' +
      (sp.b.length ? '<span>SPR: <b>' + (sp.stk / sp.pot).toFixed(1).replace('.', ',') + '</b></span>' : '') + '</div>';
    h += '</div><div class="panel" id="tpanel"></div></div>';
    root.innerHTML = h;
    bindHead();
    renderPanel();
  }

  function renderPanel() {
    var el = root.querySelector('#tpanel'); if (!el || !S.spot) return;
    var sp = S.spot, facing = sp.tc > 0, h = '';
    if (quick) {
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline"><span class="eyebrow">Tiempo</span><span class="timerbig">' + (S.answered ? (S.last.timeout ? '0,0s' : '—') : (Math.max(0, S.timeLimit - (performance.now() - S.t0) / 1000)).toFixed(1).replace('.', ',') + 's') + '</span></div><div class="timerbar"><i style="width:' + (S.answered ? 0 : Math.max(0, 100 - (performance.now() - S.t0) / (S.timeLimit * 10))) + '%"></i></div>';
    }
    h += '<div class="eyebrow">Tu decisión</div>';
    var acts = [['fold', 'Fold', 'F'], ['check', 'Check', 'X'], ['call', 'Call', 'C'], ['bet', 'Bet', 'B'], ['raise', sp.st === 'preflop' ? 'Raise' : 'Raise', 'R']];
    h += '<div class="actions">' + acts.map(function (a) {
      var legal = facing ? (a[0] === 'fold' || a[0] === 'call' || a[0] === 'raise') : (a[0] === 'check' || a[0] === 'bet');
      var lab = a[1]; if (a[0] === 'call' && sp.rfi) lab = 'Limp';
      if (a[0] === 'call' && facing && !sp.rfi) lab = 'Call ' + PT.fmtBB(sp.tc);
      var sel = (S.sel === a[0] || (S.answered && S.last && S.last.action === a[0])) ? ' sel' : '';
      return '<button class="act ' + a[0] + sel + '" data-act="' + a[0] + '"' + (!legal || S.answered ? ' disabled' : '') + '>' + lab + '<small>' + a[2] + '</small></button>';
    }).join('') + '</div>';
    if (S.sel && !S.answered) {
      h += '<div class="sizings">' + PT.sizingOptions(sp, S.sel).map(function (o, i) {
        return '<button class="btn sm" data-sz="' + o[0] + '"><kbd>' + (i + 1) + '</kbd> ' + o[1] + '</button>';
      }).join('') + '</div>';
    }
    h += '<div class="keyhint">Atajos: <span class="kbd">F</span> fold · <span class="kbd">X</span> check · <span class="kbd">C</span> call · <span class="kbd">B</span> bet · <span class="kbd">R</span> raise · <span class="kbd">1-6</span> sizing · <span class="kbd">N</span>/<span class="kbd">Enter</span> siguiente</div>';
    if (S.answered) {
      var L = S.last, cls = L.ok ? 'good' : (L.partial ? 'part' : 'badv');
      var icon = L.ok ? '✓' : (L.partial ? '≈' : '✗');
      var dec = PT.decisionText(sp, sp.ca, sp.sz);
      h += '<div class="feedback"><div class="verdict ' + cls + '"><div class="ic ' + (L.ok ? 'ok' : L.partial ? 'warn' : 'bad') + '">' + icon + '</div><div><div class="big">' + PT.esc(dec) + '</div>' +
        '<div class="small muted">' + (L.timeout ? 'Tiempo agotado' : 'Tu respuesta: ' + PT.esc(PT.decisionText(sp, L.action, L.sz)) + (L.partial ? ' — acción correcta, sizing mejorable' : '')) +
        ' · ' + (L.ms / 1000).toFixed(1).replace('.', ',') + 's</div></div></div>';
      if (quick && !S.showFull) h += '<div style="margin-top:10px;display:flex;gap:8px"><button class="btn" data-do="full">Ver análisis completo <kbd>A</kbd></button><button class="btn gold" data-do="next">Siguiente <kbd>N</kbd></button></div>';
      else h += PT.analysisHTML(sp) + '<div style="margin-top:8px"><button class="btn gold" data-do="next">Siguiente spot <kbd>N</kbd></button></div>';
      h += '</div>';
    }
    var s = S.sess;
    h += '<div class="small muted" style="margin-top:14px;border-top:1px solid var(--line);padding-top:10px">Sesión: <b class="gold">' + s.ok + '/' + s.n + '</b>' + (s.n ? ' (' + PT.pct(s.ok / s.n) + ')' : '') +
      (quick && s.okN ? ' · tiempo medio en aciertos: <b>' + (s.okMs / s.okN / 1000).toFixed(1).replace('.', ',') + 's</b>' : '') + '</div>';
    el.innerHTML = h;
    el.querySelectorAll('[data-act]').forEach(function (b) { b.onclick = function () { choose(b.getAttribute('data-act')); }; });
    el.querySelectorAll('[data-sz]').forEach(function (b) { b.onclick = function () { submit(S.sel, b.getAttribute('data-sz')); }; });
    el.querySelectorAll('[data-do="next"]').forEach(function (b) { b.onclick = next; });
    var fb = el.querySelector('[data-do="full"]'); if (fb) fb.onclick = function () { S.showFull = true; renderPanel(); };
    if (quick && !S.answered && S.timer == null && S.t0) { /* timer restarted only on next() */ }
  }

  function bindHead() {
    root.querySelectorAll('[data-f]').forEach(function (sel) {
      sel.onchange = function () {
        var f = sel.getAttribute('data-f');
        if (f === 'time') { S.timeLimit = parseInt(sel.value, 10); var st = PT.Store.settings(); st.quickTime = S.timeLimit; PT.Store.saveSettings(st); next(); return; }
        S[f] = sel.value; S.queue = []; next();
      };
    });
    root.querySelectorAll('.view-head [data-do="shuffle"]').forEach(function (b) { b.onclick = function () { S.queue = []; next(); }; });
    root.querySelectorAll('.view-head [data-do="next"]').forEach(function (b) { b.onclick = next; });
  }

  this.onKey = function (e) {
    var k = e.key.toLowerCase();
    if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
    if (S.answered) {
      if (k === 'n' || k === 'enter' || k === ' ') { e.preventDefault(); next(); }
      else if (k === 'a' && quick) { S.showFull = true; renderPanel(); }
      return;
    }
    var map = { f: 'fold', x: 'check', c: 'call', b: 'bet', r: 'raise' };
    if (map[k]) { e.preventDefault(); choose(map[k]); return; }
    if (/^[1-6]$/.test(k) && S.sel) {
      var o = PT.sizingOptions(S.spot, S.sel)[parseInt(k, 10) - 1];
      if (o) submit(S.sel, o[0]);
    }
    if (k === 'escape') { S.sel = null; renderPanel(); }
    if (k === 'n') next();
  };
  this.destroy = function () { stopTimer(); };
  refill(); next();
};
