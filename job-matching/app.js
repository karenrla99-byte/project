(() => {
'use strict';
const DEBUG = /[?&]debug\b/.test(location.search);
const INSTA = 'https://www.instagram.com/special_eun_t';
const $ = id => document.getElementById(id);
const ITEM = Object.fromEntries(DATA.items.map(i => [i.id, i]));
const JOB = Object.fromEntries(DATA.jobs.map(j => [j.id, j]));

/* ---------- 인물 그림: images/person.png 가 있으면 사용, 없으면 코드로 그린 임시 모양 ---------- */
const PERSON = {};   // 직업 id -> 불러온 인물 그림 경로 (data.js의 person)
DATA.jobs.forEach(j => { if(j.person){ const pr = new Image(); pr.onload = () => { PERSON[j.id] = j.person; }; pr.src = j.person; } });

/* ---------- 설정 (기기에 저장) ---------- */
const defaults = { speech:true, sfx:true, mode:'drag', hint:true, level:'easy', lang:'ko' };
let cfg = { ...defaults };
try { Object.assign(cfg, JSON.parse(localStorage.getItem('dongne-cfg') || '{}')); } catch(e){}
const saveCfg = () => { try { localStorage.setItem('dongne-cfg', JSON.stringify(cfg)); } catch(e){} };
{ const q = /[?&]lang=(ko|en)/.exec(location.search); if(q) cfg.lang = q[1]; }

/* ---------- 언어 (ko / en) ---------- */
const STR = {
  ko:{ townTitle:'우리 동네 사람들을 만나요', s2Go:'🔎 어울리는 물건 찾기', home:'🏘️ 동네로', home2:'← 동네로', print:'🖨️ 색칠 도안 인쇄',
    back:'🏘️ 동네로 돌아가기', again:'🔁 다시 하기', psName:'이름: ______________', psDate:'날짜: ____월 ____일',
    psL1:'① 색칠해 보세요', psL2:'② 따라 써 보세요', setTitle:'⚙️ 설정', lblSpeech:'읽어주기', lblSfx:'효과음', lblMode:'조작 방식',
    lblHint:'힌트', lblLevel:'물건 수', lblLang:'언어', on:'켜기', off:'끄기', drag:'끌어서 놓기', tap:'누르기',
    easy:'쉬움 (6개)', normal:'보통 (9개)', close:'닫기', finaleTitle:'동네 사람들을 모두 만났어요!', finaleClose:'멋져요! 👏',
    title:'동네 사람들의 직업에 어울리는 물건 찾기',
    place:p=>`📍 일하는 곳: ${p}`, s3Title:n=>`${n}에게 어울리는 물건을 찾아요`, s3Say:'어울리는 물건을 찾아 보세요',
    prog:(n,t)=>`${t}개 중 ${n}개 입혔어요`, done:n=>`${n} 완성!`, doneSay:n=>`${n} 완성! 잘했어요!`, psTitle:n=>`${n} 색칠하기`,
    finaleSay:'동네 사람들을 모두 만났어요!', speechLang:'ko-KR' },
  en:{ townTitle:'Meet the people in our town', s2Go:'🔎 Find the matching items', home:'🏘️ Town', home2:'← Town', print:'🖨️ Print coloring page',
    back:'🏘️ Back to town', again:'🔁 Play again', psName:'Name: ______________', psDate:'Date: ____ / ____ / ____',
    psL1:'① Color the picture', psL2:'② Trace the words', setTitle:'⚙️ Settings', lblSpeech:'Read aloud', lblSfx:'Sound effects', lblMode:'Controls',
    lblHint:'Hints', lblLevel:'Items', lblLang:'Language', on:'On', off:'Off', drag:'Drag', tap:'Tap',
    easy:'Easy (6 items)', normal:'Normal (9 items)', close:'Close', finaleTitle:'You met everyone in town!', finaleClose:'Great job! 👏',
    title:'Find the Items for Each Job',
    place:p=>`📍 Works at: ${p}`, s3Title:n=>`What does the ${n} use?`, s3Say:'Find the matching items',
    prog:(n,t)=>`${n} of ${t} items found`, done:n=>`${n} complete!`, doneSay:n=>`${n} complete! Great job!`, psTitle:n=>`Color the ${n}`,
    finaleSay:'You met everyone in town!', speechLang:'en-US' }
};
const S = () => STR[cfg.lang] || STR.en;
// 직업/물건 이름을 현재 언어로 (data.js의 en 항목)
const loc = o => (cfg.lang === 'en' && o.en) ? { ...o, ...o.en } : o;
function applyLang(){
  document.documentElement.lang = cfg.lang;
  document.title = S().title;
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = S()[e.dataset.i18n]; });
}

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
    u.lang = S().speechLang; u.rate = .85; u.pitch = 1.1;
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
    b.setAttribute('aria-label', loc(j).name);
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
    setTimeout(() => { $('finale').classList.add('on'); sfx.cheer(); confetti(); speak(S().finaleSay); }, 400);
  }
}

/* ---------- S2 소개 ---------- */
function showIntro(){
  const c = loc(cur);
  $('s2Icon').textContent = cur.icon;
  $('s2Name').textContent = c.name;
  $('s2Intro').textContent = c.intro;
  $('s2Place').textContent = S().place(c.place);
}
function openJob(id){
  cur = JOB[id];
  showIntro();
  show('s2');
  speak(`${loc(cur).name}. ${loc(cur).intro}`);
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
  stage.innerHTML = '<div class="shadow"></div>' +
    (PERSON[cur.id] ? `<img class="person" src="${PERSON[cur.id]}" alt="">` : '<div class="sil-body"></div><div class="sil-head"></div>') +
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
  $('s3Title').textContent = S().s3Title(loc(cur).name);
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
  speak(S().s3Say);
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
  $('s3Prog').innerHTML = `${S().prog(n,t)} <span class="dots emo">${'⭐'.repeat(n)}${'▫️'.repeat(t-n)}</span>`;
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
    sfx.good(); speak(loc(ITEM[id]).name);
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
    if(!moved){ sfx.tap(); speak(loc(ITEM[id]).name); return; }   // 살짝 누르면 이름만 읽어줌
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
}
function frame(ctx, color, w){   // 직업 배지 테두리 + 바닥 그림자 선
  ctx.strokeStyle = color; ctx.lineWidth = w;
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
    od.data[i*4] = od.data[i*4+1] = od.data[i*4+2] = 20; od.data[i*4+3] = on ? 255 : 0;   // 선만 남기고 나머지는 투명
  }
  oc.putImageData(od, 0, 0);
  return out;
}
// 그림 = 아래층(인물) + 위층(물건·꾸밈). 파일 열기(file://)에서도 동작하도록 인물 이미지는 캔버스에 합치지 않음
async function compose(job, lineArt){
  try{ await document.fonts.load('100px "Noto Color Emoji"', '🧯'); }catch(e){}
  let base = PERSON[job.id], full = false;
  if(!base){
    const bc = mk(); silhouette(bc.getContext('2d'), lineArt ? '#000' : '#8e9aa6', lineArt ? 7 : 8);
    base = bc.toDataURL('image/png'); full = true;
  }
  const layer = mk(), lc = layer.getContext('2d');
  if(lineArt){
    lc.fillStyle = '#fff'; lc.fillRect(0,0,CW,CH);
    emojiLayer(lc, job);
    const out = toLineArt(layer);
    frame(out.getContext('2d'), '#000', 6);
    return { base, full, layer: out.toDataURL('image/png') };
  }
  emojiLayer(lc, job); frame(lc, '#8e9aa6', 8);
  return { base, full, layer: layer.toDataURL('image/png') };
}
async function renderPic(el, pic, lineArt){
  el.classList.toggle('line', !!lineArt);
  const b = pic.full ? 'left:0;top:0;width:100%;height:100%'
    : `left:${SX/CW*100}%;top:${SY/CH*100}%;width:${SW/CW*100}%;height:${SH/CH*100}%`;
  el.innerHTML = `<img src="${pic.base}" style="${b}" alt=""><img src="${pic.layer}" style="left:0;top:0;width:100%;height:100%" alt="">`;
  await Promise.all([...el.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
}

/* ---------- S4 완성 ---------- */
async function finish(){
  done.add(cur.id);
  $('s4Title').textContent = S().done(loc(cur).name);
  await renderPic($('s4Img'), await compose(cur, false), false);
  show('s4');
  sfx.cheer(); confetti();
  speak(S().doneSay(loc(cur).name));
}
async function printSheet(){
  const pic = await compose(cur, true);
  $('psTitle').textContent = S().psTitle(loc(cur).name);
  const rows = $('psRows'); rows.innerHTML = '';
  [[loc(cur).name,''], ...cur.items.map(e => [loc(ITEM[e.id]).name,' sm'])].forEach(([t,cls]) => {
    const r = document.createElement('div'); r.className = 'ps-row' + cls;
    r.innerHTML = `<span>${t}</span>`.repeat(t.length > 10 ? 2 : 3);
    rows.appendChild(r);
  });
  await renderPic($('psPic'), pic, true);
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
  if(key === 'lang') refreshLang();
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
$('s2Speak').addEventListener('click', () => speak(`${loc(cur).name}. ${loc(cur).intro}`, true));
$('s2Go').addEventListener('click', () => { sfx.tap(); startGame(); });
$('s2Home').addEventListener('click', () => { sfx.tap(); goTown(); });
$('s3Back').addEventListener('click', () => { sfx.tap(); goTown(); });
$('s4Print').addEventListener('click', () => { sfx.tap(); printSheet(); });
$('s4Home').addEventListener('click', () => { sfx.tap(); goTown(); });
$('s4Again').addEventListener('click', () => { sfx.tap(); startGame(); });
document.addEventListener('contextmenu', e => e.preventDefault());

function refreshLang(){
  applyLang();
  const on = document.querySelector('.screen.on').id;
  if(on === 's2') showIntro();
  if(on === 's3'){ $('s3Title').textContent = S().s3Title(loc(cur).name); updateProgress(); }
  if(on === 's4') $('s4Title').textContent = S().done(loc(cur).name);
}
applyLang();
goTown();
})();
