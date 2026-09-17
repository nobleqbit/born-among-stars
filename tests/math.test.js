import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  julianDayNumber, fromJulianDayNumber, primeFactors, digitalRoot, numberProfile, weekdayOf,
} from '../js/julian.js';
import { lightMail, cosmicOdometer, nextWholeOrbit, yearsFromDays } from '../js/astronomy.js';
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
  assert.equal(pass.permalink.d, '19900314');
});
