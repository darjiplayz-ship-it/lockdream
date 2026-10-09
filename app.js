'use strict';
const KEY='still.v1',ID=/^\d{4}-\d{2}-\d{2}$/;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const dk=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=k=>{const[a,b,c]=k.split('-').map(Number);return new Date(a,b-1,c)};
const addDays=(k,n)=>{const d=pd(k);d.setDate(d.getDate()+n);return dk(d)};
const today=()=>dk(new Date());
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=t=>{if(!t)return'';const[h,m]=t.split(':').map(Number);return((h+11)%12+1)+':'+pad(m)+' '+(h<12?'AM':'PM')};
const uid=()=>(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));
const CHECK='<svg viewBox="0 0 16 16" fill="none" stroke="#24282A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';

function valid(d){
  if(!d||!Array.isArray(d.habits)||!d.done||typeof d.done!=='object'||Array.isArray(d.done))return null;
  const habits=d.habits.filter(h=>h&&typeof h.id==='string'&&typeof h.name==='string'&&ID.test(h.createdAt)&&(!h.archivedAt||ID.test(h.archivedAt))&&(!h.time||/^\d{2}:\d{2}$/.test(h.time)))
    .map(h=>({id:h.id,name:h.name,time:h.time||'',createdAt:h.createdAt,archivedAt:h.archivedAt||null}));
  const done={};
  for(const k in d.done)if(ID.test(k)&&Array.isArray(d.done[k]))done[k]=d.done[k].filter(x=>typeof x==='string');
  return{habits,done};
}
function load(){
  const raw=localStorage.getItem(KEY);
  if(raw){try{const v=valid(JSON.parse(raw));if(v)return v}catch(e){}
    try{localStorage.setItem(KEY+'.corrupt',raw)}catch(e){}}
  return{habits:[],done:{}};
}
let S=load(),filter='week',editId=null,shown=today();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){alert('Could not save. Browser storage may be full or blocked.')}};

const applies=(h,k)=>h.createdAt<=k&&(!h.archivedAt||k<h.archivedAt);
function stat(k){const ap=S.habits.filter(h=>applies(h,k)),d=S.done[k]||[];return{ap,n:ap.length,c:ap.filter(h=>d.includes(h.id)).length}}
const pct=s=>Math.round(s.c/s.n*100);

function renderToday(){
  const t=today(),d=pd(t),s=stat(t),done=S.done[t]||[];
  $('#date').textContent=d.toLocaleDateString(undefined,{weekday:'long'})+', '+d.getDate()+' '+d.toLocaleDateString(undefined,{month:'long'});
  $('#tcount').textContent=s.n?s.c+' of '+s.n+' completed':'No habits yet';
  $('#tpct').textContent=s.n?pct(s)+'%':'';
  $('#tbar').style.width=(s.n?pct(s):0)+'%';
  $('#tmsg').textContent=!s.n?'Start with one small habit.':s.c===s.n?'Everything done. Well done.':'';
  const g={Morning:[],Afternoon:[],Evening:[],Anytime:[]};
  s.ap.slice().sort((a,b)=>(a.time||'99').localeCompare(b.time||'99')||a.name.localeCompare(b.name)).forEach(h=>{
    const hr=h.time?+h.time.slice(0,2):-1;
    g[hr<0?'Anytime':hr<12?'Morning':hr<17?'Afternoon':'Evening'].push(h)});
  $('#list').innerHTML=Object.entries(g).filter(([,a])=>a.length).map(([n,a])=>
    `<p class="grp">${n}</p>`+a.map(h=>{const on=done.includes(h.id);
    return `<div class="item${on?' done':''}"><button class="row" data-id="${h.id}" role="checkbox" aria-checked="${on}"><span class="box">${CHECK}</span><span><span class="nm">${esc(h.name)}</span>${h.time?`<span class="tm">${fmt(h.time)}</span>`:''}</span></button><button class="more" data-edit="${h.id}" aria-label="Edit ${esc(h.name)}">⋯</button></div>`}).join('')).join('');
}
function toggle(id){
  const t=today(),a=S.done[t]||[],i=a.indexOf(id);
  i<0?a.push(id):a.splice(i,1);
  a.length?S.done[t]=a:delete S.done[t];
  save();render();
}
function days(f){
  const t=today();
  if(f==='today')return[t];
  if(f==='week')return Array.from({length:7},(_,i)=>addDays(t,i-6));
  const min=S.habits.map(h=>h.createdAt).sort()[0];if(!min)return[t];
  const o=[];for(let k=min;k<=t;k=addDays(k,1))o.push(k);return o;
}
const stat3=(a,b,c)=>`<div><b>${a}</b><span>${b}</span></div>`;
function renderProgress(){
  const t=today(),s=stat(t);
  $('#ptoday').innerHTML=s.n?stat3(s.c,'Completed')+stat3(s.n-s.c,'Remaining')+stat3(pct(s)+'%','Done'):'<span>No habits yet.</span>';
  $('#week').innerHTML=days('week').map(k=>{const s=stat(k),d=pd(k);
    return `<div class="day"><div>${d.toLocaleDateString(undefined,{weekday:'short'})}<small>${d.getDate()} ${d.toLocaleDateString(undefined,{month:'short'})}</small></div><div><div class="bar"><i style="width:${s.n?pct(s):0}%"></i></div><small style="color:var(--muted)">${s.n?s.c+' of '+s.n:'No habits'}</small></div><em>${s.n?pct(s)+'%':'—'}</em></div>`}).join('');
  let c=0,m=0,r=0;
  days(filter).forEach(k=>{const s=stat(k);c+=s.c;k===t?r+=s.n-s.c:m+=s.n-s.c});
  $('#sum').innerHTML=stat3(c,'Completed')+stat3(m,'Missed')+(filter!=='all'||r?stat3(r,'Remaining today'):'');
  $$('[data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f===filter));
}
function render(){shown=today();renderToday();renderProgress()}

function tab(n){
  $$('.screen').forEach(s=>s.hidden=s.id!==n);
  $$('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===n));
  scrollTo(0,0);
}
const dlg=$('#dlg');
function openForm(id){
  editId=id;const h=S.habits.find(x=>x.id===id);
  $('#dtitle').textContent=h?'Edit habit':'Add habit';
  $('#nm').value=h?h.name:'';$('#tm').value=h?h.time:'';
  $('#err').textContent='';$('#del').hidden=!h;
  dlg.showModal();$('#nm').focus();
}
$('#f').addEventListener('submit',e=>{
  e.preventDefault();
  const name=$('#nm').value.trim();
  if(!name){$('#err').textContent='Enter a habit name.';return}
  const btn=$('#save');if(btn.disabled)return;btn.disabled=true;
  const time=$('#tm').value||'',h=S.habits.find(x=>x.id===editId);
  if(h){h.name=name;h.time=time}
  else S.habits.push({id:uid(),name,time,createdAt:today(),archivedAt:null});
  save();dlg.close();render();btn.disabled=false;
});
$('#cancel').onclick=()=>dlg.close();
$('#del').onclick=()=>{
  const h=S.habits.find(x=>x.id===editId);
  if(h&&confirm('Delete "'+h.name+'"? Past progress is kept; it will stop appearing from today.')){h.archivedAt=today();save();dlg.close();render()}
};
$('#add').onclick=()=>openForm(null);
$('#list').addEventListener('click',e=>{
  const r=e.target.closest('[data-id]'),m=e.target.closest('[data-edit]');
  if(r)toggle(r.dataset.id);else if(m)openForm(m.dataset.edit);
});
$$('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
$$('[data-f]').forEach(b=>b.onclick=()=>{filter=b.dataset.f;renderProgress()});

$('#exp').onclick=()=>{
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));
  a.download='still-backup-'+today()+'.json';document.body.append(a);a.click();a.remove();
};
$('#imp').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const v=valid(JSON.parse(await f.text()));if(!v)throw 0;
    if(confirm('Replace current data with this backup ('+v.habits.length+' habits)?')){S=v;save();render()}}
  catch(x){alert('That file is not a valid STILL backup.')}
};

let deferred=null;
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
function hint(){$('#install').hidden=!deferred;$('#hint').hidden=!!deferred||standalone}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;hint()});
addEventListener('appinstalled',()=>{deferred=null;hint()});
$('#install').onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;hint()};
hint();

document.addEventListener('visibilitychange',()=>{if(!document.hidden&&shown!==today())render()});
setInterval(()=>{if(shown!==today())render()},60000);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
render();
