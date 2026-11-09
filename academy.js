/* Academia: lecciones + mini-quiz */
var PT = window.PT || (window.PT = {});
PT.AcademyView = function (root, params) {
  var done = PT.Store.lessons();
  function list() {
    var h = '<div class="view-head"><div><div class="eyebrow">Módulo 6</div><h1>Academia</h1><p>Ocho conceptos que separan al ganador del que regala. Lección corta + quiz.</p></div></div><div class="grid g4">';
    PT.LESSONS.forEach(function (l, i) {
      var d = done[l.id];
      h += '<div class="panel lesson-card" data-l="' + l.id + '"><div class="n">' + (i + 1) + '</div><h3>' + l.title + '</h3><p class="muted small">' + l.sub + '</p>' +
        (d ? '<span class="chip p">Quiz ' + d.score + '/' + d.total + '</span>' : '<span class="chip">Pendiente</span>') + '</div>';
    });
    root.innerHTML = h + '</div>';
    root.querySelectorAll('[data-l]').forEach(function (c) { c.onclick = function () { location.hash = '#/academia/' + c.getAttribute('data-l'); }; });
  }
  function lesson(id) {
    var l = PT.LESSONS.filter(function (x) { return x.id === id; })[0]; if (!l) return list();
    var idx = PT.LESSONS.indexOf(l), answers = {};
    var h = '<div class="view-head"><div><div class="eyebrow">Lección ' + (idx + 1) + ' de ' + PT.LESSONS.length + '</div><h1>' + l.title + '</h1><p>' + l.sub + '</p></div><div class="filters"><a class="btn" href="#/academia">← Todas</a>' +
      (idx < PT.LESSONS.length - 1 ? '<a class="btn" href="#/academia/' + PT.LESSONS[idx + 1].id + '">Siguiente →</a>' : '') + '</div></div>';
    h += '<div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(300px,1fr);align-items:start"><div class="panel lesson-body">' + l.body + '</div><div class="panel"><h3>Mini-quiz</h3><div id="quiz">';
    l.quiz.forEach(function (q, qi) {
      h += '<div class="quiz-q" data-q="' + qi + '"><b>' + (qi + 1) + '. ' + q[0] + '</b><div class="opts">' + q[1].map(function (o, oi) { return '<button class="btn opt" data-o="' + oi + '">' + o + '</button>'; }).join('') + '</div><div class="exp"></div></div>';
    });
    h += '</div><div id="qscore" class="muted"></div></div></div>';
    root.innerHTML = h;
    root.querySelectorAll('.quiz-q').forEach(function (qd) {
      var qi = +qd.getAttribute('data-q'), q = l.quiz[qi];
      qd.querySelectorAll('.opt').forEach(function (b) {
        b.onclick = function () {
          if (answers[qi] != null) return;
          var oi = +b.getAttribute('data-o'); answers[qi] = oi === q[2];
          qd.querySelectorAll('.opt').forEach(function (x, xi) { x.disabled = true; if (xi === q[2]) x.classList.add('right'); else if (xi === oi) x.classList.add('wrong'); });
          qd.querySelector('.exp').innerHTML = (oi === q[2] ? '<span class="ok">Correcto.</span> ' : '<span class="bad">No.</span> ') + q[3];
          var n = Object.keys(answers).length;
          if (n === l.quiz.length) {
            var sc = Object.keys(answers).filter(function (k) { return answers[k]; }).length;
            PT.Store.saveLesson(l.id, sc, n);
            root.querySelector('#qscore').innerHTML = '<div class="verdict ' + (sc === n ? 'good' : sc >= n / 2 ? 'part' : 'badv') + '" style="margin-top:12px"><div class="big">' + sc + '/' + n + '</div><div class="small">' + (sc === n ? 'Perfecto. Siguiente lección.' : 'Repasa el ejemplo numérico y vuelve a intentarlo (recarga la lección).') + '</div></div>';
          }
        };
      });
    });
  }
  if (params && params.lesson) lesson(params.lesson); else list();
};
