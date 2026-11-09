/* Entrenador de rangos preflop: grid 13x13 + quiz */
var PT = window.PT || (window.PT = {});

PT.rangeGridHTML = function (sc, opts) {
  opts = opts || {};
  var m = sc ? PT.buildRange(sc) : null, h = '<div class="rgrid">';
  for (var i = 0; i < 13; i++) for (var j = 0; j < 13; j++) {
    var hand = PT.handAt(i, j), cls = 'f', mix = '';
    if (m) { var e = m[hand]; cls = PT.ACTION_INFO[e.a].cls; if (e.m) mix = ' mix'; }
    if (opts.selected) cls = opts.selected[hand] ? 'sel' : 'f';
    if (opts.highlight === hand) mix += ' hl';
    h += '<div class="cell ' + cls + mix + '" data-h="' + hand + '">' + hand + '</div>';
  }
  return h + '</div>';
};

PT.RangesView = function (root) {
  var S = { sc: PT.RANGE_SCENARIOS[0], quiz: false, q: null, answered: false, allScen: false, sess: { n: 0, ok: 0 }, hover: null };

  function answersFor(sc) {
    if (sc.type === 'rfi') return [['r', 'Raise', 'R'], ['f', 'Fold', 'F']];
    if (sc.type === 'vsopen') return [['3', '3bet', 'R'], ['c', 'Call', 'C'], ['f', 'Fold', 'F']];
    return [['4', '4bet', 'R'], ['c', 'Call', 'C'], ['f', 'Fold', 'F']];
  }
  function isBorder(sc, i, j) {
    var m = PT.buildRange(sc), a = m[PT.handAt(i, j)];
    if (a.m) return true;
    var ns = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]];
    return ns.some(function (n) { return n[0] >= 0 && n[0] < 13 && n[1] >= 0 && n[1] < 13 && m[PT.handAt(n[0], n[1])].a !== a.a; });
  }
  function newQ() {
    var sc = S.allScen ? PT.RANGE_SCENARIOS[(Math.random() * PT.RANGE_SCENARIOS.length) | 0] : S.sc;
    var border = [], all = [];
    for (var i = 0; i < 13; i++) for (var j = 0; j < 13; j++) { all.push(PT.handAt(i, j)); if (isBorder(sc, i, j)) border.push(PT.handAt(i, j)); }
    var hand = (Math.random() < 0.7 && border.length) ? border[(Math.random() * border.length) | 0] : all[(Math.random() * all.length) | 0];
    var combos = PT.classCombos(hand), cb = combos[(Math.random() * combos.length) | 0];
    var cards = PT.shuffle([PT.cardStr(cb[0]), PT.cardStr(cb[1])]).sort(function (a, b) { return PT.RANKS.indexOf(b[0]) - PT.RANKS.indexOf(a[0]); });
    S.q = { sc: sc, hand: hand, cards: cards }; S.answered = false; S.res = null;
    if (S.allScen) S.sc = sc;
    render();
  }
  function answer(a) {
    if (!S.q || S.answered) return;
    var e = PT.buildRange(S.q.sc)[S.q.hand];
    var ok = a === e.a || a === e.m;
    S.answered = true; S.res = { a: a, ok: ok, e: e };
    S.sess.n++; if (ok) S.sess.ok++;
    PT.Store.addRangeResult({ sc: S.q.sc.id, hand: S.q.hand, ok: ok, ts: Date.now() });
    render();
  }

  function render() {
    var sc = S.sc, stats = PT.rangeStats(sc);
    var h = '<div class="view-head"><div><div class="eyebrow">Módulo 4</div><h1>Entrenador de rangos preflop</h1><p>6-max cash, 100bb, open 2.5bb. Rangos simplificados a acción principal; el punto blanco = mano mixta.</p></div>' +
      '<div class="filters"><button class="btn ' + (S.quiz ? '' : 'gold') + '" data-mode="view">Ver rangos</button><button class="btn ' + (S.quiz ? 'gold' : '') + '" data-mode="quiz">Modo quiz</button></div></div>';
    h += '<div class="tabs">' + PT.RANGE_SCENARIOS.map(function (x) { return '<button class="btn sm ' + (x.id === sc.id ? 'on' : '') + '" data-sc="' + x.id + '">' + x.name + '</button>'; }).join('') + '</div>';
    h += '<div class="grid" style="grid-template-columns:minmax(0,640px) minmax(280px,1fr);align-items:start">';
    var hl = S.quiz && S.answered ? S.q.hand : null;
    var hide = S.quiz && !S.answered;
    h += '<div class="panel">' + (hide ? '<div class="small muted" style="margin-bottom:8px">La tabla se revela al responder.</div>' : '') + PT.rangeGridHTML(hide ? null : sc, { highlight: hl }) +
      '<div class="legend">' + Object.keys(PT.ACTION_INFO).filter(function (k) { return stats[k] != null; }).map(function (k) {
        return '<span><i style="background:' + PT.ACTION_INFO[k].color + '"></i>' + PT.ACTION_INFO[k].label + ' ' + PT.pct(stats[k], 1) + '</span>';
      }).join('') + '<span><i style="background:#fff;border-radius:50%;width:8px;height:8px"></i>mixta (≈50/50)</span></div>' +
      '<div class="small dim">% = proporción aprox. de las 1326 combinaciones (mixtas repartidas 50/50).</div></div>';
    h += '<div class="panel">';
    if (!S.quiz) {
      h += '<h3>' + sc.name + '</h3><p class="muted">' + sc.desc + '</p><div id="hinfo" class="history">Pasa el ratón por una mano para ver su acción.</div>';
      h += '<p class="small dim" style="margin-top:12px">Aproximaciones inspiradas en soluciones modernas con rake. No son frecuencias exactas de solver: memoriza la acción principal y entiende el porqué (bloqueadores, playability, posición).</p>';
    } else {
      if (!S.q) newQ();
      var q = S.q;
      h += '<label class="small muted" style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><input type="checkbox" id="allsc"' + (S.allScen ? ' checked' : '') + '> Mezclar todos los escenarios</label>';
      h += '<div class="eyebrow">' + q.sc.name + '</div><p class="muted small">' + q.sc.desc + '</p>';
      h += '<div style="display:flex;gap:8px;justify-content:center;margin:16px 0">' + PT.cardHTML(q.cards[0], 'lg', 0) + PT.cardHTML(q.cards[1], 'lg', 60) + '</div>';
      h += '<div style="text-align:center;font-family:var(--serif);font-size:1.4rem;margin-bottom:12px">' + q.hand + '</div>';
      var ans = answersFor(q.sc);
      h += '<div class="actions" style="grid-template-columns:repeat(' + ans.length + ',1fr)">' + ans.map(function (a) {
        return '<button class="act ' + (a[0] === 'f' ? 'fold' : a[0] === 'c' ? 'call' : 'raise') + (S.answered && S.res.a === a[0] ? ' sel' : '') + '" data-qa="' + a[0] + '"' + (S.answered ? ' disabled' : '') + '>' + a[1] + '<small>' + a[2] + '</small></button>';
      }).join('') + '</div>';
      if (S.answered) {
        var e = S.res.e, lab = PT.ACTION_INFO[e.a].label + (e.m ? ' (mixta con ' + PT.ACTION_INFO[e.m].label + ')' : '');
        h += '<div class="feedback"><div class="verdict ' + (S.res.ok ? 'good' : 'badv') + '"><div class="ic">' + (S.res.ok ? '✓' : '✗') + '</div><div><div class="big">' + lab + '</div><div class="small muted">' + q.hand + ' en ' + q.sc.name + '. La celda queda resaltada en la tabla.</div></div></div>' +
          '<div style="margin-top:10px"><button class="btn gold" data-do="qnext">Siguiente <kbd>Enter</kbd></button></div></div>';
      }
      h += '<div class="keyhint">Atajos: <span class="kbd">R</span> raise/3bet/4bet · <span class="kbd">C</span> call · <span class="kbd">F</span> fold · <span class="kbd">Enter</span> siguiente</div>';
      h += '<div class="small muted" style="margin-top:12px">Sesión: <b class="gold">' + S.sess.ok + '/' + S.sess.n + '</b>' + (S.sess.n ? ' (' + PT.pct(S.sess.ok / S.sess.n) + ')' : '') + '</div>';
    }
    h += '</div></div>';
    root.innerHTML = h;
    root.querySelectorAll('[data-sc]').forEach(function (b) { b.onclick = function () { S.sc = PT.RANGE_SCENARIOS.filter(function (x) { return x.id === b.getAttribute('data-sc'); })[0]; S.allScen = false; if (S.quiz) newQ(); else render(); }; });
    root.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { S.quiz = b.getAttribute('data-mode') === 'quiz'; if (S.quiz) newQ(); else render(); }; });
    root.querySelectorAll('[data-qa]').forEach(function (b) { b.onclick = function () { answer(b.getAttribute('data-qa')); }; });
    var nb = root.querySelector('[data-do="qnext"]'); if (nb) nb.onclick = newQ;
    var cb = root.querySelector('#allsc'); if (cb) cb.onchange = function () { S.allScen = cb.checked; newQ(); };
    var info = root.querySelector('#hinfo');
    if (info) root.querySelectorAll('.rgrid .cell').forEach(function (c) {
      c.onmouseenter = c.onclick = function () {
        var hd = c.getAttribute('data-h'), e = PT.buildRange(sc)[hd];
        info.innerHTML = '<b>' + hd + '</b> (' + PT.handCombosCount(hd) + ' combos): ' + PT.ACTION_INFO[e.a].label + (e.m ? ' · <span class="warn">mixta con ' + PT.ACTION_INFO[e.m].label + '</span>' : '');
      };
    });
  }
  this.onKey = function (e) {
    if (!S.quiz || !S.q) return;
    var k = e.key.toLowerCase();
    if (S.answered) { if (k === 'enter' || k === 'n' || k === ' ') { e.preventDefault(); newQ(); } return; }
    var sc = S.q.sc;
    if (k === 'f') answer('f');
    else if (k === 'c' && sc.type !== 'rfi') answer('c');
    else if (k === 'r' || k === '3' || k === '4') answer(sc.type === 'rfi' ? 'r' : sc.type === 'vsopen' ? '3' : '4');
  };
  render();
};
