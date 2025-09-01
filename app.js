// ===============================
// TryNameGenerator – app.js (v2)
// ===============================

// ---------- wordlists ----------
const lists = {
  baby: {
    prefix: ["El","An","Mi","Jo","Li","Ari","No","Sa","Ka","Le","Na","Theo","Vi","Ava","Eli"],
    suffix: ["la","ah","na","son","iah","ana","en","elle","a","ra","ia","ael","ie","lin","ette"]
  },
  business: {
    prefix: ["Blue","Prime","Nova","Peak","Swift","Atlas","Zen","Urban","Bright","True","Clear","Apex","Spark","Echo","North"],
    suffix: ["Labs","Works","Point","Forge","Flow","Hub","Core","Studio","ly","Loop","Nest","Stack","Wave","Rise","Craft"]
  },
  fantasy: {
    prefix: ["Thra","Ela","Vor","Kael","My","Gal","Dra","Syl","Ori","Nyx","Eld","Rhae","Faer","Myr","Korin"],
    suffix: ["dor","wyn","rion","aris","dras","vash","mere","thil","gor","dell","ion","wynne","saar","lore","neth"]
  },
  username: {
    prefix: ["Night","Pixel","Shadow","Byte","Echo","Frost","Crimson","Aero","Cyber","Lunar","Turbo","Quantum","Cosmic","Nova","Rogue"],
    suffix: ["Wolf","Pilot","Nova","Rush","Axis","Storm","Spark","Rider","Ghost","Vibe","Volt","Blade","Strafe","Zen","Prime"]
  }
};

// ---------- dom refs ----------
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const el = id => document.getElementById(id);

const category  = el('category')   || { value: 'business' }; // hidden on some pages
const style     = el('style');
const lengthSel = el('length');
const starts    = el('starts');
const count     = el('count');
const results   = el('results');
const status    = el('status');
const generateBtn = el('generate');
const copyAllBtn  = el('copyAll');
const shareBtn    = el('share');
const domainBtn   = $('.cta');

// ---------- helpers ----------
const rng = arr => arr[Math.floor(Math.random() * arr.length)];

function stylize(name, s) {
  if (s === "cute")     return name + ["y","ie","oo"][Math.floor(Math.random()*3)];
  if (s === "edgy")     return name.replace(/[aeiou]/gi,"") + (Math.random()>0.5?"X":"Z");
  if (s === "modern")   return name.replace(/(^\w)(\w*)/, (_,a,b)=>a.toUpperCase()+b.toLowerCase());
  if (s === "aesthetic") {
    // soft, lowercase, sometimes with gentle suffix
    const soft = ["ly","xo","ae","ia","ie","va","va","na"];
    let out = name.toLowerCase();
    if (Math.random() > 0.6) out += rng(soft);
    return out;
  }
  return name;
}

function makeName(cat, opts) {
  const dict = lists[cat] || lists.business;
  const { prefix, suffix } = dict;
  let n = rng(prefix) + rng(suffix);

  // starts-with constraint (A–Z)
  const sw = (opts.starts || "").toLowerCase();
  if (/^[a-z]$/.test(sw)) {
    for (let i = 0; i < 40 && n[0].toLowerCase() !== sw; i++) {
      n = rng(prefix) + rng(suffix);
    }
  }

  if (opts.length === "short") n = n.slice(0, Math.max(3, Math.floor(n.length * 0.8)));
  if (opts.length === "long")  n = n + (Math.random() > 0.5 ? rng(suffix) : rng(prefix));

  return stylize(n, opts.style);
}

function generate(cat, n, opts) {
  const set = new Set();
  let safety = 0;
  while (set.size < n && safety < n*20) {
    set.add(makeName(cat, opts));
    safety++;
  }
  return [...set];
}

function setStatus(msg) {
  if (!status) return;
  status.textContent = msg;
  if (msg) setTimeout(() => { if (status.textContent === msg) status.textContent = ""; }, 1200);
}

// ---------- render (safe, no innerHTML for text) ----------
function render(list) {
  if (!results) return;

  results.innerHTML = "";
  const frag = document.createDocumentFragment();

  list.forEach(name => {
    const row = document.createElement('div');
    row.className = 'name';

    const span = document.createElement('span');
    span.textContent = name;

    const actions = document.createElement('span');
    actions.className = 'actions';

    const btnCopy = document.createElement('button');
    btnCopy.textContent = 'Copy';
    btnCopy.dataset.copy = name;
    btnCopy.title = 'Copy';

    const btnFav = document.createElement('button');
    btnFav.textContent = '★';
    btnFav.dataset.fav = name;
    btnFav.title = 'Save';

    actions.appendChild(btnCopy);
    actions.appendChild(btnFav);

    row.appendChild(span);
    row.appendChild(actions);
    frag.appendChild(row);
  });

  results.appendChild(frag);
  setStatus(`${list.length} names generated`);

  // Update domain CTA
  try {
    if (domainBtn) {
      const first = (list[0] || "").replace(/\s+/g, '');
      const domain = `${first}.com`.toLowerCase();

      if (domainBtn.href.includes("{domain}")) {
        domainBtn.href = domainBtn.href.replace("{domain}", encodeURIComponent(domain));
      } else {
        const u = new URL(domainBtn.href);
        if (u.searchParams.has("domain")) {
          u.searchParams.set("domain", domain);
          domainBtn.href = u.toString();
        }
      }
    }
  } catch (_e) {}
}

// ---------- query sync ----------
function toQuery() {
  const q = new URLSearchParams({
    c: category.value,
    s:  style?.value,
    l:  lengthSel?.value,
    st: (starts?.value || "").toLowerCase(),
    n:  count?.value
  });
  return q.toString();
}

function fromQuery() {
  const q = new URLSearchParams(location.search);
  if (q.size === 0) return;
  if (category)  category.value  = q.get('c')  || category.value;
  if (style)     style.value     = q.get('s')  || style.value;
  if (lengthSel) lengthSel.value = q.get('l')  || lengthSel.value;
  if (starts)    starts.value    = (q.get('st') || "").toUpperCase();
  if (count)     count.value     = q.get('n')  || count.value;
}

// ---------- clipboard & favorites ----------
async function clipboardWrite(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

function copy(text) {
  clipboardWrite(text).then(ok => setStatus(ok ? 'Copied!' : 'Copy failed'));
}

function copyAll() {
  const names = results ? [...results.querySelectorAll('.name span:first-child')].map(n => n.textContent) : [];
  if (names.length) copy(names.join('\n'));
}

function addFav(name) {
  const key = 'tng_favs';
  const favs = JSON.parse(localStorage.getItem(key) || '[]');
  if (!favs.includes(name)) favs.push(name);
  localStorage.setItem(key, JSON.stringify(favs));
  setStatus('Saved to Favorites');
}

// ---------- GA4 safe helper ----------
function gaEvent(name, params) {
  try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch(_e) {}
}

// ---------- events ----------
if (generateBtn) {
  generateBtn.addEventListener('click', () => {
    const n = Math.min(200, Math.max(5, +(count?.value) || 20));
    const opts = { style: style?.value, length: lengthSel?.value, starts: starts?.value };
    const list = generate((category?.value) || 'business', n, opts);

    gaEvent('generate_click', {
      category: (category?.value) || 'business',
      style: style?.value || '',
      length: lengthSel?.value || 'any',
      starts_with: (starts?.value || '').toUpperCase(),
      count: n
    });

    render(list);
  });
}

if (results) {
  results.addEventListener('click', e => {
    const t = e.target;
    if (t.dataset.copy) {
      gaEvent('copy_single', { value: t.dataset.copy.length || 0, name_len: t.dataset.copy.length });
      copy(t.dataset.copy);
    }
    if (t.dataset.fav) {
      gaEvent('favorite_add', { name_len: t.dataset.fav.length });
      addFav(t.dataset.fav);
    }
  });
}

if (copyAllBtn) {
  copyAllBtn.addEventListener('click', () => {
    const total = results ? results.querySelectorAll('.name').length : 0;
    gaEvent('copy_all', { total });
    copyAll();
  });
}

if (shareBtn) {
  shareBtn.addEventListener('click', () => {
    const url = `${location.origin}${location.pathname}?${toQuery()}`;
    clipboardWrite(url);
    setStatus('Permalink copied');
    gaEvent('share_permalink', { path: location.pathname });
  });
}

// footer year
const yearEl = el('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- initial state ----------
fromQuery();
render(generate((category?.value) || 'business', +(count?.value) || 20, {
  style:  style?.value,
  length: lengthSel?.value,
  starts: starts?.value
}));
