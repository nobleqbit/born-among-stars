import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  julianDayNumber, fromJulianDayNumber, primeFactors, digitalRoot, numberProfile, weekdayOf,
} from '../js/julian.js';
import {
  lightMail, cosmicOdometer, nextWholeOrbit, yearsFromDays, moonPhase, birthdayBroadcast,
  sunConstellation, ECLIPTIC_CONSTELLATIONS,
} from '../js/astronomy.js';
import { cosmicSignature } from '../js/signature.js';
import { composePass } from '../js/compose.js';
import { CATALOG } from '../js/catalog.js';

// Fixture values verified by hand and against an independent implementation.
test('JDN of 14 March 1990 is 2447965', () => {
  assert.equal(julianDayNumber(1990, 3, 14), 2447965);
});

test('JDN of the Unix epoch is 2440588', () => {
  assert.equal(julianDayNumber(1970, 1, 1), 2440588);
});

test('JDN round-trips through fromJulianDayNumber', () => {
  for (const [y, m, d] of [[1900, 1, 1], [2000, 2, 29], [2026, 12, 31], [1969, 7, 20]]) {
    assert.deepEqual(fromJulianDayNumber(julianDayNumber(y, m, d)), { year: y, month: m, day: d });
  }
});

test('invalid dates do not round-trip (Feb 30)', () => {
  const back = fromJulianDayNumber(julianDayNumber(2025, 2, 30));
  assert.notDeepEqual(back, { year: 2025, month: 2, day: 30 });
});

test('weekday from JDN: 20 July 1969 was a Sunday', () => {
  assert.equal(weekdayOf(julianDayNumber(1969, 7, 20)), 'Sunday');
});

test('prime factors of 2447965 are 5 × 13 × 13 × 2897', () => {
  assert.deepEqual(primeFactors(2447965), [5, 13, 13, 2897]);
  assert.deepEqual(numberProfile(2447965).repeatedPrimes, [13]);
});

test('digital root', () => {
  assert.equal(digitalRoot(2447965), 1);
  assert.equal(digitalRoot(9), 9);
  assert.equal(digitalRoot(18), 9);
  assert.equal(digitalRoot(0), 0);
});

test('light-mail picks the star whose distance matches your age', () => {
  const { star, departedAgeYears } = lightMail(36.5);
  assert.equal(star.name, 'Arcturus');
  assert.ok(Math.abs(departedAgeYears) < 1);
});

test('light-mail for a toddler says the light left before they were born', () => {
  const { star, departedAgeYears } = lightMail(2);
  assert.equal(star.name, 'Proxima Centauri');
  assert.ok(departedAgeYears < 0);
});

test('odometer: 13,336 days ≈ 3.08 Jupiter orbits', () => {
  const jup = cosmicOdometer(13336).find((o) => o.name === 'Jupiter');
  assert.ok(Math.abs(jup.orbits - 3.08) < 0.01);
});

test('next whole orbit is always in the future', () => {
  const n = nextWholeOrbit(13336);
  assert.ok(n.inDays > 0 && n.inDays <= 87.969); // Mercury is never more than one orbit away
});

test('moon phase: the reference new moon and the full moon a fortnight later', () => {
  // 6 Jan 2000 was a new moon (18:14 UTC); 21 Jan 2000 was a full moon (04:40 UTC).
  const newMoon = moonPhase(julianDayNumber(2000, 1, 6));
  assert.equal(newMoon.name, 'New Moon');
  assert.ok(newMoon.illumination < 0.02);
  const full = moonPhase(julianDayNumber(2000, 1, 21));
  assert.equal(full.name, 'Full Moon');
  assert.ok(full.illumination > 0.98);
  // Half-way points are quarters. The mean-lunation method can be ~a day off
  // the true phase (this lunation ran long), so allow a generous window.
  const q = moonPhase(julianDayNumber(2000, 1, 14)); // first quarter was 14 Jan 2000, 13:34 UTC
  assert.equal(q.name, 'First Quarter');
  assert.ok(Math.abs(q.illumination - 0.5) < 0.15);
});

test('moon phase illumination is bounded and phase is in [0,1)', () => {
  for (let jdn = 2440000; jdn < 2440000 + 60; jdn++) {
    const m = moonPhase(jdn);
    assert.ok(m.phase >= 0 && m.phase < 1);
    assert.ok(m.illumination >= 0 && m.illumination <= 1);
    assert.ok(m.name);
  }
});

test('birthday broadcast brackets the age between two stars', () => {
  const b = birthdayBroadcast(36.51);
  assert.equal(b.last.name, 'Pollux');       // 33.8 ly, already passed
  assert.equal(b.next.name, 'Arcturus');     // 36.7 ly, next up
  assert.ok(b.nextInYears > 0 && b.nextInYears < 0.2);
  const baby = birthdayBroadcast(2);
  assert.equal(baby.last, null);
  assert.equal(baby.next.name, 'Proxima Centauri');
});

test('IAU ecliptic boundaries are contiguous and cover the full circle', () => {
  let span = 0;
  for (let i = 0; i < ECLIPTIC_CONSTELLATIONS.length; i++) {
    const c = ECLIPTIC_CONSTELLATIONS[i];
    const next = ECLIPTIC_CONSTELLATIONS[(i + 1) % ECLIPTIC_CONSTELLATIONS.length];
    assert.equal(c.to, next.from, `${c.name} → ${next.name} gap`);
    span += c.from < c.to ? c.to - c.from : 360 - c.from + c.to;
  }
  assert.ok(Math.abs(span - 360) < 1e-9);
  assert.equal(ECLIPTIC_CONSTELLATIONS.length, 13);
});

test('where the Sun stood: known dates', () => {
  const at = (y, m, d) => sunConstellation(julianDayNumber(y, m, d), y);
  // Early December: the thirteenth constellation nobody's horoscope mentions.
  assert.equal(at(2000, 12, 5).constellation.name, 'Ophiuchus');
  assert.equal(at(2000, 12, 5).sign, 'Sagittarius');
  assert.equal(at(2000, 12, 5).agree, false);
  // Late November: Scorpius's seven days.
  assert.equal(at(2000, 11, 25).constellation.name, 'Scorpius');
  // The March equinox point sits in Pisces — the horoscope calls it Aries.
  const eq = at(2000, 3, 20);
  assert.ok(eq.longitude < 1 || eq.longitude > 359, `equinox longitude ${eq.longitude}`);
  assert.equal(eq.constellation.name, 'Pisces');
  assert.equal(eq.sign, 'Aries');
  // A date where the two agree.
  const mar = at(1990, 3, 14);
  assert.equal(mar.constellation.name, 'Pisces');
  assert.equal(mar.agree, true);
  // 1 Jan 2001: Sagittarius by the sky, Capricorn by the horoscope.
  assert.equal(at(2001, 1, 1).constellation.name, 'Sagittarius');
  assert.equal(at(2001, 1, 1).sign, 'Capricorn');
});

test('signature is deterministic and maps into the catalog', async () => {
  const a = await cosmicSignature(2447965, 'birthday', CATALOG.length);
  const b = await cosmicSignature(2447965, 'birthday', CATALOG.length);
  assert.equal(a.code, b.code);
  assert.ok(a.index >= 0 && a.index < CATALOG.length);
  const c = await cosmicSignature(2447965, 'anniversary', CATALOG.length);
  assert.notEqual(a.code, c.code);
});

test('every catalog entry is complete', () => {
  const ids = new Set();
  for (const b of CATALOG) {
    for (const k of ['id', 'name', 'kind', 'where', 'grit', 'strength', 'caution', 'forward', 'transmission', 'forWho']) {
      assert.ok(typeof b[k] === 'string' && b[k].length > 0, `${b.id || '?'} missing ${k}`);
    }
    assert.equal(b.facts.length, 3, `${b.id} should have exactly 3 facts`);
    assert.ok(!ids.has(b.id), `duplicate id ${b.id}`);
    ids.add(b.id);
  }
});

test('composePass assembles a full card', async () => {
  const pass = await composePass({
    year: 1990, month: 3, day: 14, occasion: 'birthday', hemisphere: 'north',
    now: new Date(2026, 8, 17),
  });
  assert.equal(pass.jdn, 2447965);
  assert.equal(pass.daysAlive, 13336);
  assert.ok(Math.abs(yearsFromDays(pass.daysAlive) - 36.51) < 0.01);
  assert.equal(pass.lightMail.star.name, 'Arcturus');
  assert.ok(pass.destination.name);
  assert.ok(pass.quantum);
  assert.match(pass.seasonLine, /spring/);
  assert.equal(pass.seasonShort, 'Spring · Northern hemisphere');
  assert.equal(pass.permalink.d, '19900314');
  // Cosmic identity: pronounceable callsign, designation, 7-line address.
  assert.match(pass.identity.callsign, /^[A-Z][a-z]{3,}$/);
  assert.equal(pass.identity.fullName, `${pass.identity.callsign} of ${pass.destination.name}`);
  assert.match(pass.identity.designation, /^BAS-2447965-[A-Z0-9]+$/);
  assert.equal(pass.identity.address.length, 7);
  assert.equal(pass.identity.address.at(-1), 'The Observable Universe');
  assert.equal(pass.image, `img/${pass.destination.id}.jpg`);
  // New card content: moon, broadcast, and the working.
  assert.ok(pass.moon.name && pass.moon.percent >= 0 && pass.moon.percent <= 100);
  assert.match(pass.lightMail.broadcast, /light-years out/);
  assert.match(pass.lightMail.broadcast, /Pollux/);
  assert.ok(pass.working.some((l) => l.includes('= 2447965')), 'working shows the JDN derivation');
  assert.ok(pass.working.some((l) => l.includes('5 × 13 × 13 × 2897')));
  assert.ok(pass.working.some((l) => l.includes('→ Io')));
  assert.equal(pass.sun.constellation, 'Pisces');
  assert.match(pass.sun.line, /IAU fixed in 1930/);
  assert.ok(pass.working.some((l) => l.includes('IAU Pisces spans')));
});

test('callsigns are pronounceable across many dates', async () => {
  // Strict consonant–vowel construction: no vowel pile-ups, no hard clusters,
  // 4–9 letters, capitalised. Sample a spread of dates.
  for (let i = 0; i < 120; i++) {
    const y = 1950 + (i % 70);
    const m = 1 + (i % 12);
    const d = 1 + (i % 28);
    const p = await composePass({ year: y, month: m, day: d, occasion: 'birthday' });
    const n = p.identity.callsign;
    assert.match(n, /^[A-Z][a-z]{3,7}$/, `bad shape: ${n}`);
    assert.doesNotMatch(n.toLowerCase(), /arso|semen|satan/, `blocked word leaked: ${n}`);
    assert.doesNotMatch(n.toLowerCase(), /[aeiou]{3}/, `vowel pile-up: ${n}`);
    assert.doesNotMatch(n.toLowerCase(), /[bcdfghjklmnpqrstvwxz]{3}/, `consonant cluster: ${n}`);
  }
});

test('cosmic identity is deterministic', async () => {
  const a = await composePass({ year: 2001, month: 9, day: 9, occasion: 'milestone' });
  const b = await composePass({ year: 2001, month: 9, day: 9, occasion: 'milestone' });
  assert.equal(a.identity.fullName, b.identity.fullName);
  const c = await composePass({ year: 2001, month: 9, day: 10, occasion: 'milestone' });
  assert.notEqual(a.identity.designation, c.identity.designation);
});

test('every destination has a bundled image and a credit', async () => {
  const { existsSync } = await import('node:fs');
  const { IMAGE_CREDITS } = await import('../js/images.js');
  for (const b of CATALOG) {
    assert.ok(existsSync(new URL(`../img/${b.id}.jpg`, import.meta.url)), `missing img/${b.id}.jpg`);
    assert.ok(IMAGE_CREDITS[b.id]?.credit, `missing credit for ${b.id}`);
  }
});
