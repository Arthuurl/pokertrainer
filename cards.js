/* Cards & shared utilities. Classic script (no modules) so it works on file:// */
var PT = window.PT || (window.PT = {});

PT.RANKS = '23456789TJQKA';       // index 0..12
PT.SUITS = 'shdc';                // spades, hearts, diamonds, clubs
PT.SUIT_SYM = { s: '♠', h: '♥', d: '♦', c: '♣' };
PT.RANK_LABEL = function (r) { return r === 'T' ? '10' : r; };

/** "Ah" -> int id (rank*4+suit) */
PT.cardId = function (str) {
  var r = PT.RANKS.indexOf(str[0].toUpperCase());
  var s = PT.SUITS.indexOf(str[1].toLowerCase());
  if (r < 0 || s < 0) throw new Error('Carta inválida: ' + str);
  return r * 4 + s;
};
PT.cardStr = function (id) { return PT.RANKS[id >> 2] + PT.SUITS[id & 3]; };

/** HTML for one card. size: '', 'lg', 'sm', 'xs'. delay in ms for deal animation */
PT.cardHTML = function (str, size, delay, extraClass) {
  if (!str) return '<div class="card empty ' + (size || '') + '"></div>';
  var r = str[0], s = str[1];
  var red = (s === 'h' || s === 'd');
  var st = delay != null ? ' style="animation-delay:' + delay + 'ms"' : '';
  return '<div class="card ' + (size || '') + (red ? ' red' : '') + (delay != null ? ' deal' : '') + ' ' + (extraClass || '') + '"' + st +
    ' aria-label="' + PT.RANK_LABEL(r) + ' de ' + ({ s: 'picas', h: 'corazones', d: 'diamantes', c: 'tréboles' })[s] + '">' +
    '<div class="ci">' + PT.RANK_LABEL(r) + '<span>' + PT.SUIT_SYM[s] + '</span></div>' +
    '<div class="cc">' + PT.SUIT_SYM[s] + '</div></div>';
};
PT.backHTML = function (size) { return '<div class="card back ' + (size || '') + '"></div>'; };

PT.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
PT.shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
PT.fmtBB = function (x) { return (Math.round(x * 10) / 10).toString().replace('.', ',') + 'bb'; };
PT.pct = function (x, d) { return (x * 100).toFixed(d == null ? 0 : d).replace('.', ',') + '%'; };
PT.toast = function (msg) {
  var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, 2200);
};

/* ---------- 169 hand classes ---------- */
// grid row i, col j (0 = A ... 12 = 2). i==j pair, i<j suited (upper-right), i>j offsuit.
PT.GRID_RANKS = 'AKQJT98765432';
PT.handAt = function (i, j) {
  var a = PT.GRID_RANKS[i], b = PT.GRID_RANKS[j];
  if (i === j) return a + b;
  if (i < j) return a + b + 's';
  return b + a + 'o';
};
PT.ALL_HANDS = (function () { var o = []; for (var i = 0; i < 13; i++) for (var j = 0; j < 13; j++) o.push(PT.handAt(i, j)); return o; })();
PT.handCombosCount = function (h) { return h.length === 2 ? 6 : (h[2] === 's' ? 4 : 12); };

/** All concrete combos of a hand class, as [id,id] */
PT.classCombos = function (h) {
  var r1 = PT.RANKS.indexOf(h[0]), r2 = PT.RANKS.indexOf(h[1]), out = [], a, b;
  if (h.length === 2) { for (a = 0; a < 4; a++) for (b = a + 1; b < 4; b++) out.push([r1 * 4 + a, r2 * 4 + b]); }
  else if (h[2] === 's') { for (a = 0; a < 4; a++) out.push([r1 * 4 + a, r2 * 4 + a]); }
  else { for (a = 0; a < 4; a++) for (b = 0; b < 4; b++) if (a !== b) out.push([r1 * 4 + a, r2 * 4 + b]); }
  return out;
};
/** Class name of two concrete cards */
PT.classOf = function (c1, c2) {
  var r1 = c1 >> 2, r2 = c2 >> 2;
  if (r1 < r2) { var t = r1; r1 = r2; r2 = t; }
  if (r1 === r2) return PT.RANKS[r1] + PT.RANKS[r2];
  return PT.RANKS[r1] + PT.RANKS[r2] + (((c1 & 3) === (c2 & 3)) ? 's' : 'o');
};

/* ---------- Range notation parser: "22+, A2s+, K9s-K6s, AJo+, AK, KQo" ---------- */
PT.parseRange = function (str) {
  var R = PT.RANKS, out = [];
  function rk(c) { return R.indexOf(c); }
  function nm(a, b, t) { return R[a] + R[b] + (t || ''); }
  str.split(',').forEach(function (tok) {
    tok = tok.trim(); if (!tok) return;
    var plus = tok.endsWith('+'); if (plus) tok = tok.slice(0, -1);
    var dash = tok.split('-');
    if (dash.length === 2) {
      var A = dash[0], B = dash[1];
      if (A[0] === A[1]) { // pair range 22-55 or 55-22
        var lo = Math.min(rk(A[0]), rk(B[0])), hi = Math.max(rk(A[0]), rk(B[0]));
        for (var p = lo; p <= hi; p++) out.push(nm(p, p));
      } else {
        var t = A[2] || '', top = rk(A[0]);
        var k1 = rk(A[1]), k2 = rk(B[1]), l = Math.min(k1, k2), h = Math.max(k1, k2);
        for (var k = l; k <= h; k++) { if (t) out.push(nm(top, k, t)); else { out.push(nm(top, k, 's')); out.push(nm(top, k, 'o')); } }
      }
      return;
    }
    if (tok[0] === tok[1]) { // pair
      var pr = rk(tok[0]);
      if (plus) for (var q = pr; q <= 12; q++) out.push(nm(q, q)); else out.push(tok);
      return;
    }
    var ty = tok[2] || '', hiR = rk(tok[0]), kr = rk(tok[1]);
    var ks = plus ? (function () { var a = []; for (var z = kr; z < hiR; z++) a.push(z); return a; })() : [kr];
    ks.forEach(function (z) { if (ty) out.push(nm(hiR, z, ty)); else { out.push(nm(hiR, z, 's')); out.push(nm(hiR, z, 'o')); } });
  });
  return out;
};
