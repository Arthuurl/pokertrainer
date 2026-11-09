/* Hand evaluator (5-7 cards), Monte Carlo / exact equity vs range, outs analysis. */
var PT = window.PT || (window.PT = {});

PT.CAT_NAMES = ['Carta alta', 'Pareja', 'Doble pareja', 'Trío', 'Escalera', 'Color', 'Full', 'Póker', 'Escalera de color'];

function ptStraightHigh(mask) {
  for (var hi = 12; hi >= 4; hi--) if (((mask >> (hi - 4)) & 31) === 31) return hi;
  if ((mask & 0x100F) === 0x100F) return 3; // wheel A-2-3-4-5
  return -1;
}

/** Evaluate best hand from array of card ids (5..7). Higher score = better. */
PT.evaluate = function (cs) {
  var rc = [0,0,0,0,0,0,0,0,0,0,0,0,0], sc = [0,0,0,0], sm = [0,0,0,0], rm = 0, i, r, s;
  for (i = 0; i < cs.length; i++) { r = cs[i] >> 2; s = cs[i] & 3; rc[r]++; sc[s]++; sm[s] |= 1 << r; rm |= 1 << r; }
  var flushMask = 0;
  for (s = 0; s < 4; s++) if (sc[s] >= 5) {
    var sf = ptStraightHigh(sm[s]);
    if (sf >= 0) return (8 << 20) | (sf << 16);
    flushMask = sm[s];
  }
  var quad = -1, trips = [], pairs = [];
  for (r = 12; r >= 0; r--) {
    if (rc[r] === 4) quad = r; else if (rc[r] === 3) trips.push(r); else if (rc[r] === 2) pairs.push(r);
  }
  function kick(excl, n) { var o = [], z; for (z = 12; z >= 0 && o.length < n; z--) if (rc[z] && excl.indexOf(z) < 0) o.push(z); return o; }
  if (quad >= 0) { var k = kick([quad], 1); return (7 << 20) | (quad << 16) | (k[0] << 12); }
  if (trips.length && (trips.length > 1 || pairs.length)) {
    var p2 = trips.length > 1 ? Math.max(trips[1], pairs[0] == null ? -1 : pairs[0]) : pairs[0];
    return (6 << 20) | (trips[0] << 16) | (p2 << 12);
  }
  if (flushMask) {
    var sh = 0, n = 0;
    for (r = 12; r >= 0 && n < 5; r--) if (flushMask & (1 << r)) { sh |= r << (16 - 4 * n); n++; }
    return (5 << 20) | sh;
  }
  var st = ptStraightHigh(rm);
  if (st >= 0) return (4 << 20) | (st << 16);
  if (trips.length) { var k3 = kick([trips[0]], 2); return (3 << 20) | (trips[0] << 16) | (k3[0] << 12) | (k3[1] << 8); }
  if (pairs.length >= 2) { var k2 = kick([pairs[0], pairs[1]], 1); return (2 << 20) | (pairs[0] << 16) | (pairs[1] << 12) | (k2[0] << 8); }
  if (pairs.length) { var k1 = kick([pairs[0]], 3); return (1 << 20) | (pairs[0] << 16) | (k1[0] << 12) | (k1[1] << 8) | (k1[2] << 4); }
  var hc = kick([], 5);
  return (hc[0] << 16) | (hc[1] << 12) | (hc[2] << 8) | (hc[3] << 4) | (hc[4] || 0);
};
PT.category = function (score) { return score >> 20; };

/** Best category using up to 5 cards (for 4-card boards on flop/turn analysis we pad: evaluate works with >=5) */
PT.evalAny = function (cs) {
  if (cs.length >= 5) return PT.evaluate(cs);
  // < 5 cards: rough eval of pairs/trips only
  var rc = {}, best = 0; cs.forEach(function (c) { rc[c >> 2] = (rc[c >> 2] || 0) + 1; });
  var cnt = Object.keys(rc).map(function (k) { return rc[k]; }).sort(function (a, b) { return b - a; });
  if (cnt[0] === 4) best = 7; else if (cnt[0] === 3 && cnt[1] === 2) best = 6; else if (cnt[0] === 3) best = 3; else if (cnt[0] === 2 && cnt[1] === 2) best = 2; else if (cnt[0] === 2) best = 1;
  return best << 20;
};

/* ---------- Range helpers ---------- */
/** Expand list of class names into combos not colliding with dead cards */
PT.combosFromClasses = function (classes, dead) {
  var d = {}; dead.forEach(function (c) { d[c] = 1; });
  var out = [];
  classes.forEach(function (h) { PT.classCombos(h).forEach(function (cb) { if (!d[cb[0]] && !d[cb[1]]) out.push(cb); }); });
  return out;
};
PT.allCombos = function (dead) { return PT.combosFromClasses(PT.ALL_HANDS, dead); };

/** Board-dependent preset filters. board: ids (>=3). Returns combos. */
PT.presetCombos = function (key, hero, board, extraClasses) {
  var dead = hero.concat(board);
  var all = PT.allCombos(dead);
  if (key === 'any') return all;
  if (key === 'classes') return PT.combosFromClasses(extraClasses || [], dead);
  if (board.length < 3) return null; // needs a flop
  var bScore = PT.evalAny(board), bCat = PT.category(bScore);
  var topR = Math.max.apply(null, board.map(function (c) { return c >> 2; }));
  return all.filter(function (cb) {
    var r1 = cb[0] >> 2, r2 = cb[1] >> 2;
    var sc = PT.evalAny(board.concat(cb)), cat = PT.category(sc);
    var improves = cat > bCat;
    var overpair = r1 === r2 && r1 > topR;
    var strong = improves && cat >= 2; // two pair+, sets, straights, flushes using hole cards
    if (key === 'overpair') return overpair || strong;
    if (key === 'toppair') return overpair || strong || (improves && cat === 1 && (r1 === topR || r2 === topR));
    if (key === 'anypair') return improves && cat >= 1;
    if (key === 'draws') {
      // flush draw (4 to a suit using a hole card), straight draws, or two overcards
      if (board.length >= 5) return false;
      var cards = board.concat(cb), s;
      for (s = 0; s < 4; s++) {
        var n = cards.filter(function (c) { return (c & 3) === s; }).length;
        var hole = ((cb[0] & 3) === s) || ((cb[1] & 3) === s);
        if (n === 4 && hole) return true;
      }
      if (PT.straightOuts(cb, board) >= 4 && cat < 4) return true;
      return r1 > topR && r2 > topR && !improves;
    }
    return true;
  });
};

/** Count distinct ranks that complete a straight using hero hole cards (for draw detection) */
PT.straightOuts = function (hole, board) {
  var used = {}; hole.concat(board).forEach(function (c) { used[c] = 1; });
  var base = PT.evalAny(hole.concat(board));
  if (PT.category(base) >= 4) return 0;
  var boardMask = 0; board.forEach(function (c) { boardMask |= 1 << (c >> 2); });
  var n = 0;
  for (var r = 0; r < 13; r++) {
    var mask = boardMask | (1 << (hole[0] >> 2)) | (1 << (hole[1] >> 2)) | (1 << r);
    var bm = boardMask | (1 << r);
    if (ptStraightHigh(mask) >= 0 && ptStraightHigh(bm) < 0) {
      for (var s = 0; s < 4; s++) if (!used[r * 4 + s]) n++;
    }
  }
  return n;
};

/* ---------- Equity ---------- */
/**
 * Equity of hero vs list of villain combos.
 * Exact enumeration when board has 4-5 cards; Monte Carlo otherwise.
 * cb(progress 0..1) ; done({win,tie,lose,eq,trials,exact})
 */
PT.computeEquity = function (hero, board, combos, opts, onProgress, onDone) {
  opts = opts || {};
  var trialsTarget = opts.trials || 20000;
  var dead = {}; hero.concat(board).forEach(function (c) { dead[c] = 1; });
  combos = combos.filter(function (cb) { return !dead[cb[0]] && !dead[cb[1]] && cb[0] !== cb[1]; });
  if (!combos.length) { onDone({ error: 'El rango del rival no tiene combos disponibles con estas cartas.' }); return; }
  var win = 0, tie = 0, lose = 0, total = 0;
  var need = 5 - board.length;

  if (need <= 1) { // exact
    combos.forEach(function (cb) {
      var deck = [];
      for (var c = 0; c < 52; c++) if (!dead[c] && c !== cb[0] && c !== cb[1]) deck.push(c);
      var runs = need === 0 ? [[]] : deck.map(function (c) { return [c]; });
      runs.forEach(function (rest) {
        var b = board.concat(rest);
        var h = PT.evaluate(hero.concat(b)), v = PT.evaluate(cb.concat(b));
        // weight each villain combo equally regardless of runout count
        var w = 1 / runs.length;
        if (h > v) win += w; else if (h < v) lose += w; else tie += w;
      });
      total += 1;
    });
    onProgress && onProgress(1);
    onDone({ win: win / total, tie: tie / total, lose: lose / total, eq: (win + tie / 2) / total, trials: total, exact: true, combos: combos.length });
    return;
  }
  // Monte Carlo
  var baseDeck = []; for (var c2 = 0; c2 < 52; c2++) if (!dead[c2]) baseDeck.push(c2);
  var chunk = 1500, cancelled = false;
  function step() {
    if (cancelled) return;
    for (var t = 0; t < chunk && total < trialsTarget; t++) {
      var cb = combos[(Math.random() * combos.length) | 0];
      // draw remaining board cards avoiding villain cards
      var b = board.slice(), picked = {};
      while (b.length < 5) {
        var x = baseDeck[(Math.random() * baseDeck.length) | 0];
        if (x === cb[0] || x === cb[1] || picked[x]) continue;
        picked[x] = 1; b.push(x);
      }
      var h = PT.evaluate(hero.concat(b)), v = PT.evaluate(cb.concat(b));
      if (h > v) win++; else if (h < v) lose++; else tie++;
      total++;
    }
    onProgress && onProgress(total / trialsTarget);
    if (total < trialsTarget) setTimeout(step, 0);
    else onDone({ win: win / total, tie: tie / total, lose: lose / total, eq: (win + tie / 2) / total, trials: total, exact: false, combos: combos.length });
  }
  setTimeout(step, 0);
  return { cancel: function () { cancelled = true; } };
};

/* ---------- Outs analysis ---------- */
/**
 * For flop (3) or turn (4) boards. Each unseen card is counted ONCE, labelled with the best
 * improvement it gives. Clean vs dirty:
 *  - pair-type improvements (overcard pairs, two pair from one card) are "sucias" by nature;
 *  - straight outs that put 3+ of a suit on board, or flush/straight outs that pair the board, are "sucias".
 * Also (if combos given) "outs reales vs rango": cards after which hero is ahead of >=50% of the range
 * while currently behind most of it.
 */
PT.analyzeOuts = function (hero, board, combos) {
  if (board.length < 3 || board.length > 4) return null;
  var dead = {}; hero.concat(board).forEach(function (c) { dead[c] = 1; });
  var cur = PT.evalAny(hero.concat(board)), curCat = PT.category(cur);
  var unseen = []; for (var c = 0; c < 52; c++) if (!dead[c]) unseen.push(c);
  var groups = {}, outs = [], clean = 0, dirty = 0;
  unseen.forEach(function (c) {
    var nb = board.concat([c]);
    var sc = PT.evalAny(hero.concat(nb)), cat = PT.category(sc);
    var bcat = PT.category(PT.evalAny(nb));
    if (cat <= curCat || cat <= bcat) return; // no real improvement, or the board plays
    if (cat === 1 && curCat === 0) {
      // only count pairing a hole card that becomes top pair or better than board top
      var top = Math.max.apply(null, board.map(function (x) { return x >> 2; }));
      if ((c >> 2) < top) return;
    }
    var name = PT.CAT_NAMES[cat];
    var isDirty = false, why = '';
    if (cat <= 2) { isDirty = true; why = 'mejora débil (pareja/dobles)'; }
    if (cat === 4) {
      var suitCount = nb.filter(function (x) { return (x & 3) === (c & 3); }).length;
      if (suitCount >= 3) { isDirty = true; why = 'pone 3 del mismo palo en mesa'; }
    }
    if ((cat === 4 || cat === 5) && PT.category(PT.evalAny(nb)) >= 1) { isDirty = true; why = 'empareja la mesa (posible full rival)'; }
    groups[name] = groups[name] || []; groups[name].push(PT.cardStr(c));
    outs.push({ card: PT.cardStr(c), cat: cat, dirty: isDirty, why: why });
    if (isDirty) dirty++; else clean++;
  });
  var res = { outs: outs, groups: groups, clean: clean, dirty: dirty, unseen: unseen.length, currentCat: PT.CAT_NAMES[curCat] };
  if (combos && combos.length) {
    var live = combos.filter(function (cb) { return !dead[cb[0]] && !dead[cb[1]]; });
    if (live.length) {
      var aheadNow = 0;
      live.forEach(function (cb) { if (PT.evalAny(hero.concat(board)) > PT.evalAny(cb.concat(board))) aheadNow++; });
      res.aheadNow = aheadNow / live.length;
      var real = [];
      unseen.forEach(function (c) {
        var nb = board.concat([c]), n = 0, a = 0;
        var h = PT.evalAny(hero.concat(nb));
        live.forEach(function (cb) { if (cb[0] === c || cb[1] === c) return; n++; if (h > PT.evalAny(cb.concat(nb))) a++; });
        if (n && a / n >= 0.5) real.push(PT.cardStr(c));
      });
      res.realOuts = res.aheadNow < 0.5 ? real : null;
    }
  }
  return res;
};

/** Probability helpers */
PT.probNext = function (outs, unseen) { return outs / unseen; };
PT.probByRiver = function (outs, unseen) { // from flop, two cards
  return 1 - ((unseen - outs) / unseen) * ((unseen - 1 - outs) / (unseen - 1));
};
