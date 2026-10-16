/* ===== Session 3: critical section, race, producer-consumer (3.4-3.6) and Session 4: hardware and software solutions (3.7-3.8) ===== */
const S3 = "Session 3", S3T = "The critical-section problem, race conditions and producer-consumer";
const S4 = "Session 4", S4T = "Hardware help, and the family of software solutions";

const sharedStrip = (cells) => '<div style="position:absolute;left:0;right:0;bottom:0;padding:8px 10px;background:var(--panel);border-top:1px solid var(--line);border-radius:0 0 12px 12px;z-index:3"><div style="font:600 11px var(--sans);color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">shared memory</div>' + H.cells(cells) + '</div>';

/* ---------- 3.4 critical-section problem (3 ATMs, an ideal lock) ---------- */
function atmProg(amount){ return [
  {ln:2, z:"entry", run:(S,T,me,D,Th) => { if (S.inside === null){ S.inside = me; go(T,1); return D.names[me]+" asks to enter in its <b>entry section</b>. Nobody is inside, so permission is granted at once."; } if (!S.queue.includes(me)) S.queue.push(me); T.st = "sleep"; return D.names[me]+" asks to enter, but "+D.names[S.inside]+" is inside. <b>Mutual exclusion</b>: it must wait. It joins the queue: "+S.queue.map(q => D.names[q]).join(", ")+"."; }},
  {ln:3, z:"cs", run:(S,T,me,D) => { const old = S.balance; S.balance += amount; go(T,2); return D.names[me]+" is in its <b>critical section</b>: balance "+old+" "+(amount > 0 ? "+ "+amount : "− "+(-amount))+" = <b>"+S.balance+"</b>. Nobody else can touch the balance now."; }},
  {ln:4, z:"exit", run:(S,T,me,D,Th) => { S.inside = null; let x = " Nobody is waiting."; if (S.queue.length){ const w = S.queue.shift(); S.inside = w; Th[w].st = "ready"; Th[w].pc = 1; x = " "+D.names[w]+" was first in the queue, so it goes in next: <b>progress</b>, and the queue order gives <b>bounded waiting</b>."; } go(T,3); return D.names[me]+" says it has left, in its <b>exit section</b>."+x; }},
  {ln:5, z:"rem", run:(S,T,me,D) => { go(T,DONE); return D.names[me]+" continues with its <b>remainder section</b> (printing the receipt), which does not touch shared data."; }}
];}
TOPICS.push({ id:"csproblem", num:"3.4", session:S3, sessionTitle:S3T, kind:"sched", short:"Critical section problem",
  title:"Critical Section Problem",
  lead:"Only one process at a time in the code that touches shared data. Every process follows the same structure: entry section, critical section, exit section, remainder section.",
  names:["ATM1","ATM2","ATM3"], tokLabel:["A1","A2","A3"],
  code:`do {
    entry section          /* ask to enter        */
        critical section   /* balance = balance ± x */
    exit section           /* say you have left    */
        remainder section  /* print the receipt    */
} while (true);`,
  init:()=>({balance:1000, inside:null, queue:[]}),
  progs:()=>[atmProg(500), atmProg(-200), atmProg(100)],
  stage:"zones", stageH:300, prefix:[0,1,2],
  overlay:(st) => sharedStrip([["balance", st.S.balance, st.last && st.last.changed.includes("balance")],["inside", st.S.inside === null ? "nobody" : "ATM"+(st.S.inside+1), st.last && st.last.changed.includes("inside")],["waiting queue", st.S.queue.map(q => "ATM"+(q+1)).join(", ") || "empty", st.last && st.last.changed.includes("queue")]]),
  vars:(st,i) => ["deposit 500","withdraw 200","deposit 100"][i],
  think:(st,i) => { const T = st.Th[i], z = zoneOf(st,i); if (z === "done") return "Done."; if (T.st === "sleep") return "Waiting my turn."; return {entry:"About to ask permission.", cs:"I may touch the balance now.", exit:"About to announce I have left.", rem:"Printing the receipt."}[z]; },
  check:(st, D) => { const inside = D.names.filter((n,i) => zoneOf(st,i) === "cs").length; if (inside > 1) return ["bad","Mutual exclusion violated."]; if (D.names.every((n,i) => isDone(st,i))) return ["ok","All three ATMs finished. Balance 1000 + 500 − 200 + 100 = <b>"+st.S.balance+"</b>, with no lost update."]; return ["n","Rule: at most one ATM in the green column at any moment."]; },
  phases:[
    {at:0, t:"Entry section: ask permission", d:"ATM1 asks and gets in; ATM2 and ATM3 must wait."},
    {at:3, t:"Critical section", d:"Only the ATM inside updates the shared balance."},
    {at:4, t:"Exit section", d:"The ATM announces it has left and the next one is let in."},
    {at:6, t:"Remainder section", d:"Work that does not touch shared data runs in parallel."},
    {at:7, t:"The three requirements", d:"Mutual exclusion, progress and bounded waiting hold at every step."}
  ],
  notes:{0:"<b>Example from the slide:</b> two (here three) ATMs updating the same bank balance. The update of the balance is the critical section. In this tab the entry section is an ideal lock, so you can see the <b>structure</b>; sessions 4–7 show how real entry sections are built.", end:"A correct solution needs all three: <b>mutual exclusion</b> (at most one inside), <b>progress</b> (if none is inside, one that wants in gets in), <b>bounded waiting</b> (a limit on how often others go first)."},
  props:[["Mutual exclusion","yes","at most one process inside"],["Progress","yes","if none is inside, one that wants in gets in"],["Bounded waiting","yes","a limit on how often others go first"]],
  propTitle:"The three requirements",
  deepTitle:"The critical-section problem",
  deep:`<div class="dgrid"><div><h3>Definitions</h3><ul><li><b>Critical section</b>: the part of a process's code that reads or writes shared data.</li><li><b>The problem</b>: design a protocol so that no two processes are in their critical sections at the same time.</li><li><b>Entry section</b>: code that asks permission. <b>Exit section</b>: code that announces leaving. The rest is the <b>remainder section</b>.</li></ul></div><div><h3>The three requirements</h3><table class="std"><tr><th>requirement</th><th>meaning</th></tr><tr><td>mutual exclusion</td><td>at most one process inside</td></tr><tr><td>progress</td><td>if none is inside, one that wants in gets in, and processes in their remainder section cannot block that</td></tr><tr><td>bounded waiting</td><td>after a process asks, only a limited number of others can go in first</td></tr></table></div></div>`
});

/* ---------- 3.5 race condition (count = 5, slide timeline) ---------- */
TOPICS.push({ id:"race", num:"3.5", session:S3, sessionTitle:S3T, kind:"sched", short:"Race condition",
  title:"Race Condition",
  lead:"count++ is not one step. In machine code it is load, add, store. If a switch happens between these steps, an update is lost. This tour replays the slide's table, row by row.",
  names:["producer","consumer"], tokLabel:["P","C"],
  code:`/* producer: count++ */
r1 = count;          /* load  */
r1 = r1 + 1;         /* add   */
count = r1;          /* store */
/* consumer: count-- */
r2 = count;          /* load  */
r2 = r2 - 1;         /* sub   */
count = r2;          /* store */`, file:"race_count.c",
  init:()=>({count:5, rows:[]}),
  progs:()=>{ const mk = (me, d, l0) => [
      {ln:l0, run:(S,T,me2,D) => { T.L.r = S.count; T.L.v = S.count; S.rows.push([me, "r"+(me+1)+" = count  ("+T.L.r+")", S.count]); go(T,1); return D.names[me]+" loads <code>count</code> into its register: <code>r"+(me+1)+" = "+T.L.r+"</code>."; }},
      {ln:l0+1, run:(S,T,me2,D) => { T.L.r += d; S.rows.push([me, "r"+(me+1)+" = r"+(me+1)+(d>0?" + 1":" − 1")+"  ("+T.L.r+")", S.count]); go(T,2); return D.names[me]+" computes in its register: <code>r"+(me+1)+" = "+T.L.r+"</code>. Memory still says "+S.count+"."; }},
      {ln:l0+2, run:(S,T,me2,D) => { const old = S.count; S.count = T.L.r; S.rows.push([me, "count = r"+(me+1), S.count]); go(T,DONE); return D.names[me]+" stores: <code>count = "+S.count+"</code> (memory held "+old+")."+(old !== T.L.v ? " But memory changed after "+D.names[me]+" loaded "+T.L.v+", so the other process's update is <b>overwritten and lost</b>." : ""); }}
    ]; return [mk(0, +1, 2), mk(1, -1, 6)]; },
  tour:[0,0,1,1,0,1],
  stage:(st) => { const S = st.S;
    let h = '<div style="padding:10px 12px"><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">' +
      '<div class="th" style="background:var(--c0b);border-color:var(--c0);min-width:150px"><div class="nm" style="color:var(--c0)">producer</div><div class="vars">register r1 = '+(st.Th[0].L.r ?? "–")+'</div></div>' +
      '<div class="cell '+(st.last && st.last.changed.includes("count") ? "chg" : "")+'" style="min-width:120px"><small>shared count</small><span style="font-size:26px">'+S.count+'</span></div>' +
      '<div class="th" style="background:var(--c1b);border-color:var(--c1);min-width:150px"><div class="nm" style="color:var(--c1)">consumer</div><div class="vars">register r2 = '+(st.Th[1].L.r ?? "–")+'</div></div></div>';
    h += '<table class="bk"><tr><th>time</th><th>producer</th><th>consumer</th><th>count</th></tr>' + (S.rows.length ? S.rows.map((r,k) => '<tr class="'+(k === S.rows.length-1 ? "pop" : "")+'"><td>t'+k+'</td><td>'+(r[0]===0 ? esc(r[1]) : "")+'</td><td>'+(r[0]===1 ? esc(r[1]) : "")+'</td><td class="'+(k===S.rows.length-1 && /count =/.test(r[1]) ? "chg" : "")+'"><b>'+r[2]+'</b></td></tr>').join("") : '<tr><td colspan="4" class="hint">nothing executed yet</td></tr>') + '</table></div>';
    return h; }, stageH:330, stageTitle:"Registers, shared count, and the timeline (as on the slide)",
  vars:(st,i) => "register r"+(i+1)+" = "+(st.Th[i].L.r ?? "–"),
  think:(st,i) => isDone(st,i) ? "Done." : ["Next: load count.","Next: change my register.","Next: write my register back."][st.Th[i].pc],
  statusOf:(st,i) => isDone(st,i) ? ["done","var(--dead)"] : st.Th[i].pc > 0 ? ["mid-update","var(--bad)"] : ["ready","var(--muted)"],
  check:(st) => { const done = isDone(st,0) && isDone(st,1); if (!done) return (st.Th[0].pc > 0 && st.Th[1].pc > 0 && !isDone(st,0) && !isDone(st,1)) ? ["bad","Both are between load and store: whichever stores last will overwrite the other."] : ["n","Correct answer after count++ and count--: <b>5</b>."]; return st.S.count === 5 ? ["ok","Final count = 5. Correct: this order did not overlap the two updates."] : ["bad","Final count = <b>"+st.S.count+"</b>, but it should be 5. The "+(st.S.count === 4 ? "producer's" : "consumer's")+" update was lost."]; },
  phases:[
    {at:0, t:"t0: producer loads count (5)", d:"r1 = 5."},
    {at:1, t:"t1: producer adds 1 (6)", d:"Only the register changes; memory still holds 5."},
    {at:2, t:"t2: switch! consumer loads count (5)", d:"The consumer reads the old value 5."},
    {at:3, t:"t3: consumer subtracts 1 (4)", d:"r2 = 4 in the consumer's register."},
    {at:4, t:"t4: producer stores 6", d:"count = 6."},
    {at:5, t:"t5: consumer stores 4", d:"count = 4 overwrites the 6. The producer's update is lost."}
  ],
  notes:{0:"<b>Example from the slide:</b> count = 5. The producer does <code>count++</code> and the consumer does <code>count--</code> at the same time. The answer should be 5, but the result can be 4, 5 or 6.", end:"Final count = 4, but it should be 5. Now switch to <b>You are the scheduler</b> and make it come out 6, then 5. Races are rare and depend on timing, so testing seldom finds them."},
  real:realOut("race_count"),
  props:[["Possible results","4, 5 or 6","depends only on the interleaving"],["Result 4","consumer stores last","after both loaded 5"],["Result 6","producer stores last","after both loaded 5"],["Result 5","no overlap","one finishes before the other loads"]], propTitle:"What can the final count be?",
  deepTitle:"Why races happen",
  deep:`<div class="dgrid"><div><h3>Definition</h3><p>A <b>race condition</b> is when several processes use shared data at the same time and the result depends on the order in which they run.</p><p>The fix is to make the load–add–store sequence a <b>critical section</b>: once one process starts it, no other may start its own until the first has stored.</p></div><div><h3>Why testing misses races</h3><p>The bad interleaving needs a context switch in a window of a few nanoseconds. Most runs hit no switch there and give the right answer. On a multicore machine the two threads truly overlap, so the real program below loses thousands of updates per run.</p></div></div>`
});

/* ---------- 3.6 producer-consumer with in/out ---------- */
const PC_N = 8, PC_ITEMS = 9;
TOPICS.push({ id:"prodcons", num:"3.6", session:S3, sessionTitle:S3T, kind:"sched", short:"Producer–consumer problem",
  title:"Producer Consumer Problem",
  lead:"A producer fills a bounded buffer; a consumer empties it. With only in and out pointers, a buffer of 8 slots can hold just 7 items, because full and empty must look different.",
  names:["producer","consumer"], tokLabel:["P","C"],
  code:`/* producer */
while (true) {
    item = produce();
    while (((in + 1) % 8) == out) ;   /* full: wait */
    buffer[in] = item;  in = (in + 1) % 8;
}
/* consumer */
while (true) {
    while (in == out) ;                /* empty: wait */
    item = buffer[out];  out = (out + 1) % 8;
    consume(item);
}`, file:"prodcons_inout.c",
  init:()=>({buf:Array(PC_N).fill(null), in:0, out:0}),
  progs:()=>[
    [ {ln:3, run:(S,T,me) => { T.L.item = T.k + 1; go(T,1); return "Producer makes item <b>"+T.L.item+"</b>."; }},
      {ln:4, run:(S,T,me) => { if ((S.in + 1) % PC_N === S.out){ T.spins++; T.spinning = true; return "Producer tests <code>(in + 1) % 8 == out</code>: ("+S.in+" + 1) % 8 = "+((S.in+1)%PC_N)+" equals out = "+S.out+". The buffer counts as <b>full</b>, so it <b>waits</b>, even though one slot is empty."; } T.spinning = false; go(T,2); return "Producer tests for full: ("+S.in+" + 1) % 8 = "+((S.in+1)%PC_N)+", out = "+S.out+". Not full."; }},
      {ln:5, run:(S,T,me) => { S.buf[S.in] = T.L.item; const o = S.in; S.in = (S.in + 1) % PC_N; T.k++; go(T, T.k < PC_ITEMS ? 0 : DONE); return "Producer puts item "+T.L.item+" in slot "+o+" and moves <code>in</code> to "+S.in+"."; }} ],
    [ {ln:9, run:(S,T,me) => { if (S.in === S.out){ T.spins++; T.spinning = true; return "Consumer tests <code>in == out</code>: both are "+S.in+". The buffer is <b>empty</b>, so it <b>waits</b>."; } T.spinning = false; go(T,1); return "Consumer tests for empty: in = "+S.in+", out = "+S.out+". There is an item."; }},
      {ln:10, run:(S,T,me) => { T.L.item = S.buf[S.out]; S.buf[S.out] = null; const o = S.out; S.out = (S.out + 1) % PC_N; go(T,2); return "Consumer takes item <b>"+T.L.item+"</b> from slot "+o+" and moves <code>out</code> to "+S.out+"."; }},
      {ln:11, run:(S,T,me) => { T.k++; go(T, T.k < PC_ITEMS ? 0 : DONE); return "Consumer uses item "+T.L.item+"."; }} ]
  ],
  tourFor:()=>{ const p = []; for (let k = 0; k < 7; k++) p.push(0,0,0); p.push(0,0); p.push(1,1,1); p.push(0); p.push(0,0); p.push(1); return autoTour(TOPICS.find(t => t.id === "prodcons"), p); },
  stage:(st) => { const S = st.S, held = (S.in - S.out + PC_N) % PC_N;
    const cx = 50, cy = 132, R = 92;
    let h = H.txt(2, 6, "<b>circular buffer, 8 slots</b> · items held = <b>"+held+"</b> of a usable 7");
    for (let k = 0; k < PC_N; k++){ const a = -Math.PI/2 + k * 2*Math.PI/PC_N; const x = cx + Math.cos(a)*R/5.6, y = cy + Math.sin(a)*R;
      h += '<div class="slot '+(S.buf[k] !== null ? "full" : "")+'" style="position:absolute;left:calc('+x+'% - 20px);top:'+(y-20)+'px">'+(S.buf[k] ?? "")+'</div>';
      h += '<div class="hint" style="position:absolute;left:calc('+(cx + Math.cos(a)*R/3.7)+'% - 6px);top:'+(cy + Math.sin(a)*(R+34) - 8)+'px;font:11px var(--mono)">'+k+'</div>';
      if (k === S.in) h += '<div style="position:absolute;left:calc('+(cx + Math.cos(a)*R/9)+'% - 12px);top:'+(cy + Math.sin(a)*(R-46) - 10)+'px;font:700 11px var(--mono);color:var(--c0)">in</div>';
      if (k === S.out) h += '<div style="position:absolute;left:calc('+(cx + Math.cos(a)*R/9)+'% + 2px);top:'+(cy + Math.sin(a)*(R-46) + 2)+'px;font:700 11px var(--mono);color:var(--c1)">out</div>';
    }
    h += H.proc(2, 60, 22, 80, "producer", "var(--c0)", "var(--c0b)", '<div class="vars" style="padding:0 8px">made '+st.Th[0].k+' / '+PC_ITEMS+'</div>', st.last && st.last.me === 0);
    h += H.proc(76, 60, 22, 80, "consumer", "var(--c1)", "var(--c1b)", '<div class="vars" style="padding:0 8px">used '+st.Th[1].k+' / '+PC_ITEMS+'</div>', st.last && st.last.me === 1);
    if (held === 7) h += H.pill(50, 250, "full test true: 7 items, 1 slot unusable", "var(--warn)");
    return h; }, stageH:280, stageTitle:"The bounded buffer",
  vars:(st,i) => i === 0 ? "in = "+st.S.in+" · spins "+st.Th[0].spins : "out = "+st.S.out+" · spins "+st.Th[1].spins,
  think:(st,i) => { const T = st.Th[i]; if (isDone(st,i)) return "Done."; if (T.spinning) return i === 0 ? "Waiting: buffer looks full." : "Waiting: buffer is empty."; return i === 0 ? ["About to make an item.","Checking for full.","Putting the item in."][T.pc] : ["Checking for empty.","Taking an item.","Using the item."][T.pc]; },
  check:(st) => isDone(st,0) && isDone(st,1) ? ["ok","All "+PC_ITEMS+" items passed through, in order. Busy waiting kept them correct but wasted CPU."] : ["n","Full means (in + 1) % 8 == out. Empty means in == out."],
  phases:[
    {at:0, t:"Producer fills the buffer", d:"Each item goes into buffer[in], then in moves on."},
    {at:22, t:"Full at 7 items", d:"(in + 1) % 8 == out, so the producer waits although slot 7 is empty."},
    {at:23, t:"Consumer takes one", d:"out moves on and frees a slot."},
    {at:26, t:"Producer continues", d:"The full test now fails, so it adds the next item."},
    {at:29, t:"Both run to the end", d:"Producer and consumer take turns until all items are used."}
  ],
  notes:{0:"<b>Example from the slide:</b> a print spooler. Programs produce print jobs into a queue; the printer consumes them one at a time.", end:"Why not use all 8 slots? Add a shared <code>counter</code> (count++ in the producer, count-- in the consumer) and you are back to the <b>race</b> of topic 3.5. Session 8 solves this properly with semaphores."},
  real:realOut("prodcons_inout"),
  props:[["Correct order of items","yes","in and out each have one writer"],["Slots usable","7 of 8","full and empty must look different"],["Waiting","busy (spin)","wastes CPU while full or empty"],["Using a counter instead","no","count++ / count-- race (3.5)"]], propTitle:"What this version gets right and wrong",
  deepTitle:"The bounded-buffer problem",
  deep:`<div class="dgrid"><div><h3>The rules</h3><ul><li>The producer must wait when the buffer is <b>full</b>.</li><li>The consumer must wait when the buffer is <b>empty</b>.</li><li>Empty: <code>in == out</code>. Full: <code>(in + 1) % N == out</code>. So one slot always stays unused.</li></ul></div><div><h3>Three ways to solve it in this unit</h3><ol><li>Busy waiting with in/out (this tab): correct for one producer and one consumer, but wastes a slot and CPU.</li><li>Semaphores <code>empty</code>, <code>full</code>, <code>mutex</code> (topic 3.16).</li><li>A monitor with conditions <code>notFull</code> and <code>notEmpty</code> (topic 3.11).</li></ol></div></div>`
});

/* ---------- 3.7 disabling interrupts ---------- */
TOPICS.push({ id:"interrupts", num:"3.7", session:S4, sessionTitle:S4T, kind:"script", short:"Disabling interrupts",
  title:"Hardware Solutions: disabling interrupts, and why it is not enough",
  lead:"On a single CPU a process can disable interrupts before its critical section, so it cannot be preempted. On a multiprocessor it fails, and user programs are not allowed to do it anyway.",
  names:["P1","P2"],
  code:`disable_interrupts();
/* critical section */
enable_interrupts();`, file:"cli_demo.c",
  init:()=>({scene:1, c1:{p:"P1", off:false, cs:false}, c2:{p:"P2", off:false, cs:false}, pending:false, viol:false, trap:false, stall:false, note:""}),
  frames:[
    {label:"1 CPU", run:S => "<b>Scene 1: one CPU.</b> P1 runs; P2 is ready and waiting for the CPU. The timer interrupt normally lets the scheduler switch between them."},
    {label:"1 CPU", ln:1, who:0, run:S => { S.c1.off = true; return "P1 calls <code>disable_interrupts()</code>. The CPU will now ignore the timer."; }},
    {label:"1 CPU", ln:2, who:0, run:S => { S.c1.cs = true; return "P1 enters its critical section."; }},
    {label:"1 CPU", ln:2, run:S => { S.pending = true; return "The timer fires, but interrupts are off, so it is <b>held pending</b>. No switch can happen: P2 cannot run, so it cannot enter. On one CPU this gives mutual exclusion."; }},
    {label:"1 CPU", ln:3, who:0, run:S => { S.c1.cs = false; S.c1.off = false; S.pending = false; S.c1.p = "P2"; return "P1 leaves and calls <code>enable_interrupts()</code>. The pending timer interrupt is delivered and the scheduler switches to P2. <b>It works on one CPU.</b>"; }},
    {label:"2 CPUs", run:S => { S.scene = 2; S.c1 = {p:"P1", off:false, cs:false}; S.c2 = {p:"P2", off:false, cs:false}; return "<b>Scene 2: two CPUs.</b> P1 runs on CPU 1 and P2 runs on CPU 2 at the same time."; }},
    {label:"2 CPUs", ln:1, who:0, run:S => { S.c1.off = true; S.c1.cs = true; return "P1 disables interrupts <b>on CPU 1 only</b> and enters its critical section."; }},
    {label:"2 CPUs", ln:2, who:1, run:S => { S.c2.cs = true; S.viol = true; return "CPU 2 never stopped. P2 enters the same critical section. <b>Both are inside: mutual exclusion fails.</b>"; }},
    {label:"2 CPUs", run:S => { S.viol = false; S.c2.cs = false; S.stall = true; return "Disabling interrupts on <b>every</b> CPU would need a message to each core, which is slow and stalls the whole machine for every critical section."; }},
    {label:"user mode", run:S => { S.stall = false; S.trap = true; return "And a user program may not do it at all: the x86 <code>cli</code> instruction is <b>privileged</b>. The real <code>cli_demo</code> tries it and the CPU raises a fault. Modern systems use special <b>atomic instructions</b> instead (next tabs)."; }}
  ],
  phases:[
    {at:0, t:"One CPU, two processes", d:"Switching happens on timer interrupts."},
    {at:1, t:"Interrupts off: no switch", d:"P1 disables interrupts and runs its critical section alone."},
    {at:4, t:"Interrupts on again", d:"The pending interrupt arrives and P2 gets the CPU."},
    {at:5, t:"Two CPUs: it fails", d:"Disabling interrupts on CPU 1 does not stop CPU 2."},
    {at:9, t:"Not allowed in user mode", d:"cli is privileged; use atomic instructions instead."}
  ],
  notes:{end:"<b>Example from the slide:</b> a small single-core microcontroller may disable interrupts for a few instructions; a multicore server cannot rely on it."},
  stage:(st) => { const S = st.S;
    const cpu = (x, name, c, show) => H.box(x, 18, 40, 120, name+(c.off ? " · interrupts OFF" : ""), show ? '<div style="padding:6px 10px"><span class="chip" style="color:'+(c.p === "P1" ? "var(--c0)" : "var(--c1)")+'">running '+c.p+'</span>'+(c.cs ? ' <span class="chip pop" style="color:var(--ok)">in critical section</span>' : "")+'</div>' : '<div class="hint" style="padding:6px 10px">'+(S.scene === 1 ? "not present in scene 1" : "")+'</div>', c.cs ? (S.viol ? "bad" : "good") : "");
    let h = H.txt(2, 0, "<b>"+(S.scene === 1 ? "Scene 1: one CPU" : "Scene 2: two CPUs")+"</b>");
    h += cpu(4, "CPU 1", S.c1, true) + cpu(56, "CPU 2", S.c2, S.scene === 2);
    if (S.scene === 1) h += H.box(56, 18, 40, 120, "ready queue", '<div style="padding:6px 10px">'+(S.c1.p === "P1" ? '<span class="chip" style="color:var(--c1)">P2 waiting for the CPU</span>' : '<span class="chip" style="color:var(--c0)">P1 done</span>')+'</div>');
    if (S.pending) h += H.pill(24, 150, "⏰ timer interrupt: held pending", "var(--warn)");
    if (S.viol) h += H.pill(50, 150, "✗ two processes in the critical section", "var(--bad)");
    if (S.stall) h += H.pill(50, 150, "all cores stop for every lock: too slow", "var(--warn)");
    if (S.trap) h += H.box(10, 180, 80, 60, "user program executes cli", '<div style="padding:0 10px;font:12.5px var(--mono);color:var(--bad)" class="pop">general protection fault → SIGSEGV: only the kernel may disable interrupts</div>', "bad");
    return h; }, stageH:250,
  real:realOut("cli_demo"),
  props:[["Single CPU","yes","no switch can happen while interrupts are off"],["Multiprocessor","no","other CPUs keep running"],["User programs","no","cli is a privileged instruction"],["Cost","high","stalls interrupts and, on SMP, the whole machine"]], propTitle:"Does disabling interrupts work?",
  deepTitle:"Interrupts and mutual exclusion",
  deep:`<p>Inside the kernel, disabling interrupts on the <b>local</b> CPU is still used for very short sections, for example to stop an interrupt handler from running in the middle of an update of a per-CPU variable. It is always combined with a spinlock when other CPUs could touch the same data.</p>`
});

/* ---------- 3.7 TestAndSet & Swap ---------- */
function tasProg(){ return [
  {ln:5, also:[2,3], z:"entry", run:(S,T,me,D) => { const rv = S.lock; S.lock = true; T.L.rv = rv; if (rv){ T.spins++; T.spinning = true; return D.names[me]+" runs <code>TestAndSet(&amp;lock)</code> as <b>one atomic step</b>: old value <b>true</b>, lock stays true. It returns true, so "+D.names[me]+" <b>spins</b>."; } T.spinning = false; go(T,1); return D.names[me]+" runs <code>TestAndSet(&amp;lock)</code> as <b>one atomic step</b>: old value <b>false</b>, and lock becomes true in the same instant. It returns false, so "+D.names[me]+" <b>enters</b>."; }},
  {ln:6, z:"cs", run:(S,T,me,D) => { go(T,2); return D.names[me]+" works in its <b>critical section</b>."; }},
  {ln:7, z:"exit", run:(S,T,me,D) => { S.lock = false; go(T,3); return D.names[me]+" sets <code>lock = false</code>, a plain store."; }},
  {ln:7, z:"rem", run:(S,T,me,D) => { T.k++; go(T, T.k < 2 ? 0 : DONE); return D.names[me]+" runs its remainder section"+(T.k < 2 ? " and will want in again." : " and is done."); }}
];}
function swapProg(){ return [
  {ln:4, z:"entry", run:(S,T,me,D) => { T.L.key = true; go(T,1); return D.names[me]+" sets its own local <code>key = true</code>."; }},
  {ln:5, also:[2], z:"entry", run:(S,T,me,D) => { const t = S.lock; S.lock = T.L.key; T.L.key = t; if (T.L.key){ T.spins++; T.spinning = true; return D.names[me]+" runs <code>Swap(&amp;lock, &amp;key)</code> atomically: lock was true, so it gets true back. It <b>spins</b>."; } T.spinning = false; go(T,2); return D.names[me]+" runs <code>Swap(&amp;lock, &amp;key)</code> atomically: lock becomes true and its key becomes <b>false</b>. It <b>enters</b>."; }},
  {ln:6, z:"cs", run:(S,T,me,D) => { go(T,3); return D.names[me]+" works in its <b>critical section</b>."; }},
  {ln:7, z:"exit", run:(S,T,me,D) => { S.lock = false; go(T,4); return D.names[me]+" sets <code>lock = false</code>. The single false is back in lock."; }},
  {ln:7, z:"rem", run:(S,T,me,D) => { T.k++; go(T, T.k < 2 ? 0 : DONE); return D.names[me]+" runs its remainder section"+(T.k < 2 ? " and will want in again." : " and is done."); }}
];}
const spinThink = (kind) => (st,i,D) => { const T = st.Th[i], z = zoneOf(st,i); if (z === "done") return "Done."; if (T.spinning) return "Spinning: lock is held by the other process."; if (z === "cs") return "Inside. lock = true keeps the other out."; if (z === "exit") return "About to release the lock."; if (z === "rem") return "Doing other work."; return kind === "swap" && T.pc === 0 ? "About to set key = true." : "Next: try the atomic instruction."; };
TOPICS.push({ id:"tas", num:"3.7", session:S4, sessionTitle:S4T, kind:"sched", short:"TestAndSet",
  title:"Hardware Solutions: atomic TestAndSet",
  lead:"The hardware gives an instruction that reads and writes a memory word in one atomic step. TestAndSet returns the old value of lock and sets it to true.",
  names:["P0","P1"],
  code:`boolean TestAndSet(boolean *target) {
    boolean rv = *target;  *target = true;
    return rv;               /* one atomic step */
}
while (TestAndSet(&lock)) ;   /* spin */
/* critical section */
lock = false;`, file:"cs_tas.c",
  init:()=>({lock:false}), progs:()=>[tasProg(), tasProg()], stage:"zones", stageH:290,
  tour:[0,1,1,0,1,0,1,0,0,1,1,0,1,1,0,0,0,1,1,1,1],
  overlay:(st) => sharedStrip([["lock", B(st.S.lock), st.last && st.last.changed.includes("lock")]]),
  vars:(st,i) => "rv = "+(st.Th[i].L.rv === undefined ? "–" : B(st.Th[i].L.rv))+" · rounds "+st.Th[i].k+"/2 · spins "+st.Th[i].spins,
  think:spinThink("tas"),
  phases:[
    {at:0, t:"First caller sees false", d:"P0's TestAndSet returns false and sets lock = true atomically: P0 enters."},
    {at:1, t:"Others see true and spin", d:"P1's TestAndSet keeps returning true."},
    {at:5, t:"Release with a plain store", d:"lock = false lets the next TestAndSet succeed."},
    {at:6, t:"The roles swap", d:"P1 gets in; P0 spins on its next attempt."},
    {at:20, t:"Both done", d:"Mutual exclusion held at every step, at the cost of busy waiting."}
  ],
  notes:{0:"Because the read and the write happen in one indivisible step, two processes can never both see <code>false</code>.", end:"On the VM, <code>__atomic_test_and_set</code> compiled to the single x86 instruction <code>xchg %al, lock</code>, and two threads spun 3.2 million times while doing 4 million entries."},
  real:[PS+"./cs_tas", "testandset: counter =  4000000  expected 4000000  lost 0  (412 ms, 3209122 spins)", PS+"objdump -d cs_tas | grep lock", "    12ea:	xchg   %al,0x2d40(%rip)    # 4030 <lock>   <- TestAndSet", "    1306:	movb   $0x0,0x2d23(%rip)   # 4030 <lock>   <- lock = false"],
  props:[["Mutual exclusion","yes","read and set happen as one instruction"],["Progress","yes","a free lock is taken by the next attempt"],["Bounded waiting","no","an unlucky process can lose every race"],["While waiting","mid","spins (busy waiting)"]],
  deep:`<div class="dgrid"><div><h3>How the CPU does it</h3><p>The core takes exclusive ownership of the cache line holding <code>lock</code>, reads it, writes it, and only then lets other cores at the line. x86 uses <code>XCHG</code>; ARM uses load-exclusive/store-exclusive.</p></div><div><h3>Spinning</h3><p>Good for very short critical sections on multicore machines. Wasteful when the holder is descheduled, because waiters burn whole time slices (see topic 3.8).</p></div></div>`
});
TOPICS.push({ id:"swap", num:"3.7", session:S4, sessionTitle:S4T, kind:"sched", short:"Swap",
  title:"Hardware Solutions: atomic Swap",
  lead:"Swap exchanges two words atomically. A process keeps swapping its key (true) with lock until it gets false back.",
  names:["P0","P1"],
  code:`void Swap(boolean *a, boolean *b) {
    boolean t = *a;  *a = *b;  *b = t;   /* atomic */
}
key = true;
while (key == true) Swap(&lock, &key);
/* critical section */
lock = false;`, file:"cs_swap.c",
  init:()=>({lock:false}), progs:()=>[swapProg(), swapProg()], stage:"zones", stageH:290,
  tour:[0,1,0,1,0,1,0,1,0,0,0,1,1,0,1,1,1,0,0,0,1,1,1,1],
  overlay:(st) => sharedStrip([["lock", B(st.S.lock), st.last && st.last.changed.includes("lock")],["P0 key", st.Th[0].L.key === undefined || st.Th[0].L.key === null ? "–" : B(st.Th[0].L.key), false],["P1 key", st.Th[1].L.key === undefined || st.Th[1].L.key === null ? "–" : B(st.Th[1].L.key), false]]),
  vars:(st,i) => "key = "+(st.Th[i].L.key == null ? "–" : B(st.Th[i].L.key))+" · rounds "+st.Th[i].k+"/2 · spins "+st.Th[i].spins,
  think:spinThink("swap"),
  phases:[
    {at:0, t:"Both prepare a key", d:"Each process puts true in its private key."},
    {at:2, t:"One swap pulls out the false", d:"P0 swaps and gets false: there is only one false in the system."},
    {at:3, t:"The other swaps true for true", d:"P1 keeps getting true back and spins."},
    {at:6, t:"Release puts false back", d:"lock = false; the next Swap by P1 succeeds."},
    {at:23, t:"Both done", d:"Same guarantees as TestAndSet."}
  ],
  notes:{0:"Think of <b>false</b> as a single token. Whoever ends up holding it is inside; leaving puts it back.", end:"TestAndSet is really a Swap that always writes true. On x86 both are the same <code>xchg</code> instruction."},
  real:[PS+"./cs_swap", "swap      : counter =  4000000  expected 4000000  lost 0  (471 ms, 4105787 spins)", PS+"objdump -d cs_swap | grep lock", "    12e5:	xchg   %eax,0x2d45(%rip)   # 4030 <lock>   <- Swap(&lock, &key)"],
  props:[["Mutual exclusion","yes","only one process can hold the single false"],["Progress","yes",""],["Bounded waiting","no","same starvation risk as TestAndSet"],["While waiting","mid","spins"]],
  deep:`<p>Both TestAndSet and Swap give mutual exclusion but make waiting processes spin (busy waiting). The OS builds sleeping locks, semaphores and mutexes, on top of them.</p>`
});

/* ---------- 3.8 software solutions family: spin vs sleep ---------- */
TOPICS.push({ id:"family", num:"3.8", session:S4, sessionTitle:S4T, kind:"script", short:"Software solutions: the family",
  title:"Software Solutions: the family of solutions in this unit",
  lead:"Software solutions use ordinary variables, and later OS tools, instead of special instructions. The big difference is how a process waits: by spinning, or by sleeping.",
  names:["holder H","waiter W"],
  init:()=>({spin:[], sleep:[], spinWaste:0, sleepWaste:0}),
  frames:[
    {label:"setup", run:S => "One CPU, two processes. <b>H</b> holds the lock and is in its critical section. <b>W</b> wants the lock. Top row: W waits by <b>spinning</b>. Bottom row: W waits by <b>sleeping</b>."},
    {label:"spin", run:S => { S.spin.push(["H","CS (part 1)"]); return "Spin row: H runs part of its critical section, then its time slice ends."; }},
    {label:"spin", run:S => { S.spin.push(["W","spin…"]); S.spinWaste++; return "Spin row: W gets the CPU and spins its <b>whole time slice</b> testing a lock that cannot change, because H is not running. A wasted slice."; }},
    {label:"spin", run:S => { S.spin.push(["H","CS (part 2), unlock"]); return "Spin row: H runs again, finishes and unlocks."; }},
    {label:"spin", run:S => { S.spin.push(["W","lock, CS"]); return "Spin row: W finally gets the lock."; }},
    {label:"sleep", run:S => { S.sleep.push(["H","CS (part 1)"]); return "Sleep row: same start, H runs part of its critical section."; }},
    {label:"sleep", run:S => { S.sleep.push(["W","wait → sleeps"]); return "Sleep row: W asks for the lock, finds it taken, and <b>blocks</b> at once. The scheduler takes it off the CPU."; }},
    {label:"sleep", run:S => { S.sleep.push(["H","CS (part 2), unlock, wake W"]); return "Sleep row: H gets the CPU straight back, finishes, unlocks and wakes W. No time was wasted."; }},
    {label:"sleep", run:S => { S.sleep.push(["W","lock, CS"]); return "Sleep row: W runs and enters. Sleeping freed the CPU for the process that had to leave the critical section."; }}
  ],
  phases:[
    {at:0, t:"Same situation twice", d:"H is inside, W wants in, one CPU."},
    {at:1, t:"Spinning wastes the CPU", d:"W burns a time slice while H cannot run."},
    {at:5, t:"Sleeping gives the CPU back", d:"W blocks; H runs at once and wakes W when done."},
    {at:8, t:"Which solutions spin", d:"Algorithms 1–3 and Bakery spin; semaphores and monitors sleep."}
  ],
  notes:{end:"<b>The family (slide table):</b> Algorithm 1, 2 and Peterson: 2 processes, busy waiting. Bakery: n processes, busy waiting. Semaphore and monitor: n processes, sleeping, with OS or language support."},
  stage:(st) => { const S = st.S;
    const row = (y, title, arr, waste) => H.txt(2, y, "<b>"+title+"</b> · wasted slices: <b>"+waste+"</b>") + '<div style="position:absolute;left:2%;right:2%;top:'+(y+20)+'px;display:flex;gap:4px">' + (arr.length ? arr.map((b,k) => '<div class="'+(k === arr.length-1 ? "pop" : "")+'" style="flex:1;min-width:0;padding:8px 6px;border-radius:8px;font:600 12px var(--sans);text-align:center;color:#fff;background:'+(b[0]==="H" ? "var(--c0)" : /spin/.test(b[1]) ? "var(--bad)" : /sleep/.test(b[1]) ? "var(--warn)" : "var(--c1)")+'">'+b[0]+': '+esc(b[1])+'</div>').join("") : '<span class="hint">no time slices yet</span>') + '</div>';
    return row(10, "W spins (busy waiting)", S.spin, S.spinWaste) + row(120, "W sleeps (semaphore / monitor)", S.sleep, 0) + H.txt(2, 220, "time →", "font:600 12px var(--sans)"); }, stageH:250, stageTitle:"One CPU, time slices left to right",
  props:[["Algorithm 1","2 · spin","shared variable turn"],["Algorithm 2","2 · spin","shared flag[2]"],["Peterson (Algorithm 3)","2 · spin","flag[2] and turn"],["Bakery","n · spin","number[n], choosing[n]"],["Semaphore","n · sleeps","OS support"],["Monitor","n · sleeps","language support"]], propTitle:"The family: processes · waiting · needs",
  deepTitle:"Where each solution is covered",
  deep:`<p>Algorithms 1, 2 and 3 (Peterson) solve the problem for two processes with shared variables (topics 3.12–3.14). The Bakery algorithm solves it for n processes with ticket numbers (3.15). Semaphores (3.9, 3.10) and monitors (3.11) let a waiting process sleep instead of spin. <b>Example:</b> Peterson's solution needs only two shared variables, flag[2] and turn, and no special hardware instruction.</p>`
});
