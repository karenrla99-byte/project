(() => {
'use strict';
const DEBUG = /[?&]debug\b/.test(location.search);
const INSTA = 'https://www.instagram.com/special_eun_t';
const $ = id => document.getElementById(id);
const ITEM = Object.fromEntries(DATA.items.map(i => [i.id, i]));
const JOB = Object.fromEntries(DATA.jobs.map(j => [j.id, j]));

/* ---------- 설정 (기기에 저장) ---------- */
const defaults = { speech:true, sfx:true, mode:'drag', hint:true, level:'easy' };
let cfg = { ...defaults };
try { Object.assign(cfg, JSON.parse(localStorage.getItem('dongne-cfg') || '{}')); } catch(e){}
const saveCfg = () => { try { localStorage.setItem('dongne-cfg', JSON.stringify(cfg)); } catch(e){} };

/* ---------- 상태 (완성 기록은 접속 중에만 유지) ---------- */
const done = new Set();
let finaleShown = false;
let cur = null;          // 현재 직업
let placed = new Set();  // 입힌 물건 id
let wrong = 0;           // 연속 오답 수
let locked = false;

/* ---------- 소리 ---------- */
let actx = null;
function tone(freq, t0, dur, type='sine', vol=.18){
  if(!cfg.sfx) return;
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    const t = actx.currentTime + t0;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t+.02); g.gain.exponentialRampToValueAtTime(.001, t+dur);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+dur+.05);
  }catch(e){}
}
const sfx = {
  tap:  () => tone(520, 0, .12, 'triangle'),
  good: () => { tone(660,0,.18); tone(880,.1,.25); },
  cheer:() => [523,659,784,1047,784,1047].forEach((f,i)=>tone(f,i*.13,.3,'triangle',.2))
};
function speak(text, force){
  if(!force && !cfg.speech) return;
  try{
    if(!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; u.rate = .85; u.pitch = 1.1;
    speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------- 화면 전환 ---------- */
function show(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  // 인스타 링크는 첫 화면에서만 작동
  const a = $('insta');
  if(id === 's1'){ a.href = INSTA; } else { a.removeAttribute('href'); }
}

/* ---------- S1 동네 ---------- */
function buildTown(){
  const town = $('town');
  town.querySelectorAll('.deco,.hot').forEach(n => n.remove());
  DATA.townDecor.forEach(d => {
    const e = document.createElement('div');
    e.className = 'deco'; e.textContent = d.emoji;
    e.style.cssText = `left:${d.x}%;top:${d.y}%;--sz:${d.size}`;
    town.appendChild(e);
  });
  DATA.jobs.forEach(j => {
    const h = j.hotspot;
    const b = document.createElement('button');
    b.className = 'hot' + (h.base ? '' : ' solo');
    b.style.cssText = `left:${h.x}%;top:${h.y}%;--sz:${h.size}`;
    b.setAttribute('aria-label', j.name);
    b.innerHTML = (h.base ? `<span class="base">${h.base}</span><span class="fg">${h.emoji}</span>` : `<span class="fg">${h.emoji}</span>`) +
                  (done.has(j.id) ? '<span class="star">⭐</span>' : '');
    b.addEventListener('click', () => { sfx.tap(); openJob(j.id); });
    town.appendChild(b);
  });
  $('townCount').textContent = `⭐ ${done.size} / ${DATA.jobs.length}`;
}
function goTown(){
  buildTown(); show('s1');
  if(done.size === DATA.jobs.length && !finaleShown){
    finaleShown = true;
    setTimeout(() => { $('finale').classList.add('on'); sfx.cheer(); confetti(); speak('동네 사람들을 모두 만났어요!'); }, 400);
  }
}

/* ---------- S2 소개 ---------- */
function openJob(id){
  cur = JOB[id];
  $('s2Icon').textContent = cur.icon;
  $('s2Name').textContent = cur.name;
  $('s2Intro').textContent = cur.intro;
  $('s2Place').textContent = `📍 일하는 곳: ${cur.place}`;
  show('s2');
  speak(`${cur.name}. ${cur.intro}`);
}

/* ---------- 인물 + 물건 그리기 ---------- */
function slotPos(entry){
  const s = DATA.slots[entry.slot], o = entry.offset || {};
  return { x: s.x + (o.x||0), y: s.y + (o.y||0), scale: entry.scale || s.scale };
}
function placedEl(entry){
  const it = ITEM[entry.id], p = slotPos(entry);
  const e = document.createElement('div');
  e.className = 'placed'; e.textContent = it.emoji; e.dataset.id = entry.id;
  e.style.cssText = `left:${p.x}%;top:${p.y}%;font-size:${p.scale*30}cqw`;
  return e;
}
function figure(stage, withBadge){
  stage.innerHTML = '<div class="shadow"></div><div class="sil-body"></div><div class="sil-head"></div>' +
    (withBadge ? `<div class="badge">${cur.icon}</div>` : '');
  if(DEBUG){
    Object.entries(DATA.slots).forEach(([n,s]) => {
      const d = document.createElement('div');
      d.className = 'dbg'; d.style.cssText = `left:${s.x}%;top:${s.y}%`; d.textContent = n;
      stage.appendChild(d);
    });
  }
}

/* ---------- S3 게임 ---------- */
function startGame(){
  placed = new Set(); wrong = 0; locked = false;
  $('s3Title').textContent = `${cur.name}에게 어울리는 물건을 찾아요`;
  const stage = $('s3Stage');
  figure(stage, true);
  if(cfg.hint){
    cur.items.forEach(e => {
      const p = slotPos(e), h = document.createElement('div');
      h.className = 'slot-hint'; h.dataset.slot = e.id;
      const w = p.scale * 30;
      h.style.cssText = `left:${p.x}%;top:${p.y}%;width:${w}cqw;height:${w}cqw`;
      stage.appendChild(h);
    });
  }
  buildTray(); updateProgress(); show('s3');
  speak('어울리는 물건을 찾아 보세요');
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function buildTray(){
  const own = cur.items.map(e => e.id);
  const pool = DATA.items.filter(i => i.usableAsDistractor && !own.includes(i.id)).map(i => i.id);
  const nWrong = cfg.level === 'easy' ? 3 : 6;
  const ids = shuffle([...own, ...shuffle(pool).slice(0, nWrong)]);
  const tray = $('tray'); tray.innerHTML = '';
  ids.forEach(id => {
    const it = ITEM[id], el = document.createElement('div');
    el.className = 'ti'; el.textContent = it.emoji; el.dataset.id = id; el.setAttribute('aria-label', it.name);
    el.addEventListener('pointerdown', ev => onDown(ev, el));
    tray.appendChild(el);
  });
}
function updateProgress(){
  const n = placed.size, t = cur.items.length;
  $('s3Prog').innerHTML = `${t}개 중 ${n}개 입혔어요 <span class="dots emo">${'⭐'.repeat(n)}${'▫️'.repeat(t-n)}</span>`;
}
function sparkle(stage, x, y){
  for(let i=0;i<7;i++){
    const s = document.createElement('div');
    s.className = 'spark'; s.textContent = i%2 ? '✨' : '⭐';
    s.style.cssText = `left:${x}%;top:${y}%;font-size:6cqw;--dx:${(Math.random()-.5)*30}cqw;--dy:${(Math.random()-.5)*30}cqw`;
    stage.appendChild(s); setTimeout(() => s.remove(), 1000);
  }
}
function tryItem(id, el){
  if(locked || placed.has(id)) return;
  const entry = cur.items.find(e => e.id === id);
  if(entry){
    placed.add(id); wrong = 0;
    const stage = $('s3Stage');
    const h = stage.querySelector(`.slot-hint[data-slot="${id}"]`); if(h) h.remove();
    const pe = placedEl(entry); pe.classList.add('pop'); stage.appendChild(pe);
    const p = slotPos(entry); sparkle(stage, p.x, p.y);
    el.remove();
    tray_clearHint();
    sfx.good(); speak(ITEM[id].name);
    updateProgress();
    if(placed.size === cur.items.length){
      locked = true;
      setTimeout(finish, 1700);
    }
  } else {
    wrong++;
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    if(cfg.hint && wrong >= 2){
      document.querySelectorAll('#tray .ti').forEach(t => {
        if(cur.items.some(e => e.id === t.dataset.id)) t.classList.add('hint');
      });
    }
  }
}
function tray_clearHint(){ document.querySelectorAll('#tray .ti.hint').forEach(t => t.classList.remove('hint')); }

/* ---------- 끌기 / 누르기 ---------- */
function onDown(ev, el){
  if(locked) return;
  ev.preventDefault();
  const id = el.dataset.id;
  if(cfg.mode === 'tap'){ sfx.tap(); tryItem(id, el); return; }
  const sx = ev.clientX, sy = ev.clientY; let moved = false;
  const ghost = document.createElement('div');
  ghost.className = 'ghost'; ghost.textContent = ITEM[id].emoji;
  const place = e => { ghost.style.left = e.clientX+'px'; ghost.style.top = e.clientY+'px'; };
  place(ev);
  try{ el.setPointerCapture(ev.pointerId); }catch(e){}
  const move = e => {
    if(!moved && Math.hypot(e.clientX-sx, e.clientY-sy) > 10){ moved = true; document.body.appendChild(ghost); el.classList.add('drag-src'); }
    if(moved) place(e);
  };
  const up = e => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    ghost.remove(); el.classList.remove('drag-src');
    if(!moved){ sfx.tap(); speak(ITEM[id].name); return; }   // 살짝 누르면 이름만 읽어줌
    const r = $('s3Stage').getBoundingClientRect(), m = 20;
    if(e.type !== 'pointercancel' && e.clientX > r.left-m && e.clientX < r.right+m && e.clientY > r.top-m && e.clientY < r.bottom+m){
      tryItem(id, el);
    }
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}

/* ---------- 그림 합성 (색 그림 / 색칠 도안) ---------- */
const CW = 1100, CH = 1200, SX = 150, SY = 150, SW = 800, SH = 880;
const DECOR_SPOTS = [[100,90,120],[1000,90,120],[550,70,100],[90,400,100],[1020,320,100],[70,640,110],[1030,600,100],[80,1110,120],[1020,1110,120],[550,1130,100]];
const GENERIC_DECOR = ['☀️','☁️','🌷','⭐','🌳','☁️','🌼','⭐'];
const mk = () => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return c; };
function glyph(ctx, emoji, x, y, size){
  ctx.font = `${size}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji, x, y);
}
function emojiLayer(ctx, job){
  // 인물 주변 꾸밈
  const dec = [...(job.decor||[]), ...GENERIC_DECOR];
  DECOR_SPOTS.forEach((d,i) => glyph(ctx, dec[i % dec.length], d[0], d[1], d[2]));
  // 물건
  job.items.forEach(e => {
    const p = slotPos(e);
    glyph(ctx, ITEM[e.id].emoji, SX + p.x/100*SW, SY + p.y/100*SH, p.scale*.30*SW);
  });
  glyph(ctx, job.icon, SX + .095*SW, SY + .095*SW, .12*SW);
}
function silhouette(ctx, color, w){
  ctx.fillStyle = '#fff'; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round';
  const bx = SX + .24*SW, bw = .52*SW, by = SY + .40*SH, bh = .60*SH, r = .30*bw;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, [r, r, 0, 0]); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(SX + .5*SW, SY + .22*SH, .125*SW, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(SX + .095*SW, SY + .095*SW, .095*SW, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(SX + .5*SW, SY + SH + 10, .31*SW, 18, 0, 0, Math.PI*2); ctx.stroke();
}
function toLineArt(src){
  const w = CW, h = CH, d = src.getContext('2d').getImageData(0,0,w,h).data;
  const q = new Float32Array(w*h);
  for(let i=0;i<w*h;i++){ const L = .299*d[i*4] + .587*d[i*4+1] + .114*d[i*4+2]; q[i] = Math.round(L/45); }
  const edge = new Uint8Array(w*h);
  for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
    const i = y*w+x;
    const gx = -q[i-w-1] - 2*q[i-1] - q[i+w-1] + q[i-w+1] + 2*q[i+1] + q[i+w+1];
    const gy = -q[i-w-1] - 2*q[i-w] - q[i-w+1] + q[i+w-1] + 2*q[i+w] + q[i+w+1];
    if(Math.abs(gx) + Math.abs(gy) >= 3) edge[i] = 1;
  }
  const out = mk(), oc = out.getContext('2d'), od = oc.createImageData(w,h);
  for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
    const i = y*w+x;
    const on = edge[i] || edge[i-1] || edge[i+1] || edge[i-w] || edge[i+w];   // 선을 살짝 굵게
    const v = on ? 20 : 255;
    od.data[i*4] = od.data[i*4+1] = od.data[i*4+2] = v; od.data[i*4+3] = 255;
  }
  oc.putImageData(od, 0, 0);
  return out;
}
async function compose(job, lineArt){
  try{ await document.fonts.load('100px "Noto Color Emoji"', '🧯'); }catch(e){}
  const c = mk(), ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,CW,CH);
  if(!lineArt){
    ctx.fillStyle = '#e9f6ff'; ctx.fillRect(0,0,CW,CH*.9);
    silhouette(ctx, '#8e9aa6', 8);
    emojiLayer(ctx, job);
    return c;
  }
  silhouette(ctx, '#000', 7);
  const layer = mk(), lc = layer.getContext('2d');
  lc.fillStyle = '#fff'; lc.fillRect(0,0,CW,CH);
  emojiLayer(lc, job);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(toLineArt(layer), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/* ---------- S4 완성 ---------- */
async function finish(){
  done.add(cur.id);
  $('s4Title').textContent = `${cur.name} 완성!`;
  const c = await compose(cur, false);
  $('s4Img').src = c.toDataURL('image/png');
  show('s4');
  sfx.cheer(); confetti();
  speak(`${cur.name} 완성! 잘했어요!`);
}
async function printSheet(){
  const c = await compose(cur, true);
  $('psTitle').textContent = `${cur.name} 색칠하기`;
  const rows = $('psRows'); rows.innerHTML = '';
  [[cur.name,''], ...cur.items.map(e => [ITEM[e.id].name,' sm'])].forEach(([t,cls]) => {
    const r = document.createElement('div'); r.className = 'ps-row' + cls;
    r.innerHTML = `<span>${t}</span><span>${t}</span><span>${t}</span>`;
    rows.appendChild(r);
  });
  const img = $('psImg');
  await new Promise(res => { img.onload = res; img.src = c.toDataURL('image/png'); });
  window.print();
}

function confetti(){
  const set = ['✨','⭐','🎉','🎈','🌟'];
  for(let i=0;i<28;i++){
    const f = document.createElement('div');
    f.className = 'fall'; f.textContent = set[i % set.length];
    f.style.cssText = `left:${Math.random()*100}vw;font-size:${24+Math.random()*28}px;animation-duration:${2.2+Math.random()*2}s;animation-delay:${Math.random()*.8}s`;
    document.body.appendChild(f); setTimeout(() => f.remove(), 5500);
  }
}

/* ---------- 설정 UI ---------- */
function syncSettings(){
  document.querySelectorAll('#settings .seg').forEach(seg => {
    const key = seg.dataset.key;
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('sel', String(cfg[key]) === b.dataset.v));
  });
}
document.querySelectorAll('#settings .seg button').forEach(b => b.addEventListener('click', () => {
  const key = b.parentElement.dataset.key, v = b.dataset.v;
  cfg[key] = (v === 'true') ? true : (v === 'false') ? false : v;
  saveCfg(); syncSettings(); sfx.tap();
}));
$('btnSet').addEventListener('click', () => { syncSettings(); $('settings').classList.add('on'); });
$('setClose').addEventListener('click', () => $('settings').classList.remove('on'));
$('finaleClose').addEventListener('click', () => $('finale').classList.remove('on'));

/* ---------- 전체화면 ---------- */
const root = document.documentElement;
const canFull = !!(root.requestFullscreen || root.webkitRequestFullscreen);
if(!canFull) $('btnFull').style.display = 'none';
$('btnFull').addEventListener('click', () => {
  const on = document.fullscreenElement || document.webkitFullscreenElement;
  try{
    if(on){ (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else { (root.requestFullscreen || root.webkitRequestFullscreen).call(root); }
  }catch(e){}
});

/* ---------- 버튼 연결 ---------- */
$('s2Speak').addEventListener('click', () => speak(`${cur.name}. ${cur.intro}`, true));
$('s2Go').addEventListener('click', () => { sfx.tap(); startGame(); });
$('s2Home').addEventListener('click', () => { sfx.tap(); goTown(); });
$('s3Back').addEventListener('click', () => { sfx.tap(); goTown(); });
$('s4Print').addEventListener('click', () => { sfx.tap(); printSheet(); });
$('s4Home').addEventListener('click', () => { sfx.tap(); goTown(); });
$('s4Again').addEventListener('click', () => { sfx.tap(); startGame(); });
document.addEventListener('contextmenu', e => e.preventDefault());

goTown();
})();
