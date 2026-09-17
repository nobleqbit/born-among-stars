// Renders a pass to the DOM, and to a PNG via canvas for sharing.
//
// Layout follows a boarding-pass metaphor: one photo hero, one voyage strip,
// one row of ticket fields, a two-column body (identity + odometer beside the
// story), a single perforated tear line, and everything secondary behind a
// native <details> toggle. Nothing from the pass object is dropped.

import { IMAGE_CREDITS } from './images.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// A tiny probe: body, two solar panels, a dish. Colours via currentColor + accents.
const PROBE_SVG = `<svg class="voyage__probe" viewBox="0 0 24 14" aria-hidden="true">
  <rect x="0" y="5.5" width="8" height="3" fill="#8fb3ff"/>
  <rect x="16" y="5.5" width="8" height="3" fill="#8fb3ff"/>
  <rect x="9" y="4" width="6" height="6" rx="1" fill="currentColor"/>
  <circle cx="12" cy="2" r="1.5" fill="#ffd27a"/>
</svg>`;

export function renderPass(pass, root) {
  const d = pass.destination;
  const id = pass.identity;
  const credit = IMAGE_CREDITS[d.id];
  const alt = `${d.name}, ${d.kind}${credit ? ` — ${credit.title}` : ''}`;
  const jdn = pass.jdn.toLocaleString('en-US');

  const field = (k, v) => `<div class="field"><dt class="field__k">${k}</dt><dd class="field__v">${v}</dd></div>`;
  const tile = (k, body, wide = false) =>
    `<section class="tile${wide ? ' tile--wide' : ''}"><span class="tile__k">${k}</span>${body}</section>`;

  root.innerHTML = `
    <article class="pass">
      <header class="pass__hero">
        <img class="pass__photo" src="${esc(pass.image)}" alt="${esc(alt)}" loading="eager" decoding="async"
             onerror="this.remove(); this.closest('.pass__hero').classList.add('pass__hero--nophoto')">
        <div class="pass__top">
          <div class="pass__mast">
            <div class="pass__eyebrow">Cosmic boarding pass · ${esc(pass.occasion.label)}</div>
            <h2 class="pass__headline">${esc(pass.occasion.headline)}</h2>
          </div>
          <div class="pass__sig" title="SHA-256 of your date + occasion. Same inputs, same card, always.">
            <span class="pass__siglabel">SIG</span>${esc(pass.signature)}
          </div>
        </div>
        <div class="pass__title">
          <div>
            <div class="pass__eyebrow">Destination</div>
            <h3 class="pass__destname">${esc(d.name)}</h3>
            <p class="pass__destkind">${esc(d.kind)} — ${esc(d.where)}</p>
          </div>
          ${credit ? `<div class="pass__credit">${esc(credit.title)}<br>${esc(credit.credit)}</div>` : ''}
        </div>
      </header>

      <div class="voyage" role="img" aria-label="Voyage from Earth to ${esc(d.name)}">
        <div class="voyage__end"><span class="voyage__earth" aria-hidden="true"></span><span class="voyage__label">Earth</span></div>
        <div class="voyage__path" aria-hidden="true">${PROBE_SVG}</div>
        <div class="voyage__end"><span class="voyage__body" aria-hidden="true"></span><span class="voyage__label">${esc(d.name)}</span></div>
      </div>

      <dl class="pass__fields">
        ${field('Origin', `Earth <small>a ${esc(pass.date.weekday)}</small>`)}
        ${field('Date', esc(pass.date.label))}
        ${field('Julian Day', jdn)}
        ${pass.seasonLine
          ? field('Season', esc(pass.seasonShort))
          : field('Assigned to', esc(d.forWho))}
      </dl>

      <div class="pass__body">
        <aside class="pass__aside">
          <section class="ident">
            <div class="pass__eyebrow">Your papers, please</div>
            <h4 class="ident__callsign">${esc(id.fullName)}</h4>
            <code class="ident__code">${esc(id.designation)}</code>
            <ol class="ident__addr" aria-label="Cosmic address">
              ${id.address.slice(1).map((line) => `<li>${esc(line)}</li>`).join('')}
            </ol>
            <span class="stamp">Assigned to ${esc(d.forWho)}</span>
          </section>
          <section class="blk">
            <span class="blk__k">Laps around the Sun</span>
            <ul class="odo">
              ${pass.odometer.map((o) => `<li><span>${esc(o.name)} orbits</span><b>${esc(o.orbitsLabel)}</b></li>`).join('')}
            </ul>
          </section>
        </aside>

        <div class="pass__main">
          <section class="blk">
            <span class="blk__k">Why you were sent here</span>
            <p class="pass__grit">${esc(d.grit)}</p>
          </section>
          <section class="blk">
            <span class="blk__k">Light-mail</span>
            <p>${esc(pass.lightMail.line)}</p>
          </section>
          <footer class="pass__tx">
            <div class="pass__eyebrow">Transmission from ${esc(d.name)}</div>
            <blockquote>“${esc(d.transmission)}”</blockquote>
          </footer>
        </div>
      </div>

      <div class="pass__tear" aria-hidden="true"></div>

      <details class="pass__more">
        <summary class="pass__summary">
          <span>The rest of the manifest</span>
          <span class="summary__hint">three true things · your next cosmic birthday · your number · physics · where to point next</span>
        </summary>
        <div class="more">
          ${tile('Three true things', `<ul class="tile__facts">${d.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`)}
          ${tile('Your next cosmic birthday', `<p>${esc(pass.nextOrbit.line)}</p>${pass.smile[0] ? `<p class="tile__small">${esc(pass.smile[0])}</p>` : ''}`)}
          ${tile('Your number, dissected', `<p>${esc(pass.number.note)}</p><p class="tile__small">${esc(pass.number.rootLine)}</p>`)}
          ${tile('Physics, lightly misused', `<p>${esc(pass.quantum)}</p>`)}
          ${tile('What you’ve got', `<p>${esc(d.strength)}</p>`)}
          ${tile('The fine print', `<p>${esc(d.caution)}</p>`)}
          ${tile('Where to point next', `<p class="tile__forward">${esc(d.forward)}</p>${pass.smile[1] ? `<p class="tile__small">${esc(pass.smile[1])}</p>` : ''}`, true)}
        </div>
      </details>
    </article>
  `;
}

// ── PNG export ────────────────────────────────────────────────────────────
// Mirrors the part of the card above the tear line: the tidy single image
// worth sharing. The "more" tiles stay on the page.

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

/** Draws the pass to a canvas and resolves to a JPEG data URL.
 *  JPEG (q=0.88) keeps the text crisp and lands around 250–350 KB with the
 *  photo, versus ~1.2 MB as PNG — a far better thing to share. */
export const SHARE_IMAGE_EXT = 'jpg';
export async function passToImage(pass) {
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

  add(`COSMIC BOARDING PASS · ${pass.occasion.label.toUpperCase()}`, `600 18px ${mono}`, '#8fb3ff', 4);
  add(pass.occasion.headline, `700 30px ${serif}`, '#ffffff', 12);
  add(`Origin: Earth · ${pass.date.label} · Julian Day ${pass.jdn.toLocaleString('en-US')} · SIG ${pass.signature}`, `400 18px ${mono}`, '#9aa4b2', 30);
  add('DESTINATION', `600 18px ${mono}`, '#8fb3ff', 4);
  add(d.name, `700 48px ${serif}`, '#ffd27a', 4);
  add(`${d.kind} — ${d.where}`, `400 22px ${sans}`, '#c9d1dc', 24);
  add('ISSUED TO', `600 18px ${mono}`, '#8fb3ff', 4);
  add(pass.identity.fullName, `700 34px ${serif}`, '#ffffff', 4);
  add(pass.identity.designation, `500 18px ${mono}`, '#9aa4b2', 10);
  add(pass.identity.address.slice(1).join('  ·  '), `400 17px ${mono}`, '#8b95a5', 28);
  add('WHY YOU WERE SENT HERE', `600 18px ${mono}`, '#8fb3ff', 8);
  add(d.grit, `400 24px ${sans}`, '#e8edf3', 26);
  add('LIGHT-MAIL', `600 18px ${mono}`, '#8fb3ff', 8);
  add(pass.lightMail.line, `400 24px ${sans}`, '#e8edf3', 30);
  add(`TRANSMISSION FROM ${d.name.toUpperCase()}`, `600 18px ${mono}`, '#8fb3ff', 8);
  add(`“${d.transmission}”`, `italic 700 30px ${serif}`, '#ffd27a', 24);
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

  // Background: deep space + stars (seeded by the JDN so it's stable per date)
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
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, photoTop, maxW, PHOTO_H, 18);
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
  return canvas.toDataURL('image/jpeg', 0.88);
}
