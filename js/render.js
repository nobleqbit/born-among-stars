// Renders a pass to the DOM, and to a PNG via canvas for sharing.

import { IMAGE_CREDITS } from './images.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderPass(pass, root) {
  const d = pass.destination;
  root.innerHTML = `
    <article class="pass" aria-live="polite">
      <header class="pass__head">
        <div>
          <div class="pass__eyebrow">Cosmic boarding pass · ${esc(pass.occasion.label)}</div>
          <h2 class="pass__headline">${esc(pass.occasion.headline)}</h2>
        </div>
        <div class="pass__sig" title="SHA-256 of your date + occasion. Same inputs, same card, always.">
          <span class="pass__siglabel">SIG</span> ${esc(pass.signature)}
        </div>
      </header>

      <div class="pass__origin">
        <span>Origin: Earth</span>
        <span>${esc(pass.date.label)} · a ${esc(pass.date.weekday)}</span>
        <span>Julian Day ${pass.jdn.toLocaleString('en-US')}</span>
        ${pass.seasonLine ? `<span>${esc(pass.seasonLine)}</span>` : ''}
      </div>

      <section class="pass__dest">
        <div class="pass__eyebrow">Destination</div>
        <h3 class="pass__destname">${esc(d.name)}</h3>
        <p class="pass__destkind">${esc(d.kind)} — ${esc(d.where)}</p>
        <p class="pass__forwho">Assigned to ${esc(d.forWho)}.</p>
      </section>

      <section>
        <h4>Why you were sent here</h4>
        <p class="pass__grit">${esc(d.grit)}</p>
        <ul class="pass__facts">
          ${d.facts.map((f) => `<li>${esc(f)}</li>`).join('')}
        </ul>
      </section>

      <section class="pass__grid">
        <div>
          <h4>Cosmic odometer</h4>
          <ul class="pass__odo">
            ${pass.odometer.map((o) => `<li><b>${esc(o.orbitsLabel)}</b> ${esc(o.name)} orbits</li>`).join('')}
          </ul>
          <p class="pass__small">${esc(pass.nextOrbit.line)}</p>
        </div>
        <div>
          <h4>Light-mail</h4>
          <p>${esc(pass.lightMail.line)}</p>
        </div>
      </section>

      <section class="pass__grid">
        <div>
          <h4>The number itself</h4>
          <p>${esc(pass.number.note)}</p>
          <p class="pass__small">${esc(pass.number.rootLine)}</p>
        </div>
        <div>
          <h4>Quantum note</h4>
          <p>${esc(pass.quantum)}</p>
        </div>
      </section>

      <section class="pass__grid">
        <div>
          <h4>Strength</h4>
          <p>${esc(d.strength)}</p>
        </div>
        <div>
          <h4>Constructive</h4>
          <p>${esc(d.caution)}</p>
        </div>
      </section>

      <section>
        <h4>Forward vector</h4>
        <p class="pass__forward">${esc(d.forward)}</p>
      </section>

      <section class="pass__smile">
        ${pass.smile.map((s) => `<p>${esc(s)}</p>`).join('')}
      </section>

      <footer class="pass__tx">
        <div class="pass__eyebrow">Transmission from ${esc(d.name)}</div>
        <blockquote>“${esc(d.transmission)}”</blockquote>
      </footer>
    </article>
  `;
}

// ── PNG export ────────────────────────────────────────────────────────────

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // no photo is fine; the card still exports
    img.src = src;
  });
}

/** Draw an image to fill a box, cropping to preserve aspect (CSS object-fit: cover). */
function drawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

const PHOTO_H = 440;

/** Draws the pass to a canvas and resolves to a PNG data URL. */
export async function passToPNG(pass) {
  const W = 1200;
  const pad = 64;
  const maxW = W - pad * 2;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = await loadImage(pass.image);

  // Measure first: lay out into a list of {text, font, color, gap}.
  const blocks = [];
  const add = (text, font, color, gap = 10, width = maxW) => blocks.push({ text, font, color, gap, width });
  const d = pass.destination;
  const mono = '"SF Mono", Menlo, Consolas, monospace';
  const serif = 'Georgia, "Times New Roman", serif';
  const sans = '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

  add(`COSMIC BOARDING PASS · ${pass.occasion.label.toUpperCase()}`, `600 20px ${mono}`, '#8fb3ff', 6);
  add(pass.occasion.headline, `700 52px ${serif}`, '#ffffff', 18);
  add(`Origin: Earth · ${pass.date.label} · Julian Day ${pass.jdn.toLocaleString('en-US')} · SIG ${pass.signature}`, `400 20px ${mono}`, '#9aa4b2', 34);
  add('DESTINATION', `600 18px ${mono}`, '#8fb3ff', 4);
  add(d.name, `700 44px ${serif}`, '#ffd27a', 4);
  add(`${d.kind} — ${d.where}`, `400 22px ${sans}`, '#c9d1dc', 24);
  add('ISSUED TO', `600 18px ${mono}`, '#8fb3ff', 4);
  add(pass.identity.fullName, `700 34px ${serif}`, '#ffffff', 4);
  add(pass.identity.designation, `500 18px ${mono}`, '#9aa4b2', 10);
  add(pass.identity.address.slice(1).join('  ·  '), `400 17px ${mono}`, '#8b95a5', 28);
  add('WHY YOU WERE SENT HERE', `600 18px ${mono}`, '#8fb3ff', 8);
  add(d.grit, `400 24px ${sans}`, '#e8edf3', 26);
  add('COSMIC ODOMETER', `600 18px ${mono}`, '#8fb3ff', 8);
  add(pass.odometer.map((o) => `${o.orbitsLabel} ${o.name}`).join('   ·   '), `400 22px ${mono}`, '#e8edf3', 26);
  add('LIGHT-MAIL', `600 18px ${mono}`, '#8fb3ff', 8);
  add(pass.lightMail.line, `400 24px ${sans}`, '#e8edf3', 26);
  add('QUANTUM NOTE', `600 18px ${mono}`, '#8fb3ff', 8);
  add(pass.quantum, `400 22px ${sans}`, '#c9d1dc', 26);
  add('FORWARD VECTOR', `600 18px ${mono}`, '#8fb3ff', 8);
  add(d.forward, `400 24px ${sans}`, '#e8edf3', 30);
  add(`TRANSMISSION FROM ${d.name.toUpperCase()}`, `600 18px ${mono}`, '#8fb3ff', 8);
  add(`“${d.transmission}”`, `italic 700 30px ${serif}`, '#ffd27a', 20);
  add('born-among-stars · every number on this card is real and checkable', `400 16px ${mono}`, '#6b7686', 0);

  // Height pass — the photo (if any) sits above the text blocks.
  canvas.width = W;
  const photoTop = pad;
  let h = pad + (img ? PHOTO_H + 32 : 0);
  const laid = blocks.map((b) => {
    ctx.font = b.font;
    const size = parseInt(b.font.match(/(\d+)px/)[1], 10);
    const lines = wrap(ctx, b.text, b.width);
    const lh = Math.round(size * 1.35);
    const block = { ...b, lines, lh, y: h };
    h += lines.length * lh + b.gap;
    return block;
  });
  h += pad;
  canvas.height = h;

  // Background: deep space + stars
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#070b16');
  g.addColorStop(1, '#0d1326');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, h);
  let seed = pass.jdn;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * W, y = rnd() * h, r = rnd() * 1.4 + 0.2;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.6})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // Destination photo: rounded, cover-fit, fading into the card, with credit.
  if (img) {
    const r = 18;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, photoTop, maxW, PHOTO_H, r);
    ctx.clip();
    drawCover(ctx, img, pad, photoTop, maxW, PHOTO_H);
    const fade = ctx.createLinearGradient(0, photoTop + PHOTO_H * 0.55, 0, photoTop + PHOTO_H);
    fade.addColorStop(0, 'rgba(7,11,22,0)');
    fade.addColorStop(1, 'rgba(7,11,22,0.85)');
    ctx.fillStyle = fade;
    ctx.fillRect(pad, photoTop, maxW, PHOTO_H);
    const credit = IMAGE_CREDITS[d.id];
    if (credit) {
      ctx.font = `400 14px ${mono}`;
      ctx.fillStyle = 'rgba(200,210,224,0.85)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${credit.title} — ${credit.credit}`.slice(0, 110), pad + maxW - 16, photoTop + PHOTO_H - 12);
      ctx.textAlign = 'left';
    }
    ctx.restore();
  }

  // Card frame
  ctx.strokeStyle = 'rgba(143,179,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad / 2, pad / 2, W - pad, h - pad);

  // Text
  for (const b of laid) {
    ctx.font = b.font;
    ctx.fillStyle = b.color;
    ctx.textBaseline = 'top';
    b.lines.forEach((line, i) => ctx.fillText(line, pad, b.y + i * b.lh));
  }
  return canvas.toDataURL('image/png');
}
