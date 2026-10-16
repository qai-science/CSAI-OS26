/* ===== Session 5: semaphores (3.9, 3.10) and Session 6: monitors (3.11) ===== */
const S5 = "Session 5", S5T = "Semaphores: counting and binary";
const S6 = "Session 6", S6T = "Monitors";

/* ---------- 3.9 counting semaphore: 3 printers, 5 jobs (slide definition, value may go negative) ---------- */
function printerJob(){ return [
  {ln:2, also:[3], z:"entry", run:(S,T,me,D,Th) => { S.value--; if (S.value < 0){ S.list.push(me); T.st = "sleep"; return D.names[me]+": <code>wait(printers)</code> makes value <b>"+S.value+"</b>. It is negative, so "+D.names[me]+" joins the list and <b>blocks</b>. A value of −"+(-S.value)+" means "+(-S.value)+" job"+(S.value < -1 ? "s are" : " is")+" waiting."; } const p = S.printer.indexOf(null); S.printer[p] = me; T.L.p = p; go(T,1); return D.names[me]+": <code>wait(printers)</code> makes value <b>"+S.value+"</b> (not negative), so it takes printer "+(p+1)+"."; }},
  {ln:8, z:"cs", run:(S,T,me,D) => { go(T,2); return D.names[me]+" prints on printer "+(T.L.p+1)+"."; }},
  {ln:5, also:[6], z:"exit", run:(S,T,me,D,Th) => { S.value++; const p = T.L.p; S.printer[p] = null; let x = ""; if (S.value <= 0){ const w = S.list.shift(); Th[w].st = "ready"; Th[w].pc = 1; Th[w].L.p = p; S.printer[p] = w; x = " Value ≤ 0 means someone is waiting, so <b>"+D.names[w]+"</b> is taken off the list, woken up, and gets printer "+(p+1)+"."; } else x = " Nobody is waiting; printer "+(p+1)+" is free."; go(T,DONE); return D.names[me]+": <code>signal(printers)</code> makes value <b>"+S.value+"</b>."+x; }}
];}
TOPICS.push({ id:"countsem", num:"3.9", session:S5, sessionTitle:S5T, kind:"sched", short:"Counting semaphore",
  title:"Semaphores: Counting Semaphore",
  lead:"A semaphore is an integer changed only by wait() and signal(), each done atomically. Start it at N to manage N identical resources: here 3 printers shared by 5 print jobs.",
  names:["J1","J2","J3","J4","J5"],
  code:`wait(S) {
    S.value--;
    if (S.value < 0) { add me to S.list; block(); } }
signal(S) {
    S.value++;
    if (S.value <= 0) { take P off S.list; wakeup(P); } }
/* each job: */
wait(printers);   print();   signal(printers);`, file:"sem_printers.c",
  init:()=>({value:3, list:[], printer:[null,null,null]}),
  progs:()=>[0,1,2,3,4].map(printerJob),
  stage:"zones", stageH:410, tokGap:56,
  zones:[["entry","Waiting (blocked)"],["cs","Printing (3 printers)"],["exit","Releasing"],["rem","Done"]], doneZone:"rem",
  tokNote:(st,i,fin) => fin ? "done" : st.Th[i].st === "sleep" ? "in S.list" : zoneOf(st,i) === "cs" ? "printer "+(st.Th[i].L.p+1) : "",
  overlay:(st) => sharedStrip([["printers.value", st.S.value, st.last && st.last.changed.includes("value")],["S.list (blocked)", st.S.list.map(q => "J"+(q+1)).join(", ") || "empty", st.last && st.last.changed.includes("list")],["printer 1", st.S.printer[0] === null ? "free" : "J"+(st.S.printer[0]+1), false],["printer 2", st.S.printer[1] === null ? "free" : "J"+(st.S.printer[1]+1), false],["printer 3", st.S.printer[2] === null ? "free" : "J"+(st.S.printer[2]+1), false]]),
  prefix:[0,1,2,3,4,0,0],
  think:(st,i) => { const T = st.Th[i]; if (isDone(st,i)) return "Printed."; if (T.st === "sleep") return "Blocked: all 3 printers busy."; return ["Next: wait(printers).","Printing.","Next: signal(printers)."][T.pc]; },
  statusOf:(st,i) => isDone(st,i) ? ["done","var(--dead)"] : st.Th[i].st === "sleep" ? ["blocked","var(--warn)"] : zoneOf(st,i) === "cs" ? ["printing","var(--ok)"] : ["ready","var(--muted)"],
  check:(st, D) => { const n = D.names.filter((x,i) => zoneOf(st,i) === "cs").length; if (n > 3) return ["bad","More than 3 jobs printing!"]; if (D.names.every((x,i) => isDone(st,i))) return ["ok","All 5 jobs printed, never more than 3 at once. Value back to <b>3</b>."]; return ["n","Invariant: printing jobs ≤ 3. A negative value −k means k jobs are blocked."]; },
  phases:[
    {at:0, t:"Three jobs take the three printers", d:"value 3 → 2 → 1 → 0: each wait succeeds."},
    {at:3, t:"More jobs block", d:"J4 and J5 make the value −1 and −2 and join S.list."},
    {at:6, t:"signal wakes a waiter", d:"J1 finishes: value −1 ≤ 0, so J4 is woken and takes J1's printer."},
    {at:7, t:"The rest drain in turn", d:"Each signal either wakes a blocked job or frees a printer."}
  ],
  notes:{0:"<b>Example from the slide:</b> a lab with 3 printers, <code>printers = 3</code>. Each job does <code>wait(printers)</code> before printing and <code>signal(printers)</code> after.", end:"Value back to 3. In this (sleeping) definition a negative value −k counts the blocked processes. POSIX semaphores keep the value at 0 or more and track the waiters separately, which is the same idea."},
  real:realOut("sem_printers"),
  props:[["wait(S)","value−−, block if < 0","atomic"],["signal(S)","value++, wake one if ≤ 0","atomic"],["value = −k","k processes blocked","sleeping version"],["Start value","number of resources","N identical printers"]], propTitle:"The rules",
  deepTitle:"Counting semaphores",
  deep:`<div class="dgrid"><div><h3>Definition</h3><p>A semaphore S is an integer changed only by <code>wait(S)</code> and <code>signal(S)</code>. Busy-waiting version: <code>wait</code>: while S ≤ 0 do nothing, then S−−; <code>signal</code>: S++. Sleeping version (this tab): a process that must wait joins S's list and blocks, and <code>signal</code> wakes one.</p></div><div><h3>Why atomic?</h3><p>If two jobs ran <code>S.value--</code> at the same time, the decrement itself would race (topic 3.5). The OS makes each operation indivisible, using the hardware instructions of topic 3.7 inside the kernel.</p></div></div>`
});

/* ---------- 3.10 binary semaphore: one key ---------- */
function keyProg(){ return [
  {ln:2, z:"entry", run:(S,T,me,D) => { if (S.value === 1){ S.value = 0; S.holder = me; go(T,1); return D.names[me]+": <code>wait(mutex)</code>. The key is on the desk (value 1), so "+D.names[me]+" <b>takes the key</b>: value 0."; } S.queue.push(me); T.st = "sleep"; return D.names[me]+": <code>wait(mutex)</code>. No key on the desk (value 0), so "+D.names[me]+" <b>waits</b> in the queue."; }},
  {ln:3, z:"cs", run:(S,T,me,D) => { go(T,2); return D.names[me]+" uses the room: its <b>critical section</b>."; }},
  {ln:4, z:"exit", run:(S,T,me,D,Th) => { let x; if (S.queue.length){ const w = S.queue.shift(); S.holder = w; Th[w].st = "ready"; Th[w].pc = 1; x = D.names[w]+" was waiting, so the key goes <b>straight to "+D.names[w]+"</b>. Value stays 0."; } else { S.value = 1; S.holder = null; x = "Nobody is waiting, so the key goes back on the desk: value <b>1</b>."; } go(T,3); return D.names[me]+": <code>signal(mutex)</code>. "+x; }},
  {ln:5, z:"rem", run:(S,T,me,D) => { T.k++; go(T, T.k < 2 ? 0 : DONE); return D.names[me]+" does other things"+(T.k < 2 ? " and will need the room again." : " and is done."); }}
];}
TOPICS.push({ id:"binsem", num:"3.10", session:S5, sessionTitle:S5T, kind:"sched", short:"Binary semaphore: the key",
  title:"Semaphores: Binary Semaphore (mutex = 1)",
  lead:"A binary semaphore has only the values 0 and 1. Start it at 1 to guard a critical section: one key, one room.",
  names:["P1","P2"],
  code:`semaphore mutex = 1;          /* one key on the desk */
wait(mutex);                  /* take the key, or wait */
    /* critical section */    /* use the room */
signal(mutex);                /* return the key */
    /* remainder section */`, file:"cs_binsem.c",
  init:()=>({value:1, holder:null, queue:[]}), progs:()=>[keyProg(), keyProg()],
  stage:"zones", stageH:300, prefix:[0,1,0,0,0,0],
  overlay:(st) => sharedStrip([["mutex (value)", st.S.value, st.last && st.last.changed.includes("value")],["key", st.S.holder === null ? "🔑 on the desk" : "🔑 with P"+(st.S.holder+1), st.last && st.last.changed.includes("holder")],["waiting", st.S.queue.map(q => "P"+(q+1)).join(", ") || "nobody", st.last && st.last.changed.includes("queue")]]),
  badge:(st,i) => st.S.holder === i ? "🔑" : "",
  think:(st,i) => { const T = st.Th[i], z = zoneOf(st,i); if (z === "done") return "Done."; if (T.st === "sleep") return "Waiting for the key."; return {entry:"Next: ask for the key.", cs:"Inside, holding the key.", exit:"About to return the key.", rem:"Elsewhere."}[z]; },
  phases:[
    {at:0, t:"Take the key", d:"P1's wait(mutex) finds value 1 and sets it to 0."},
    {at:1, t:"No key: wait", d:"P2's wait(mutex) finds 0, so P2 sleeps in the queue."},
    {at:3, t:"Return the key", d:"P1's signal hands the key directly to the waiting P2."},
    {at:5, t:"Turns continue", d:"Whoever holds the key is the only one in the room."}
  ],
  notes:{0:"<b>Example from the slide:</b> one washroom key at a hostel desk. Take the key (wait), use the room, return the key (signal).", end:"A binary semaphore behaves like a mutex lock. One difference: a mutex has an owner who must unlock it, while <b>any</b> process may signal a semaphore. That makes the next tab possible."},
  real:[PS+"./cs_binsem", "binsem    : counter =  4000000  expected 4000000  lost 0  (1270 ms)"],
  props:[["Mutual exclusion","yes","value 1 lets one wait succeed"],["Progress","yes","signal wakes a waiter or frees the key"],["Bounded waiting","yes","FIFO queue here"],["While waiting","yes","sleeps"]],
  deep:`<div class="dgrid"><div><h3>Building a counting semaphore from binary ones</h3><pre class="pseudo">int C = N;  binary S1 = 1, S2 = 0;
wait(C):   wait(S1); C--;
           if (C &lt; 0) { signal(S1); wait(S2); }
           signal(S1);
signal(C): wait(S1); C++;
           if (C &lt;= 0) signal(S2);
           else signal(S1);</pre></div><div><h3>Two uses</h3><ul><li>Start at <b>1</b>: mutual exclusion (this tab).</li><li>Start at <b>0</b>: make one event wait for another (next tab).</li></ul></div></div>`
});

/* ---------- 3.10 ordering with synch = 0 ---------- */
TOPICS.push({ id:"order", num:"3.10", session:S5, sessionTitle:S5T, kind:"sched", short:"Binary semaphore: ordering",
  title:"Semaphores: ordering with synch = 0",
  lead:"Start a binary semaphore at 0 to make one event wait for another: P2 does wait(synch) before S2, and P1 does signal(synch) after S1. S2 then always happens after S1.",
  names:["P1","P2"],
  code:`semaphore synch = 0;     /* S1 has not happened */
/* P1 */
S1;                      /* write the result */
signal(synch);
/* P2 */
wait(synch);
S2;                      /* read the result  */`, file:"sem_order.c",
  init:()=>({value:0, queue:[], result:null, s1:false, s2:false}),
  progs:()=>[
    [ {ln:3, run:(S,T) => { S.result = 42; S.s1 = true; go(T,1); return "P1 runs <b>S1</b> and writes the result (42)."; }},
      {ln:4, run:(S,T,me,D,Th) => { if (S.queue.length){ const w = S.queue.shift(); Th[w].st = "ready"; Th[w].pc = 1; go(T,DONE); return "P1: <code>signal(synch)</code>. P2 is waiting, so it is <b>woken</b>."; } S.value = 1; go(T,DONE); return "P1: <code>signal(synch)</code>. Nobody waits yet, so the value becomes <b>1</b>: the signal is <b>remembered</b>."; }} ],
    [ {ln:6, run:(S,T,me) => { if (S.value > 0){ S.value = 0; go(T,1); return "P2: <code>wait(synch)</code>. The value is 1, so S1 already happened: P2 continues without waiting."; } T.st = "sleep"; S.queue.push(me); return "P2: <code>wait(synch)</code>. The value is 0, so S1 has not happened: P2 <b>sleeps</b>."; }},
      {ln:7, run:(S,T) => { S.s2 = true; go(T,DONE); return "P2 runs <b>S2</b> and reads result = <b>"+S.result+"</b>. Correct order."; }} ]
  ],
  tour:[1,0,0,1],
  stage:(st) => { const S = st.S;
    let h = H.proc(3, 14, 40, 100, "P1: S1; signal(synch);", "var(--c0)", "var(--c0b)", '<div style="padding:4px 10px">'+(S.s1 ? '<span class="chip pop" style="color:var(--ok)">S1 done: result = 42</span>' : '<span class="hint">S1 not run yet</span>')+'</div>', st.last && st.last.me === 0);
    h += H.proc(57, 14, 40, 100, "P2: wait(synch); S2;", "var(--c1)", "var(--c1b)", '<div style="padding:4px 10px">'+(st.Th[1].st === "sleep" ? '<span style="color:var(--warn);font-weight:700">sleeping in wait(synch)</span>' : S.s2 ? '<span class="chip pop" style="color:var(--ok)">S2 read 42</span>' : '<span class="hint">not run yet</span>')+'</div>', st.last && st.last.me === 1);
    h += H.line(43, 64, 57, 64, "var(--muted)") + H.txt(46, 44, "signal → wait", "font:600 11px var(--mono)");
    h += H.box(30, 140, 40, 70, "synch", '<div class="big '+(st.last && st.last.changed.includes("value") ? "pop" : "")+'">'+S.value+'</div>');
    h += H.txt(3, 226, "order check: S1 "+(S.s1 ? "✔" : "…")+"  →  S2 "+(S.s2 ? "✔" : "…"), "font:600 13px var(--mono);color:var(--ink)");
    return h; }, stageH:250, stageTitle:"Ordering with synch = 0",
  check:(st) => isDone(st,0) && isDone(st,1) ? ["ok","S1 ran before S2. Try the scheduler mode: no order you pick can break it."] : ["n","Rule: S2 must not run before S1."],
  statusOf:(st,i) => isDone(st,i) ? ["done","var(--dead)"] : st.Th[i].st === "sleep" ? ["sleeping","var(--warn)"] : ["ready","var(--muted)"],
  phases:[
    {at:0, t:"P2 arrives first and waits", d:"synch = 0, so wait(synch) blocks P2."},
    {at:1, t:"P1 runs S1", d:"The result is written."},
    {at:2, t:"signal wakes P2", d:"P1's signal(synch) wakes the sleeping P2."},
    {at:3, t:"P2 runs S2", d:"It reads the result safely."}
  ],
  notes:{0:"P1 and P2 run in any order. We need S2 (in P2) to happen <b>after</b> S1 (in P1). The real <code>sem_order</code> even starts P2 first on purpose.", end:"If P1 had signalled first, the value 1 would have remembered it and P2 would pass straight through. A semaphore signal is <b>remembered</b>; a monitor's <code>signal()</code> is not (topic 3.11)."},
  real:[PS+"./sem_order", "[    1 ms] P2: wait(synch), S1 not done yet", "[ 2023 ms] P1: S1  (write the result)", "[ 2026 ms] P2: S2  (read the result)"],
  deep:`<p>A mutex cannot do this: ordering needs one process to wait and a <b>different</b> one to release it, and a mutex must be unlocked by its owner. A semaphore has no owner.</p>`
});

/* ---------- monitor machinery (entry queue + condition queues, Mesa signal) ---------- */
const MON = {
  enter(S, T, me, D, resume){ T.resume = resume; if (S.owner === null){ S.owner = me; go(T, resume); return true; } T.st = "sleep"; S.entryQ.push(me); return false; },
  leave(S, Th, D){ if (S.entryQ.length){ const w = S.entryQ.shift(); S.owner = w; Th[w].st = "ready"; Th[w].pc = Th[w].resume; return " The monitor passes to <b>"+D.names[w]+"</b>, first in the entry queue."; } S.owner = null; return " The monitor is now empty."; },
  wait(S, T, me, Th, D, cond, resume){ T.st = "sleep"; T.resume = resume; S.cond[cond].push(me); return MON.leave(S, Th, D); },
  signal(S, D, cond){ if (S.cond[cond].length){ const w = S.cond[cond].shift(); S.entryQ.push(w); return " "+D.names[w]+" was waiting on <code>"+cond+"</code> and moves to the <b>entry queue</b> (signal-and-continue)."; } return " Nobody waits on <code>"+cond+"</code>, so the signal does <b>nothing</b>; it is not remembered."; }
};
function monitorBg(D, procs, conds, dataTitle){
  const pw = 54 / procs.length;
  return '<div class="box" style="left:0;top:0;width:20%;height:100%;background:var(--zone)"><b>entry queue</b></div>' +
    '<div class="box" style="left:22%;top:0;width:58%;height:100%;background:var(--soft);border-width:2px;border-color:var(--ink)"><b style="text-align:center;color:var(--ink);font-size:12px">monitor '+D.monName+'</b></div>' +
    '<div class="box" id="mData" style="left:24%;top:30px;width:54%;height:62px;background:var(--mon)"><b>'+dataTitle+'</b><div id="mDataIn" style="padding:0 8px"></div></div>' +
    procs.map((p,k) => '<div class="box" style="left:'+(24+k*pw)+'%;top:100px;width:'+(pw-0.8)+'%;height:84px;background:var(--proc)"><b>'+p+'()</b></div>').join("") +
    conds.map((c,k) => '<div class="box" style="left:'+(24+k*54/conds.length)+'%;top:192px;width:'+(54/conds.length-0.8)+'%;height:84px;background:var(--warn-bg)"><b>condition '+c+'</b></div>').join("") +
    '<div class="box" style="left:24%;top:284px;width:54%;height:40px;background:var(--init)"><b>initialisation: '+D.initText+'</b></div>' +
    '<div class="box" style="left:82%;top:0;width:18%;height:100%;background:var(--zone)"><b>outside</b></div>';
}
function monitorPlace(st, D, procOf, procs, conds){
  const S = st.S, n = D.names.length, outIdx = [];
  return D.names.map((nm,i) => {
    const T = st.Th[i]; const qi = S.entryQ.indexOf(i);
    let ck = -1, ci = -1; conds.forEach((c,k) => { const j = S.cond[c].indexOf(i); if (j >= 0){ ck = k; ci = j; } });
    if (S.owner === i){ const k = procs.indexOf(procOf(st, i)); const pw = 54 / procs.length; return {x: 24 + k*pw + pw/2, y: 122, lb: procOf(st,i)+"()"}; }
    if (qi >= 0) return {x:10, y: 36 + qi*64, lb:"waiting"};
    if (ck >= 0){ const cw = 54 / conds.length; return {x: 24 + ck*cw + 6 + ci*9, y: 212, lb:"asleep"}; }
    outIdx.push(i); const k = outIdx.length - 1;
    return {x:91, y: 36 + k*64, lb: isDone(st,i) ? "done" : D.jobs ? D.jobs[i] : "next call"};
  });
}
const monStatus = (conds) => (st,i) => { const S = st.S; if (isDone(st,i)) return ["done","var(--dead)"]; for (const c of conds) if (S.cond[c].includes(i)) return ["waiting on "+c,"var(--warn)"]; if (S.entryQ.includes(i)) return ["in entry queue","var(--warn)"]; if (S.owner === i) return ["inside monitor","var(--ok)"]; return ["outside","var(--muted)"]; };

/* ---------- 3.11 monitor: bank account ---------- */
function bankProg(kind, x){
  if (kind === "deposit") return [
    {ln:4, run:(S,T,me,D) => MON.enter(S,T,me,D,1) ? D.names[me]+" calls <code>deposit("+x+")</code>. The monitor is empty, so it walks in. The compiler added the lock." : D.names[me]+" calls <code>deposit("+x+")</code>, but "+D.names[S.owner]+" is inside: it waits in the <b>entry queue</b>."},
    {ln:5, run:(S,T,me,D) => { S.balance += x; go(T,2); return D.names[me]+": <code>balance = balance + "+x+"</code> → <b>"+S.balance+"</b>."; }},
    {ln:6, run:(S,T,me,D) => { go(T,3); return D.names[me]+": <code>funds.signal()</code>."+MON.signal(S,D,"funds"); }},
    {ln:7, run:(S,T,me,D,Th) => { go(T,DONE); return D.names[me]+" leaves the monitor."+MON.leave(S,Th,D); }} ];
  return [
    {ln:8, run:(S,T,me,D) => MON.enter(S,T,me,D,1) ? D.names[me]+" calls <code>withdraw("+x+")</code>. The monitor is empty, so it walks in." : D.names[me]+" calls <code>withdraw("+x+")</code>, but "+D.names[S.owner]+" is inside: it waits in the <b>entry queue</b>."},
    {ln:9, run:(S,T,me,D,Th) => { if (S.balance < x) return D.names[me]+" checks <code>balance &lt; "+x+"</code>: "+S.balance+" is too little. <code>funds.wait()</code> puts it to sleep <b>and releases the monitor</b>."+MON.wait(S,T,me,Th,D,"funds",1); go(T,2); return D.names[me]+" checks <code>balance &lt; "+x+"</code>: "+S.balance+" is enough, so the <code>while</code> loop ends."; }},
    {ln:10, run:(S,T,me,D) => { S.balance -= x; go(T,3); return D.names[me]+": <code>balance = balance - "+x+"</code> → <b>"+S.balance+"</b>."; }},
    {ln:11, run:(S,T,me,D,Th) => { go(T,DONE); return D.names[me]+" leaves the monitor."+MON.leave(S,Th,D); }} ];
}
TOPICS.push({ id:"monitor", num:"3.11", session:S6, sessionTitle:S6T, kind:"sched", short:"Monitor: bank account",
  title:"Monitors: the lock lives with the data",
  lead:"A monitor groups shared data with the procedures that use it. Only one process at a time can be active inside; the compiler adds the locking.",
  names:["ATM1","ATM2","ATM3"], tokLabel:["A1","A2","A3"], jobs:["withdraw(150)","deposit(100)","withdraw(30)"], monName:"Account", initText:"balance = 100",
  code:`monitor Account {
    int balance = 100;                     /* initialisation */
    condition funds;
    void deposit(int x) {
        balance = balance + x;
        funds.signal();                    /* wake one waiter */
    }
    void withdraw(int x) {
        while (balance < x) funds.wait();  /* sleep, let others in */
        balance = balance - x;
    }
}`, file:"monitor_bank.c",
  init:()=>({balance:100, owner:null, entryQ:[], cond:{funds:[]}}),
  progs:()=>[bankProg("withdraw",150), bankProg("deposit",100), bankProg("withdraw",30)],
  tour:[0,1,0,2,1,1,1,2,2,2,0,0,0],
  stage:"tokens", stageH:330, stageTitle:"The monitor (one process active inside)",
  stageBg:(D) => monitorBg(D, ["deposit","withdraw"], ["funds"], "shared data"),
  place:(st,D) => monitorPlace(st, D, (st,i) => i === 1 ? "deposit" : "withdraw", ["deposit","withdraw"], ["funds"]),
  overlay:(st) => '<div style="position:absolute;left:24%;width:54%;top:52px;text-align:center;font:700 22px var(--mono)" class="'+(st.last && st.last.changed.includes("balance") ? "pop" : "")+'">balance = '+st.S.balance+'</div>',
  statusOf:monStatus(["funds"]),
  vars:(st,i,D) => D.jobs[i],
  think:(st,i,D) => { const S = st.S; if (isDone(st,i)) return "Finished."; if (S.cond.funds.includes(i)) return "Asleep: balance "+S.balance+" is too low."; if (S.entryQ.includes(i)) return "Waiting at the door: "+D.names[S.owner]+" is inside."; if (S.owner === i) return "Inside. Nobody else can touch balance."; return "About to call "+D.jobs[i]+"."; },
  check:(st,D) => D.names.every((n,i) => isDone(st,i)) ? ["ok","Finished: balance 100 + 100 − 30 − 150 = <b>"+st.S.balance+"</b>. One ATM inside at a time."] : ["n","Count the tokens inside the monitor box: never more than one."],
  phases:[
    {at:0, t:"ATM1 enters", d:"The monitor is empty; the compiler-added lock lets ATM1 in."},
    {at:1, t:"Others queue at the door", d:"ATM2 waits in the entry queue while ATM1 is inside."},
    {at:2, t:"wait() releases the monitor", d:"Balance 100 < 150: ATM1 sleeps on funds and ATM2 gets in."},
    {at:5, t:"signal() moves the sleeper", d:"After the deposit, ATM1 goes from funds to the entry queue, behind ATM3."},
    {at:10, t:"Re-check with while", d:"ATM1 re-tests balance < 150 when it finally gets back in."}
  ],
  notes:{0:"<b>Example from the slide:</b> a bank-account monitor with deposit() and withdraw(). Two ATMs can never update the balance at the same moment.", 3:"If ATM1 kept the monitor while it slept, nobody could ever deposit: that would be a deadlock. So <code>wait()</code> must release it.", 10:"ATM3 got in before ATM1. That is why the code says <code>while</code>, not <code>if</code>: the condition may have changed before the woken process runs.", end:"Balance 20 and no lost update. The real <code>monitor_bank</code> kept the balance at exactly 100 after 4 million operations; without the monitor it ended at 501, 237 and 102."},
  real:[PS+"./monitor_bank unsafe", "unsafe : 2 ATMs x 1,000,000 x (deposit 1, withdraw 1): balance = 501 (expected 100)", PS+"./monitor_bank unsafe", "unsafe : 2 ATMs x 1,000,000 x (deposit 1, withdraw 1): balance = 237 (expected 100)", PS+"./monitor_bank", "monitor: 2 ATMs x 1,000,000 x (deposit 1, withdraw 1): balance = 100 (expected 100)", "[    1 ms] ATM1: withdraw(150), balance is only 100, waiting...", "[ 1002 ms] ATM2: deposit(100)", "[ 1003 ms] ATM1: got 150, balance now 50"],
  props:[["Mutual exclusion","yes","one process active inside"],["Forgotten unlock","impossible","the compiler adds lock and unlock"],["Waiting for a condition","yes","wait() sleeps and releases the monitor"],["Signal semantics","mid","signal-and-continue: re-check with while"]],
  deep:`<div class="dgrid"><div><h3>The four parts</h3><ul><li>Shared data (private to the monitor)</li><li>Procedures, the only way in</li><li>Initialisation code</li><li>An implicit lock with an entry queue</li></ul><p>This removes semaphore mistakes such as a forgotten <code>signal()</code> or <code>wait()</code> and <code>signal()</code> in the wrong order.</p></div><div><h3>Languages</h3><p>Java <code>synchronized</code> methods with <code>wait()</code>/<code>notify()</code>; C# <code>lock</code> with <code>Monitor.Wait</code>/<code>Pulse</code>. C has no monitors, so POSIX gives <b>mutexes and condition variables</b> and you assemble the monitor yourself, as <code>monitor_bank.c</code> does.</p></div></div>`
});

/* ---------- 3.11 condition variables: BoundedBuffer monitor ---------- */
const BB_N = 2, BB_ITEMS = 4;
function bbProg(isProd){
  if (isProd) return [
    {ln:4, run:(S,T,me,D) => { T.L.x = T.k + 1; return MON.enter(S,T,me,D,1) ? "Producer calls <code>put("+T.L.x+")</code> and enters the monitor." : "Producer calls <code>put("+T.L.x+")</code>, but the consumer is inside: entry queue."; }},
    {ln:5, run:(S,T,me,D,Th) => { if (S.count === BB_N) return "Producer: <code>count == N</code> ("+S.count+" == "+BB_N+"), the buffer is full. <code>notFull.wait()</code>: sleep and release the monitor."+MON.wait(S,T,me,Th,D,"notFull",1); go(T,2); return "Producer: count = "+S.count+" &lt; "+BB_N+", not full."; }},
    {ln:6, run:(S,T,me,D) => { S.buf[S.in] = T.L.x; S.in = (S.in + 1) % BB_N; S.count++; go(T,3); return "Producer puts item <b>"+T.L.x+"</b>: count = "+S.count+"."; }},
    {ln:7, run:(S,T,me,D) => { go(T,4); return "Producer: <code>notEmpty.signal()</code>."+MON.signal(S,D,"notEmpty"); }},
    {ln:7, run:(S,T,me,D,Th) => { T.k++; go(T, T.k < BB_ITEMS ? 0 : DONE); return "Producer returns from put() and leaves."+MON.leave(S,Th,D); }} ];
  return [
    {ln:8, run:(S,T,me,D) => MON.enter(S,T,me,D,1) ? "Consumer calls <code>take()</code> and enters the monitor." : "Consumer calls <code>take()</code>, but the producer is inside: entry queue."},
    {ln:9, run:(S,T,me,D,Th) => { if (S.count === 0) return "Consumer: <code>count == 0</code>, the buffer is empty. <code>notEmpty.wait()</code>: sleep and release the monitor."+MON.wait(S,T,me,Th,D,"notEmpty",1); go(T,2); return "Consumer: count = "+S.count+", not empty."; }},
    {ln:10, run:(S,T,me,D) => { T.L.x = S.buf[S.out]; S.buf[S.out] = null; S.out = (S.out + 1) % BB_N; S.count--; S.got.push(T.L.x); go(T,3); return "Consumer takes item <b>"+T.L.x+"</b>: count = "+S.count+"."; }},
    {ln:11, run:(S,T,me,D) => { go(T,4); return "Consumer: <code>notFull.signal()</code>."+MON.signal(S,D,"notFull"); }},
    {ln:11, run:(S,T,me,D,Th) => { T.k++; go(T, T.k < BB_ITEMS ? 0 : DONE); return "Consumer returns item "+T.L.x+" and leaves."+MON.leave(S,Th,D); }} ];
}
TOPICS.push({ id:"condvar", num:"3.11", session:S6, sessionTitle:S6T, kind:"sched", short:"Condition variables",
  title:"Monitors: condition variables (bounded buffer)",
  lead:"Sometimes a process inside the monitor cannot continue, for example the buffer is empty. x.wait() suspends it and releases the monitor; x.signal() wakes one waiting process.",
  names:["producer","consumer"], tokLabel:["P","C"], monName:"BoundedBuffer (N = 2)", initText:"count = 0, in = 0, out = 0",
  code:`monitor BoundedBuffer {
  item buf[N];  int count = 0, in = 0, out = 0;
  condition notFull, notEmpty;
  void put(item x) {
    while (count == N) notFull.wait();
    buf[in] = x;  in = (in + 1) % N;  count++;
    notEmpty.signal(); }
  item take() {
    while (count == 0) notEmpty.wait();
    x = buf[out];  out = (out + 1) % N;  count--;
    notFull.signal();  return x; } }`, file:"monitor_buffer.c",
  init:()=>({buf:Array(BB_N).fill(null), count:0, in:0, out:0, got:[], owner:null, entryQ:[], cond:{notFull:[], notEmpty:[]}}),
  progs:()=>[bbProg(true), bbProg(false)],
  prefix:[1,1, 0,0,0,0,0, 0, 1,1,1,1, 0,0,0,0, 0,0,0,0,0, 0,0, 1,1,1,1,1, 0,0,0,0],
  stage:"tokens", stageH:330, stageTitle:"The BoundedBuffer monitor",
  stageBg:(D) => monitorBg(D, ["put","take"], ["notFull","notEmpty"], "shared data"),
  place:(st,D) => monitorPlace(st, D, (st,i) => i === 0 ? "put" : "take", ["put","take"], ["notFull","notEmpty"]),
  overlay:(st) => '<div style="position:absolute;left:24%;width:54%;top:50px;text-align:center">'+st.S.buf.map(v => '<span class="slot '+(v !== null ? "full" : "")+'">'+(v ?? "")+'</span>').join("")+' <span style="font:700 14px var(--mono)">count = '+st.S.count+'</span></div>',
  statusOf:monStatus(["notFull","notEmpty"]),
  vars:(st,i) => i === 0 ? "items put: "+st.Th[0].k+" / "+BB_ITEMS : "items taken: "+st.S.got.join(", "),
  think:(st,i) => { const S = st.S; if (isDone(st,i)) return "Finished."; if (S.cond.notFull.includes(i)) return "Asleep: the buffer is full."; if (S.cond.notEmpty.includes(i)) return "Asleep: the buffer is empty."; if (S.entryQ.includes(i)) return "Waiting to enter."; if (S.owner === i) return "Inside the monitor."; return i === 0 ? "About to call put()." : "About to call take()."; },
  check:(st,D) => D.names.every((n,i) => isDone(st,i)) ? ["ok","All "+BB_ITEMS+" items passed through in order: "+st.S.got.join(", ")+"."] : ["n","Sleeping processes wait on a condition, outside the monitor lock."],
  phases:[
    {at:0, t:"Consumer finds it empty", d:"count == 0, so notEmpty.wait() sleeps and releases the monitor."},
    {at:2, t:"Producer puts and signals notEmpty", d:"put(1) adds an item; notEmpty.signal() moves the consumer to the entry queue."},
    {at:8, t:"Consumer gets in and takes it", d:"When the producer leaves, the monitor passes to the consumer."},
    {at:22, t:"Buffer full: producer waits", d:"Items 2 and 3 fill both slots; put(4) finds count == N and calls notFull.wait()."},
    {at:26, t:"take() signals notFull", d:"The consumer frees a slot and moves the producer back to the entry queue."},
    {at:28, t:"Both finish", d:"The producer re-checks with while, puts item 4, and the consumer drains the rest."}
  ],
  notes:{0:"<b>Example from the slide:</b> a consumer that finds <code>count == 0</code> calls <code>notEmpty.wait()</code>; the producer calls <code>notEmpty.signal()</code> after adding an item.", end:"If nobody is waiting, <code>x.signal()</code> does nothing, unlike a semaphore's signal, which is remembered. With signal-and-continue, test the condition in a <code>while</code> loop."},
  real:realOut("monitor_buffer"),
  props:[["x.wait()","sleep + release monitor","re-acquire when woken"],["x.signal()","wake one waiter","nothing if none waits"],["vs semaphore signal","not remembered","semaphores count signals"],["Test style","while loop","signal-and-continue"]], propTitle:"Condition variables",
  deep:`<p>Hoare semantics (signal-and-wait) would run the woken process immediately, so the condition is guaranteed true. Mesa semantics (signal-and-continue), used by Java, C# and POSIX, only moves it to the entry queue, so it must re-test. POSIX version: <code>pthread_cond_wait(&amp;notEmpty, &amp;m)</code> inside <code>while (count == 0)</code>, as in <code>monitor_buffer.c</code>.</p>`
});
