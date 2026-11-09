/* Persistence in localStorage, prefix pokerTrainer_ */
var PT = window.PT || (window.PT = {});
PT.Store = (function () {
  var P = 'pokerTrainer_';
  var mem = {}; // fallback if localStorage blocked
  function get(k, def) {
    try { var v = localStorage.getItem(P + k); return v == null ? def : JSON.parse(v); }
    catch (e) { return mem[k] != null ? mem[k] : def; }
  }
  function set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { mem[k] = v; } }
  function del(k) { try { localStorage.removeItem(P + k); } catch (e) { delete mem[k]; } }
  return {
    get: get, set: set,
    settings: function () { return Object.assign({ dailyGoal: 20, quickTime: 12 }, get('settings', {})); },
    saveSettings: function (s) { set('settings', s); },
    results: function () { return get('results', []); },
    addResult: function (r) { var a = get('results', []); a.push(r); if (a.length > 3000) a = a.slice(-3000); set('results', a); },
    rangeResults: function () { return get('rangeQuiz', []); },
    addRangeResult: function (r) { var a = get('rangeQuiz', []); a.push(r); if (a.length > 3000) a = a.slice(-3000); set('rangeQuiz', a); },
    lessons: function () { return get('lessons', {}); },
    saveLesson: function (id, score, total) { var l = get('lessons', {}); var prev = l[id]; if (!prev || score >= prev.score) l[id] = { score: score, total: total, ts: Date.now() }; set('lessons', l); },
    resetAll: function () { ['results', 'rangeQuiz', 'lessons', 'settings'].forEach(del); }
  };
})();

/* ---------- Stats helpers ---------- */
PT.Stats = {
  streaks: function (res) {
    var cur = 0, best = 0, run = 0;
    res.forEach(function (r) { if (r.ok) { run++; if (run > best) best = run; } else run = 0; });
    for (var i = res.length - 1; i >= 0 && res[i].ok; i--) cur++;
    return { cur: cur, best: best };
  },
  acc: function (res) { if (!res.length) return null; return res.filter(function (r) { return r.ok; }).length / res.length; },
  today: function (res) { var d = new Date(); d.setHours(0, 0, 0, 0); return res.filter(function (r) { return r.ts >= d.getTime(); }); },
  byKey: function (res, fn) {
    var m = {};
    res.forEach(function (r) { (fn(r) || []).forEach(function (k) { m[k] = m[k] || { n: 0, ok: 0 }; m[k].n++; if (r.ok) m[k].ok++; }); });
    return m;
  },
  weakest: function (res, min) {
    var m = PT.Stats.byKey(res, function (r) { return r.tags; });
    return Object.keys(m).filter(function (k) { return m[k].n >= (min || 3); })
      .map(function (k) { return { k: k, n: m[k].n, acc: m[k].ok / m[k].n }; })
      .sort(function (a, b) { return a.acc - b.acc || b.n - a.n; });
  }
};
