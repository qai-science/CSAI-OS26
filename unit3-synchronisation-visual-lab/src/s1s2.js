/* ===== Session 1: IPC (3.1, 3.2) and Session 2: Linux IPC (3.3) ===== */
const S1 = "Session 1", S1T = "Why processes talk, and the two ways they do it";
const S2 = "Session 2", S2T = "IPC in Linux: shared memory, pipes and named pipes";

/* ---------- 3.1 IPC ---------- */
TOPICS.push({ id:"ipc", num:"3.1", session:S1, sessionTitle:S1T, kind:"script", short:"Inter Process Communication",
  title:"Inter Process Communication (IPC)",
  lead:"Processes that work together must exchange data. Each process has its own address space, so the operating system has to carry the data between them.",
  names:["process A","process B"], stageH:300, stageTitle:"Two processes and the kernel",
  init:()=>({aX:7, bBuf:"–", fault:false, chan:null, delivered:false, reasons:[], tabs:false}),
  frames:[
    {label:"setup", run:S => "Process A holds a variable <code>x = 7</code>. Process B wants that value. Each lives in its <b>own address space</b>: the same address means different memory in each process."},
    {label:"fault", who:0, run:S => { S.fault = true; return "A tries the obvious thing: read B's memory through a pointer. The memory-management hardware finds no mapping for that address in A's page table and raises a fault. The OS stops A with a <b>segmentation fault</b>. Processes cannot simply read each other's variables."; }},
    {label:"send", who:0, run:S => { S.fault = false; S.chan = "7"; return "A asks the kernel for help instead: it hands the value 7 to an <b>IPC mechanism</b>. The kernel can see both address spaces, so it holds the data for B."; }},
    {label:"deliver", who:1, run:S => { S.chan = null; S.delivered = true; S.bBuf = "7"; return "The kernel delivers the data into B's address space. B now has the 7. This is <b>interprocess communication</b>: the set of mechanisms the OS gives cooperating processes to exchange data."; }},
    {label:"why", run:S => { S.reasons.push("information sharing"); return "<b>Reason 1: information sharing.</b> Several processes need the same data, for example two programs reading one file or clipboard."; }},
    {label:"why", run:S => { S.reasons.push("speed-up"); return "<b>Reason 2: computation speed-up.</b> Split a big job into parts that run on several cores at once, then combine the results."; }},
    {label:"why", run:S => { S.reasons.push("modularity"); return "<b>Reason 3: modularity.</b> Build a system as separate processes that each do one job and talk to each other."; }},
    {label:"why", run:S => { S.reasons.push("convenience"); return "<b>Reason 4: convenience.</b> One user runs many things at once, such as editing, compiling and printing, which must cooperate."; }},
    {label:"example", run:S => { S.tabs = true; return "<b>Example from the slide.</b> A browser runs every tab as a separate process. If one tab crashes the others survive, but each tab must use IPC to ask the main browser process to show a page, save a file or open a new tab."; }}
  ],
  phases:[
    {at:0, t:"Two separate address spaces", d:"A has x = 7. B cannot see A's memory, and A cannot see B's."},
    {at:1, t:"Direct access fails", d:"Reading another process's memory raises a fault: the hardware protects each process."},
    {at:2, t:"The kernel carries the data", d:"A gives the data to an IPC mechanism; the kernel delivers it to B."},
    {at:4, t:"Why processes cooperate", d:"Information sharing, speed-up, modularity, convenience."},
    {at:8, t:"Real example", d:"Browser tabs are separate processes that talk to the main browser through IPC."}
  ],
  notes:{0:"An <b>independent</b> process shares no data with others. A <b>cooperating</b> process can affect, or be affected by, other processes. Cooperating processes need IPC.", end:"Remember the two IPC models of topic 3.2: <b>shared memory</b> (the kernel sets up a common region once) and <b>message passing</b> (every message goes through the kernel)."},
  stage:(st) => { const S = st.S;
    let h = H.proc(3, 14, 36, 128, "process A · address space", "var(--c0)", "var(--c0b)", '<div style="padding:6px 10px;font:13px var(--mono)">x = 7<br>'+(S.fault ? '<span style="color:var(--bad)">y = *ptr_into_B; ✗ segfault</span>' : '<span class="hint">pages mapped only for A</span>')+'</div>', st.last && st.last.me === 0);
    h += H.proc(61, 14, 36, 128, "process B · address space", "var(--c1)", "var(--c1b)", '<div style="padding:6px 10px;font:13px var(--mono)">buf = '+esc(S.bBuf)+(S.delivered ? ' <span class="chip pop" style="color:var(--ok)">received</span>' : "")+'<br><span class="hint">pages mapped only for B</span></div>', st.last && st.last.me === 1);
    if (S.fault) h += H.pill(50, 60, "✗ no mapping: fault", "var(--bad)");
    h += H.kern(110, "kernel: can see every address space");
    h += H.box(32, 200, 36, 56, "IPC mechanism", S.chan ? '<div class="big pop" style="font-size:18px">data: '+esc(S.chan)+'</div>' : '<div class="hint" style="text-align:center">'+(S.delivered ? "delivered" : "empty")+'</div>', S.chan ? "hot" : "");
    if (S.chan) { h += H.line(21, 142, 40, 200, "var(--c0)", true); }
    if (S.delivered && !S.reasons.length) h += H.line(60, 200, 79, 142, "var(--c1)", true);
    const R = ["information sharing","speed-up","modularity","convenience"];
    h += '<div style="position:absolute;left:3%;right:3%;top:150px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap">' + R.map(r => '<span class="chip '+(S.reasons.includes(r) ? "pop" : "")+'" style="color:'+(S.reasons.includes(r) ? "var(--ok)" : "var(--line)")+'">'+r+'</span>').join("") + '</div>';
    if (S.tabs) h += H.box(3, 262, 94, 30, "", '<div style="padding:5px 10px;font-size:12.5px">🌐 tab 1 · tab 2 · tab 3 are separate processes → IPC → main browser process</div>', "good pop");
    return h; },
  deepTitle:"IPC in depth",
  deep:`<div class="dgrid"><div><h3>Independent vs cooperating</h3><p>An independent process cannot affect or be affected by others. A cooperating process shares data, so its result can depend on what others do. All the synchronisation problems later in this unit come from cooperation.</p><h3>Why the OS must be involved</h3><p>Memory protection gives each process a private address space through its page table. That isolation is what stops a buggy program from corrupting others, but it also means data can only cross between processes through something the kernel provides or sets up.</p></div><div><h3>The menu of IPC mechanisms</h3><table class="std"><tr><th>Model</th><th>Linux examples</th></tr><tr><td>Shared memory</td><td><code>shm_open</code> + <code>mmap</code>, <code>shmget</code></td></tr><tr><td>Message passing</td><td>pipes, FIFOs, POSIX message queues, sockets, signals</td></tr></table><p>Topic 3.2 compares the two models; topic 3.3 runs the Linux calls for real.</p></div></div>`
});

/* ---------- 3.2 shared memory vs message passing ---------- */
TOPICS.push({ id:"models", num:"3.2", session:S1, sessionTitle:S1T, kind:"script", short:"Shared memory vs message passing",
  title:"IPC Mechanisms: Shared Memory and Message Passing",
  lead:"Two models of interprocess communication. Watch the counters: how often each model needs the kernel, and how often the data is copied.",
  stageH:330, stageTitle:"The same 10 chunks of an image, sent both ways",
  init:()=>({sm:{setup:false, done:0, sys:0, copies:0, region:0}, mp:{done:0, sys:0, copies:0, queue:0}, net:false}),
  frames:[
    {label:"start", run:S => "Process A must give process B an image cut into 10 chunks. On the left we use <b>shared memory</b>, on the right <b>message passing</b>. Count the system calls (kernel entries) and copies."},
    {label:"shm", run:S => { S.sm.setup = true; S.sm.sys += 2; return "<b>Shared memory, set-up.</b> A and B each call the kernel once to create and map a common region (<code>shm_open</code> + <code>mmap</code>). That is the <b>only</b> time the kernel is involved."; }},
    {label:"shm", run:S => { S.sm.done = 1; S.sm.copies += 1; S.sm.region = 1; return "A writes chunk 1 straight into the shared region with an ordinary memory store. No system call."; }},
    {label:"shm", run:S => "B reads chunk 1 straight from the same region, again with no system call and no extra copy. Both processes see the same bytes."},
    {label:"shm", run:S => { S.sm.done = 10; S.sm.copies = 10; S.sm.region = 10; return "Chunks 2 to 10 go the same way. Total: 2 system calls, 10 copies (one per chunk). But nothing stops B reading a chunk A is still writing: <b>the programmer must synchronise</b>."; }},
    {label:"msg", run:S => { S.mp.sys += 1; S.mp.copies += 1; S.mp.queue = 1; return "<b>Message passing.</b> A calls <code>send(m1)</code>: a system call, and the kernel copies chunk 1 from A into its message queue."; }},
    {label:"msg", run:S => { S.mp.sys += 1; S.mp.copies += 1; S.mp.queue = 0; S.mp.done = 1; return "B calls <code>receive(m1)</code>: another system call, and the kernel copies the chunk out of the queue into B. Two copies and two kernel entries for one chunk."; }},
    {label:"msg", run:S => { S.mp.sys = 20; S.mp.copies = 20; S.mp.done = 10; return "Chunks 2 to 10 the same way. Total: <b>20 system calls and 20 copies</b>. Slower, but there are no shared variables and <code>send</code>/<code>receive</code> synchronise by themselves."; }},
    {label:"net", run:S => { S.net = true; return "Now put B on <b>another machine</b>. There is no memory both can map, so shared memory is impossible. Message passing still works: the kernel sends the messages over the network (sockets)."; }}
  ],
  phases:[
    {at:0, t:"The task", d:"Move 10 chunks from A to B, both ways."},
    {at:1, t:"Shared memory: set up once", d:"Two system calls create and map one common region."},
    {at:2, t:"Shared memory: direct access", d:"Writes and reads are plain memory operations: fast, but unsynchronised."},
    {at:5, t:"Message passing: through the kernel", d:"Every send and receive is a system call plus a copy."},
    {at:8, t:"Across machines", d:"Only message passing works between computers."}
  ],
  notes:{end:"Rule of thumb from the slide: two processes on one machine exchanging a 100 MB image use <b>shared memory</b>; a client and a server on two machines use <b>message passing</b>. The real benchmark below measures the difference."},
  stage:(st) => { const S = st.S, sm = S.sm, mp = S.mp;
    let h = H.txt(2, 4, "<b>shared memory</b>") + H.txt(52, 4, "<b>message passing</b>");
    h += '<div style="position:absolute;left:50%;top:0;bottom:0;border-left:1px dashed var(--line)"></div>';
    h += H.proc(2, 26, 18, 70, "A", "var(--c0)", "var(--c0b)", '<div class="hint" style="padding:0 8px">writes '+sm.done+'/10</div>');
    h += H.proc(30, 26, 18, 70, "B", "var(--c1)", "var(--c1b)", '<div class="hint" style="padding:0 8px">reads '+sm.done+'/10</div>');
    h += H.box(8, 110, 34, 54, "shared region", sm.setup ? '<div style="padding:0 8px">'+Array.from({length:10},(x,k)=>'<span class="slot '+(k<sm.region?"full":"")+'" style="width:22px;height:22px;margin:1px">'+(k<sm.region?k+1:"")+'</span>').join("")+'</div>' : '<div class="hint" style="padding:0 8px">not created yet</div>', sm.setup ? "good" : "");
    h += H.proc(52, 26, 18, 70, "A", "var(--c0)", "var(--c0b)", '<div class="hint" style="padding:0 8px">sent '+Math.max(mp.done, mp.queue ? 1 : 0)+'/10</div>');
    h += H.proc(80, 26, 18, 70, "B", "var(--c1)", "var(--c1b)", '<div class="hint" style="padding:0 8px">got '+mp.done+'/10</div>');
    h += H.kern(150, "kernel");
    h += H.box(58, 196, 34, 50, "kernel message queue", '<div style="padding:0 8px">'+(mp.queue ? '<span class="slot full pop">m'+(mp.done+1)+'</span>' : '<span class="hint">empty</span>')+'</div>', mp.queue ? "hot" : "");
    if (mp.queue) h += H.line(61, 96, 66, 196, "var(--c0)", true);
    h += H.box(8, 196, 34, 50, "kernel", '<div class="hint" style="padding:0 8px">'+(sm.setup ? "only used at set-up" : "")+'</div>');
    h += '<div style="position:absolute;left:2%;width:46%;top:256px">' + H.cells([["system calls", sm.sys, st.last && st.last.changed.includes("sm")],["copies", sm.copies, false]]) + '</div>';
    h += '<div style="position:absolute;left:52%;width:46%;top:256px">' + H.cells([["system calls", mp.sys, st.last && st.last.changed.includes("mp")],["copies", mp.copies, false]]) + '</div>';
    if (S.net) h += H.pill(25, 70, "✗ different machines: no common memory", "var(--bad)") + H.pill(75, 108, "✓ messages go over the network", "var(--ok)");
    return h; },
  real:realOut("ipc_bench"),
  propTitle:"Side by side", props:[["Speed","Shared memory","kernel only at set-up"],["Synchronisation","Message passing","built into send and receive"],["Between machines","Message passing","shared memory needs one machine"],["Programming effort","Message passing","no shared variables to protect"]],
  deepTitle:"Choosing a model",
  deep:`<div class="dgrid"><div><h3>Shared memory</h3><ul><li>Fastest: after set-up, data moves at memory speed.</li><li>The programmer must prevent races, using the tools of sessions 3–8.</li><li>Only between processes on one machine.</li></ul><h3>Message passing</h3><ul><li><code>send(m)</code> and <code>receive(m)</code> through the kernel.</li><li>Each message costs system calls and copies.</li><li>No shared variables, works across machines, and <code>receive</code> waits for data by itself.</li></ul></div><div><h3>Real numbers</h3><p><code>ipc_bench.c</code> moves 100 MB between two processes once through a shared region and once through a pipe, and counts the <code>read()</code> calls the pipe needed. See the terminal above.</p><h3>Next tab</h3><p>Message passing has its own design choices: direct or indirect naming, blocking or not, and how many messages the link can buffer.</p></div></div>`
});

/* ---------- 3.2 message passing design (sender / receiver / mailbox) ---------- */
function mpProgs(O){
  const cap = O.cap === "inf" ? Infinity : +O.cap;
  const sender = [];
  for (let k = 1; k <= 4; k++) sender.push({ln:2, z:"entry", run:(S,T,me,D,Th) => {
    const m = "m" + k;
    if (S.recvWaiting){ S.recvWaiting = false; S.got.push(m); Th[1].st = "ready"; Th[1].pc += 1; go(T, T.pc+1); return "Sender: <code>send(A, "+m+")</code>. The receiver is already waiting, so the message is handed over <b>directly</b> and both continue."; }
    if (S.queue.length < cap){ S.queue.push(m); go(T, T.pc+1); return "Sender: <code>send(A, "+m+")</code>. There is room in mailbox A ("+S.queue.length+" of "+(cap === Infinity ? "∞" : cap)+"), so the message is stored and the sender <b>continues at once</b>."; }
    T.st = "sleep"; T.resume = T.pc + 1; S.pending = m;
    return "Sender: <code>send(A, "+m+")</code>, but "+(cap === 0 ? "the link has <b>zero capacity</b>" : "mailbox A is <b>full</b>")+". The sender <b>blocks</b> until the receiver takes a message.";
  }});
  const recv = [];
  for (let k = 1; k <= 4; k++){
    recv.push({ln:5, z:"rem", run:(S,T,me) => { go(T, T.pc+1); return "Receiver: busy with other work (it is slower than the sender)."; }});
    recv.push({ln:4, z:"entry", run:(S,T,me,D,Th) => {
      if (S.queue.length){ const m = S.queue.shift(); S.got.push(m); let x = ""; if (S.pending){ S.queue.push(S.pending); x = " The blocked sender's message "+S.pending+" now fits, so the sender wakes up."; S.pending = null; Th[0].st = "ready"; Th[0].pc = Th[0].resume; } go(T, T.pc+1); return "Receiver: <code>receive(A)</code> takes <b>"+m+"</b> from the mailbox."+x; }
      if (S.pending){ const m = S.pending; S.pending = null; S.got.push(m); Th[0].st = "ready"; Th[0].pc = Th[0].resume; go(T, T.pc+1); return "Receiver: <code>receive(A)</code> takes <b>"+m+"</b> straight from the blocked sender, which wakes up. Blocking send + blocking receive = a <b>rendezvous</b>."; }
      T.st = "sleep"; S.recvWaiting = true; return "Receiver: <code>receive(A)</code>, but the mailbox is empty. The receiver <b>blocks</b> until a message arrives.";
    }});
  }
  return [sender, recv];
}
TOPICS.push({ id:"mpdesign", num:"3.2", session:S1, sessionTitle:S1T, kind:"sched", short:"Message passing: design choices",
  title:"IPC Mechanisms: design choices in message passing",
  lead:"Direct or indirect naming, blocking or non-blocking, and how many messages the link can buffer. Change the buffer capacity above and replay: the sender's waiting changes completely.",
  names:["sender","receiver"], tokLabel:["S","R"],
  options:[{key:"cap", label:"Buffer capacity", values:[["2","bounded n = 2"],["0","zero (rendezvous)"],["inf","unbounded"]]}],
  code:`/* sender P: 4 messages to mailbox A */
for (k = 1; k <= 4; k++) send(A, m[k]);

/* receiver Q */
for (k = 1; k <= 4; k++) { receive(A, &x);
                           work(x); }`,
  file:"mq_demo.c",
  init:O => ({cap:O.cap, queue:[], pending:null, recvWaiting:false, got:[]}),
  progs:mpProgs, noFree:false,
  stage:(st) => { const S = st.S, cap = S.cap === "inf" ? 6 : +S.cap;
    const sT = st.Th[0], rT = st.Th[1];
    let h = H.proc(2, 30, 22, 110, "sender P", "var(--c0)", "var(--c0b)", '<div style="padding:4px 10px;font-size:12.5px">'+(isDone(st,0) ? "all 4 sent ✓" : sT.st === "sleep" ? '<span style="color:var(--warn);font-weight:700">blocked</span> holding '+S.pending : "sending m"+(sT.pc+1))+'</div>', st.last && st.last.me === 0);
    h += H.proc(76, 30, 22, 110, "receiver Q", "var(--c1)", "var(--c1b)", '<div style="padding:4px 10px;font-size:12.5px">'+(rT.st === "sleep" ? '<span style="color:var(--warn);font-weight:700">blocked</span> in receive' : isDone(st,1) ? "done ✓" : "working")+'<br>got: '+(S.got.join(", ") || "–")+'</div>', st.last && st.last.me === 1);
    const slots = cap === 0 ? '<div class="hint" style="padding:6px 10px">capacity 0: no slot at all, so the sender must wait for the receiver every time</div>' : '<div style="padding:4px 8px">' + Array.from({length:cap}, (x,k) => '<span class="slot '+(k < S.queue.length ? "full pop" : "")+'"'+(S.cap === "inf" ? ' style="border-style:dashed"' : "")+'>'+(S.queue[k] || "")+'</span>').join("") + (S.cap === "inf" ? '<span class="hint"> … ∞</span>' : "") + '</div>';
    h += H.box(28, 46, 44, 80, "mailbox A (kernel) · "+(S.cap === "inf" ? "unbounded" : "capacity "+cap), slots, S.queue.length === cap && cap > 0 ? "hot" : "");
    h += H.line(24, 86, 28, 86, "var(--c0)") + H.line(72, 86, 76, 86, "var(--c1)");
    h += H.txt(3, 160, "<b>direct</b>: <code>send(Q, msg)</code> names the process · <b>indirect</b>: <code>send(A, msg)</code> uses a mailbox that several processes may share (used here)");
    return h; },
  stageH:200, stageTitle:"Sender, mailbox, receiver",
  vars:(st,i) => i === 0 ? "messages sent: " + Math.min(st.Th[0].pc, 4) + " / 4" : "messages received: " + st.S.got.length + " / 4",
  think:(st,i) => { const T = st.Th[i]; if (isDone(st,i)) return "Finished."; if (T.st === "sleep") return i === 0 ? "Blocked: no room for my message." : "Blocked: nothing to receive yet."; return i === 0 ? "Next: send m"+(T.pc+1)+"." : (T.pc % 2 === 0 ? "Doing other work." : "Next: receive."); },
  statusOf:(st,i) => isDone(st,i) ? ["done","var(--dead)"] : st.Th[i].st === "sleep" ? ["blocked","var(--warn)"] : ["running","var(--ok)"],
  check:(st) => isDone(st,0) && isDone(st,1) ? ["ok","All 4 messages delivered in order: "+st.S.got.join(", ")+"."] : ["n","Capacity "+(st.S.cap === "inf" ? "unbounded: the sender never waits" : st.S.cap === "0" ? "0: every send waits for a receive (rendezvous)" : st.S.cap+": the sender waits only when the mailbox is full")+"."],
  phases:O => O.cap === "0" ? [
    {at:0, t:"Zero capacity: the first send blocks", d:"There is no slot, so send(A, m1) waits for a receiver."},
    {at:2, t:"Rendezvous", d:"receive takes m1 straight from the blocked sender, and both continue."},
    {at:3, t:"Every message repeats it", d:"Blocking send + blocking receive: the two meet for each message."}
  ] : O.cap === "inf" ? [
    {at:0, t:"Naming: send to a mailbox", d:"Indirect communication: the sender names mailbox A, not the receiver."},
    {at:2, t:"The sender never waits", d:"An unbounded buffer always has room, so every send returns at once."},
    {at:6, t:"All four sent", d:"The sender has finished while the receiver is still working."},
    {at:7, t:"The receiver drains the queue", d:"Messages come out in order m2, m3, m4."}
  ] : [
    {at:0, t:"Naming: send to a mailbox", d:"Indirect communication: the sender names mailbox A, not the receiver."},
    {at:2, t:"Sender runs ahead", d:"While there is room (2 slots), send returns immediately."},
    {at:6, t:"Full: the sender blocks", d:"m4 does not fit, so the sender waits."},
    {at:7, t:"A receive wakes the sender", d:"Taking m2 frees a slot; m4 goes in and the sender continues."}
  ],
  notes:{0:"<b>Design choice 1, naming.</b> Direct: <code>send(Q, msg)</code>. Indirect: <code>send(A, msg)</code> to a mailbox (port) several processes may share. <b>Choice 2, blocking:</b> a blocking send waits until the message is received or stored; a non-blocking send returns at once. <b>Choice 3, buffering:</b> zero, bounded n, or unbounded.", end:"Try the other capacities. Zero capacity makes every message a <b>rendezvous</b>; unbounded lets the sender finish at once; bounded n blocks only when full. The real <code>mq_demo</code> uses a POSIX message queue with capacity 2."},
  real:realOut("mq_demo"),
  propTitle:"Buffer capacity: when does the sender wait?", props:[["zero","always","until the receiver takes it (rendezvous)"],["bounded n","only when full","the simulation default"],["unbounded","never","memory permitting"]],
  deepTitle:"Message-passing design choices",
  deep:`<div class="dgrid"><div><h3>Direct vs indirect</h3><p><b>Direct</b>: each side names the other, <code>send(P, msg)</code> and <code>receive(Q, msg)</code>. One link per pair. <b>Indirect</b>: messages go to a <b>mailbox</b>, and any process that shares it may receive. The print server in the slide reads jobs from one mailbox that every user program sends to.</p><h3>Blocking vs non-blocking</h3><table class="std"><tr><th></th><th>blocking</th><th>non-blocking</th></tr><tr><td>send</td><td>wait until received or stored</td><td>return at once</td></tr><tr><td>receive</td><td>wait for a message</td><td>return a message or "none"</td></tr></table></div><div><h3>Buffering</h3><table class="std"><tr><th>capacity</th><th>sender waits?</th></tr><tr><td>zero</td><td>always, until received</td></tr><tr><td>bounded n</td><td>only when full</td></tr><tr><td>unbounded</td><td>never</td></tr></table><p>Blocking send plus blocking receive is called a <b>rendezvous</b>: both meet at the hand-over.</p></div></div>`
});

/* ---------- 3.3 shared memory ---------- */
TOPICS.push({ id:"shm", num:"3.3", session:S2, sessionTitle:S2T, kind:"script", short:"POSIX shared memory",
  title:"Shared Memory in Linux: POSIX shm",
  lead:"shm_open, ftruncate, mmap and shm_unlink. Any process that opens the same name and maps it sees the same bytes. The kernel gives no synchronisation.",
  names:["writer","reader"],
  code:`fd = shm_open("/frames", O_CREAT | O_RDWR, 0666);
ftruncate(fd, 4096);
p = mmap(0, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
sprintf(p, "hello");    /* writer */
q = mmap(... "/frames" ...);  printf("%s", q);   /* reader */
shm_unlink("/frames");  /* at the end */`, file:"shm_writer.c",
  init:()=>({exists:false, size:0, data:"", wMap:false, rMap:false, out:""}),
  frames:[
    {who:0, ln:1, run:S => { S.exists = true; return "The writer calls <code>shm_open(\"/frames\", O_CREAT | O_RDWR, 0666)</code>. The kernel creates a named shared-memory object and returns a file descriptor. A file appears at <code>/dev/shm/frames</code>, size 0."; }},
    {who:0, ln:2, run:S => { S.size = 4096; return "<code>ftruncate(fd, 4096)</code> sets the size to one page. The new bytes are all zero."; }},
    {who:0, ln:3, run:S => { S.wMap = true; return "<code>mmap(..., MAP_SHARED, fd, 0)</code> maps those 4096 bytes into the writer's address space and returns the pointer <code>p</code>. MAP_SHARED means stores go to the shared pages."; }},
    {who:0, ln:4, run:S => { S.data = "hello"; return "<code>sprintf(p, \"hello\")</code> is an ordinary memory write: <b>no system call</b>. The bytes land directly in the shared pages."; }},
    {who:1, ln:5, run:S => { S.rMap = true; return "A different process, the reader, opens the <b>same name</b> and maps it. Now both processes map the same physical pages."; }},
    {who:1, ln:5, run:S => { S.out = S.data; return "The reader prints what is at <code>q</code>: <b>hello</b>. No data was copied through the kernel, which is why shared memory is the fastest IPC."; }},
    {who:0, ln:6, run:S => { S.exists = false; S.wMap = false; S.rMap = false; return "<code>shm_unlink(\"/frames\")</code> removes the name. The memory is freed once nobody has it mapped. Note the kernel never made the reader wait for the writer: <b>no synchronisation</b>."; }}
  ],
  phases:[
    {at:0, t:"Create the object", d:"shm_open makes /dev/shm/frames and returns a file descriptor."},
    {at:1, t:"Size it and map it", d:"ftruncate sets 4096 bytes; mmap gives the writer a pointer p."},
    {at:3, t:"Write with a plain store", d:"sprintf(p, \"hello\") needs no system call."},
    {at:4, t:"Reader maps the same name", d:"Both processes see the same bytes."},
    {at:6, t:"Unlink", d:"shm_unlink removes the name. Synchronisation is your job."}
  ],
  notes:{0:"<b>Example from the slide:</b> a camera process writes each frame into <code>/frames</code>; a display process maps <code>/frames</code> and reads it without any copying."},
  stage:(st) => { const S = st.S;
    let h = H.proc(3, 14, 30, 96, "writer", "var(--c0)", "var(--c0b)", '<div style="padding:4px 10px;font:12.5px var(--mono)">'+(S.wMap ? "p → /frames" : "no mapping")+'</div>', st.last && st.last.me === 0);
    h += H.proc(67, 14, 30, 96, "reader", "var(--c1)", "var(--c1b)", '<div style="padding:4px 10px;font:12.5px var(--mono)">'+(S.rMap ? "q → /frames" : "no mapping")+(S.out ? '<br>printed: <b class="pop">'+S.out+'</b>' : "")+'</div>', st.last && st.last.me === 1);
    h += H.kern(130, "kernel");
    h += H.box(25, 140, 50, 100, "/dev/shm/frames"+(S.exists ? " · "+S.size+" bytes" : " · does not exist"), S.exists ? '<div style="padding:4px 8px">'+Array.from({length:10},(x,k)=>'<span class="slot '+(S.data[k]?"full pop":"")+'" style="width:26px;height:26px">'+(S.data[k]||"·")+'</span>').join("")+'</div>' : "", S.exists ? "hot" : "");
    if (S.wMap) h += H.line(18, 110, 32, 140, "var(--c0)", true);
    if (S.rMap) h += H.line(82, 110, 68, 140, "var(--c1)", true);
    return h; }, stageH:260,
  real:[PS+"./shm_writer", "writer: wrote \"hello\" into /frames", "writer: now run ./shm_reader in another terminal, then press Enter", PS+"./shm_reader            # terminal 2", "reader: read \"hello\" from /frames", PS+"ls -l /dev/shm/frames", "-rw-rw-r-- 1 cosmos cosmos 4096 Oct 15 03:09 /dev/shm/frames", "writer: /frames unlinked"],
  deep:`<p>See topic 3.6 and session 5 for why the missing synchronisation matters: the reader can run before the writer has written. The IPC simulator from earlier shows that race step by step.</p>`
});

/* ---------- 3.3 ordinary pipe ---------- */
TOPICS.push({ id:"pipe", num:"3.3", session:S2, sessionTitle:S2T, kind:"script", short:"Ordinary pipes",
  title:"Ordinary pipes: one-way, between parent and child",
  lead:"pipe(fd) creates a one-way channel. After fork() the child inherits both ends; each side closes the end it does not use.",
  names:["parent","child"],
  code:`int fd[2];  pipe(fd);
if (fork() == 0) {        /* child reads */
    close(fd[1]);  read(fd[0], buf, 100);
} else {                  /* parent writes */
    close(fd[0]);  write(fd[1], "hi", 3);
}`, file:"pipe_demo.c",
  init:()=>({pipe:false, child:false, pfd:[], cfd:[], buf:"", blocked:false, got:"", eof:false}),
  frames:[
    {who:0, ln:1, run:S => { S.pipe = true; S.pfd = ["fd[0] read","fd[1] write"]; return "<code>pipe(fd)</code>: the kernel creates an anonymous buffer and gives the parent two descriptors, <code>fd[0]</code> (read end) and <code>fd[1]</code> (write end). It has <b>no name</b>."; }},
    {who:0, ln:2, run:S => { S.child = true; S.cfd = ["fd[0] read","fd[1] write"]; return "<code>fork()</code> copies the parent, <b>including its descriptor table</b>, so the child holds both ends too. That is the only way to share an unnamed pipe: related processes."; }},
    {who:1, ln:3, run:S => { S.cfd = ["fd[0] read"]; return "The child closes <code>fd[1]</code>, the end it does not use."; }},
    {who:1, ln:3, run:S => { S.blocked = true; return "The child calls <code>read(fd[0], ...)</code> on an <b>empty</b> pipe, so the kernel puts it to sleep."; }},
    {who:0, ln:5, run:S => { S.pfd = ["fd[1] write"]; return "The parent closes <code>fd[0]</code>, the end it does not use."; }},
    {who:0, ln:5, run:S => { S.buf = "hi"; return "The parent calls <code>write(fd[1], \"hi\", 3)</code>. The kernel copies the bytes into the pipe buffer and wakes the sleeping child."; }},
    {who:1, ln:3, run:S => { S.got = S.buf; S.buf = ""; S.blocked = false; return "The child's <code>read</code> returns <b>hi</b>; the bytes leave the pipe. A pipe is a stream: each byte is read once."; }},
    {who:0, ln:6, run:S => { S.pfd = []; S.eof = true; return "When the parent closes its write end, the child's next <code>read</code> returns 0, meaning <b>end-of-file</b>. EOF comes only when <b>every</b> write end is closed, which is why each side must close the end it does not use."; }}
  ],
  phases:[
    {at:0, t:"pipe(fd)", d:"Kernel buffer with a read end fd[0] and a write end fd[1]."},
    {at:1, t:"fork() copies both ends", d:"Child and parent each hold fd[0] and fd[1]."},
    {at:2, t:"Close the unused ends", d:"Child keeps the read end, parent keeps the write end."},
    {at:3, t:"read blocks, write wakes it", d:"An empty pipe blocks the reader until data arrives."},
    {at:7, t:"End-of-file", d:"Once every write end is closed, read returns 0."}
  ],
  notes:{end:"<b>Example from the slide:</b> the shell command <code>ls | wc -l</code> builds exactly this: <code>pipe()</code>, then <code>fork()</code> twice, connecting <code>ls</code>'s output to <code>wc</code>'s input."},
  stage:(st) => { const S = st.S;
    const fds = (a) => a.map(f => '<div class="chip" style="color:var(--ink);margin:2px">'+f+'</div>').join("");
    let h = H.proc(3, 14, 34, 110, "parent", "var(--c0)", "var(--c0b)", '<div style="padding:2px 8px">'+fds(S.pfd)+'</div>', st.last && st.last.me === 0);
    h += S.child ? H.proc(63, 14, 34, 110, "child"+(S.blocked ? " · sleeping in read()" : ""), "var(--c1)", "var(--c1b)", '<div style="padding:2px 8px">'+fds(S.cfd)+(S.got ? '<div class="pop" style="font:700 13px var(--mono)">buf = "'+S.got+'"</div>' : "")+(S.eof ? '<div class="hint">next read() → 0 (EOF)</div>' : "")+'</div>', st.last && st.last.me === 1) : H.box(63, 14, 34, 110, "child", '<div class="hint" style="padding:6px">not created yet (no fork)</div>');
    h += H.kern(110, "kernel");
    h += H.box(22, 160, 56, 60, S.pipe ? "pipe buffer (no name)  write end → read end" : "no pipe yet", S.pipe ? '<div style="padding:4px 8px;font:700 15px var(--mono)" class="'+(S.buf?"pop":"")+'">'+(S.buf ? '"'+S.buf+'"' : '<span class="hint">empty</span>')+'</div>' : "", S.buf ? "hot" : "");
    return h; }, stageH:240,
  real:[PS+"./pipe_demo", "parent (pid 56447): sent \"hello through the pipe\"", "child  (pid 56448): got \"hello through the pipe\""],
  deep:`<table class="std"><tr><th></th><th>ordinary pipe</th><th>named pipe (next tab)</th></tr><tr><td>name</td><td>none</td><td>path in the file system</td></tr><tr><td>users</td><td>related processes</td><td>any process</td></tr><tr><td>lifetime</td><td>ends with the processes</td><td>until deleted</td></tr></table>`
});

/* ---------- 3.3 named pipe ---------- */
TOPICS.push({ id:"fifo", num:"3.3", session:S2, sessionTitle:S2T, kind:"script", short:"Named pipes (FIFOs)",
  title:"Named pipes (FIFOs): a pipe with a name in the file system",
  lead:"mkfifo creates a special file; any process that knows the path can open it. Opening blocks until the other end is opened too.",
  names:["terminal 1","terminal 2"],
  code:`$ mkfifo /tmp/ch            # once
$ cat /tmp/ch                # terminal 1 waits
$ echo ready > /tmp/ch       # terminal 2`, file:"fifo_writer.c",
  init:()=>({name:false, catOpen:false, catBlocked:false, echoOpen:false, buf:"", out:"", catDone:false}),
  frames:[
    {who:0, ln:1, run:S => { S.name = true; return "<code>mkfifo /tmp/ch</code> creates a special file of type <b>p</b>. It is only a name: no data is ever stored on disk."; }},
    {who:0, ln:2, run:S => { S.catOpen = true; S.catBlocked = true; return "Terminal 1 runs <code>cat /tmp/ch</code>. Opening a FIFO for reading <b>blocks until a writer opens it</b>, so the terminal looks frozen."; }},
    {who:1, ln:3, run:S => { S.echoOpen = true; S.catBlocked = false; return "Terminal 2 runs <code>echo ready &gt; /tmp/ch</code>. The shell opens the FIFO for writing, the two opens meet (a <b>rendezvous</b>), and the kernel attaches a buffer."; }},
    {who:1, ln:3, run:S => { S.buf = "ready"; return "<code>echo</code> writes <b>ready</b> into the buffer, first in, first out."; }},
    {who:0, ln:2, run:S => { S.out = S.buf; S.buf = ""; return "<code>cat</code> reads it and terminal 1 prints <b>ready</b>."; }},
    {who:1, ln:3, run:S => { S.echoOpen = false; S.catDone = true; S.catOpen = false; return "<code>echo</code> finishes and the write end closes. <code>cat</code>'s next read returns end-of-file, so it exits. The name <code>/tmp/ch</code> <b>stays</b> until someone runs <code>rm /tmp/ch</code>."; }}
  ],
  phases:[
    {at:0, t:"mkfifo makes a name", d:"A special file of type p appears in the file system."},
    {at:1, t:"Open blocks", d:"The reader waits until a writer opens the same path."},
    {at:2, t:"Rendezvous", d:"Both opens complete together; a kernel buffer is attached."},
    {at:3, t:"Data flows FIFO", d:"echo writes, cat reads and prints."},
    {at:5, t:"Close and EOF", d:"The writer closes, cat sees EOF; the name outlives both."}
  ],
  stage:(st) => { const S = st.S;
    let h = H.proc(3, 14, 36, 100, "terminal 1: cat", "var(--c0)", "var(--c0b)", '<div style="padding:4px 10px;font:12.5px var(--mono)">'+(S.catBlocked ? '<span style="color:var(--warn)">blocked in open()</span>' : S.catDone ? "exited (EOF)" : S.catOpen ? "reading" : "–")+(S.out ? '<br>prints: <b class="pop">'+S.out+'</b>' : "")+'</div>', st.last && st.last.me === 0);
    h += H.proc(61, 14, 36, 100, "terminal 2: echo", "var(--c1)", "var(--c1b)", '<div style="padding:4px 10px;font:12.5px var(--mono)">'+(S.echoOpen ? "writing" : S.catDone ? "done" : "–")+'</div>', st.last && st.last.me === 1);
    h += H.box(30, 124, 40, 44, "file system", '<div style="padding:0 8px;font:12.5px var(--mono)">'+(S.name ? '<span class="pop">prw-rw-r--  /tmp/ch</span>' : '<span class="hint">(no /tmp/ch)</span>')+'</div>');
    h += H.kern(80, "kernel");
    h += H.box(30, 184, 40, 46, "FIFO buffer", '<div style="padding:0 8px;font:700 14px var(--mono)">'+(S.buf ? '<span class="pop">"'+S.buf+'"</span>' : '<span class="hint">'+(S.echoOpen || S.catOpen ? "empty" : "no buffer until opened")+'</span>')+'</div>', S.buf ? "hot" : "");
    return h; }, stageH:240,
  real:[PS+"mkfifo /tmp/f; cat /tmp/f      # terminal 1", PS+"echo hi > /tmp/f               # terminal 2", "hi", PS+"./fifo_writer & ./fifo_reader", "writer: waiting for a reader...", "writer: sent \"hello through the FIFO\"", "reader: got \"hello through the FIFO\""],
  deep:`<table class="std"><tr><th></th><th>ordinary pipe</th><th>named pipe</th></tr><tr><td>name</td><td>none</td><td>path in the file system</td></tr><tr><td>users</td><td>related processes</td><td>any process</td></tr><tr><td>lifetime</td><td>ends with the processes</td><td>until deleted</td></tr><tr><td>created by</td><td><code>pipe()</code></td><td><code>mkfifo</code>, then <code>open()</code></td></tr></table>`
});
