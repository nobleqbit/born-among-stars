// UI wiring. Nothing here ever leaves the browser.

import { composePass, OCCASIONS } from './compose.js';
import { renderPass, passToPNG } from './render.js';
import { julianDayNumber, fromJulianDayNumber } from './julian.js';

const $ = (sel) => document.querySelector(sel);

const yearSel = $('#year');
const monthSel = $('#month');
const daySel = $('#day');
const occSel = $('#occasion');
const hemiSel = $('#hemisphere');
const form = $('#form');
const out = $('#pass');
const actions = $('#actions');
const status = $('#status');

// ── Populate dropdowns ───────────────────────────────────────────────────
const thisYear = new Date().getFullYear();
for (let y = thisYear; y >= 1900; y--) yearSel.append(new Option(String(y), String(y)));
['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December']
  .forEach((m, i) => monthSel.append(new Option(m, String(i + 1))));
for (let d = 1; d <= 31; d++) daySel.append(new Option(String(d), String(d)));
for (const [k, v] of Object.entries(OCCASIONS)) occSel.append(new Option(v.label, k));

function validDate(y, m, d) {
  const back = fromJulianDayNumber(julianDayNumber(y, m, d));
  return back.year === y && back.month === m && back.day === d;
}

// ── Permalink in / out ───────────────────────────────────────────────────
function readParams() {
  const p = new URLSearchParams(location.search);
  const d = p.get('d');
  if (d && /^\d{8}$/.test(d)) {
    yearSel.value = d.slice(0, 4);
    monthSel.value = String(Number(d.slice(4, 6)));
    daySel.value = String(Number(d.slice(6, 8)));
  }
  if (p.get('o') && OCCASIONS[p.get('o')]) occSel.value = p.get('o');
  if (['north', 'south', 'skip'].includes(p.get('h'))) hemiSel.value = p.get('h');
  return Boolean(d);
}

function writeParams(pass) {
  const p = new URLSearchParams({ d: pass.permalink.d, o: pass.permalink.o });
  if (pass.permalink.h !== 'skip') p.set('h', pass.permalink.h);
  history.replaceState(null, '', `${location.pathname}?${p}`);
}

// ── Generate ─────────────────────────────────────────────────────────────
let current = null;

async function generate() {
  const year = Number(yearSel.value);
  const month = Number(monthSel.value);
  const day = Number(daySel.value);
  if (!validDate(year, month, day)) {
    status.textContent = 'That date doesn’t exist on Earth. Try another.';
    return;
  }
  status.textContent = 'Consulting the ephemeris…';
  current = await composePass({
    year, month, day, occasion: occSel.value, hemisphere: hemiSel.value,
  });
  renderPass(current, out);
  writeParams(current);
  actions.hidden = false;
  status.textContent = '';
  document.title = `${current.destination.name} · Born Among Stars`;
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  generate();
});

$('#copy-link').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    status.textContent = 'Link copied. Same link, same card, forever.';
  } catch {
    status.textContent = location.href;
  }
});

$('#download').addEventListener('click', () => {
  if (!current) return;
  const a = document.createElement('a');
  a.href = passToPNG(current);
  a.download = `born-among-stars-${current.permalink.d}-${current.destination.id}.png`;
  a.click();
});

// ── Starfield ────────────────────────────────────────────────────────────
(function starfield() {
  const c = $('#sky');
  const ctx = c.getContext('2d');
  let stars = [];
  function resize() {
    c.width = innerWidth * devicePixelRatio;
    c.height = innerHeight * devicePixelRatio;
    stars = Array.from({ length: Math.min(400, Math.floor((innerWidth * innerHeight) / 4000)) }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: (Math.random() * 1.2 + 0.3) * devicePixelRatio,
      p: Math.random() * Math.PI * 2, s: 0.004 + Math.random() * 0.01,
    }));
  }
  function frame(t) {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const s of stars) {
      const a = 0.35 + 0.45 * Math.sin(t * s + s.p);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  addEventListener('resize', resize, { passive: true });
  resize();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(frame);
  else frame(0);
})();

// Default to today's date; render immediately if a permalink was supplied.
const now = new Date();
yearSel.value = String(Math.min(now.getFullYear(), thisYear));
monthSel.value = String(now.getMonth() + 1);
daySel.value = String(now.getDate());
if (readParams()) generate();
