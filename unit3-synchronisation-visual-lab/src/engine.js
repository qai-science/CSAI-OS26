/* ===== Unit III Visual Lab engine ===== */
const TOPICS = [];
const REPO_CODE = "code/";
const PS = "$ ";
const DONE = 99;
const COLORS = ["var(--c0)","var(--c1)","var(--c2)","var(--c3)","var(--c4)"];
const BGS = ["var(--c0b)","var(--c1b)","var(--c2b)","var(--c3b)","var(--c4b)"];
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const go = (T, n) => { T.pc = n; };
const B = v => v ? "true" : "false";
const clone = o => JSON.parse(JSON.stringify(o));
const less = (a, i, b, k) => a < b || (a === b && i < k);

const TOK = /(\/\*.*?\*\/|\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*")|\b(int|void|char|boolean|bool|true|false|while|for|if|else|return|do|monitor|condition|semaphore|struct|item|long|const)\b|\b(wait|signal|send|receive|TestAndSet|Swap|deposit|withdraw|put|take|shm_open|ftruncate|mmap|munmap|shm_unlink|pipe|fork|read|write|close|mkfifo|open|unlink|sprintf|printf|max|disable_interrupts|enable_interrupts|cat|echo|eat|think|block|wakeup|mq_send|mq_receive)\b/g;
function hl(line){ let o = "", last = 0, m; TOK.lastIndex = 0; while ((m = TOK.exec(line))){ o += esc(line.slice(last, m.index)); o += '<span class="'+(m[1]?"c":m[2]?"s":m[3]?"k":"f")+'">'+esc(m[0])+"</span>"; last = TOK.lastIndex; if (m[0] === "") TOK.lastIndex++; } return o + esc(line.slice(last)); }

let cur = 0, mode = "tour", tstep = 0, hist = [], timer = null, opts = {};

const val = (D, x) => typeof x === "function" ? x(optsFor(D)) : x;
function optsFor(D){ const o = {}; (D.options||[]).forEach(op => o[op.key] = opts[D.id+"."+op.key] ?? op.values[0][0]); return o; }

/* ---------- replay ---------- */
function replay(D, h){
  const O = optsFor(D);
  const S = D.init(O);
  const log = []; let last = null;
  if (D.kind === "script"){
    h.forEach((k, idx) => {
      const f = D.frames[k]; const before = clone(S);
      const msg = f.run(S, O);
      const changed = Object.keys(S).filter(x => JSON.stringify(S[x]) !== JSON.stringify(before[x]));
      last = {me: f.who ?? -1, ln: [].concat(f.ln||[]), msg, changed, before};
      log.push({me: last.me, msg, idx: idx+1, label: f.label});
    });
    return {S, last, log, O};
  }
  const P = D.progs(O);
  const Th = Array.from({length:D.names.length}, () => ({pc:0, k:0, st:"ready", spinning:false, spins:0, resume:0, L:{}}));
  if (D.setup) D.setup(S, Th, O);
  h.forEach((me, idx) => {
    const T = Th[me], ins = P[me][T.pc];
    if (!ins || T.st === "sleep") return;
    const before = clone(S);
    const msg = ins.run(S, T, me, D, Th, O);
    const changed = Object.keys(S).filter(x => JSON.stringify(S[x]) !== JSON.stringify(before[x]));
    last = {me, ln:[ins.ln].concat(ins.also||[]), msg, changed, before};
    log.push({me, msg, idx: idx+1});
  });
  return {S, Th, P, last, log, O};
}
const runnable = (st, i) => st.Th[i].st !== "sleep" && st.P[i][st.Th[i].pc] !== undefined;
const zoneOf = (st, i) => { const ins = st.P[i][st.Th[i].pc]; return ins ? (ins.z || "entry") : "done"; };
const isDone = (st, i) => !st.P[i][st.Th[i].pc];

function tourOf(D){
  const O = optsFor(D), key = JSON.stringify(O);
  D._tour = D._tour || {};
  if (D._tour[key]) return D._tour[key];
  let seq;
  if (D.kind === "script") seq = D.frames.map((f,k) => k);
  else if (D.tourFor) seq = D.tourFor(O);
  else if (D.tour) seq = D.tour;
  else seq = autoTour(D, D.prefix || []);
  return D._tour[key] = seq;
}
function autoTour(D, prefix){
  const h = prefix.slice(); const n = D.names.length; let lastPick = -1;
  for (let guard = 0; guard < 400; guard++){
    const st = replay(D, h);
    const cand = [...Array(n).keys()].filter(i => runnable(st, i));
    if (!cand.length) break;
    const prog = cand.filter(i => { const a = JSON.stringify([st.S, st.Th[i].pc, st.Th[i].L]); const s2 = replay(D, h.concat([i])); return JSON.stringify([s2.S, s2.Th[i].pc, s2.Th[i].L]) !== a; });
    if (!prog.length) break;
    const ordered = prog.slice().sort((a,b) => ((a - lastPick - 1 + n) % n) - ((b - lastPick - 1 + n) % n));
    lastPick = ordered[0]; h.push(lastPick);
  }
  return h;
}

/* ---------- navigation ---------- */
function buildNav(){
  let html = "", sel = "", lastS = null;
  TOPICS.forEach((D,i) => {
    if (D.session !== lastS){ html += '<div class="sess">'+esc(D.session)+(D.sessionTitle ? '<small>'+esc(D.sessionTitle)+'</small>' : "")+'</div>'; lastS = D.session; }
    html += '<button type="button" data-i="'+i+'" aria-current="'+(i===cur)+'"><span class="no">'+esc(D.num)+'</span><span>'+esc(D.short || D.title)+'</span></button>';
    sel += '<option value="'+i+'"'+(i===cur?" selected":"")+'>'+esc(D.num+"  "+(D.short||D.title))+'</option>';
  });
  $("nav").innerHTML = html; $("topicSel").innerHTML = sel;
  $("nav").querySelectorAll("button").forEach(b => b.onclick = () => select(+b.dataset.i));
  $("topicSel").onchange = e => select(+e.target.value);
}
function select(i, keepScroll){
  stop(); cur = i; tstep = 0; hist = []; mode = "tour";
  const D = TOPICS[i];
  buildNav();
  $("crumb").textContent = D.session + (D.sessionTitle ? " · " + D.sessionTitle : "") + " · Topic " + D.num;
  $("title").textContent = D.title; $("lead").innerHTML = D.lead || "";
  const page = D.kind === "page";
  $("simUI").hidden = page; $("pageUI").hidden = !page;
  if (page){ $("page").innerHTML = D.page; if (D.onShow) D.onShow(); }
  else { buildStatic(D); setMode("tour"); }
  try{ history.replaceState(null, "", "#"+D.id); }catch(e){}
  if (!keepScroll) window.scrollTo({top:0});
}

/* ---------- static parts of a simulation ---------- */
function buildStatic(D){
  const sched = D.kind === "sched";
  $("modeSeg").hidden = !sched || D.noFree;
  $("codeCard").hidden = !D.code;
  if (D.code){
    $("code").innerHTML = val(D, D.code).split("\n").map((l,i) => '<div class="ln" data-n="'+(i+1)+'"><span class="no">'+(i+1)+'</span><span class="mk"></span><span class="src">'+hl(l)+'</span></div>').join("");
    $("srclink").hidden = !D.file; if (D.file){ $("srclink").href = REPO_CODE + D.file; $("srclink").textContent = "Real C program: " + D.file; }
  }
  $("runBtns").innerHTML = sched ? D.names.map((n,i) => '<button type="button" data-r="'+i+'" style="background:'+BGS[i]+';border-color:'+COLORS[i]+';color:'+COLORS[i]+'">Run '+esc(n)+' &#9654;</button>').join("") : "";
  $("runBtns").querySelectorAll("button").forEach(b => b.onclick = () => runT(+b.dataset.r));
  $("optBox").innerHTML = (D.options||[]).map(op => '<label>'+esc(op.label)+' <select data-k="'+op.key+'">'+op.values.map(([v,t]) => '<option value="'+esc(v)+'"'+(String(optsFor(D)[op.key])===String(v)?" selected":"")+'>'+esc(t)+'</option>').join("")+'</select></label>').join("");
  $("optBox").querySelectorAll("select").forEach(s => s.onchange = () => { opts[D.id+"."+s.dataset.k] = s.value; stop(); tstep = 0; hist = []; buildStatic(D); render(); });
  buildPhases(D);
  const real = typeof D.real === "function" ? D.real(optsFor(D)) : D.real;
  $("realBox").hidden = !real;
  if (real) $("real").innerHTML = real.map(l => l.startsWith(PS) ? '<span class="pr">cosmos@vm</span>:<span class="pa">~/unit3/code</span>$ ' + esc(l.slice(PS.length)) : l.startsWith("#") ? '<span class="dim">'+esc(l)+'</span>' : /(lost [1-9]|DEADLOCK|NO PROGRESS|unsafe :|should be 5\)$|refused|out of order: [1-9])/.test(l) && !/count = 5 /.test(l) ? '<span class="bad">'+esc(l)+'</span>' : /(lost 0|balance = 100|got 150|in order, 0|0 out of order|finished|no deadlock)/.test(l) ? '<span class="good">'+esc(l)+'</span>' : esc(l)).join("\n");
  $("realTitle").textContent = D.realTitle || "Real run on the Ubuntu VM";
  $("propCard").hidden = !D.props;
  if (D.props){
    $("propTitle").textContent = D.propTitle || "Requirements check";
    const cls = {yes:"yes", no:"no", mid:"mid", "—":""}, txt = {yes:"Yes", no:"No", mid:"Partly", "—":"—"};
    $("props").innerHTML = "<table>" + D.props.map(([k,v,n]) => '<tr><td>'+esc(k)+'</td><td><span class="'+(cls[v] ?? "")+'">'+(txt[v] ?? esc(v))+'</span>'+(n ? '<br><span class="hint">'+esc(n)+'</span>' : "")+'</td></tr>').join("") + "</table>";
  }
  $("deepTitle").textContent = D.deepTitle || "In depth"; $("deep").innerHTML = D.deep || "";
  $("stageTitle").textContent = D.stageTitle || "What is happening";
  $("stageHint").textContent = D.stageHint || "";
  buildStage(D);
}
function buildPhases(D){
  const PH = val(D, D.phases);
  $("phaseCard").hidden = !PH;
  if (!PH) return;
  $("phases").innerHTML = PH.map((p,k) => '<li data-at="'+p.at+'"><span class="n">'+(k+1)+'</span><div><b>'+p.t+'</b><span class="d">'+p.d+'</span></div></li>').join("");
  $("phases").querySelectorAll("li").forEach(li => li.onclick = () => { if (mode !== "tour") setMode("tour"); stop(); tstep = Math.min(+li.dataset.at === 0 ? 0 : +li.dataset.at + 1, tourOf(D).length); render(); });
}
function phaseIndex(D, step){
  const PH = val(D, D.phases); if (!PH) return -1; let k = -1;
  PH.forEach((p,i) => { if ((p.at === 0 ? 0 : p.at + 1) <= step) k = i; });
  return k;
}

/* ---------- stage ---------- */
function buildStage(D){
  const st = $("stage");
  st.style.height = (D.stageH || 260) + "px";
  if (D.stage === "zones"){
    const Z = D.zones || [["rem","Remainder"],["entry","Entry: asking"],["cs","Critical section"],["exit","Exit"]];
    const w = 100 / Z.length;
    st.innerHTML = Z.map(([z,l],k) => '<div class="zone '+(z==="cs"?"cs":"")+'" id="z_'+z+'" style="left:'+(k*w)+'%;width:'+w+'%"><h3>'+esc(l)+'</h3></div>').join("") + tokensHTML(D);
  } else if (D.stage === "tokens"){
    st.innerHTML = D.stageBg(D, optsFor(D)) + tokensHTML(D);
  } else st.innerHTML = "";
}
function tokensHTML(D){ return D.names.map((n,i) => '<div class="tok" id="tok'+i+'" style="background:'+COLORS[i]+';left:50%;top:40px">'+esc(D.tokLabel ? D.tokLabel[i] : n)+'<span class="tk" style="color:'+COLORS[i]+'" hidden></span><span class="lb" hidden></span></div>').join(""); }
function zonePlace(D, st){
  const Z = D.zones || [["rem"],["entry"],["cs"],["exit"]]; const w = 100 / Z.length;
  const count = {};
  return D.names.map((n,i) => {
    let z = zoneOf(st, i); const fin = z === "done"; if (fin) z = D.doneZone || Z[0][0];
    const k = Z.findIndex(q => q[0] === z); count[z] = (count[z]||0);
    const y = 50 + count[z]*(D.tokGap || 74); count[z]++;
    const T = st.Th[i];
    const lb = D.tokNote ? D.tokNote(st, i, fin) : fin ? "done" : T.st === "sleep" ? "sleeping" : T.spinning ? "waiting" : z === "cs" ? "inside" : "";
    return {x: k*w + w/2, y, lb, badge: D.badge ? D.badge(st, i) : null};
  });
}
function drawStage(D, st){
  if (D.stage === "zones" || D.stage === "tokens"){
    const pos = D.stage === "zones" ? zonePlace(D, st) : D.place(st, D);
    pos.forEach((p,i) => {
      const t = $("tok"+i); if (!t) return;
      t.style.left = p.x + "%"; t.style.top = p.y + "px"; t.style.opacity = p.hide ? 0 : 1;
      t.classList.toggle("act", !!(st.last && st.last.me === i));
      t.classList.toggle("spin", !!(st.Th && st.Th[i].spinning && !isDone(st, i)));
      t.classList.toggle("sleep", !!(st.Th && st.Th[i].st === "sleep"));
      const lb = t.querySelector(".lb"); lb.textContent = p.lb || ""; lb.hidden = !p.lb;
      const tk = t.querySelector(".tk"); tk.hidden = p.badge == null || p.badge === ""; tk.textContent = p.badge ?? "";
    });
    if (D.stage === "zones"){ const csz = $("z_cs"); if (csz) csz.classList.toggle("bad", D.names.filter((n,i) => zoneOf(st,i) === "cs").length > 1); }
    if (D.overlay){ let ov = $("overlay"); if (!ov){ ov = document.createElement("div"); ov.id = "overlay"; $("stage").appendChild(ov); } ov.innerHTML = D.overlay(st, D); }
  } else {
    $("stage").innerHTML = D.stage(st, D, st.O);
  }
}

/* ---------- render ---------- */
function statusGeneric(D, st, i){
  const T = st.Th[i];
  if (isDone(st, i)) return ["done","var(--dead)"];
  if (T.st === "sleep") return ["sleeping","var(--warn)"];
  if (T.spinning) return ["waiting (spin)","var(--bad)"];
  const z = zoneOf(st, i);
  return ({rem:["remainder","var(--muted)"], entry:["entry section","var(--accent)"], cs:["in critical section","var(--ok)"], exit:["leaving","var(--accent)"]})[z] || ["ready","var(--muted)"];
}
function bannerGeneric(D, st){
  const n = D.names.length, all = [...Array(n).keys()];
  const inside = all.filter(i => zoneOf(st, i) === "cs");
  if (D.stage === "zones" && inside.length > 1) return ["bad", "Mutual exclusion violated: " + inside.map(i => D.names[i]).join(" and ") + " are both in the critical section."];
  if (all.every(i => isDone(st, i))) return ["ok", "Finished."];
  if (!all.some(i => runnable(st, i))) return ["bad", "Deadlock: no process can run."];
  return ["n", D.rule || "Watch the critical section: at most one process inside."];
}
function render(){
  const D = TOPICS[cur];
  const seq = tourOf(D);
  const h = mode === "tour" ? seq.slice(0, tstep) : hist;
  const st = replay(D, h);
  const sched = D.kind === "sched";
  if (D.code){
    document.querySelectorAll(".ln").forEach(e => { e.className = "ln"; e.querySelector(".mk").innerHTML = ""; });
    if (sched) st.Th.forEach((T, i) => {
      const ins = st.P[i][T.pc]; if (!ins) return;
      const el = document.querySelector('.ln[data-n="'+ins.ln+'"]'); if (!el) return;
      el.classList.add("on");
      el.querySelector(".mk").insertAdjacentHTML("beforeend", '<span style="background:'+COLORS[i]+'">'+esc(D.names[i])+(T.st === "sleep" ? "·z" : T.spinning ? "·…" : "")+'</span>');
    });
    if (st.last) st.last.ln.forEach(n => { const el = document.querySelector('.ln[data-n="'+n+'"]'); if (el) el.classList.add("ex"); });
  }
  drawStage(D, st);
  if (sched){
    $("threads").hidden = false;
    $("threads").innerHTML = D.names.map((n,i) => { const [lab, col] = (D.statusOf ? D.statusOf(st, i, D) : null) || statusGeneric(D, st, i);
      const vars = D.vars ? D.vars(st, i, D) : "";
      const th = D.think ? D.think(st, i, D) : "";
      return '<div class="th" style="background:'+BGS[i]+';border-color:'+COLORS[i]+'"><div class="nm" style="color:'+COLORS[i]+'">'+esc(n)+'<span class="st" style="color:'+col+';border:1px solid '+col+'">'+esc(lab)+'</span></div>'+(vars ? '<div class="vars">'+vars+'</div>' : "")+(th ? '<div class="think">"'+esc(th)+'"</div>' : "")+'</div>'; }).join("");
  } else { $("threads").hidden = !D.cards; if (D.cards) $("threads").innerHTML = D.cards(st, D); }
  const bn = D.check ? D.check(st, D) : sched ? bannerGeneric(D, st) : null;
  $("banner").hidden = !bn; if (bn){ $("banner").className = "banner " + bn[0]; $("banner").innerHTML = bn[1]; }
  /* phases */
  const PH = val(D, D.phases);
  const pk = mode === "tour" ? phaseIndex(D, tstep) : -1;
  if (PH) $("phases").querySelectorAll("li").forEach((li,k) => { li.className = k < pk ? "past" : k === pk ? "now" : ""; });
  /* explanation */
  const isEnd = mode === "tour" && tstep === seq.length;
  const note = mode === "tour" ? (D.notes && (D.notes[tstep] || (isEnd ? D.notes.end : null))) : (hist.length === 0 && D.notes ? D.notes[0] : null);
  const phTag = pk >= 0 ? '<span class="tag ph">Step '+(pk+1)+' of '+PH.length+': '+PH[pk].t+'</span>' : "";
  let ex;
  if (st.last){
    const i = st.last.me;
    const who = i >= 0 && D.names ? '<span class="tag" style="background:'+COLORS[i]+'">'+esc(D.names[i])+' · frame '+h.length+'</span>' : '<span class="tag" style="background:var(--ink);color:var(--bg)">frame '+h.length+'</span>';
    ex = phTag + who + '<p>'+st.last.msg+'</p>' + (note ? '<div class="note">'+note+'</div>' : "");
  } else ex = phTag + '<span class="tag" style="background:var(--ink);color:var(--bg)">start</span><p>'+(note || "Press <b>Next</b> or <b>Play</b> to start.")+'</p>' + (mode === "free" ? '<div class="note">You are the scheduler. Press a <b>Run</b> button to execute one step of that process, in any order. Try to break the rules. Keys <kbd>1</kbd>–<kbd>'+D.names.length+'</kbd> work too.</div>' : "");
  $("explain").innerHTML = ex;
  $("log").innerHTML = st.log.slice().reverse().slice(0, 60).map(e => '<li><span class="sn">'+e.idx+'</span>'+(e.me >= 0 && D.names ? '<span class="who" style="background:'+COLORS[e.me]+'">'+esc(D.names[e.me])+'</span>' : '<span class="who" style="background:var(--muted)">'+esc(e.label || "step")+'</span>')+'<span>'+e.msg+'</span></li>').join("") || '<li><span class="hint">Nothing has happened yet.</span></li>';
  if (mode === "tour"){
    $("count").textContent = "frame " + tstep + " / " + seq.length;
    $("progress").style.width = (seq.length ? 100*tstep/seq.length : 0) + "%";
    $("prev").disabled = tstep === 0; $("next").disabled = tstep === seq.length;
  } else {
    $("count").textContent = h.length + " step" + (h.length === 1 ? "" : "s") + " run";
    $("progress").style.width = "0";
    $("runBtns").querySelectorAll("button").forEach(b => { const i = +b.dataset.r; b.disabled = !runnable(st, i); b.title = st.Th[i].st === "sleep" ? D.names[i] + " is asleep and cannot run" : ""; });
    $("runR").disabled = !D.names.some((n,i) => runnable(st, i)); $("undo").disabled = !hist.length;
  }
}

/* ---------- controls ---------- */
function stop(){ clearInterval(timer); timer = null; $("play").innerHTML = "&#9654; Play"; }
function next(){ const D = TOPICS[cur]; if (tstep < tourOf(D).length){ tstep++; render(); } else stop(); }
function play(){ if (timer){ stop(); return; } if (tstep === tourOf(TOPICS[cur]).length){ tstep = 0; render(); } $("play").innerHTML = "&#10074;&#10074; Pause"; timer = setInterval(next, +$("speed").value); }
function setMode(m){ stop(); if (TOPICS[cur].kind !== "sched" || TOPICS[cur].noFree) m = "tour"; mode = m; $("mTour").setAttribute("aria-pressed", m === "tour"); $("mFree").setAttribute("aria-pressed", m === "free"); $("tourCtl").hidden = m !== "tour"; $("freeCtl").hidden = m !== "free"; render(); }
function runT(i){ const D = TOPICS[cur]; const st = replay(D, hist); if (runnable(st, i)){ hist.push(i); render(); } }
function initControls(){
  $("mTour").onclick = () => setMode("tour"); $("mFree").onclick = () => setMode("free");
  $("next").onclick = () => { stop(); next(); };
  $("prev").onclick = () => { stop(); if (tstep > 0){ tstep--; render(); } };
  $("reset").onclick = () => { stop(); tstep = 0; render(); };
  $("play").onclick = play;
  $("speed").onchange = () => { if (timer){ stop(); play(); } };
  $("runR").onclick = () => { const D = TOPICS[cur]; const st = replay(D, hist); const c = D.names.map((n,i) => i).filter(i => runnable(st, i)); if (c.length){ hist.push(c[Math.floor(Math.random()*c.length)]); render(); } };
  $("undo").onclick = () => { hist.pop(); render(); };
  $("freset").onclick = () => { hist = []; render(); };
  document.addEventListener("keydown", e => {
    const D = TOPICS[cur]; if (D.kind === "page" || e.target.closest("select,input,textarea")) return;
    if (mode === "tour"){
      if (e.key === "ArrowRight"){ stop(); next(); e.preventDefault(); }
      else if (e.key === "ArrowLeft"){ stop(); if (tstep > 0){ tstep--; render(); } e.preventDefault(); }
      else if (e.key === " " && !e.target.closest("button")){ play(); e.preventDefault(); }
      else if (e.key === "Home"){ stop(); tstep = 0; render(); }
    } else if (/^[1-9]$/.test(e.key) && +e.key <= D.names.length){ runT(+e.key - 1); }
    else if (e.key === "Backspace"){ hist.pop(); render(); e.preventDefault(); }
  });
  $("theme").onclick = () => { const r = document.documentElement; const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; r.dataset.theme = dark ? "light" : "dark"; try{ localStorage.setItem("u3-theme", r.dataset.theme); }catch(e){} };
  try{ const t = localStorage.getItem("u3-theme"); if (t) document.documentElement.dataset.theme = t; }catch(e){}
}
function boot(){
  initControls();
  const start = TOPICS.findIndex(d => d.id === location.hash.slice(1));
  select(start >= 0 ? start : 0, true);
}

/* ---------- small drawing helpers for html stages ---------- */
const H = {
  box: (x, y, w, h, title, inner, cls, style) => '<div class="box '+(cls||"")+'" style="left:'+x+'%;top:'+y+'px;width:'+w+'%;height:'+h+'px;'+(style||"")+'">'+(title ? '<b>'+title+'</b>' : "")+(inner||"")+'</div>',
  proc: (x, y, w, h, name, col, bg, inner, active) => '<div class="box'+(active ? " hot" : "")+'" style="left:'+x+'%;top:'+y+'px;width:'+w+'%;height:'+h+'px;background:'+bg+';border-color:'+col+'"><b style="color:'+col+'">'+name+'</b>'+(inner||"")+'</div>',
  kern: (h, label) => '<div class="kern" style="height:'+h+'px"><b>'+(label || "kernel")+'</b></div>',
  pill: (x, y, text, col, cls) => '<div class="'+(cls||"pop")+'" style="position:absolute;left:'+x+'%;top:'+y+'px;transform:translateX(-50%);background:'+col+';color:#fff;font:700 12px var(--mono);padding:3px 10px;border-radius:999px;white-space:nowrap;z-index:3">'+text+'</div>',
  txt: (x, y, text, style) => '<div style="position:absolute;left:'+x+'%;top:'+y+'px;font-size:12px;color:var(--muted);'+(style||"")+'">'+text+'</div>',
  cells: (arr, chg) => '<div class="mem">' + arr.map(([n,v,c]) => '<div class="cell'+(c ? " chg" : "")+'"><small>'+esc(n)+'</small><span>'+esc(v)+'</span></div>').join("") + '</div>',
  line: (x1, y1, x2, y2, col, dash) => '<svg style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible" preserveAspectRatio="none"><line x1="'+x1+'%" y1="'+y1+'" x2="'+x2+'%" y2="'+y2+'" stroke="'+(col||"var(--muted)")+'" stroke-width="2" '+(dash ? 'stroke-dasharray="6 5"' : "")+'/></svg>'
};
const REAL = typeof REAL_OUTPUTS === "object" ? REAL_OUTPUTS : {};
function realOut(key){ return REAL[key] ? REAL[key].replace(/\s+$/,"").split("\n") : ["# Real run pending: build.py fills this from real_outputs/"+key+".txt", "# (run code/run_all.sh on Linux to produce it)", PS+"./"+key]; }
function realPending(cmds){ return ["# VM run pending: these lines are filled in from the real program output"].concat(cmds.map(c => PS + c)); }
