/* App shell: router, Inicio (dashboard), Progreso */
var PT = window.PT || (window.PT = {});

PT.TIPS = [
  'Contra un fish pasivo: más valor, más grande, cero faroles en river.',
  'Apuesta 1/3 del bote → el rival necesita 20% de equity para pagar. Pot → 33%.',
  'K72 rainbow: c-bet de rango pequeña. 987 two-tone: checkea mucho más.',
  'Si un jugador pasivo sube en el river, casi siempre tiene la mano.',
  'Set-mining: tu call debería ser ≤ 1/15-1/20 del stack efectivo.',
  'Desde SB contra un open: 3bet o fold. Pagar es el leak más caro de las ciegas.',
  'Un farol de river ideal no tiene showdown value y no bloquea las manos que foldean.',
  'Bankroll: 20-30 buy-ins del stake. Baja sin ego si caes de 15-20.',
  'Con SPR ≤ 3 y top pair buen kicker, estás comprometido: planifica el all-in.',
  'MDF = bote / (bote + apuesta). Pero no defiendas basura para cumplirlo.'
];

PT.Dashboard = function (root) {
  var res = PT.Store.results(), st = PT.Store.settings();
  var acc = PT.Stats.acc(res), sk = PT.Stats.streaks(res), today = PT.Stats.today(res);
  var weak = PT.Stats.weakest(res, 3).slice(0, 4);
  var goalPct = Math.min(1, today.length / st.dailyGoal);
  var h = '<div class="view-head"><div><div class="eyebrow">Inicio</div><h1>Hola, Arthur.</h1><p>Entrena con calma: decisiones correctas primero, velocidad después.</p></div>' +
    '<div class="filters"><a class="btn gold" href="#/lab">Entrenar spots →</a><a class="btn" href="#/rapido">Modo rápido</a></div></div>';
  h += '<div class="grid g4">' +
    stat(res.length, 'Spots entrenados') + stat(acc == null ? '—' : PT.pct(acc), 'Precisión global') + stat(sk.cur, 'Racha actual') + stat(sk.best, 'Mejor racha') + '</div>';
  h += '<div class="grid g2" style="margin-top:16px">';
  h += '<div class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Objetivo diario</h3><label class="small muted">Meta <input type="number" id="goal" min="1" max="500" value="' + st.dailyGoal + '" style="width:70px"> spots</label></div>' +
    '<div style="font-family:var(--serif);font-size:2rem;color:var(--cream)">' + today.length + ' <span class="muted" style="font-size:1rem">/ ' + st.dailyGoal + ' hoy</span></div>' +
    '<div class="progressbar" style="margin:10px 0"><i style="width:' + (goalPct * 100) + '%"></i></div>' +
    '<p class="small muted">' + (goalPct >= 1 ? '<span class="ok">Objetivo cumplido.</span> Repasa tus leaks o haz un quiz de rangos.' : 'Te faltan ' + (st.dailyGoal - today.length) + ' spots. Precisión hoy: ' + (today.length ? PT.pct(PT.Stats.acc(today)) : '—') + '.') + '</p></div>';
  h += '<div class="panel"><h3>Tus puntos débiles</h3>' + (weak.length ? weak.map(function (w) {
    return '<div class="hbar"><span>' + PT.esc(w.k) + '</span><div class="track"><i style="width:' + (w.acc * 100) + '%;background:' + (w.acc < 0.5 ? 'var(--bad)' : w.acc < 0.75 ? 'var(--warn)' : 'var(--ok)') + '"></i></div><a class="btn sm" href="#/lab?cat=' + encodeURIComponent(w.k) + '">' + PT.pct(w.acc) + ' · Entrenar</a></div>';
  }).join('') : '<p class="muted">Responde al menos 3 spots de una categoría para detectar leaks.</p>') + '</div></div>';
  var mods = [
    ['#/lab', '♠', 'Laboratorio de spots', PT.SPOTS.length + ' spots preflop → river con análisis GTO y explotador.'],
    ['#/rapido', '⏱', 'Modo rápido', 'Contra reloj (8/12/20 s). Solo la acción y el sizing, como en mesa.'],
    ['#/rangos', '▦', 'Rangos preflop', 'Tablas 13×13 de RFI, vs open y vs 3bet + quiz.'],
    ['#/calc', '%', 'Calculadora', 'Equity real vs rangos, outs limpias/sucias y pot odds.'],
    ['#/academia', '✦', 'Academia', PT.LESSONS.length + ' lecciones cortas con mini-quiz.'],
    ['#/progreso', '↗', 'Progreso', 'Precisión por calle y categoría, rachas y leaks.']
  ];
  h += '<h2 style="margin-top:26px">Módulos</h2><div class="grid g3">' + mods.map(function (m) {
    return '<a class="panel lesson-card" style="text-decoration:none;color:inherit" href="' + m[0] + '"><div class="n">' + m[1] + '</div><h3>' + m[2] + '</h3><p class="muted small" style="margin:0">' + m[3] + '</p></a>';
  }).join('') + '</div>';
  h += '<div class="panel" style="margin-top:16px;display:flex;gap:14px;align-items:center"><span class="gold" style="font-size:1.4rem">♦</span><div><div class="eyebrow">Consejo de reg</div>' + PT.TIPS[(Math.random() * PT.TIPS.length) | 0] + '</div></div>';
  root.innerHTML = h;
  var g = root.querySelector('#goal');
  g.onchange = function () { var s = PT.Store.settings(); s.dailyGoal = Math.max(1, parseInt(g.value, 10) || 20); PT.Store.saveSettings(s); PT.Dashboard(root); };
  function stat(v, l) { return '<div class="panel stat"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>'; }
};

PT.ProgressView = function (root) {
  var res = PT.Store.results(), rq = PT.Store.rangeResults(), les = PT.Store.lessons();
  var acc = PT.Stats.acc(res), sk = PT.Stats.streaks(res);
  var okIds = {}; res.forEach(function (r) { if (r.ok) okIds[r.id] = 1; });
  var nDone = Object.keys(okIds).filter(function (id) { return PT.SPOTS.some(function (s) { return s.id === id; }); }).length;
  var h = '<div class="view-head"><div><div class="eyebrow">Módulo 7</div><h1>Progreso</h1><p>Lo que no se mide no mejora.</p></div><div class="filters"><button class="btn" id="reset">Resetear estadísticas</button></div></div>';
  h += '<div class="grid g4">' + st(res.length, 'Respuestas') + st(acc == null ? '—' : PT.pct(acc), 'Precisión') + st(sk.best, 'Mejor racha') + st(nDone + '/' + PT.SPOTS.length, 'Spots resueltos') + '</div>';
  if (!res.length) { root.innerHTML = h + '<div class="panel empty-state" style="margin-top:16px">Aún no hay datos. <a href="#/lab">Empieza con el laboratorio</a>.</div>'; bindReset(); return; }
  // chart last 50
  var last = res.slice(-50);
  h += '<div class="grid g2" style="margin-top:16px"><div class="panel chart"><h3>Últimas ' + last.length + ' respuestas</h3>' + lineChart(last) + '<p class="small muted">Línea: precisión móvil (ventana de 10). Puntos: verde acierto, rojo fallo.</p></div>';
  // streets
  var bySt = PT.Stats.byKey(res, function (r) { return [r.st]; });
  var byD = PT.Stats.byKey(res, function (r) { return [r.d]; });
  h += '<div class="panel"><h3>Por calle</h3>' + ['preflop', 'flop', 'turn', 'river'].map(function (k) { return bar(PT.STREET_ES[k], bySt[k]); }).join('') +
    '<h3 style="margin-top:14px">Por dificultad</h3>' + ['p', 'i', 'a'].map(function (k) { return bar(PT.DIFF_ES[k], byD[k]); }).join('') + '</div></div>';
  // categories + leaks
  var weak = PT.Stats.weakest(res, 1);
  h += '<div class="grid g2" style="margin-top:16px"><div class="panel"><h3>Por categoría</h3><div style="max-height:560px;overflow:auto"><table class="t"><tr><th>Categoría</th><th>N</th><th>Precisión</th><th></th></tr>' +
    weak.map(function (w) { return '<tr><td>' + PT.esc(w.k) + '</td><td>' + w.n + '</td><td class="' + (w.acc < 0.5 ? 'bad' : w.acc < 0.75 ? 'warn' : 'ok') + '">' + PT.pct(w.acc) + '</td><td><a class="btn sm" href="#/lab?cat=' + encodeURIComponent(w.k) + '">Entrenar</a></td></tr>'; }).join('') + '</table></div></div>';
  var leaks = PT.Stats.weakest(res, 3).filter(function (w) { return w.acc < 0.75; }).slice(0, 3);
  var lessonFor = { 'pot odds': 'l1', 'implied odds': 'l1', 'matemáticas': 'l1', 'SPR': 'l2', 'bote 3bet': 'l2', 'board seco': 'l3', 'board mojado': 'l3', 'range advantage': 'l3', 'nut advantage': 'l3', 'c-bet': 'l4', 'multiway': 'l4', 'thin value': 'l5', 'farol polarizado': 'l5', 'overbet': 'l5', 'blockers': 'l6', 'explotador': 'l7', 'hero fold': 'l7', 'bluff-catcher': 'l5', 'MDF': 'l1' };
  h += '<div class="grid"><div class="panel"><h3>Leaks principales</h3>' + (leaks.length ? leaks.map(function (w) {
    var l = lessonFor[w.k];
    return '<div class="history" style="margin-top:8px"><b>' + PT.esc(w.k) + '</b> — ' + PT.pct(w.acc) + ' en ' + w.n + ' spots.<br><span class="small muted">Siguiente drill: 10 spots de esta categoría en el laboratorio' + (l ? ' + la lección "' + PT.LESSONS.filter(function (x) { return x.id === l; })[0].title + '"' : '') + '.</span><div style="margin-top:6px;display:flex;gap:6px"><a class="btn sm gold" href="#/lab?cat=' + encodeURIComponent(w.k) + '">Drill</a>' + (l ? '<a class="btn sm" href="#/academia/' + l + '">Lección</a>' : '') + '</div></div>';
  }).join('') : '<p class="muted">Sin leaks claros (≥3 respuestas y <75%). Sigue así o sube la dificultad.</p>') + '</div>';
  // quick + ranges + academy
  var q = res.filter(function (r) { return r.mode === 'quick'; }), qok = q.filter(function (r) { return r.ok; });
  var qms = qok.length ? qok.reduce(function (a, r) { return a + r.ms; }, 0) / qok.length : null;
  var rqAcc = PT.Stats.acc(rq);
  h += '<div class="panel"><h3>Modo rápido</h3>' + (q.length ? '<p>Precisión: <b>' + PT.pct(qok.length / q.length) + '</b> en ' + q.length + ' spots · tiempo medio en aciertos: <b>' + (qms == null ? '—' : (qms / 1000).toFixed(1).replace('.', ',') + 's') + '</b> · timeouts: <b>' + q.filter(function (r) { return r.timeout; }).length + '</b></p>' : '<p class="muted">Sin datos todavía.</p>') +
    '<h3 style="margin-top:12px">Quiz de rangos</h3>' + (rq.length ? '<p>Precisión: <b>' + PT.pct(rqAcc) + '</b> en ' + rq.length + ' manos.</p>' : '<p class="muted">Sin datos todavía.</p>') +
    '<h3 style="margin-top:12px">Academia</h3><p>' + PT.LESSONS.map(function (l) { var d = les[l.id]; return '<span class="chip ' + (d ? (d.score === d.total ? 'p' : 'i') : '') + '">' + l.title + (d ? ' ' + d.score + '/' + d.total : '') + '</span>'; }).join('') + '</p></div></div></div>';
  root.innerHTML = h;
  bindReset();

  function bindReset() {
    root.querySelector('#reset').onclick = function () {
      if (confirm('¿Seguro que quieres borrar todas las estadísticas (spots, quiz de rangos y academia)? No se puede deshacer.')) { PT.Store.resetAll(); PT.toast('Estadísticas reseteadas'); PT.ProgressView(root); }
    };
  }
  function st(v, l) { return '<div class="panel stat"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>'; }
  function bar(label, d) {
    if (!d) return '<div class="hbar"><span>' + label + '</span><div class="track"></div><span class="dim small">—</span></div>';
    var a = d.ok / d.n;
    return '<div class="hbar"><span>' + label + '</span><div class="track"><i style="width:' + (a * 100) + '%;background:' + (a < 0.5 ? 'var(--bad)' : a < 0.75 ? 'var(--warn)' : 'var(--ok)') + '"></i></div><span class="small">' + PT.pct(a) + ' <span class="dim">(' + d.n + ')</span></span></div>';
  }
  function lineChart(arr) {
    var W = 600, H = 200, pad = 28, n = arr.length;
    var x = function (i) { return pad + (n === 1 ? 0 : i * (W - 2 * pad) / (n - 1)); }, y = function (v) { return H - pad - v * (H - 2 * pad); };
    var pts = arr.map(function (r, i) { var s = arr.slice(Math.max(0, i - 9), i + 1); return [x(i), y(s.filter(function (q) { return q.ok; }).length / s.length)]; });
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
    [0, .25, .5, .75, 1].forEach(function (v) { svg += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#ffffff14"/><text x="4" y="' + (y(v) + 4) + '" fill="#6d766f" font-size="10">' + (v * 100) + '%</text>'; });
    svg += '<polyline fill="none" stroke="#d4b46a" stroke-width="2.5" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
    arr.forEach(function (r, i) { svg += '<circle cx="' + x(i).toFixed(1) + '" cy="' + (H - 8) + '" r="3.5" fill="' + (r.ok ? '#4fc58a' : '#e86a5c') + '"/>'; });
    return svg + '</svg>';
  }
};

/* ---------- Router ---------- */
PT.App = (function () {
  var current = null;
  var routes = {
    inicio: function (el) { PT.Dashboard(el); return null; },
    lab: function (el, p) { return new PT.Trainer(el, 'lab', p); },
    rapido: function (el, p) { return new PT.Trainer(el, 'quick', p); },
    rangos: function (el) { return new PT.RangesView(el); },
    calc: function (el) { PT.CalcView(el); return null; },
    academia: function (el, p) { PT.AcademyView(el, p); return null; },
    progreso: function (el) { PT.ProgressView(el); return null; }
  };
  function parse() {
    var h = location.hash.replace(/^#\/?/, ''), q = {}, parts = h.split('?');
    if (parts[1]) parts[1].split('&').forEach(function (kv) { var a = kv.split('='); q[a[0]] = decodeURIComponent(a[1] || ''); });
    var seg = parts[0].split('/');
    var name = seg[0] || 'inicio'; if (!routes[name]) name = 'inicio';
    if (name === 'academia' && seg[1]) q.lesson = seg[1];
    return { name: name, params: q };
  }
  function go() {
    if (current && current.destroy) current.destroy();
    var r = parse(), el = document.getElementById('view');
    document.querySelectorAll('.nav a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-r') === r.name); });
    current = routes[r.name](el, r.params);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', go);
  document.addEventListener('keydown', function (e) { if (e.ctrlKey || e.metaKey || e.altKey) return; if (current && current.onKey) current.onKey(e); });
  document.addEventListener('DOMContentLoaded', go);
  return { go: go };
})();
