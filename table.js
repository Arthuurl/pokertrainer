/* Poker table renderer + spot helpers (labels, sizing options, judging) */
var PT = window.PT || (window.PT = {});
PT.POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
PT.STREET_ES = { preflop: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River' };
PT.DIFF_ES = { p: 'Principiante', i: 'Intermedio', a: 'Avanzado' };
PT.ACTION_ES = { fold: 'Fold', check: 'Check', call: 'Call', bet: 'Bet', raise: 'Raise' };
PT.VT_ES = { fish: 'Fish pasivo', maniaco: 'Maniaco', reg: 'Reg' };

// Seat coordinates (% of table box), clockwise from hero at bottom
PT.SEAT_XY = [[50, 93], [12, 70], [14, 20], [50, 6], [86, 20], [88, 70]];
PT.BET_XY = [[50, 72], [27, 63], [28, 33], [50, 25], [72, 33], [73, 63]];
PT.DEALER_XY = [[64, 84], [22, 56], [24, 30], [60, 18], [77, 42], [78, 56]];

PT.sizingOptions = function (spot, action) {
  if (action === 'bet') return [['1/3', '1/3'], ['1/2', '1/2'], ['2/3', '2/3'], ['pot', 'Pot'], ['1.5x', 'Overbet 1.5x'], ['allin', 'All-in']];
  if (spot.st === 'preflop') {
    if (spot.rfi) return [['2.5x', '2.5bb'], ['3x', '3bb'], ['4x', '4bb'], ['5x', '5bb'], ['allin', 'All-in']];
    return [['2.5x', '2.5x'], ['3x', '3x'], ['4x', '4x'], ['5x', '5x'], ['allin', 'All-in']];
  }
  return [['2x', 'Min (2x)'], ['2.5x', '2.5x'], ['3x', '3x'], ['4x', '4x'], ['allin', 'All-in']];
};

PT.sizingText = function (spot, action, sz) {
  if (!sz) return '';
  if (sz === 'allin') return 'all-in';
  if (action === 'bet') return ({ '1/3': '1/3 del bote', '1/2': '1/2 del bote', '2/3': '2/3 del bote', 'pot': 'bote (100%)', '1.5x': 'overbet 1.5x del bote' })[sz] || sz;
  var n = parseFloat(sz);
  if (spot.st === 'preflop') {
    if (spot.rfi) return n + 'bb';
    var base = spot.tc + (spot.inv != null ? spot.inv : (spot.hp === 'BB' ? 1 : spot.hp === 'SB' ? 0.5 : 0)); // total size of the bet faced
    var to = Math.round(base * n * 10) / 10;
    return n + 'x (~' + to + 'bb)';
  }
  return n + 'x la apuesta' + (spot.tc ? ' (~' + (Math.round(spot.tc * n * 10) / 10) + 'bb)' : '');
};

/** "Raise a 2/3 del bote" style decision line */
PT.decisionText = function (spot, action, sz) {
  if (action === 'bet') return 'Bet ' + PT.sizingText(spot, action, sz);
  if (action === 'raise') {
    var verb = 'Raise';
    if (spot.st === 'preflop' && !spot.rfi) {
      var t = spot.tags.join(' ');
      verb = /squeeze/.test(t) ? 'Squeeze' : /4bet/.test(t) && spot.tc > 5 ? '4bet' : '3bet';
      if (/vs 3bet/.test(t)) verb = '4bet';
      if (spot.id === 'p24') verb = '5bet';
    }
    return sz === 'allin' ? verb + ' all-in' : verb + ' a ' + PT.sizingText(spot, action, sz);
  }
  return PT.ACTION_ES[action];
};

/** Judge an answer. Returns {ok, actionOk} */
PT.judge = function (spot, action, sz) {
  var list = spot.acc.slice();
  list.push(spot.ca + (spot.sz ? ':' + spot.sz : ''));
  var ok = list.some(function (a) {
    var p = a.split(':'), ac = p[0], s = p[1];
    if (ac !== action) return false;
    if (action !== 'bet' && action !== 'raise') return true;
    if (!s) return sz !== 'allin';
    if (s === '*') return true;
    return s === sz;
  });
  var actionOk = list.some(function (a) { return a.split(':')[0] === action; });
  return { ok: ok, actionOk: actionOk };
};

/** Render table HTML for a spot. reveal: show villain cards? (never — unknown) */
PT.renderTable = function (spot, opts) {
  opts = opts || {};
  var heroIdx = PT.POSITIONS.indexOf(spot.hp);
  var html = '<div class="table-wrap"><div class="rail"><div class="felt">';
  html += '<div class="pot"><span class="lbl">BOTE</span><span class="amt">' + PT.fmtBB(spot.pot) + '</span></div>';
  html += '<div class="board">';
  for (var i = 0; i < 5; i++) html += spot.b[i] ? PT.cardHTML(spot.b[i], 'bd', 80 + i * 70) : PT.cardHTML(null, 'bd');
  html += '</div></div></div>';
  // seats
  PT.POSITIONS.forEach(function (pos, pi) {
    var seat = (pi - heroIdx + 6) % 6, xy = PT.SEAT_XY[seat];
    var isHero = pos === spot.hp, isVil = pos === spot.vp;
    var active = isHero || isVil || (spot.st === 'preflop' && spot.rfi && PT.POSITIONS.indexOf(pos) > heroIdx);
    var folded = !active;
    var vStack = Math.round((spot.stk - (spot.tc || 0)) * 10) / 10;
    var style = isHero ? 'left:50%;top:auto;bottom:1%;transform:translateX(-50%)' : 'left:' + xy[0] + '%;top:' + xy[1] + '%';
    html += '<div class="seat ' + (isHero ? 'hero ' : '') + (isVil ? 'villain ' : '') + (folded ? 'folded' : '') + '" style="' + style + '">';
    if (isHero) html += '<div class="hero-cards">' + PT.cardHTML(spot.h[0], 'hc', 0) + PT.cardHTML(spot.h[1], 'hc', 60) + '</div>';
    if (isVil && !isHero) html += '<div class="vill-cards">' + PT.backHTML('xs') + PT.backHTML('xs') + '</div>';
    html += '<div class="plate"><div class="tag">' + (isHero ? 'Tú' : isVil ? 'Rival' : (folded ? 'fold' : '')) + '</div><div class="pos">' + pos + '</div>' +
      '<div class="stk">' + (isHero ? PT.fmtBB(spot.stk) : isVil ? (vStack <= 0 ? 'ALL-IN' : PT.fmtBB(vStack)) : '') + '</div>' +
      (isVil && spot.vt ? '<div class="vt">' + PT.VT_ES[spot.vt] + '</div>' : '') + '</div></div>';
    if (pos === 'BTN') { var d = PT.DEALER_XY[seat]; html += '<div class="dealer" style="left:' + d[0] + '%;top:' + d[1] + '%">D</div>'; }
    if (isVil && spot.tc > 0 && !spot.rfi) {
      var b = PT.BET_XY[seat];
      html += '<div class="betchip" style="left:' + b[0] + '%;top:' + b[1] + '%" title="Lo que te toca pagar"><i></i>' + PT.fmtBB(spot.tc) + '</div>';
    }
  });
  html += '</div>';
  return html;
};
