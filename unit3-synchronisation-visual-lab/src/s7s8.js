/* ===== Session 7: Algorithms 1-3 and Bakery (3.12-3.15) and Session 8: classic problems (3.16) ===== */
const S7 = "Session 7", S7T = "Algorithms 1, 2 and 3 (Peterson) and the Bakery algorithm";
const S8 = "Session 8", S8T = "Classic synchronisation problems";

/* ---------- semaphore helper: value >= 0 + FIFO queue, hand-off on signal ---------- */
const SEM = {
  wait(S, name, T, me){ const s = S.sem[name]; if (s.v > 0){ s.v--; go(T, T.pc+1); return true; } s.q.push(me); T.st = "sleep"; return false; },
  signal(S, name, Th, D){ const s = S.sem[name]; if (s.q.length){ const w = s.q.shift(); Th[w].st = "ready"; Th[w].pc += 1; return " It wakes <b>"+D.names[w]+"</b>, which was waiting on "+name+"."; } s.v++; return ""; }
};
const semCell = (S, n, ch) => [n+(S.sem[n].q.length ? " (waiting: "+S.sem[n].q.length+")" : ""), S.sem[n].v, ch];

/* ---------- 3.12 Algorithm 1 ---------- */
function alg1(me){ const wants = me === 0 ? 1 : 2; return [
  {ln:3, z:"entry", run:(S,T,me,D) => { if (S.turn !== me){ T.spins++; T.spinning = true; return D.names[me]+" tests <code>turn != "+me+"</code>: turn is "+S.turn+", so it <b>waits</b>."; } T.spinning = false; go(T,1); return D.names[me]+" tests <code>turn != "+me+"</code>: turn is "+me+", so it enters."; }},
  {ln:4, z:"cs", run:(S,T,me,D) => { go(T,2); return D.names[me]+" is in its <b>critical section</b>."; }},
  {ln:5, z:"exit", run:(S,T,me,D) => { S.turn = 1-me; go(T,3); return D.names[me]+" sets <code>turn = "+(1-me)+"</code>: it must hand the turn over, wanted or not."; }},
  {ln:6, z:"rem", run:(S,T,me,D) => { T.k++; if (T.k < wants){ go(T,0); return D.names[me]+" finishes its remainder section and wants in again."; } go(T,DONE); return D.names[me]+" goes off to do other work for a long time (busy elsewhere)."; }}
];}
TOPICS.push({ id:"alg1", num:"3.12", session:S7, sessionTitle:S7T, kind:"sched", short:"Algorithm 1",
  title:"Algorithm 1: take turns, using one shared variable turn",
  lead:"Pi may enter only when turn == i, and sets turn = j on leaving. Mutual exclusion holds, but progress fails: the processes must strictly alternate.",
  names:["P0","P1"],
  code:`int turn = 0;          /* shared */
/* process Pi (j is the other) */
while (turn != i) ;     /* wait */
/* critical section */
turn = j;
/* remainder section */`, file:"alg1_turn.c",
  init:()=>({turn:0}), progs:()=>[alg1(0), alg1(1)], stage:"zones", stageH:290,
  tour:[0,0,0,0,1,1,1,1,1,1,1],
  overlay:(st) => sharedStrip([["turn", st.S.turn, st.last && st.last.changed.includes("turn")]]),
  vars:(st,i) => "entries "+st.Th[i].k+" / "+(i === 0 ? 1 : 2)+" · spins "+st.Th[i].spins,
  think:(st,i,D) => { const T = st.Th[i], z = zoneOf(st,i); if (z === "done") return "Busy elsewhere."; if (z === "entry") return (T.spinning ? "Waiting: " : "Next: test. ") + "turn = "+st.S.turn+"."; return {cs:"Inside.", exit:"About to hand the turn over.", rem:"Remainder section."}[z]; },
  check:(st,D) => { const w = [0,1].find(i => st.Th[i].spinning && !isDone(st,i)); if (w !== undefined && isDone(st,1-w)) return ["bad","<b>Progress fails:</b> the critical section is empty and "+D.names[1-w]+" is busy elsewhere, yet "+D.names[w]+" can never enter."]; return bannerGeneric(D, st); },
  phases:[
    {at:0, t:"turn = 0: P0 enters", d:"P0 passes its test and enters."},
    {at:2, t:"P0 leaves: turn = 1", d:"P0 hands the turn to P1 and goes off to work elsewhere."},
    {at:4, t:"P1 enters and leaves: turn = 0", d:"P1 hands the turn back to P0."},
    {at:8, t:"P1 wants in again", d:"turn = 0 and P0 is busy elsewhere, so P1 waits for ever."}
  ],
  notes:{0:"<b>Example from the slide:</b> turn = 0. P0 enters and leaves (turn = 1). P1 enters and leaves (turn = 0). P1 wants in again but must wait for P0, which is busy elsewhere.", end:"Like two people sharing one bicycle who must hand it over after every ride, even if the other does not want it. <b>An empty critical section can stay locked.</b>"},
  real:[PS+"./alg1_turn", "T0: in critical section (entry 1)", "T1: in critical section (entry 1)", "T1: done, stays in its remainder section", "T0: in critical section (entry 2)", "after 2 s: T0 entered 2 of 3 times, turn = 1", "NO PROGRESS: the critical section is free and T1 is not interested,", "             but T0 still waits for turn == 0"],
  props:[["Mutual exclusion","yes","turn has one value, so only one process can pass"],["Progress","no","strict alternation"],["Bounded waiting","yes","you wait at most one turn"]],
  deep:`<p><code>turn</code> records <b>whose turn it is</b> but not <b>who wants in</b>. Algorithm 2 records who wants in instead.</p>`
});

/* ---------- 3.13 Algorithm 2 ---------- */
function alg2(me){ return [
  {ln:3, z:"entry", run:(S,T,me,D) => { S.flag[me] = true; go(T,1); return D.names[me]+": <code>flag["+me+"] = true</code>, \"I want to enter\"."; }},
  {ln:4, z:"entry", run:(S,T,me,D) => { const j = 1-me; if (S.flag[j]){ T.spins++; T.spinning = true; return D.names[me]+" sees <code>flag["+j+"] == true</code>, so it <b>waits</b>."; } T.spinning = false; go(T,2); return D.names[me]+" sees <code>flag["+j+"] == false</code>, so it enters."; }},
  {ln:5, z:"cs", run:(S,T,me,D) => { go(T,3); return D.names[me]+" is in its <b>critical section</b>."; }},
  {ln:6, z:"exit", run:(S,T,me,D) => { S.flag[me] = false; go(T,4); return D.names[me]+": <code>flag["+me+"] = false</code>."; }},
  {ln:6, z:"rem", run:(S,T,me,D) => { T.k++; go(T, T.k < 2 ? 0 : DONE); return D.names[me]+" runs its remainder section."; }}
];}
TOPICS.push({ id:"alg2", num:"3.13", session:S7, sessionTitle:S7T, kind:"sched", short:"Algorithm 2",
  title:"Algorithm 2: say that you want to enter, using flag[2]",
  lead:"Pi sets flag[i] = true, waits while flag[j] is true, then enters; on leaving it sets flag[i] = false. Mutual exclusion holds, but if both set their flags before either tests, both wait for ever.",
  names:["P0","P1"],
  code:`boolean flag[2] = {false, false};
/* process Pi */
flag[i] = true;
while (flag[j]) ;      /* wait */
/* critical section */
flag[i] = false;`, file:"alg2_flag.c",
  init:()=>({flag:[false,false]}), progs:()=>[alg2(0), alg2(1)], stage:"zones", stageH:290,
  tour:[0,0,0,1,1,0,1,1,1,1,0, 0,1,1,0,1,0],
  overlay:(st) => sharedStrip([["flag[0]", B(st.S.flag[0]), st.last && st.last.before && st.last.before.flag && st.last.before.flag[0] !== st.S.flag[0]],["flag[1]", B(st.S.flag[1]), st.last && st.last.before && st.last.before.flag && st.last.before.flag[1] !== st.S.flag[1]]]),
  vars:(st,i) => "rounds "+st.Th[i].k+" / 2 · spins "+st.Th[i].spins,
  think:(st,i,D) => { const T = st.Th[i], z = zoneOf(st,i); if (z === "done") return "Done."; if (T.pc === 0) return "About to raise my flag."; if (T.pc === 1) return (st.S.flag[1-i] ? (T.spinning ? "Waiting: " : "Next: test. ")+D.names[1-i]+"'s flag is up." : "Next: test. "+D.names[1-i]+"'s flag is down."); return {cs:"Inside.", exit:"About to lower my flag.", rem:"Remainder."}[z]; },
  check:(st,D) => (st.S.flag[0] && st.S.flag[1] && st.Th[0].pc === 1 && st.Th[1].pc === 1 && st.Th[0].spinning && st.Th[1].spinning) ? ["bad","<b>Both wait for ever:</b> both flags are up and each waits for the other to lower its flag."] : bannerGeneric(D, st),
  phases:[
    {at:0, t:"One at a time: it works", d:"P0 raises its flag and enters; P1 waits while flag[0] is up."},
    {at:5, t:"P0 lowers its flag, P1 enters", d:"Mutual exclusion and a clean hand-over."},
    {at:11, t:"Both raise flags at once", d:"P0: flag[0] = true, then a switch; P1: flag[1] = true."},
    {at:13, t:"Each waits for the other", d:"P1 sees flag[0] true and waits; P0 sees flag[1] true and waits. Neither ever enters."}
  ],
  notes:{11:"<b>Example from the slide:</b> P0: flag[0] = true, then a switch. P1: flag[1] = true, sees flag[0] true, waits. P0 sees flag[1] true, waits.", end:"Like two polite people at a door, each waiting for the other to go first. The real <code>alg2_flag</code> got stuck this way on every run."},
  real:[PS+"./alg2_flag", "DEADLOCK after T0 = 0 and T1 = 5268 entries", "flag[0] = 1, flag[1] = 1: each thread waits for the other forever", PS+"./alg2_flag", "DEADLOCK after T0 = 16989 and T1 = 6 entries", "flag[0] = 1, flag[1] = 1: each thread waits for the other forever"],
  props:[["Mutual exclusion","yes","a process enters only when the other's flag is false"],["Progress","no","both can wait for ever"],["Bounded waiting","—","meaningless once both are stuck"]],
  deep:`<p>Swapping the two lines (test first, then set the flag) removes the deadlock but lets both enter, breaking mutual exclusion instead. Peterson combines flags with a turn to get both.</p>`
});

/* ---------- 3.14 Peterson ---------- */
function peter(me){ return [
  {ln:3, z:"entry", run:(S,T,me,D) => { S.flag[me] = true; go(T,1); return D.names[me]+": <code>flag["+me+"] = true</code>, \"I want in\"."; }},
  {ln:3, z:"entry", run:(S,T,me,D) => { S.turn = 1-me; go(T,2); return D.names[me]+": <code>turn = "+(1-me)+"</code>, \"but you go first\". Whoever writes turn <b>last</b> waits."; }},
  {ln:4, z:"entry", run:(S,T,me,D) => { const j = 1-me; if (S.flag[j] && S.turn === j){ T.spins++; T.spinning = true; return D.names[me]+" tests <code>flag["+j+"] &amp;&amp; turn == "+j+"</code>: both true, so it <b>waits</b>."; } T.spinning = false; go(T,3); return D.names[me]+" tests <code>flag["+j+"] &amp;&amp; turn == "+j+"</code>: false ("+(S.flag[j] ? "turn = "+S.turn : D.names[j]+" does not want in")+"), so it enters."; }},
  {ln:5, z:"cs", run:(S,T,me,D) => { go(T,4); return D.names[me]+" is in its <b>critical section</b>."; }},
  {ln:6, z:"exit", run:(S,T,me,D) => { S.flag[me] = false; go(T,5); return D.names[me]+": <code>flag["+me+"] = false</code>."; }},
  {ln:6, z:"rem", run:(S,T,me,D) => { T.k++; go(T, T.k < 2 ? 0 : DONE); return D.names[me]+" runs its remainder section"+(T.k < 2 ? " and will want in again." : " and is done."); }}
];}
TOPICS.push({ id:"peterson", num:"3.14", session:S7, sessionTitle:S7T, kind:"sched", short:"Algorithm 3 / Peterson",
  title:"Algorithm 3 / Peterson Solution: combine flag and turn",
  lead:"Pi sets flag[i] = true (I want in) and then turn = j (but you go first). It waits while flag[j] && turn == j. It meets all three requirements.",
  names:["P0","P1"],
  code:`boolean flag[2];  int turn;
/* process Pi */
flag[i] = true;  turn = j;
while (flag[j] && turn == j) ;
/* critical section */
flag[i] = false;`, file:"cs_peterson.c",
  init:()=>({flag:[false,false], turn:0}), progs:()=>[peter(0), peter(1)], stage:"zones", stageH:290,
  tour:[0,1,0,1,1,0,1,0,0,0,1,0,0,0,1,1,0,0,0,0,1,1,1,1,1,1,1],
  overlay:(st) => { const b = st.last && st.last.before; return sharedStrip([["flag[0]", B(st.S.flag[0]), b && b.flag && b.flag[0] !== st.S.flag[0]],["flag[1]", B(st.S.flag[1]), b && b.flag && b.flag[1] !== st.S.flag[1]],["turn", st.S.turn, st.last && st.last.changed.includes("turn")]]); },
  vars:(st,i) => "rounds "+st.Th[i].k+" / 2 · spins "+st.Th[i].spins,
  think:(st,i,D) => { const T = st.Th[i], S = st.S, j = 1-i, z = zoneOf(st,i); if (z === "done") return "Done."; if (T.pc === 0) return "About to say: I want in."; if (T.pc === 1) return "About to let "+D.names[j]+" go first."; if (T.pc === 2) return (S.flag[j] && S.turn === j) ? (T.spinning ? "Waiting: " : "Next: test. ")+D.names[j]+" wants in and turn = "+j+"." : "Next: test. Free to go."; return {cs:"Inside.", exit:"About to lower my flag.", rem:"Remainder."}[z]; },
  phases:[
    {at:0, t:"Both say \"I want in\"", d:"flag[0] = flag[1] = true."},
    {at:2, t:"P0 writes turn = 1, then P1 writes turn = 0", d:"P1 wrote last."},
    {at:4, t:"turn decides", d:"P1 wrote turn last, so P1 waits and P0 enters: mutual exclusion."},
    {at:10, t:"Progress", d:"P0 has left (flag[0] = false), so P1 enters at once."},
    {at:13, t:"Bounded waiting", d:"P0 wants in again but set turn = 1, so P1 goes first: at most one entry by the other."}
  ],
  notes:{4:"<b>Example from the slide:</b> both set their flags. P0 writes turn = 1, then P1 writes turn = 0. P1 wrote last, so P1 waits and P0 enters.", end:"All three requirements hold. It is for two processes, and on modern CPUs it needs memory barriers: the textbook version lost 12–39 updates per run on the VM."},
  real:[PS+"./cs_peterson plain", "peterson-p: counter =  3999968  expected 4000000  lost 32  (941 ms)", PS+"./cs_peterson", "peterson  : counter =  4000000  expected 4000000  lost 0  (1330 ms)", "# plain = textbook code; default = C11 atomics with fences"],
  props:[["Mutual exclusion","yes","turn decides a tie"],["Progress","yes","a process with flag = false blocks no one"],["Bounded waiting","yes","a waiter enters after at most one entry by the other"]],
  deep:`<table class="std"><tr><th>requirement</th><th>Alg. 1</th><th>Alg. 2</th><th>Peterson</th></tr><tr><td>mutual exclusion</td><td>yes</td><td>yes</td><td>yes</td></tr><tr><td>progress</td><td>no</td><td>no</td><td>yes</td></tr><tr><td>bounded waiting</td><td>yes</td><td>—</td><td>yes</td></tr></table>`
});

/* ---------- 3.15 Bakery (slide example: P1 = 3, P2 = P4 = 4) ---------- */
const NB = 4;
function bakery(me){ const nextJ = T => { T.L.j++; if (T.L.j === me) T.L.j++; }; return [
  {ln:1, z:"entry", run:(S,T,me,D) => { S.choosing[me] = true; go(T,1); return D.names[me]+": <code>choosing["+me+"] = true</code>, \"I am picking a ticket\"."; }},
  {ln:2, z:"entry", run:(S,T,me,D) => { T.L.m = Math.max(...S.number); go(T,2); return D.names[me]+" reads every ticket: ["+S.number.join(", ")+"]. The largest is <b>"+T.L.m+"</b>."; }},
  {ln:2, z:"entry", run:(S,T,me,D) => { S.number[me] = T.L.m + 1; go(T,3); const tie = S.number.some((n,k) => k !== me && n === S.number[me]); return D.names[me]+" takes ticket <code>number["+me+"] = "+(T.L.m+1)+"</code>."+(tie ? " <b>Same number as another process!</b> The id breaks the tie." : ""); }},
  {ln:3, z:"entry", run:(S,T,me,D) => { S.choosing[me] = false; T.L.j = me === 0 ? 1 : 0; go(T,4); return D.names[me]+": <code>choosing["+me+"] = false</code>. Now it checks every other process, starting with "+D.names[T.L.j]+"."; }},
  {ln:5, also:[4], z:"entry", run:(S,T,me,D) => { const j = T.L.j; if (S.choosing[j]){ T.spins++; T.spinning = true; return D.names[me]+": "+D.names[j]+" is still choosing, so it <b>waits</b>."; } T.spinning = false; go(T,5); return D.names[me]+": "+D.names[j]+" is not choosing."; }},
  {ln:6, also:[4], z:"entry", run:(S,T,me,D) => { const j = T.L.j, nj = S.number[j], ni = S.number[me]; if (nj && less(nj, j, ni, me)){ T.spins++; T.spinning = true; return D.names[me]+": "+D.names[j]+" holds <b>("+nj+", "+(j+1)+")</b>, smaller than its own <b>("+ni+", "+(me+1)+")</b>, so it <b>waits</b>."; } T.spinning = false; const why = nj ? "("+nj+", "+(j+1)+") is not smaller than ("+ni+", "+(me+1)+")" : D.names[j]+" has no ticket"; nextJ(T); if (T.L.j >= NB){ go(T,6); return D.names[me]+": "+why+". All checks passed: it <b>enters</b>."; } go(T,4); return D.names[me]+": "+why+". Next check: "+D.names[T.L.j]+"."; }},
  {ln:8, z:"cs", run:(S,T,me,D) => { go(T,7); return D.names[me]+" is in its <b>critical section</b> with ticket "+S.number[me]+"."; }},
  {ln:8, z:"exit", run:(S,T,me,D) => { S.number[me] = 0; go(T,DONE); return D.names[me]+": <code>number["+me+"] = 0</code>, it throws its ticket away."; }}
];}
TOPICS.push({ id:"bakery", num:"3.15", session:S7, sessionTitle:S7T, kind:"sched", short:"Bakery algorithm",
  title:"Bakery Algorithm: take a number, n processes",
  lead:"Before entering, a process takes a ticket one higher than any ticket it sees. The smallest ticket enters first; ties go to the smaller process id: (number, id).",
  names:["P1","P2","P3","P4"],
  code:`choosing[i] = true;
number[i] = 1 + max(number[0], ..., number[n-1]);
choosing[i] = false;
for (j = 0; j < n; j++) {
    while (choosing[j]) ;
    while (number[j] && (number[j],j) < (number[i],i)) ;
}
/* critical section */   number[i] = 0;`, file:"bakery.c",
  init:()=>({choosing:[false,false,false,false], number:[0,0,2,0]}),
  setup:(S,Th) => { Th[2].pc = 6; },
  progs:()=>[0,1,2,3].map(bakery), stage:"zones", stageH:370, tokGap:76,
  prefix:[0,0,0,0, 1,3,1,3,1,3,1,3, 0,0,0,0, 3,3, 2,2],
  badge:(st,i) => st.S.number[i] ? "#"+st.S.number[i] : "",
  tokNote:(st,i,fin) => fin ? "done" : st.S.choosing[i] ? "choosing" : st.Th[i].spinning ? "waiting" : zoneOf(st,i) === "cs" ? "inside" : "",
  overlay:(st,D) => { const S = st.S, b = st.last && st.last.before; const q = S.number.map((n,i) => [n,i]).filter(p => p[0]).sort((a,c) => less(a[0],a[1],c[0],c[1]) ? -1 : 1);
    return '<div style="position:absolute;left:0;right:0;bottom:0;padding:8px 10px;background:var(--panel);border-top:1px solid var(--line);border-radius:0 0 12px 12px;z-index:3"><table class="bk"><tr><th>process (id)</th>'+[0,1,2,3].map(i => '<th style="color:'+COLORS[i]+'">P'+(i+1)+' ('+(i+1)+')</th>').join("")+'</tr><tr><th>choosing</th>'+S.choosing.map((c,i) => '<td class="'+(b && b.choosing && b.choosing[i] !== c ? "chg" : "")+'">'+(c ? "✍ true" : "false")+'</td>').join("")+'</tr><tr><th>number</th>'+S.number.map((n,i) => '<td class="'+(b && b.number && b.number[i] !== n ? "chg" : "")+'"><b>'+n+'</b></td>').join("")+'</tr></table><div class="hint" style="margin-top:4px">order by (ticket, id): '+(q.map(([n,i]) => '<b style="color:'+COLORS[i]+'">P'+(i+1)+'</b> ('+n+', '+(i+1)+')').join(" → ") || "nobody holds a ticket")+'</div></div>'; },
  vars:(st,i) => "ticket "+st.S.number[i]+(st.Th[i].pc >= 4 && st.Th[i].pc <= 5 ? " · checking P"+(st.Th[i].L.j+1) : "")+" · spins "+st.Th[i].spins,
  think:(st,i,D) => { const T = st.Th[i], S = st.S, ni = S.number[i]; if (isDone(st,i)) return "Served."; if (T.pc === 0) return "About to pick a ticket."; if (T.pc === 1) return "Choosing: reading all tickets."; if (T.pc === 2) return "Saw max = "+T.L.m+": my ticket will be "+(T.L.m+1)+"."; if (T.pc === 3) return "Ticket "+ni+" written."; if (T.pc === 4) return S.choosing[T.L.j] ? (T.spinning ? "Waiting: " : "Next: ")+D.names[T.L.j]+" is still choosing." : "Next: check "+D.names[T.L.j]+"."; if (T.pc === 5){ const nj = S.number[T.L.j]; return nj && less(nj, T.L.j, ni, i) ? (T.spinning ? "Waiting: " : "Next: compare. ")+D.names[T.L.j]+" has ("+nj+","+(T.L.j+1)+") < my ("+ni+","+(i+1)+")." : "Next: compare with "+D.names[T.L.j]+": I am ahead."; } return zoneOf(st,i) === "cs" ? "Inside with ticket "+ni+"." : "Throwing my ticket away."; },
  phases:[
    {at:0, t:"P3 is already inside with ticket 2", d:"It started earlier; everyone must wait for it."},
    {at:1, t:"P1 takes ticket 3", d:"It sees max = 2, so number[0] = 3."},
    {at:4, t:"P2 and P4 both take ticket 4", d:"Both read max = 3 before either writes: a tie."},
    {at:12, t:"choosing[] and comparisons", d:"P1 waits for P3 (2 < 3); P4 waits for P1 (3 < 4)."},
    {at:19, t:"P3 leaves: number = 0", d:"The smallest remaining pair goes next."},
    {at:20, t:"Served in order (ticket, id)", d:"P1 (3), then P2 (4, id 2), then P4 (4, id 4)."}
  ],
  notes:{0:"<b>Example from the slide:</b> P1 gets ticket 3, P2 and P4 both get 4. Order of entry: P1 (3), then P2 (4, id 2), then P4 (4, id 4). P3 already holds ticket 2 and is inside.", 12:"P2 and P4 hold the same number. Comparing the pairs <b>(4, 2) &lt; (4, 4)</b> puts P2 first.", end:"Entered in order P3, P1, P2, P4. It gives mutual exclusion, progress and bounded waiting for any number of processes, with no special hardware."},
  real:[PS+"./bakery", "bakery    : counter =  400000  expected 400000  lost 0  (244 ms)", "largest ticket handed out: 313319,  spins on a tied ticket: 35919"],
  props:[["Mutual exclusion","yes","(ticket, id) pairs are unique"],["Progress","yes","the smallest pair never waits"],["Bounded waiting","yes","first come, first served"],["Processes","n","no special hardware"]],
  deep:`<p><code>choosing[i]</code> marks that Pi is still picking its number, so others do not compare against a half-written ticket. Without it, P1 could see <code>number[4] = 0</code> while P4 is between reading the max and writing its ticket, walk in, and then P4 (with a smaller pair) walks in too.</p>`
});

/* ---------- 3.16 bounded buffer with semaphores ---------- */
const BS_N = 3, BS_ITEMS = 4;
function bsProd(O){ const first = O.order === "wrong" ? "mutex" : "empty", second = O.order === "wrong" ? "empty" : "mutex"; return [
  {ln:2, z:"entry", run:(S,T,me,D) => { T.L.x = T.k + 1; return SEM.wait(S, first, T, me) ? "Producer: <code>wait("+first+")</code> succeeds ("+first+" now "+S.sem[first].v+")." : "Producer: <code>wait("+first+")</code>, but "+first+" is 0, so it <b>sleeps</b>"+(first === "empty" ? ": the buffer is full." : "."); }},
  {ln:3, z:"entry", run:(S,T,me,D) => SEM.wait(S, second, T, me) ? "Producer: <code>wait("+second+")</code> succeeds." : "Producer: <code>wait("+second+")</code>, but "+second+" is 0, so it <b>sleeps</b>"+(second === "empty" ? " <b>while still holding mutex</b>." : ".")},
  {ln:4, z:"cs", run:(S,T,me,D) => { S.buf[S.in] = T.L.x; S.in = (S.in + 1) % BS_N; go(T,3); return "Producer adds item <b>"+T.L.x+"</b> to the buffer."; }},
  {ln:5, z:"exit", run:(S,T,me,D,Th) => { go(T,4); return "Producer: <code>signal(mutex)</code>."+SEM.signal(S,"mutex",Th,D); }},
  {ln:6, z:"exit", run:(S,T,me,D,Th) => { T.k++; const m = "Producer: <code>signal(full)</code>, one more filled slot."+SEM.signal(S,"full",Th,D); go(T, T.k < BS_ITEMS ? 0 : DONE); return m; }}
];}
function bsCons(){ return [
  {ln:8, z:"entry", run:(S,T,me,D) => SEM.wait(S,"full",T,me) ? "Consumer: <code>wait(full)</code> succeeds (full now "+S.sem.full.v+")." : "Consumer: <code>wait(full)</code>, but full is 0: the buffer is empty, so it <b>sleeps</b>."},
  {ln:9, z:"entry", run:(S,T,me,D) => SEM.wait(S,"mutex",T,me) ? "Consumer: <code>wait(mutex)</code> succeeds." : "Consumer: <code>wait(mutex)</code>, but mutex is 0 (the producer holds it), so it <b>sleeps</b>."},
  {ln:10, z:"cs", run:(S,T,me,D) => { T.L.x = S.buf[S.out]; S.buf[S.out] = null; S.out = (S.out + 1) % BS_N; S.got.push(T.L.x); go(T,3); return "Consumer removes item <b>"+T.L.x+"</b>."; }},
  {ln:11, z:"exit", run:(S,T,me,D,Th) => { go(T,4); return "Consumer: <code>signal(mutex)</code>."+SEM.signal(S,"mutex",Th,D); }},
  {ln:12, z:"exit", run:(S,T,me,D,Th) => { T.k++; const m = "Consumer: <code>signal(empty)</code>, one more free slot."+SEM.signal(S,"empty",Th,D); go(T, T.k < BS_ITEMS ? 0 : DONE); return m; }}
];}
TOPICS.push({ id:"boundedsem", num:"3.16", session:S8, sessionTitle:S8T, kind:"sched", short:"Bounded buffer (semaphores)",
  title:"Case study 1: the bounded buffer with semaphores",
  lead:"Three semaphores: mutex = 1 (one process at a time touches the buffer), empty = n (free slots), full = 0 (filled slots). Switch the order to see why the counting semaphore must come first.",
  names:["producer","consumer"], tokLabel:["P","C"],
  options:[{key:"order", label:"Producer's order", values:[["right","wait(empty) then wait(mutex)"],["wrong","wait(mutex) then wait(empty)"]]}],
  code:O => O.order === "wrong" ? `/* producer */
wait(mutex);          /* WRONG ORDER */
wait(empty);
add item
signal(mutex);
signal(full);
/* consumer */
wait(full);
wait(mutex);
remove item
signal(mutex);
signal(empty);` : `/* producer */
wait(empty);
wait(mutex);
add item
signal(mutex);
signal(full);
/* consumer */
wait(full);
wait(mutex);
remove item
signal(mutex);
signal(empty);`, file:"bounded_buffer_sem.c",
  init:()=>({buf:Array(BS_N).fill(null), in:0, out:0, got:[], sem:{mutex:{v:1,q:[]}, empty:{v:BS_N,q:[]}, full:{v:0,q:[]}}}),
  progs:O => [bsProd(O), bsCons()],
  tourFor:O => { const D = TOPICS.find(t => t.id === "boundedsem"); const p = Array(BS_N*5).fill(0); if (O.order === "wrong") return p.concat([0,0,1,1]); return autoTour(D, p.concat([0])); },
  stage:(st) => { const S = st.S, sem = S.sem;
    const sb = (x, n) => H.box(x, 150, 30, 76, n+" = "+sem[n].v, '<div style="padding:0 8px;font-size:12px">'+(sem[n].q.length ? 'sleeping: <b style="color:var(--warn)">'+sem[n].q.map(q => ["producer","consumer"][q]).join(", ")+'</b>' : '<span class="hint">nobody waiting</span>')+'</div>', st.last && st.last.changed.includes("sem") && st.last.before.sem[n].v !== sem[n].v ? "hot" : "");
    let h = H.proc(2, 14, 26, 110, "producer", "var(--c0)", "var(--c0b)", '<div style="padding:2px 8px;font-size:12.5px">made '+st.Th[0].k+' / '+BS_ITEMS+(st.Th[0].st === "sleep" ? '<br><b style="color:var(--warn)">asleep</b>' : "")+'</div>', st.last && st.last.me === 0);
    h += H.proc(72, 14, 26, 110, "consumer", "var(--c1)", "var(--c1b)", '<div style="padding:2px 8px;font-size:12.5px">got: '+(S.got.join(", ") || "–")+(st.Th[1].st === "sleep" ? '<br><b style="color:var(--warn)">asleep</b>' : "")+'</div>', st.last && st.last.me === 1);
    h += H.box(31, 24, 38, 90, "buffer ("+BS_N+" slots)", '<div style="padding:0 8px">'+S.buf.map(v => '<span class="slot '+(v !== null ? "full" : "")+'">'+(v ?? "")+'</span>').join("")+'</div>');
    h += sb(2, "mutex") + sb(35, "empty") + sb(68, "full");
    h += H.txt(2, 236, "full = "+sem.full.v+"  ·  empty = "+sem.empty.v+"  ·  mutex = "+sem.mutex.v+"   (full + empty = "+(sem.full.v + sem.empty.v)+" when nobody is mid-operation)", "font:600 12px var(--mono);color:var(--ink)");
    return h; }, stageH:260, stageTitle:"Buffer and the three semaphores",
  vars:(st,i) => i === 0 ? "next item "+(st.Th[0].k+1) : "items taken "+st.S.got.length,
  statusOf:(st,i) => isDone(st,i) ? ["done","var(--dead)"] : st.Th[i].st === "sleep" ? ["asleep","var(--warn)"] : zoneOf(st,i) === "cs" ? ["touching buffer","var(--ok)"] : ["ready","var(--muted)"],
  think:(st,i) => { const S = st.S, T = st.Th[i]; if (isDone(st,i)) return "Done."; if (T.st === "sleep"){ for (const n of ["mutex","empty","full"]) if (S.sem[n].q.includes(i)) return "Asleep on "+n+"."; } return "Ready."; },
  check:(st,D) => { if (D.names.every((n,i) => isDone(st,i))) return ["ok","All "+BS_ITEMS+" items through, in order. mutex = 1, empty = "+BS_N+", full = 0 again."]; if (!D.names.some((n,i) => runnable(st,i))) return ["bad","<b>Deadlock.</b> The producer holds mutex and sleeps on empty; the consumer sleeps on mutex. Neither can ever wake the other."]; return ["n","Take the counting semaphore first and mutex second."]; },
  phases:O => O.order === "wrong" ? [
    {at:0, t:"Producer fills the buffer", d:"Three items: empty goes 3 → 0, full goes 0 → 3."},
    {at:15, t:"Producer takes mutex first", d:"wait(mutex) succeeds: mutex = 0."},
    {at:16, t:"…then sleeps on empty, holding mutex", d:"The buffer is full."},
    {at:17, t:"Consumer cannot get in", d:"wait(full) succeeds, but wait(mutex) sleeps: deadlock."}
  ] : [
    {at:0, t:"Producer fills the buffer", d:"Each item: wait(empty), wait(mutex), add, signal(mutex), signal(full)."},
    {at:15, t:"Buffer full: producer sleeps on empty", d:"It does not hold mutex, so the consumer can still get in."},
    {at:16, t:"Consumer takes an item", d:"signal(empty) wakes the producer."},
    {at:21, t:"Both run to the end", d:"Semaphores keep count and order; nobody spins."}
  ],
  notes:{0:"<b>Example from the slide:</b> a print spooler with 8 slots: mutex = 1, empty = 8, full = 0. Here the buffer has 3 slots so it fills quickly.", end:"Rule from the slide: take the counting semaphore first and mutex second, or the system can deadlock when the buffer is full. Switch the order at the top and replay."},
  real:realOut("bounded_buffer_sem"),
  props:[["mutex = 1","one process in the buffer",""],["empty = n","free slots","producer waits on it"],["full = 0","filled slots","consumer waits on it"],["Order","counting first, mutex second","otherwise deadlock when full"]], propTitle:"The three semaphores",
  deep:`<pre class="pseudo">/* producer */          /* consumer */
wait(empty);            wait(full);
wait(mutex);            wait(mutex);
add item                remove item
signal(mutex);          signal(mutex);
signal(full);           signal(empty);</pre><p>Compared with topic 3.6: all n slots are usable, nobody busy-waits, and any number of producers and consumers can share the buffer.</p>`
});

/* ---------- 3.16 readers and writers ---------- */
function readerProg(){ return [
  {ln:2, z:"entry", run:(S,T,me,D) => SEM.wait(S,"mutex",T,me) ? D.names[me]+": <code>wait(mutex)</code> to update read_count." : D.names[me]+": <code>wait(mutex)</code>, but another reader is updating read_count: it sleeps."},
  {ln:2, z:"entry", run:(S,T,me,D) => { S.read_count++; go(T,2); return D.names[me]+": <code>read_count++</code> → <b>"+S.read_count+"</b>."; }},
  {ln:3, z:"entry", run:(S,T,me,D) => { if (S.read_count === 1) return SEM.wait(S,"rw_mutex",T,me) ? D.names[me]+" is the <b>first reader</b>: <code>wait(rw_mutex)</code> locks writers out." : D.names[me]+" is the first reader, but a writer holds rw_mutex: it sleeps (still holding mutex)."; go(T,3); return D.names[me]+" is not the first reader (read_count = "+S.read_count+"), so readers already hold rw_mutex. No wait."; }},
  {ln:4, z:"entry", run:(S,T,me,D,Th) => { go(T,4); return D.names[me]+": <code>signal(mutex)</code>."+SEM.signal(S,"mutex",Th,D); }},
  {ln:4, z:"cs", run:(S,T,me,D) => { go(T,5); return D.names[me]+" <b>reads</b>, together with any other readers."; }},
  {ln:5, z:"exit", run:(S,T,me,D) => SEM.wait(S,"mutex",T,me) ? D.names[me]+": <code>wait(mutex)</code> to update read_count." : D.names[me]+": <code>wait(mutex)</code>: sleeps."},
  {ln:5, z:"exit", run:(S,T,me,D) => { S.read_count--; go(T,7); return D.names[me]+": <code>read_count--</code> → <b>"+S.read_count+"</b>."; }},
  {ln:6, z:"exit", run:(S,T,me,D,Th) => { go(T,8); if (S.read_count === 0) return D.names[me]+" is the <b>last reader</b>: <code>signal(rw_mutex)</code>."+SEM.signal(S,"rw_mutex",Th,D); return D.names[me]+": other readers are still reading ("+S.read_count+"), so rw_mutex stays locked. The writer keeps waiting."; }},
  {ln:7, z:"exit", run:(S,T,me,D,Th) => { T.k++; const m = D.names[me]+": <code>signal(mutex)</code>."+SEM.signal(S,"mutex",Th,D); go(T, T.k < 2 ? 0 : DONE); return m; }}
];}
TOPICS.push({ id:"rw", num:"3.16", session:S8, sessionTitle:S8T, kind:"sched", short:"Readers and writers",
  title:"Case study 2: readers and writers",
  lead:"Many readers may read shared data at the same time; a writer needs it alone. The first solution favours readers: while readers keep arriving, a writer can starve.",
  names:["R1","R2","R3","W"],
  code:`/* reader */
wait(mutex);  read_count++;
if (read_count == 1) wait(rw_mutex);
signal(mutex);   ... read ...
wait(mutex);  read_count--;
if (read_count == 0) signal(rw_mutex);
signal(mutex);
/* writer */  wait(rw_mutex); ... write ... signal(rw_mutex);`, file:"readers_writers.c",
  init:()=>({read_count:0, sem:{mutex:{v:1,q:[]}, rw_mutex:{v:1,q:[]}}}),
  progs:()=>[readerProg(), readerProg(), readerProg(), [
    {ln:8, z:"entry", run:(S,T,me,D) => SEM.wait(S,"rw_mutex",T,me) ? "W: <code>wait(rw_mutex)</code> succeeds: no reader inside." : "W: <code>wait(rw_mutex)</code>, but readers hold it. The writer <b>sleeps</b>."},
    {ln:8, z:"cs", run:(S,T) => { go(T,2); return "W <b>writes</b>, alone."; }},
    {ln:8, z:"exit", run:(S,T,me,D,Th) => { go(T,DONE); return "W: <code>signal(rw_mutex)</code>."+SEM.signal(S,"rw_mutex",Th,D); }} ]],
  stage:"zones", stageH:370, tokGap:56,
  zones:[["entry","Entry"],["cs","Reading or writing"],["exit","Exit"],["rem","Done"]], doneZone:"rem",
  prefix:[0,0,0,0, 3, 1,1,1,1, 0,0,0,0,0, 0,0,0,0, 1,1,1,1,1, 2,2,2,2, 0,0,0,0,0, 1,1,1,1, 2,2,2,2,2],
  overlay:(st) => sharedStrip([["read_count", st.S.read_count, st.last && st.last.changed.includes("read_count")],semCell(st.S,"mutex",false),semCell(st.S,"rw_mutex",false)]),
  vars:(st,i) => i < 3 ? "reads done "+st.Th[i].k+" / 2" : "writes 0 / 1".replace("0", isDone(st,3) ? "1" : "0"),
  statusOf:(st,i) => { if (isDone(st,i)) return ["done","var(--dead)"]; if (st.Th[i].st === "sleep") return ["asleep","var(--warn)"]; if (zoneOf(st,i) === "cs") return [i === 3 ? "writing" : "reading","var(--ok)"]; return ["ready","var(--muted)"]; },
  think:(st,i) => { const T = st.Th[i]; if (isDone(st,i)) return "Done."; if (i === 3) return T.st === "sleep" ? "Starving: readers keep the data busy." : zoneOf(st,3) === "cs" ? "Writing alone." : "I want to write."; if (T.st === "sleep") return "Asleep."; return zoneOf(st,i) === "cs" ? "Reading with "+(st.S.read_count-1)+" other reader(s)." : "Updating read_count."; },
  check:(st,D) => { const ins = D.names.map((n,i) => i).filter(i => zoneOf(st,i) === "cs"); if (ins.includes(3) && ins.length > 1) return ["bad","A writer is inside with others!"]; if (D.names.every((n,i) => isDone(st,i))) return ["ok","Finished. The writer only got in once every reader had left."]; if (st.Th[3].st === "sleep" && st.S.read_count > 0) return ["bad","<b>Writer starving:</b> read_count never reaches 0 while new readers keep arriving."]; return ["n","Readers together, a writer alone."]; },
  phases:[
    {at:0, t:"First reader locks writers out", d:"R1 makes read_count = 1 and takes rw_mutex."},
    {at:4, t:"The writer has to wait", d:"W sleeps on rw_mutex."},
    {at:5, t:"More readers join freely", d:"R2 makes read_count 2 and reads at the same time as R1."},
    {at:9, t:"Readers overlap, count never hits 0", d:"Each leaving reader sees another still reading."},
    {at:53, t:"Last reader lets the writer in", d:"Only when read_count reaches 0 does W get rw_mutex."}
  ],
  notes:{0:"<b>Example from the slide:</b> a railway seat chart. Thousands look up seats at once (readers); a booking must change the chart alone (writer).", 9:"Watch read_count: a new reader always arrives before the last one leaves, so it never reaches 0 and the writer keeps sleeping.", end:"This first solution <b>favours readers</b>. Other versions favour writers (new readers wait if a writer is waiting) or queue everyone fairly."},
  real:realOut("readers_writers"),
  props:[["Readers together","yes","read_count tracks them"],["Writer alone","yes","rw_mutex"],["Writer starvation","possible","readers favoured"]], propTitle:"Properties",
  deep:`<p><code>mutex</code> only protects <code>read_count</code>. <code>rw_mutex</code> is held by the group of readers as a whole (taken by the first, released by the last) or by one writer.</p>`
});

/* ---------- 3.16 dining philosophers ---------- */
const DP = 5;
function philProg(i, O){ const left = i, right = (i + 1) % DP; let first = left, second = right; if (O.strat === "ordered" && i % 2 === 0){ first = right; second = left; }
  const take = (c, step) => (S,T,me,D) => { const ch = S.ch[c]; if (ch.holder === null){ ch.holder = me; go(T, T.pc+1); return D.names[me]+": <code>wait(chopstick["+c+"])</code>, picks up chopstick c"+c+" ("+(c === left ? "left" : "right")+")."; } ch.q.push(me); T.st = "sleep"; return D.names[me]+": <code>wait(chopstick["+c+"])</code>, but "+D.names[ch.holder]+" has c"+c+". "+D.names[me]+" <b>waits</b>"+(step === 2 ? ", holding c"+first+"." : "."); };
  const rel = (S, c, Th, D) => { const ch = S.ch[c]; if (ch.q.length){ const w = ch.q.shift(); ch.holder = w; Th[w].st = "ready"; Th[w].pc += 1; return " c"+c+" goes to "+D.names[w]+"."; } ch.holder = null; return ""; };
  return [
    {ln:2, z:"rem", run:(S,T,me,D) => { go(T,1); return D.names[me]+" thinks, then gets hungry."; }},
    {ln:3, z:"entry", run:take(first, 1)},
    {ln:4, z:"entry", run:take(second, 2)},
    {ln:5, z:"cs", run:(S,T,me,D) => { go(T,4); S.meals++; return D.names[me]+" <b>eats</b> with c"+left+" and c"+right+"."; }},
    {ln:6, z:"exit", run:(S,T,me,D,Th) => { const m = rel(S, second, Th, D) + rel(S, first, Th, D); go(T,DONE); return D.names[me]+" puts both chopsticks down."+m; }}
  ];
}
TOPICS.push({ id:"dining", num:"3.16", session:S8, sessionTitle:S8T, kind:"sched", short:"Dining philosophers",
  title:"Case study 3: the dining philosophers",
  lead:"Five philosophers sit at a round table with one chopstick between each pair. Each needs both neighbouring chopsticks to eat. If all five pick up their left chopstick at once, each waits for ever for the right one.",
  names:["P0","P1","P2","P3","P4"],
  options:[{key:"strat", label:"Strategy", values:[["left","everyone picks left first"],["ordered","odd: left first · even: right first"]]}],
  code:`semaphore chopstick[5] = {1, 1, 1, 1, 1};
think();
wait(chopstick[i]);             /* first chopstick  */
wait(chopstick[(i + 1) % 5]);   /* second chopstick */
eat();
signal(chopstick[i]);  signal(chopstick[(i + 1) % 5]);`, file:"dining.c",
  init:()=>({ch:Array.from({length:DP}, () => ({holder:null, q:[]})), meals:0}),
  progs:O => [0,1,2,3,4].map(i => philProg(i, O)),
  tourFor:O => { const p = [0,1,2,3,4, 0,1,2,3,4]; if (O.strat === "left") return p.concat([0,1,2,3,4]); return autoTour(TOPICS.find(t => t.id === "dining"), p); },
  stage:(st,D) => { const S = st.S, cx = 50, cy = 160, R = 118;
    let h = '<div style="position:absolute;left:calc(50% - 70px);top:'+(cy-70)+'px;width:140px;height:140px;border-radius:50%;background:var(--zone);border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font:600 12px var(--sans);color:var(--muted);text-align:center">meals eaten<br>'+S.meals+'</div>';
    for (let c = 0; c < DP; c++){ const a = -Math.PI/2 + (c + 0.5) * 2*Math.PI/DP; const x = Math.cos(a)*R*0.62, y = Math.sin(a)*R*0.62; const hd = S.ch[c].holder;
      h += '<div style="position:absolute;left:calc(50% + '+x+'px - 22px);top:'+(cy+y-10)+'px;width:44px;height:20px;border-radius:10px;background:'+(hd === null ? "var(--soft)" : COLORS[hd])+';border:1.5px solid var(--line);font:700 11px var(--mono);color:'+(hd === null ? "var(--ink)" : "#fff")+';display:flex;align-items:center;justify-content:center;transform:rotate('+(a*180/Math.PI+90)+'deg)"><span style="display:inline-block;transform:rotate('+(-(a*180/Math.PI+90))+'deg)">c'+c+'</span></div>'; }
    for (let i = 0; i < DP; i++){ const a = -Math.PI/2 + i * 2*Math.PI/DP; const x = Math.cos(a)*R, y = Math.sin(a)*R; const T = st.Th[i];
      const s = isDone(st,i) ? "full" : T.st === "sleep" ? "waiting" : zoneOf(st,i) === "cs" ? "eating" : T.pc === 0 ? "thinking" : "hungry";
      h += '<div class="'+(st.last && st.last.me === i ? "pop" : "")+'" style="position:absolute;left:calc(50% + '+x+'px - 30px);top:'+(cy+y-30)+'px;width:60px;height:60px;border-radius:50%;background:'+COLORS[i]+';color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 13px var(--mono);box-shadow:0 0 0 '+(s === "eating" ? "4px var(--ok)" : s === "waiting" ? "4px var(--warn)" : "3px var(--panel)")+'">'+D.names[i]+'<span style="font:600 9.5px var(--sans)">'+s+'</span></div>'; }
    return h; }, stageH:320, stageTitle:"The round table (chopstick colour = who holds it)",
  vars:(st,i) => "left c"+i+" · right c"+((i+1)%DP),
  statusOf:(st,i) => isDone(st,i) ? ["ate","var(--dead)"] : st.Th[i].st === "sleep" ? ["waiting","var(--warn)"] : zoneOf(st,i) === "cs" ? ["eating","var(--ok)"] : st.Th[i].pc === 0 ? ["thinking","var(--muted)"] : ["hungry","var(--accent)"],
  think:(st,i) => { const T = st.Th[i]; if (isDone(st,i)) return "Ate."; if (T.st === "sleep") return "Holding "+(T.pc === 2 ? "one chopstick, " : "")+"waiting for the next."; return ["Thinking.","Next: first chopstick.","Next: second chopstick.","Eating.","Putting chopsticks down."][T.pc]; },
  check:(st,D) => { if (D.names.every((n,i) => isDone(st,i))) return ["ok","Everyone ate: no deadlock. Breaking the circular wait fixes it."]; if (!D.names.some((n,i) => runnable(st,i))) return ["bad","<b>Deadlock:</b> every philosopher holds one chopstick and waits for ever for the next."]; return ["n","At most two philosophers can eat at the same time (5 chopsticks, 2 each)."]; },
  phases:O => O.strat === "left" ? [
    {at:0, t:"Everyone thinks, then gets hungry", d:"Five philosophers, five chopsticks."},
    {at:5, t:"All pick up the left chopstick", d:"c0 to c4 are all taken at the same moment."},
    {at:10, t:"All wait for the right one", d:"Each right chopstick is someone else's left: a circular wait."},
    {at:14, t:"Deadlock", d:"Nobody can eat, nobody will put a chopstick down."}
  ] : [
    {at:0, t:"Everyone thinks, then gets hungry", d:"Five philosophers, five chopsticks."},
    {at:5, t:"Odd pick left, even pick right", d:"Neighbours now compete for the same first chopstick."},
    {at:11, t:"Someone always gets both", d:"The circular wait is broken, so at least one eats."},
    {at:13, t:"Eating and releasing", d:"Released chopsticks wake the waiting neighbours until all have eaten."}
  ],
  notes:{0:"<b>Example from the slide:</b> it models any process that needs two resources held by others, such as a transfer that must lock two bank accounts.", end:"Fixes from the slide: allow at most four at the table; pick up both only if both are free (a monitor); or odd philosophers pick left first, even ones right first. Switch the strategy at the top and replay."},
  real:realOut("dining"),
  props:[["Left-first","deadlock possible","circular wait"],["At most 4 seated","no deadlock","one always gets two"],["Both-or-none (monitor)","no deadlock","no hold-and-wait"],["Odd/even order","no deadlock","breaks the circle"]], propTitle:"Strategies",
  deep:`<p>A deadlock needs all four conditions: mutual exclusion (a chopstick has one holder), hold and wait (holding the left while waiting for the right), no preemption (nobody snatches a chopstick), and circular wait (P0 → P1 → … → P4 → P0). Each fix removes one of them, which is exactly the deadlock material that follows in the course.</p>`
});
