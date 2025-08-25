// ---------- wordlists (starter) ----------
const lists = {
  baby: {prefix:["El","An","Mi","Jo","Li","Ari","No","Sa","Ka","Le","Na","Theo","Vi","Ava","Eli"], suffix:["la","ah","na","son","iah","ana","en","elle","a","ra","ia","ael","ie","lin","ette"]},
  business: {prefix:["Blue","Prime","Nova","Peak","Swift","Atlas","Zen","Urban","Bright","True","Clear","Apex","Spark","Echo","North"], suffix:["Labs","Works","Point","Forge","Flow","Hub","Core","Studio","ly","Loop","Nest","Stack","Wave","Rise","Craft"]},
  fantasy: {prefix:["Thra","Ela","Vor","Kael","My","Gal","Dra","Syl","Ori","Nyx","Eld","Rhae","Faer","Myr","Korin"], suffix:["dor","wyn","rion","aris","dras","vash","mere","thil","gor","dell","ion","wynne","saar","lore","neth"]},
  username: {prefix:["Night","Pixel","Shadow","Byte","Echo","Frost","Crimson","Aero","Cyber","Lunar","Turbo","Quantum","Cosmic","Nova","Rogue"], suffix:["Wolf","Pilot","Nova","Rush","Axis","Storm","Spark","Rider","Ghost","Vibe","Volt","Blade","Strafe","Zen","Prime"]}
};

// ---------- dom refs ----------
const el = id => document.getElementById(id);
const category   = el('category')   || { value: 'business' }; // some category pages use a hidden input
const style      = el('style');
const lengthSel  = el('length');
const starts     = el('starts');
const count      = el('count');
const results    = el('results');
const status     = el('status');
const domainBtn  = document.querySelector('.cta');

// ---------- helpers ----------
function rng(arr){return arr[Math.floor(Math.random()*arr.length)];}
function stylize(name, s){
  if(s==="cute") return name + ["y","ie","oo"][Math.floor(Math.random()*3)];
  if(s==="edgy") return name.replace(/[aeiou]/gi,"") + (Math.random()>0.5?"X":"Z");
  if(s==="modern") return name.replace(/(\w)(\w*)/, (m,a,b)=>a.toUpperCase()+b.toLowerCase());
  return name;
}
function makeName(cat, opts){
  const {prefix, suffix} = lists[cat] || lists.business;
  let name = rng(prefix) + rng(suffix);
  if(opts.starts && /^[a-z]$/i.test(opts.starts)) {
    for(let i=0;i<30 && name[0].toLowerCase()!==opts.starts.toLowerCase();i++){
      name = rng(prefix) + rng(suffix);
    }
  }
  if(opts.length==="short") name = name.slice(0, Math.max(3, Math.floor(name.length*0.8)));
  if(opts.length==="long")  name = name + (Math.random()>0.5?rng(suffix):rng(prefix));
  return stylize(name, opts.style);
}
function generate(cat, n, opts){
  const set = new Set();
  while(set.size < n) set.add(makeName(cat, opts));
  return [...set];
}

// ---------- render ----------
function render(list){
  if(!results) return;
  results.innerHTML = "";
  const frag = document.createDocumentFragment();
  list.forEach(name=>{
    const div = document.createElement('div');
    div.className = 'name';
    div.innerHTML = `<span>${name}</span>
      <span class="actions">
        <button data-copy="${name}" title="Copy">Copy</button>
        <button data-fav="${name}" title="Save">★</button>
      </span>`;
    frag.appendChild(div);
  });
  results.appendChild(frag);
  if(status){ status.textContent = `${list.length} names generated`; }

  // update domain CTA link for business page
  const domain = encodeURIComponent((list[0]||"").replace(/\s+/g,'') + ".com");
  if (domainBtn && domainBtn.href.includes("domain=")) {
    domainBtn.href = domainBtn.href.replace(/domain=.+$/,'domain='+domain);
  }
}

// ---------- query sync ----------
function toQuery(){
  const q = new URLSearchParams({
    c: category.value, s: style?.value, l: lengthSel?.value,
    st: (starts?.value||"").toLowerCase(), n: count?.value
  });
  return q.toString();
}
function fromQuery(){
  const q = new URLSearchParams(location.search);
  if(q.size===0) return;
  if(category)   category.value   = q.get('c') || category.value;
  if(style)      style.value      = q.get('s') || style.value;
  if(lengthSel)  lengthSel.value  = q.get('l') || lengthSel.value;
  if(starts)     starts.value     = (q.get('st')||"").toUpperCase();
  if(count)      count.value      = q.get('n') || count.value;
}

// ---------- clipboard & favorites ----------
function copy(text){
  navigator.clipboard.writeText(text).then(()=>{
    if(status){ status.textContent = 'Copied!'; setTimeout(()=>status.textContent='',1200); }
  });
}
function copyAll(){
  const names = [...results.querySelectorAll('.name span:first-child')].map(n=>n.textContent);
  if(names.length) copy(names.join('\n'));
}
function addFav(name){
  const key = 'tng_favs';
  const favs = JSON.parse(localStorage.getItem(key)||'[]');
  if(!favs.includes(name)) favs.push(name);
  localStorage.setItem(key, JSON.stringify(favs));
  if(status){ status.textContent = 'Saved to Favorites'; setTimeout(()=>status.textContent='',1200); }
}

// ---------- GA4 safe helper ----------
function gaEvent(name, params){
  try{
    if(typeof gtag === 'function'){ gtag('event', name, params||{}); }
  }catch(_e){}
}

// ---------- events ----------
const generateBtn = document.getElementById('generate');
if(generateBtn){
  generateBtn.addEventListener('click', ()=>{
    const n = Math.min(200, Math.max(5, +(count?.value)||20));
    const opts = { style: style?.value, length: lengthSel?.value, starts: starts?.value };
    const list = generate((category?.value)||'business', n, opts);

    // GA: log generate click
    gaEvent('generate_click', {
      category: (category?.value)||'business',
      style: style?.value||'',
      length: lengthSel?.value||'any',
      starts_with: (starts?.value||'').toUpperCase(),
      count: n
    });

    render(list);
  });
}

if(results){
  results.addEventListener('click', e=>{
    const t = e.target;
    if(t.dataset.copy){
      gaEvent('copy_single', { value: t.dataset.copy.length || 0, name_len: t.dataset.copy.length });
      copy(t.dataset.copy);
    }
    if(t.dataset.fav){
      gaEvent('favorite_add', { name_len: t.dataset.fav.length });
      addFav(t.dataset.fav);
    }
  });
}

const copyAllBtn = document.getElementById('copyAll');
if(copyAllBtn){
  copyAllBtn.addEventListener('click', ()=>{
    const total = results ? results.querySelectorAll('.name').length : 0;
    gaEvent('copy_all', { total });
    copyAll();
  });
}

const shareBtn = document.getElementById('share');
if(shareBtn){
  shareBtn.addEventListener('click', ()=>{
    const url = `${location.origin}${location.pathname}?${toQuery()}`;
    navigator.clipboard.writeText(url);
    if(status){ status.textContent = 'Permalink copied'; setTimeout(()=>status.textContent='',1200); }
    gaEvent('share_permalink', { path: location.pathname });
  });
}

// footer year
const yearEl = document.getElementById('year');
if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

// initial state
fromQuery();
render(generate((category?.value)||'business', +(count?.value)||20, {style:style?.value,length:lengthSel?.value,starts:starts?.value}));
