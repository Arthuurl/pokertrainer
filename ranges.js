/* Preflop ranges — NLHE 6-max cash, 100bb, open 2.5bb (SB 3bb), rake-aware simplified.
   Each scenario is built from ordered steps: [notation, primaryAction, mixedAlt?]. Later steps override earlier ones.
   Actions: r = raise (open), 3 = 3bet, 4 = 4bet, c = call, f = fold.
   Mixed hands: primary action shown, alternative listed; both count as correct in the quiz.
   These are solver-informed approximations simplified to a primary action, NOT exact solver output. */
var PT = window.PT || (window.PT = {});

PT.RANGE_SCENARIOS = [
  { id: 'rfi_utg', group: 'RFI', name: 'RFI UTG', type: 'rfi', hero: 'UTG',
    desc: 'Primero en hablar, 5 jugadores detrás. Rango ~17%: pares, Ax suited, broadways fuertes y suited connectors altos.',
    steps: [
      ['66+, A2s+, KTs+, QTs+, JTs, T9s, AJo+, KQo', 'r'],
      ['55-22, K9s, Q9s, J9s, 98s, 87s, 76s, 65s, ATo, KJo', 'r', 'f']
    ] },
  { id: 'rfi_hj', group: 'RFI', name: 'RFI HJ', type: 'rfi', hero: 'HJ',
    desc: '4 jugadores detrás. ~21%: añade más suited y broadways offsuit.',
    steps: [
      ['44+, A2s+, K9s+, Q9s+, J9s+, T9s, 98s, 87s, ATo+, KJo+, QJo', 'r'],
      ['33-22, K8s, K7s, Q8s, J8s, T8s, 97s, 76s, 65s, 54s, A9o, KTo, QTo, JTo', 'r', 'f']
    ] },
  { id: 'rfi_co', group: 'RFI', name: 'RFI CO', type: 'rfi', hero: 'CO',
    desc: '3 detrás (BTN + ciegas). ~28%: todos los pares, todos los Axs, Kx suited amplio.',
    steps: [
      ['22+, A2s+, K7s+, Q9s+, J9s+, T8s+, 98s, 87s, 76s, 65s, A9o+, KTo+, QTo+, JTo', 'r'],
      ['K6s-K4s, Q8s, J8s, 97s, 86s, 75s, 54s, A8o, A5o, K9o', 'r', 'f']
    ] },
  { id: 'rfi_btn', group: 'RFI', name: 'RFI BTN', type: 'rfi', hero: 'BTN',
    desc: 'Solo las ciegas detrás y posición garantizada. ~45%: roba agresivo.',
    steps: [
      ['22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, A2o+, K9o+, Q9o+, J9o+, T9o', 'r'],
      ['Q4s-Q2s, J6s, J5s, T6s, 95s, 85s, 74s, 63s, 53s, 43s, K8o-K5o, Q8o, J8o, T8o, 98o, 87o', 'r', 'f']
    ] },
  { id: 'rfi_sb', group: 'RFI', name: 'RFI SB (raise-or-fold)', type: 'rfi', hero: 'SB',
    desc: 'Solo vs BB, fuera de posición postflop. Simplificado a raise 3bb o fold (los solvers también usan limp; aquí no).',
    steps: [
      ['22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, A2o+, K8o+, Q9o+, J9o+, T9o', 'r'],
      ['Q4s-Q2s, J6s, J5s, T6s, 95s, 85s, 74s, 64s, 53s, 43s, K7o, K6o, K5o, Q8o, J8o, T8o, 98o', 'r', 'f']
    ] },
  { id: 'bb_vs_btn', group: 'Vs open', name: 'BB vs BTN open 2.5bb', type: 'vsopen', hero: 'BB', villain: 'BTN',
    desc: 'Cierras la acción con 1.5bb para un bote de 5.5bb: necesitas ~27% de equity cruda. Defensa muy amplia; 3bet lineal-polar a ~11bb.',
    steps: [
      ['22+, A2s+, K2s+, Q2s+, J4s+, T6s+, 95s+, 85s+, 74s+, 63s+, 52s+, 42s+, A2o+, K5o+, Q8o+, J8o+, T8o+, 97o+, 87o, 76o', 'c'],
      ['32s, K4o, K3o, K2o, Q7o, Q6o, J7o, T7o, 96o, 86o, 75o, 65o, 54o', 'c', 'f'],
      ['JJ+, AQs+, AKo, A5s, A4s', '3'],
      ['TT, 99, AJs, KQs, KJs, AQo, A3s, A2s, K9s, Q9s, J9s, T8s, 97s, 86s, 76s, 65s, 54s', '3', 'c']
    ] },
  { id: 'co_vs_utg', group: 'Vs open', name: 'CO vs UTG open 2.5bb', type: 'vsopen', hero: 'CO', villain: 'UTG',
    desc: 'UTG es fuerte y tienes 3 jugadores detrás: 3bet a ~7.5bb (IP) mayoritariamente por valor + algún bluff con bloqueadores; flats selectivos.',
    steps: [
      ['TT-66, AQs, AJs, ATs, KQs, KJs, QJs, JTs', 'c'],
      ['55, 44, KTs, QTs, T9s, 98s', 'c', 'f'],
      ['QQ+, AKs, AKo', '3'],
      ['JJ, AQs, KQs', '3', 'c'],
      ['A5s, A4s, AQo', '3', 'f']
    ] },
  { id: 'sb_vs_btn', group: 'Vs open', name: 'SB vs BTN open (3bet-or-fold)', type: 'vsopen', hero: 'SB', villain: 'BTN',
    desc: 'Fuera de posición y con el BB detrás: estrategia 3bet-or-fold a ~11bb. Pagar desde SB es un leak clásico (squeeze del BB + OOP).',
    steps: [
      ['88+, A9s+, A5s, A4s, KTs+, QTs+, JTs, AJo+, KQo', '3'],
      ['77-55, A8s-A6s, A3s, A2s, K9s, Q9s, J9s, T9s, 98s, 87s, 76s, ATo, KJo', '3', 'f']
    ] },
  { id: 'btn_vs_bb3b', group: 'Vs 3bet', name: 'BTN vs 3bet del BB (11bb)', type: 'vs3bet', hero: 'BTN', villain: 'BB',
    desc: 'Abriste 2.5bb y el BB 3betea a 11bb. Pagas 8.5bb para un bote de 22.5bb (necesitas ~38% pero tienes posición). 4bet a ~24bb.',
    steps: [
      ['JJ-55, AQs-A6s, KQs-K9s, QJs-Q9s, JTs, J9s, T9s, T8s, 98s, 87s, 76s, 65s, AQo', 'c'],
      ['44-22, K8s, Q8s, J8s, 97s, 86s, 54s, AJo, KQo, ATo, KJo', 'c', 'f'],
      ['QQ+, AKo', '4'],
      ['AKs, JJ', '4', 'c'],
      ['A5s, A4s', '4', 'c'],
      ['A3s, A2s', 'c', '4']
    ] }
];

PT.ACTION_INFO = {
  r: { label: 'Raise', cls: 'r', color: 'var(--raise)' },
  '3': { label: '3bet', cls: 't', color: 'var(--threeb)' },
  '4': { label: '4bet', cls: 'q', color: 'var(--fourb)' },
  c: { label: 'Call', cls: 'c', color: 'var(--call)' },
  f: { label: 'Fold', cls: 'f', color: 'var(--fold)' }
};

/** Build map hand -> {a: primary, m: alt|null} */
PT.buildRange = function (sc) {
  if (sc._map) return sc._map;
  var map = {};
  PT.ALL_HANDS.forEach(function (h) { map[h] = { a: 'f', m: null }; });
  sc.steps.forEach(function (st) {
    PT.parseRange(st[0]).forEach(function (h) { map[h] = { a: st[1], m: st[2] || null }; });
  });
  sc._map = map;
  return map;
};
PT.rangeClasses = function (sc, actions) { // classes whose primary action is in actions
  var m = PT.buildRange(sc);
  return PT.ALL_HANDS.filter(function (h) { return actions.indexOf(m[h].a) >= 0 || (m[h].m && actions.indexOf(m[h].m) >= 0 && m[h].a !== 'f'); });
};
PT.rangeStats = function (sc) {
  var m = PT.buildRange(sc), tot = {}, all = 1326;
  // mixed hands are weighted 50/50 between primary and alternative (approximation)
  PT.ALL_HANDS.forEach(function (h) {
    var n = PT.handCombosCount(h), a = m[h].a, b = m[h].m;
    if (b) { tot[a] = (tot[a] || 0) + n / 2; tot[b] = (tot[b] || 0) + n / 2; }
    else tot[a] = (tot[a] || 0) + n;
  });
  var out = {}; Object.keys(tot).forEach(function (k) { out[k] = tot[k] / all; });
  return out;
};
