/* Academia — lecciones cortas + mini-quiz. q: [pregunta, [opciones], índiceCorrecto, explicación] */
var PT = window.PT || (window.PT = {});
PT.LESSONS = [
{ id:'l1', title:'Pot odds e implied odds', sub:'Cuánta equity necesitas para pagar',
  body:`
<p>Cada call es una apuesta matemática: arriesgas X para ganar el bote. Si tu equity supera el precio, el call es +EV a largo plazo, independientemente de si ganas esta mano.</p>
<h4>Fórmula de pot odds</h4>
<p><b>Equity requerida = a pagar / (bote final tras tu call)</b>. El bote final incluye el bote previo, la apuesta del rival y tu call.</p>
<ul>
<li>Apuesta 1/3 del bote → necesitas <b>20%</b></li>
<li>Apuesta 1/2 → <b>25%</b></li>
<li>Apuesta 2/3 → <b>28.6%</b></li>
<li>Apuesta pot → <b>33.3%</b></li>
<li>Overbet 1.5x → <b>37.5%</b></li>
</ul>
<h4>Regla del 2 y del 4</h4>
<p>Outs × 2 ≈ % de ligar en la siguiente carta. Outs × 4 ≈ % de ligar del flop al river <i>si ves las dos cartas</i> (es decir, si el rival va all-in o no apostará en turn). Con 9 outs: ~18% / ~35% (exacto: 19.1% y 35%).</p>
<h4>Implied odds</h4>
<p>Cuando no tienes el precio directo, cuenta lo que ganarás en calles futuras si ligas. Funcionan si: (1) tu proyecto es a nuts u oculto, (2) quedan stacks detrás, (3) el rival paga cuando ligas. Contra un all-in no hay implied odds.</p>
<p><b>Reverse implied odds</b>: cuando ligas una mano que aún pierde (color bajo, top pair kicker malo), pierdes más en calles futuras.</p>
<div class="example"><b>Ejemplo.</b> Turn, bote 20bb. El rival apuesta 10bb. Tienes un proyecto de color (9 outs, 9/46 = 19.6%). Necesitas 10/(20+10+10) = <b>25%</b>. Directamente no llega. ¿Cuánto tienes que ganar extra en el river si ligas? EV=0 cuando 0.196 × (40 + X) = 10 → X ≈ 11bb. Si el rival tiene 80bb y pagará un river de ~12bb una de cada dos veces o más, el call es razonable; si va all-in, fold.</div>
<h4>Errores típicos</h4>
<ul><li>Pagar proyectos contra all-ins contando implied odds que no existen.</li><li>Usar la regla del 4 en el flop cuando el rival apostará también el turn.</li><li>Contar outs que te dan la segunda mejor mano (color bajo con color mayor posible).</li></ul>
<p><b>Clave:</b> calcula el precio antes de mirar tus cartas con cariño. Las manos no tienen sentimientos, los porcentajes sí.</p>`,
  quiz:[
   ['El rival apuesta 2/3 del bote en el river. ¿Qué equity necesitas para pagar?',['20%','25%','28.6%','40%'],2,'2/3 → x/(1+2x) con x=2/3 → 0.667/2.333 = 28.6%.'],
   ['Flop, tienes OESD (8 outs). Probabilidad aproximada de ligar en el turn:',['~8%','~17%','~32%','~50%'],1,'8/47 = 17%. Regla del 2: 16%.'],
   ['¿En qué caso NO existen implied odds?',['Rival con 100bb detrás','Rival fish que paga mucho','Rival all-in','Proyecto a color nut'],2,'Si el rival está all-in no hay más apuestas que ganar.'],
   ['Bote 30bb, rival apuesta 15bb. Pagas 15 para un bote final de:',['45bb','60bb','30bb','75bb'],1,'30 + 15 + 15 = 60 → necesitas 25%.']
  ] },
{ id:'l2', title:'SPR y commitment', sub:'Stack-to-pot ratio: cuánto vale tu mano',
  body:`
<p><b>SPR = stack efectivo / bote</b> al empezar el flop. Te dice cuánta "profundidad" queda y qué manos merecen ir all-in.</p>
<h4>Guía rápida</h4>
<ul>
<li><b>SPR ≤ 3</b> (botes 3beteados/4beteados): top pair buen kicker y overpairs están comprometidas. Si apuestas una vez, vas por stacks.</li>
<li><b>SPR 4-7</b>: top pair top kicker juega 2-3 calles, pero ojo a raises grandes en boards mojados.</li>
<li><b>SPR 10+</b> (single raised pots, ~18 a 100bb): one-pair no es mano para jugarte 100bb. Las sets, escaleras y colores ganan los botes grandes.</li>
</ul>
<h4>Por qué importa</h4>
<p>Con SPR bajo, los proyectos especulativos pierden valor (no hay implied odds) y las manos de valor directo ganan. Con SPR alto, la capacidad de ligar fuerte y la posición valen más. Por eso 3betear AQ y pagar 3bets con 76s tienen lógicas distintas.</p>
<h4>Planificar el sizing</h4>
<p>Si quieres llegar all-in al river, elige tamaños que lo permitan: en un bote de 22bb con 89bb detrás (SPR 4), apostar 1/3 flop (7.5), 2/3 turn (25) y jam river (~56 en un bote de ~87) funciona de forma natural.</p>
<div class="example"><b>Ejemplo.</b> 3bet pot: bote 22.5bb, stacks 89bb → SPR ≈ 4. Tienes AQ en Q-7-3. Apuestas 7.5bb y el rival hace all-in. Pagas 81.5 para un bote final de 200.5 → necesitas <b>40.6%</b>. Contra un rango de jam que mezcla sets y proyectos, AQ tiene ~55%: call obligatorio. En un single raised pot con SPR 18, la misma mano vs un check-raise all-in sería mucho más dudosa.</div>
<h4>Errores típicos</h4>
<ul><li>Hacer slowplay con top pair en SPR bajo y dejar que el rival realice gratis.</li><li>Pagar 3bets OOP con manos especulativas cuando el SPR resultante no da implied odds.</li><li>Jugarse 100bb con one-pair en SPR 15+ contra un rival pasivo.</li></ul>
<p><b>Clave:</b> decide en el flop cuántas calles de valor quieres y si estás dispuesto a ir all-in. Si no lo estás, no infles el bote.</p>`,
  quiz:[
   ['Bote 22bb, stacks efectivos 88bb. SPR:',['2','4','8','22'],1,'88/22 = 4.'],
   ['Con SPR 2, ¿qué mano suele estar comprometida en flop?',['Gutshot','Top pair buen kicker','A-high','Backdoor flush'],1,'Con SPR bajo, top pair fuerte/overpair va por stacks.'],
   ['¿Qué tipo de manos ganan valor con SPR alto?',['Top pair kicker débil','Pares bajos y suited connectors (implied)','Ax offsuit','KQo'],1,'Las manos que ligan fuerte y oculto rinden con stacks profundos.'],
   ['Un single raised pot a 100bb suele empezar con SPR de aprox.:',['2','5','~18','50'],2,'Bote ~5.5bb, stacks ~97.5bb → SPR ~18.']
  ] },
{ id:'l3', title:'Texturas de flop y range advantage', sub:'Seco, semimojado, mojado',
  body:`
<p>Antes de mirar tus cartas, pregúntate: <b>¿a quién favorece este board?</b> Dos conceptos:</p>
<ul>
<li><b>Range advantage</b>: tu rango tiene más equity media que el del rival.</li>
<li><b>Nut advantage</b>: tienes más combos de manos muy fuertes (sets, dobles, escaleras).</li>
</ul>
<h4>Clasificación</h4>
<ul>
<li><b>Seco</b> (K72r, A83r, Q52r): pocos proyectos, cartas desconectadas, rainbow. Favorece al agresor preflop con cartas altas. Equity estática: el turn cambia poco.</li>
<li><b>Semimojado</b> (KT5 two-tone, Q86r, J74 two-tone): algún proyecto. Estrategias mixtas.</li>
<li><b>Mojado</b> (987 two-tone, JT8, 654ss): muchos proyectos y manos hechas fuertes. Suele favorecer al que defiende (BB tiene más conectores y cartas bajas).</li>
<li><b>Doblados</b> (TT4, 772) y <b>monocolor</b> (963sss): rangos se comprimen; tamaños pequeños.</li>
</ul>
<h4>Consecuencias prácticas</h4>
<ul>
<li>Board seco + range advantage → c-bet de rango pequeña (25-33%).</li>
<li>Board mojado sin nut advantage → menos c-bets, más checks; cuando apuestas, más grande (2/3+) y polarizado.</li>
<li>BB en boards bajos conectados: más check-raises (y algún donk pequeño).</li>
</ul>
<div class="example"><b>Ejemplo.</b> BTN vs BB en K♥7♦2♣: BTN tiene AK, KK, KQ, KJ y overpairs; BB casi no tiene KK/AK (los 3betea). El BTN puede apostar ~85% de su rango a 1/3. En 9♥8♥7♦ ocurre lo contrario: el BB tiene T6, 65, 98, 87, 77-99 en proporción mayor y el BTN debería checkear más de la mitad de su rango, incluido AK sin corazones.</div>
<h4>Errores típicos</h4>
<ul><li>C-betear el 100% de los flops con el mismo tamaño.</li><li>Olvidar que el BB tiene ventaja en boards bajos y conectados.</li><li>Ignorar el palo: dos cartas del mismo palo cambian mucho el plan.</li></ul>
<p><b>Clave:</b> la textura decide frecuencia y tamaño; tu mano concreta decide si eres valor, farol o check.</p>`,
  quiz:[
   ['¿Qué board favorece más al open de BTN vs BB?',['9♥8♥7♦','K♥7♦2♣','6♠5♠4♦','T♥9♥8♣'],1,'K72r: el BTN tiene más Kx fuertes y overpairs.'],
   ['En un board mojado donde el defensor tiene nut advantage, el agresor debería:',['Apostar 100% pequeño','Checkear más y apostar más grande cuando apuesta','Donkear','Apostar all-in'],1,'Menos frecuencia, más polarización.'],
   ['Un board monocolor suele jugarse con:',['Overbets frecuentes','Tamaños pequeños','Nunca c-bet','Solo check-raise'],1,'Los rangos se comprimen; apuestas pequeñas.'],
   ['"Nut advantage" significa:',['Tener más equity media','Tener más combos de manos muy fuertes','Estar en posición','Tener más fichas'],1,'Es sobre la parte alta del rango.']
  ] },
{ id:'l4', title:'C-bet: cuándo y con qué sizing', sub:'La decisión más repetida del póker',
  body:`
<p>La c-bet no es automática. Decide con tres preguntas: <b>¿quién tiene range advantage?</b>, <b>¿el board es estático o dinámico?</b> y <b>¿cuántos rivales hay?</b></p>
<h4>Sizing pequeño (25-33%)</h4>
<ul>
<li>Boards secos donde tienes ventaja (K72r, A83r, Q72r, TT4).</li>
<li>Monocolores.</li>
<li>Botes 3beteados con ventaja de rango (A73 como 3bettor).</li>
<li>Objetivo: apostar mucho rango, negar equity barata a overcards y backdoors.</li>
</ul>
<h4>Sizing grande (66-75%)</h4>
<ul>
<li>Boards dinámicos (JT8, 986 two-tone) cuando apuestas: valor que necesita protección y semi-bluffs con mucha equity.</li>
<li>Rango polarizado: apuestas menos combos pero más grandes.</li>
</ul>
<h4>Check</h4>
<ul>
<li>Manos con showdown value medio que no quieren crecer el bote.</li>
<li>Manos sin equity en boards donde el rival tiene nut advantage (AK en 987hh).</li>
<li>Multiway: apuesta solo valor y proyectos fuertes.</li>
</ul>
<h4>Buenas c-bets farol</h4>
<p>Overcards + backdoors (QJ en K72 con backdoor de color), gutshots, manos que ganan equity con cartas del turn. Malas: cartas sin backdoors en boards donde no tienes ventaja.</p>
<div class="example"><b>Ejemplo.</b> Bote 5.5bb, c-bet de 1/3 = 1.8bb. Para ser rentable como farol puro necesita fold el 1.8/(5.5+1.8) = <b>24.7%</b> de las veces. En K72r el BB foldea ~35-45% a esa c-bet: incluso tu aire gana dinero, y además tiene equity. Con 2/3 (3.7bb) necesitarías ~40% de folds.</div>
<h4>Errores típicos</h4>
<ul><li>C-bet automática multiway.</li><li>Apostar grande en boards secos (pierdes contra pocas manos y foldeas todo lo peor).</li><li>No tener plan de turn: decide en el flop qué cartas vas a barrilear.</li></ul>
<p><b>Clave:</b> pequeño y frecuente donde mandas; grande y selectivo donde el board está vivo; check donde el rival manda.</p>`,
  quiz:[
   ['Un farol de 1/3 del bote necesita que el rival foldee:',['~25%','~33%','~40%','~50%'],0,'1/3 / (1 + 1/3) = 25%.'],
   ['BTN vs BB en J♥T♥8♣. ¿Estrategia de c-bet más lógica?',['Rango 1/4','Menos frecuencia, tamaño mayor','Siempre all-in','Nunca apostar'],1,'Board dinámico: polariza.'],
   ['Multiway (3 jugadores), board 875 two-tone, tienes AQ sin backdoors:',['Bet 1/3','Bet pot','Check','Overbet'],2,'Sin equity ni ventaja multiway: check.'],
   ['¿Qué mano es mejor c-bet farol en K♥7♦2♣?',['Q♥J♥ (backdoor color+escalera)','5♣4♠','9♦3♣','8♠3♦'],0,'Overcards y backdoors.']
  ] },
{ id:'l5', title:'Value vs farol y polarización', sub:'Por qué apuestas lo que apuestas',
  body:`
<p>En el river ya no hay equity futura: o apuestas para que te pague algo peor (<b>valor</b>), o para que foldee algo mejor (<b>farol</b>). Si ninguna ocurre, check.</p>
<h4>Rango polarizado vs lineal (merged)</h4>
<ul>
<li><b>Polarizado</b>: nuts + faroles, sin manos medias. Usa tamaños grandes (2/3, pot, overbet).</li>
<li><b>Lineal/merged</b>: manos fuertes y medias, sin muchos faroles. Usa tamaños pequeños (1/4-1/2): thin value.</li>
</ul>
<h4>Ratio valor/farol</h4>
<p>Con una apuesta de tamaño B en un bote P, el rival necesita B/(P+2B) de equity para pagar. En equilibrio, tu proporción de faroles debe ser ese mismo número:</p>
<ul>
<li>1/2 pot → 25% faroles (3 valor : 1 farol)</li>
<li>Pot → 33% faroles (2:1)</li>
<li>2x pot → 40% faroles</li>
</ul>
<h4>Thin value</h4>
<p>Apostar una mano que gana a la mitad o algo más de su rango de call. Funciona cuando el rival está capado (checkeó turn) y tiene muchas manos peores que pagan pequeño.</p>
<h4>Elegir faroles</h4>
<p>Los mejores faroles: <b>sin showdown value</b> y que <b>no bloquean el rango de fold</b> del rival (o bloquean su rango de call). Un proyecto fallado de 6-high es buen farol; A-high que bloquea los proyectos fallados del rival, mal farol.</p>
<div class="example"><b>Ejemplo.</b> River, bote 30bb. Apuestas pot (30bb). El rival necesita 30/90 = 33% para pagar. Si tienes 20 combos de valor, en equilibrio deberías tener 10 combos de farol (33% del total). Con 25 combos de farol estás sobre-faroleando: el rival debe pagar todo. Con 2, está bien foldear muchísimo contra ti.</div>
<h4>Errores típicos</h4>
<ul><li>Apostar manos medias en el river "para ver dónde estoy".</li><li>Farolear con manos que tienen showdown value.</li><li>Usar tamaños pequeños con rango polarizado.</li></ul>
<p><b>Clave:</b> manos medias → check o apuesta pequeña; manos extremas → apuesta grande.</p>`,
  quiz:[
   ['Apuestas pot en el river. Proporción de faroles de equilibrio:',['10%','25%','33%','50%'],2,'B/(P+2B) = 1/3.'],
   ['Un rango "polarizado" contiene sobre todo:',['Manos medias','Nuts y faroles','Solo proyectos','Pares bajos'],1,'Extremos del rango.'],
   ['¿Qué mano es mejor farol en el river?',['A-high que gana a proyectos fallados','6-high de proyecto fallado','Segunda pareja','Top pair'],1,'Sin showdown value.'],
   ['Thin value funciona mejor cuando el rival:',['Está capado y paga con manos peores','Tiene rango polarizado','Es un nit','Ha check-raiseado'],0,'Rango capado con muchos bluff-catchers peores.']
  ] },
{ id:'l6', title:'Blockers y combos', sub:'Contar manos, no adivinar',
  body:`
<p><b>Combos</b> por mano: pareja = 6, suited = 4, offsuit = 12. Cada carta visible (tuya o del board) reduce combos.</p>
<ul>
<li>Pareja con una carta en board: 3 combos (sets).</li>
<li>AK sin bloqueos: 16 combos (4 suited + 12 offsuit). Si tienes un A: 12. Si hay un A y un K en mesa: 9.</li>
</ul>
<h4>Blockers (bloqueadores)</h4>
<p>Tener una carta reduce las combinaciones del rival que la contienen. Aplicaciones:</p>
<ul>
<li><b>3bet bluff con A5s</b>: el A bloquea AA/AK/AQ (las manos que siguen).</li>
<li><b>Bluff en river con A♠ en board de 3 picas</b>: el rival no tiene el color nut.</li>
<li><b>Bluff-catch</b>: quieres <i>bloquear su valor</i> y <i>no bloquear sus faroles</i>. Pagar con una T cuando sus faroles son QT/T9 es peor que pagar con una mano sin T.</li>
</ul>
<h4>Nut blockers</h4>
<p>En boards de color, tener el A del palo hace que los colores máximos del rival desaparezcan. Bien usados, son la base de faroles y call-downs avanzados. Mal usados, son una excusa para pagar sin sentido: el blocker afina decisiones cercanas, no convierte basura en call.</p>
<div class="example"><b>Ejemplo.</b> River K♦9♦4♣8♠2♦. El rival apuesta. Valor posible: colores (A♦X♦, Q♦J♦, T♦7♦...), sets, dobles. Si tienes A♦9♣, eliminas todos los colores con A♦ (en un rango BTN, 5-8 combos), y además tu 9♣ deja solo 1 combo de 99 y reduce K9/98. Su valor baja de, p. ej., 30 a 22 combos; sus faroles (QJ, JT, T7, 76 fallados) siguen intactos. Un call marginal pasa a ser bueno.</div>
<h4>Errores típicos</h4>
<ul><li>Contar manos imposibles (sets que tu bloqueas).</li><li>Pagar "porque tengo un blocker" con una mano que no gana a ningún farol.</li><li>Olvidar que el board también bloquea combos.</li></ul>
<p><b>Clave:</b> cuenta combos de valor vs farol después de quitar tus bloqueos.</p>`,
  quiz:[
   ['¿Cuántos combos tiene AKo sin bloqueos?',['4','6','12','16'],2,'4×4 − 4 suited = 12.'],
   ['Hay un rey en el board. ¿Cuántos combos de KK quedan?',['1','3','6','4'],1,'C(3,2) = 3.'],
   ['¿Por qué A5s es buen 3bet bluff?',['Gana siempre preflop','Bloquea AA/AK/AQ y tiene playability','Es la mejor mano','Bloquea 55'],1,'Blocker + equity.'],
   ['Para pagar como bluff-catcher prefieres:',['Bloquear sus faroles','Bloquear su valor','Tener showdown cero','Tener color'],1,'Si bloqueas valor, su rango tiene más faroles en proporción.']
  ] },
{ id:'l7', title:'Juego explotador vs GTO', sub:'Fish pasivo vs maniaco',
  body:`
<p><b>GTO</b> es tu línea base: no se puede explotar. Pero en stakes bajos los rivales cometen errores grandes y predecibles; ganas más desviándote para castigarlos. Regla: <b>desvíate cuando tienes una lectura clara</b>, y vuelve al GTO cuando no la tienes.</p>
<h4>Fish pasivo / calling station</h4>
<ul>
<li>Paga demasiado, apuesta y sube poco.</li>
<li><b>Más valor, más grande</b>: apuesta top pair 3 calles, dobles con sizings de pot.</li>
<li><b>Menos faroles</b>: casi cero en river.</li>
<li><b>Respeta su agresión</b>: cuando un pasivo sube, casi siempre es fuerte → hero folds.</li>
<li>Aisla sus limps con raises grandes.</li>
</ul>
<h4>Maniaco / hiperagresivo</h4>
<ul>
<li>Apuesta y sube con aire, 3betea muchísimo.</li>
<li><b>Bluff-catch más ancho</b>: segundas parejas y A-high ganan valor.</li>
<li><b>Deja que farolee</b>: check-call en vez de apostar; slowplay de manos fuertes.</li>
<li><b>4bet lineal y paga más 3bets</b> con manos que dominan su rango.</li>
<li>Reduce faroles: él no foldea por orgullo.</li>
</ul>
<h4>Nit / reg tight</h4>
<ul>
<li>Roba sus ciegas, foldea a su agresión tardía (river raise = nuts).</li>
</ul>
<div class="example"><b>Ejemplo.</b> River, bote 21bb. Rival apuesta pot (21bb): necesitas 33%. Con TPTK contra un reg equilibrado (33% faroles) eres indiferente-call. Contra un fish que solo apuesta pot con valor (~5% faroles), tu call pierde: EV ≈ 0.05×42 − 0.95×21 = −17.9bb. Contra un maniaco con 50% faroles: EV ≈ 0.5×42 − 0.5×21 = +10.5bb.</div>
<h4>Errores típicos</h4>
<ul><li>Desviarse mucho con muestras pequeñas (20 manos no definen a nadie).</li><li>Farolear a calling stations.</li><li>Foldear a maniacos solo por miedo al tamaño.</li></ul>
<p><b>Clave:</b> GTO te protege; la explotación te paga. Las estadísticas (VPIP/PFR/AF) y la muestra deciden cuánto te desvías.</p>`,
  quiz:[
   ['Contra un fish pasivo, en river con top pair, normalmente:',['Check siempre','Valor más grande','Farol','Overbet farol'],1,'Paga demasiado: cobra más.'],
   ['Un fish pasivo hace check-raise all-in en el river. Tú tienes TPTK:',['Call siempre','Fold casi siempre','Raise','Depende del bote'],1,'Pasivo + agresión = valor.'],
   ['Contra un maniaco, ¿qué haces más?',['Faroles','Bluff-catch y check-call','Fold','Limp'],1,'Deja que farolee y paga más.'],
   ['El GTO es útil sobre todo como:',['Línea base sin lecturas','Forma de ganar más a fishes','Excusa para no pensar','Estrategia solo de torneos'],0,'Base inexplotable cuando no tienes info.']
  ] },
{ id:'l8', title:'Bankroll y selección de mesas', sub:'Sobrevivir a la varianza',
  body:`
<p>Puedes jugar bien y perder durante semanas. La varianza en NLHE es enorme: un jugador ganador de 5bb/100 puede tener rachas de −30 buy-ins en 100k manos. Solo el bankroll te mantiene vivo.</p>
<h4>Reglas prácticas (cash)</h4>
<ul>
<li><b>20-30 buy-ins</b> (de 100bb) para el stake que juegas. Más conservador (40+) si el poker no es tu ingreso pero no quieres bajar nunca.</li>
<li><b>Sube</b> cuando tengas ~30 buy-ins del stake superior.</li>
<li><b>Baja</b> sin ego si caes por debajo de 15-20 buy-ins.</li>
<li>Nunca mezcles dinero de vida con bankroll.</li>
</ul>
<h4>Selección de mesas</h4>
<ul>
<li>Tu winrate depende más de <b>con quién juegas</b> que de cualquier ajuste fino.</li>
<li>Busca mesas con VPIP medio alto (30%+), botes promedio grandes y jugadores que limpean.</li>
<li>Evita mesas con 4-5 regs: aunque seas mejor, la rake se come el edge.</li>
<li>Siéntate a la izquierda de los fishes (actúas después que ellos).</li>
</ul>
<h4>Gestión de sesiones</h4>
<ul>
<li>Stop-loss de 3-4 buy-ins por sesión para evitar tilt.</li>
<li>Revisa 2-3 manos clave después de cada sesión (no solo las que perdiste).</li>
</ul>
<div class="example"><b>Ejemplo.</b> Juegas NL10 (buy-in 10€). Con 25 buy-ins necesitas <b>250€</b>. Si bajas a 150€ (15 BI), vuelve a NL5 hasta recuperar. Si ganas 5bb/100 jugando 20k manos al mes, esperas ~1000bb = 100€/mes en NL10, con desviación típica de ~±1.300bb: puedes tener un mes negativo jugando bien.</div>
<h4>Errores típicos</h4>
<ul><li>Subir de stake tras una buena sesión sin el bankroll necesario.</li><li>Jugar en tilt para "recuperar".</li><li>Quedarse en mesas sin fishes por comodidad.</li></ul>
<p><b>Clave:</b> bankroll protege tu juego; selección de mesas te da el dinero.</p>`,
  quiz:[
   ['¿Bankroll mínimo razonable para NL25 (cash, 25€ buy-in)?',['50€','125€','500-750€','5000€'],2,'20-30 buy-ins: 500-750€.'],
   ['¿Cuándo deberías bajar de stake?',['Nunca','Si caes por debajo de ~15-20 buy-ins','Tras perder una mano','Cuando aburre'],1,'Disciplina de bankroll.'],
   ['La mejor mesa para tu winrate es la que tiene:',['5 regs','Fishes con VPIP alto','Solo nits','Stacks cortos'],1,'Tus beneficios vienen de los errores de otros.'],
   ['Dónde sentarte respecto al fish:',['A su derecha','A su izquierda','Enfrente','Da igual'],1,'Actúas después que él la mayoría de manos.']
  ] }
];
