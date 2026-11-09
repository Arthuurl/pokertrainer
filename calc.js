/* Calculadora de equity, outs y pot odds */
var PT = window.PT || (window.PT = {});
PT.CalcView = function (root) {
  var S = { slots: [null, null, null, null, null, null, null], active: 0, preset: 'toppair', custom: {}, job: null, result: null, outs: null, running: false, prog: 0 };
  var SLOT_NAMES = ['Tu carta 1', 'Tu carta 2', 'Flop 1', 'Flop 2', 'Flop 3', 'Turn', 'River'];

  function presets() {
    var o = [['any', 'Cualquier mano (100%)'], ['overpair', 'Overpair+ (requiere flop)'], ['toppair', 'Top pair+ (requiere flop)'], ['anypair', 'Cualquier pareja+ (requiere flop)'], ['draws', 'Proyectos (color/escalera) + overcards (requiere flop)']];
    PT.RANGE_SCENARIOS.forEach(function (sc) {
      if (sc.type === 'rfi') o.push(['sc:' + sc.id + ':r', 'Rango de open ' + sc.hero + (sc.hero === 'BTN' ? ' (c-bet wide)' : '')]);
      else {
        var ag = sc.type === 'vsopen' ? '3' : '4';
        o.push(['sc:' + sc.id + ':c', sc.name + ' — call']);
        o.push(['sc:' + sc.id + ':' + ag, sc.name + ' — ' + (ag === '3' ? '3bet' : '4bet')]);
      }
    });
    o.push(['custom', 'Personalizado (selecciona en la tabla)']);
    return o;
  }
  function hero() { return S.slots.slice(0, 2).filter(Boolean).map(PT.cardId); }
  function board() { var b = S.slots.slice(2); var out = []; for (var i = 0; i < 5; i++) { if (!b[i]) break; out.push(PT.cardId(b[i])); } return out; }
  function villainCombos() {
    var hh = hero(), bb = board();
    if (S.preset.indexOf('sc:') === 0) {
      var p = S.preset.split(':'), sc = PT.RANGE_SCENARIOS.filter(function (x) { return x.id === p[1]; })[0];
      return PT.combosFromClasses(PT.rangeClasses(sc, [p[2]]), hh.concat(bb));
    }
    if (S.preset === 'custom') return PT.combosFromClasses(Object.keys(S.custom).filter(function (k) { return S.custom[k]; }), hh.concat(bb));
    return PT.presetCombos(S.preset, hh, bb);
  }

  function pickerHTML() {
    var used = {}; S.slots.forEach(function (c) { if (c) used[c] = 1; });
    var h = '<div class="picker">';
    'shdc'.split('').forEach(function (s) {
      'AKQJT98765432'.split('').forEach(function (r) {
        var c = r + s, red = s === 'h' || s === 'd';
        h += '<div class="pk' + (red ? ' red' : '') + (used[c] ? ' used' : '') + '" data-c="' + c + '">' + PT.RANK_LABEL(r) + PT.SUIT_SYM[s] + '</div>';
      });
    });
    return h + '</div>';
  }

  function render() {
    var h = '<div class="view-head"><div><div class="eyebrow">Módulo 5</div><h1>Calculadora de equity y outs</h1><p>Evaluador real de 7 cartas: enumeración exacta en turn/river, Monte Carlo (20.000 runouts) en preflop/flop.</p></div></div>';
    h += '<div class="grid" style="grid-template-columns:minmax(0,1.1fr) minmax(320px,1fr);align-items:start">';
    // left: cards
    h += '<div class="panel"><h3>Cartas</h3><div class="slots">';
    S.slots.forEach(function (c, i) {
      if (i === 2) h += '<span class="dim" style="margin:0 6px">|</span>';
      h += '<div class="slot' + (S.active === i ? ' active' : '') + '" data-slot="' + i + '" title="' + SLOT_NAMES[i] + '">' + PT.cardHTML(c, 'sm') + '</div>';
    });
    h += '</div><div class="small muted" style="margin-top:6px">Seleccionando: <b class="gold">' + SLOT_NAMES[S.active] + '</b>. Clic en una carta colocada para quitarla.</div>';
    h += pickerHTML();
    h += '<div class="filters" style="margin-top:12px"><button class="btn sm" data-do="clear">Limpiar todo</button><button class="btn sm" data-do="clearb">Limpiar board</button><button class="btn sm" data-do="rhero">Mano aleatoria</button><button class="btn sm" data-do="rflop">Flop aleatorio</button></div>';
    h += '<h3 style="margin-top:18px">Rango del rival</h3><select id="preset" style="width:100%">' + presets().map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === S.preset ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
    if (S.preset === 'custom') {
      var n = Object.keys(S.custom).filter(function (k) { return S.custom[k]; }).reduce(function (a, k) { return a + PT.handCombosCount(k); }, 0);
      h += '<div class="small muted" style="margin:8px 0">Clic o arrastra para seleccionar. ' + n + ' combos (' + PT.pct(n / 1326, 1) + ').</div>' + PT.rangeGridHTML(null, { selected: S.custom }) +
        '<div class="filters" style="margin-top:8px"><button class="btn sm" data-do="cnone">Vaciar</button><button class="btn sm" data-do="cbtn">Cargar open BTN</button><button class="btn sm" data-do="cbb">Cargar defensa BB vs BTN</button></div>';
    }
    h += '<div style="margin-top:14px"><button class="btn gold" data-do="calc"' + (S.running ? ' disabled' : '') + '>Calcular equity</button></div></div>';
    // right: results + pot odds
    h += '<div class="grid"><div class="panel" id="res">' + resultsHTML() + '</div>' + potOddsHTML() + '</div></div>';
    root.innerHTML = h;
    bind();
  }

  function resultsHTML() {
    if (S.running) return '<h3>Calculando…</h3><div class="progressbar"><i style="width:' + Math.round(S.prog * 100) + '%"></i></div><p class="small muted">' + Math.round(S.prog * 100) + '% de los runouts</p>';
    if (S.err) return '<h3>Resultado</h3><p class="bad">' + S.err + '</p>';
    if (!S.result) return '<h3>Resultado</h3><p class="muted">Elige tus 2 cartas, 0-5 cartas de board y un rango. Pulsa <b>Calcular</b>.</p>';
    var r = S.result, h = '<h3>Equity: <span class="gold">' + PT.pct(r.eq, 1) + '</span></h3>';
    h += '<div class="eqbar"><div class="h" style="width:' + (r.win * 100) + '%">' + (r.win > 0.12 ? 'Gana ' + PT.pct(r.win, 1) : '') + '</div><div class="t" style="width:' + (r.tie * 100) + '%">' + (r.tie > 0.06 ? PT.pct(r.tie, 0) : '') + '</div><div class="v">' + (r.lose > 0.12 ? 'Pierde ' + PT.pct(r.lose, 1) : '') + '</div></div>';
    h += '<p class="small muted" style="margin-top:8px">' + (r.exact ? 'Cálculo exacto (enumeración completa)' : 'Monte Carlo: ' + r.trials.toLocaleString('es-ES') + ' runouts (±~0,7%)') + ' · ' + r.combos + ' combos del rival · empate ' + PT.pct(r.tie, 1) + '</p>';
    if (S.outs) {
      var o = S.outs, b = board().length, unseen = o.unseen;
      var total = o.clean + o.dirty;
      h += '<h3 style="margin-top:16px">Outs</h3><p>Mano actual: <b>' + o.currentCat + '</b>. Outs de mejora (cada carta contada una vez): <b class="gold">' + total + '</b> — <span class="ok">' + o.clean + ' limpias</span>, <span class="warn">' + o.dirty + ' sucias</span>.</p>';
      h += '<table class="t"><tr><th>Mejora a</th><th>Cartas</th><th>Nº</th></tr>' + Object.keys(o.groups).map(function (g) {
        return '<tr><td>' + g + '</td><td class="mono small">' + o.groups[g].map(function (c) { return PT.RANK_LABEL(c[0]) + PT.SUIT_SYM[c[1]]; }).join(' ') + '</td><td>' + o.groups[g].length + '</td></tr>';
      }).join('') + '</table>';
      var dirtyNotes = {}; o.outs.forEach(function (x) { if (x.dirty) dirtyNotes[x.why] = (dirtyNotes[x.why] || 0) + 1; });
      if (Object.keys(dirtyNotes).length) h += '<p class="small muted">Sucias: ' + Object.keys(dirtyNotes).map(function (k) { return dirtyNotes[k] + ' por ' + k; }).join(' · ') + '.</p>';
      h += '<p class="small">Probabilidad de ligar alguna out en la próxima carta: <b>' + PT.pct(total / unseen, 1) + '</b> (limpias: ' + PT.pct(o.clean / unseen, 1) + ')' +
        (b === 3 ? ' · hasta el river (viendo 2 cartas): <b>' + PT.pct(PT.probByRiver(total, unseen), 1) + '</b>' : '') + '. Regla rápida: ' + total + ' × ' + (b === 3 ? '2 / ×4' : '2') + ' ≈ ' + (total * 2) + '%' + (b === 3 ? ' / ' + (total * 4) + '%' : '') + (b === 3 && total > 12 ? ' (con más de ~12 outs la regla del 4 sobrestima; usa el % exacto)' : '') + '.</p>';
      if (o.realOuts) h += '<p class="small">Vs este rango vas por delante ahora del <b>' + PT.pct(o.aheadNow, 0) + '</b> de combos. Cartas que te ponen por delante de ≥50% del rango ("outs reales"): <b>' + o.realOuts.length + '</b>' + (o.realOuts.length ? ' <span class="mono dim">(' + o.realOuts.map(function (c) { return PT.RANK_LABEL(c[0]) + PT.SUIT_SYM[c[1]]; }).join(' ') + ')</span>' : '') + '.</p>';
      else if (o.aheadNow != null) h += '<p class="small">Ya vas por delante del <b>' + PT.pct(o.aheadNow, 0) + '</b> de los combos del rango con la mano actual: piensa en valor y protección, no en outs.</p>';
    }
    return h;
  }

  function potOddsHTML() {
    var h = '<div class="panel"><h3>Pot odds</h3><div class="filters"><label>Bote (incl. apuesta rival)<input type="number" id="po-pot" min="0" step="0.5" value="' + (S.pot || 15) + '"></label><label>A pagar<input type="number" id="po-call" min="0" step="0.5" value="' + (S.call || 5) + '"></label></div><div id="po-out" style="margin-top:10px"></div></div>';
    return h;
  }
  function updatePotOdds() {
    var pot = parseFloat(root.querySelector('#po-pot').value) || 0, call = parseFloat(root.querySelector('#po-call').value) || 0;
    S.pot = pot; S.call = call;
    var out = root.querySelector('#po-out'); if (!out) return;
    if (call <= 0) { out.innerHTML = '<p class="muted">Introduce la cantidad a pagar.</p>'; return; }
    var req = call / (pot + call), h = '<p>Equity requerida: <b class="gold">' + PT.pct(req, 1) + '</b> (pagas ' + call + ' para un bote final de ' + (pot + call) + '; odds ' + (pot / call).toFixed(1).replace('.', ',') + ':1).</p>';
    if (S.result) {
      var eq = S.result.eq, ev = eq * (pot + call) - call;
      h += '<p>Con tu equity calculada (<b>' + PT.pct(eq, 1) + '</b>): EV del call ≈ <b class="' + (ev >= 0 ? 'ok' : 'bad') + '">' + (ev >= 0 ? '+' : '') + ev.toFixed(2).replace('.', ',') + '</b> → ' + (ev >= 0 ? '<span class="ok">call +EV</span>' : '<span class="bad">call −EV a precio directo</span>') + '.</p>';
      var b = board().length;
      if (ev < 0 && b < 5 && eq > 0) {
        var X = call / eq - pot - call;
        h += '<p class="small muted">Implied odds: necesitarías ganar de media ~' + X.toFixed(1).replace('.', ',') + ' extra en calles futuras cuando ligues para que el call sea neutro. Solo cuenta si quedan stacks detrás y tu proyecto es a nuts (no vale contra un all-in). La equity calculada asume ver todas las cartas hasta el river' + (b === 3 ? '; si el rival apuesta también el turn, tu equity real al precio de hoy es menor.' : '.') + '</p>';
      } else if (b < 5 && ev >= 0) h += '<p class="small muted">Ojo: en flop, la equity asume ver turn y river. Si el rival apostará también el turn, mira la probabilidad de la próxima carta.</p>';
    } else h += '<p class="small muted">Calcula la equity a la izquierda para ver si el call es +EV.</p>';
    out.innerHTML = h;
  }

  function placeCard(c) {
    if (S.slots.indexOf(c) >= 0) return;
    S.slots[S.active] = c;
    // advance to next empty slot
    for (var k = 1; k <= 7; k++) { var n = (S.active + k) % 7; if (!S.slots[n]) { S.active = n; break; } }
    S.result = null; S.outs = null; S.err = null;
    render();
  }
  function randFill(idxs) {
    var used = {}; S.slots.forEach(function (c, i) { if (c && idxs.indexOf(i) < 0) used[c] = 1; });
    var deck = []; for (var i = 0; i < 52; i++) { var cs = PT.cardStr(i); if (!used[cs]) deck.push(cs); }
    PT.shuffle(deck); idxs.forEach(function (i, k) { S.slots[i] = deck[k]; });
    S.result = null; S.outs = null; S.err = null;
  }

  function calc() {
    var hh = hero(), bb = board();
    S.err = null; S.result = null; S.outs = null;
    if (hh.length < 2) { S.err = 'Selecciona tus dos cartas.'; render(); return; }
    var b2 = S.slots.slice(2); if ((b2[3] && !b2[2]) || (b2[4] && !b2[3]) || ((b2[0] || b2[1] || b2[2]) && !(b2[0] && b2[1] && b2[2]))) { S.err = 'El board debe tener 0, 3, 4 o 5 cartas en orden (flop completo antes del turn).'; render(); return; }
    var combos = villainCombos();
    if (combos === null) { S.err = 'Ese preset depende del board: añade al menos el flop, o elige un rango preflop.'; render(); return; }
    if (!combos.length) { S.err = 'El rango seleccionado no tiene combos posibles con estas cartas.'; render(); return; }
    S.running = true; S.prog = 0; render();
    var t0 = Date.now();
    PT.computeEquity(hh, bb, combos, { trials: 20000 }, function (p) {
      S.prog = p; var r = root.querySelector('#res'); if (r) r.innerHTML = resultsHTML();
    }, function (res) {
      S.running = false;
      if (res.error) { S.err = res.error; render(); return; }
      S.result = res;
      if (bb.length === 3 || bb.length === 4) S.outs = PT.analyzeOuts(hh, bb, combos.length > 1500 ? PT.shuffle(combos.slice()).slice(0, 1500) : combos);
      render();
    });
  }

  function bind() {
    root.querySelectorAll('[data-slot]').forEach(function (s) {
      s.onclick = function () { var i = +s.getAttribute('data-slot'); if (S.slots[i] && S.active === i) { S.slots[i] = null; S.result = null; S.outs = null; } S.active = i; render(); };
    });
    root.querySelectorAll('.pk').forEach(function (p) { p.onclick = function () { if (!p.classList.contains('used')) placeCard(p.getAttribute('data-c')); }; });
    var acts = {
      clear: function () { S.slots = [null, null, null, null, null, null, null]; S.active = 0; S.result = null; S.outs = null; S.err = null; },
      clearb: function () { for (var i = 2; i < 7; i++) S.slots[i] = null; S.active = 2; S.result = null; S.outs = null; S.err = null; },
      rhero: function () { randFill([0, 1]); },
      rflop: function () { for (var i = 5; i < 7; i++) S.slots[i] = null; randFill([2, 3, 4]); },
      cnone: function () { S.custom = {}; },
      cbtn: function () { S.custom = {}; PT.rangeClasses(PT.RANGE_SCENARIOS[3], ['r']).forEach(function (h) { S.custom[h] = 1; }); },
      cbb: function () { S.custom = {}; PT.rangeClasses(PT.RANGE_SCENARIOS[5], ['c', '3']).forEach(function (h) { S.custom[h] = 1; }); },
      calc: function () { calc(); return true; }
    };
    root.querySelectorAll('[data-do]').forEach(function (b) { b.onclick = function () { if (!acts[b.getAttribute('data-do')]()) render(); }; });
    var ps = root.querySelector('#preset'); ps.onchange = function () { S.preset = ps.value; S.result = null; S.outs = null; render(); };
    // custom grid drag-select
    var grid = root.querySelector('.rgrid');
    if (grid && S.preset === 'custom') {
      var down = false, val = 1;
      grid.querySelectorAll('.cell').forEach(function (c) {
        var hnd = c.getAttribute('data-h');
        c.onmousedown = function (e) { e.preventDefault(); down = true; val = S.custom[hnd] ? 0 : 1; S.custom[hnd] = val; c.className = 'cell ' + (val ? 'sel' : 'f'); };
        c.onmouseenter = function () { if (down) { S.custom[hnd] = val; c.className = 'cell ' + (val ? 'sel' : 'f'); } };
      });
      document.addEventListener('mouseup', function up() { if (down) { down = false; render(); } document.removeEventListener('mouseup', up); });
    }
    ['#po-pot', '#po-call'].forEach(function (id) { var i = root.querySelector(id); if (i) i.oninput = updatePotOdds; });
    updatePotOdds();
  }
  render();
};
