// Turns inputs into a complete "cosmic boarding pass" object.
// Pure data out — rendering lives in render.js.

import { julianDayNumber, todayJDN, numberProfile, weekdayOf } from './julian.js';
import {
  yearsFromDays, cosmicOdometer, localDaysLived, lightMail, nextWholeOrbit,
} from './astronomy.js';
import { cosmicSignature } from './signature.js';
import { CATALOG, CATALOG_SIZE } from './catalog.js';

export const OCCASIONS = {
  birthday:    { label: 'Birthday',    headline: 'Born among stars',    dateWord: 'born' },
  anniversary: { label: 'Anniversary', headline: 'Aligned among stars', dateWord: 'aligned' },
  milestone:   { label: 'Milestone',   headline: 'Marked among stars',  dateWord: 'marked' },
  because:     { label: 'Just because', headline: 'Found among stars',  dateWord: 'found' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

const QUANTUM_LINES = [
  'Before you opened this card, your destination was in superposition. You collapsed it by looking. That is how it works.',
  'Quantum tunnelling: particles routinely pass through barriers they do not have the energy to climb. So, apparently, do you.',
  'Heisenberg: you cannot know exactly where you are and exactly where you are going at the same time. Pick one for this year. The other will follow.',
  'Two entangled particles share a state across any distance. Somebody, somewhere, is still correlated with you. Call them.',
  'Decoherence is what happens when a quantum system gets tangled up with everything around it and loses its cleverness. Guard a little isolation this year.',
  'The vacuum is never empty; it flickers with things that almost happened. Some of your almosts are still flickering. Fund one.',
];

// ── Cosmic identity ───────────────────────────────────────────────────────
// We never ask for a name, so we issue one: a pronounceable callsign built
// from the signature bytes (deterministic — same date, same name forever),
// plus a catalogue-style designation and an address that runs outward from
// the destination to the edge of the observable universe.

const SYLLABLES = ['ve', 'la', 'ri', 'so', 'ne', 'ka', 'tho', 'zar', 'mi', 'del', 'or', 'an',
  'el', 'ys', 'ta', 'lu', 'no', 'sa', 'vi', 'ren', 'ith', 'dra', 'lo', 'um', 'ar', 'es', 'on',
  'ia', 'ur', 'tel', 'ma', 'is'];
// Guard against accidental unfortunate syllable collisions.
const BLOCKLIST = ['sex', 'ass', 'tit', 'cum', 'fag', 'nig', 'cok', 'dic', 'fuk', 'shi', 'kil'];

function cosmicCallsign(hex, start = 8) {
  const bytes = hex.match(/.{2}/g).map((h) => parseInt(h, 16));
  for (let attempt = 0; attempt < 8; attempt++) {
    const count = 2 + (bytes[(start + attempt) % bytes.length] % 2); // 2 or 3 syllables
    let name = '';
    for (let i = 0; i < count; i++) {
      name += SYLLABLES[bytes[(start + attempt + 1 + i * 3) % bytes.length] % SYLLABLES.length];
    }
    name = name[0].toUpperCase() + name.slice(1);
    if (!BLOCKLIST.some((b) => name.toLowerCase().includes(b))) return name;
  }
  return 'Orion';
}

function season(month, hemisphere) {
  const north = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer',
    'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'][month - 1];
  if (hemisphere === 'south') {
    return { winter: 'summer', spring: 'autumn', summer: 'winter', autumn: 'spring' }[north];
  }
  return north;
}

function fmt(n, digits = 0) {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function numberNote(p) {
  if (p.isPrime) {
    return `Your day number is prime. Nothing divides it cleanly. Take the hint.`;
  }
  if (p.repeatedPrimes.length) {
    const q = p.repeatedPrimes[0];
    return `Your day factors as ${p.factorString} — the prime ${q} appears more than once. It is entangled with itself. Cute.`;
  }
  if (p.isPalindrome) {
    return `Your day number reads the same forwards and backwards — time-symmetric, like a law of physics.`;
  }
  return `Your day factors as ${p.factorString}: ${p.distinctPrimes} distinct primes, the largest being ${fmt(p.largestPrime)}. Nobody else’s day factors quite like that.`;
}

function lightMailLine(lm, birthYear, dateWord) {
  const { star, departedAgeYears } = lm;
  const abs = Math.abs(departedAgeYears);
  const base = `${star.name} is ${star.ly} light-years away — ${star.note}. The light arriving from it tonight`;
  if (abs < 1) return `${base} left that star around the time you were ${dateWord}. It has been on its way your whole life, and it lands now.`;
  if (departedAgeYears > 0) {
    return `${base} left that star when you were about ${fmt(abs)} years old. Whatever you were doing then, it has been travelling toward you ever since.`;
  }
  return `${base} left that star about ${fmt(abs)} years before ${birthYear}. It was already on its way to this moment before you existed.`;
}

/**
 * @param {object} input
 * @param {number} input.year
 * @param {number} input.month   1–12
 * @param {number} input.day
 * @param {string} input.occasion   key of OCCASIONS
 * @param {string} [input.hemisphere]  'north' | 'south' | 'skip'
 * @param {Date}   [input.now]
 */
export async function composePass(input) {
  const { year, month, day, occasion = 'birthday', hemisphere = 'skip', now = new Date() } = input;
  const occ = OCCASIONS[occasion] || OCCASIONS.birthday;

  const jdn = julianDayNumber(year, month, day);
  const today = todayJDN(now);
  const daysAlive = today - jdn;
  const ageYears = yearsFromDays(daysAlive);
  const profile = numberProfile(jdn);
  const sig = await cosmicSignature(jdn, occasion, CATALOG_SIZE);
  const body = CATALOG[sig.index];

  // Odometer: the four most story-worthy bodies for this age.
  const odo = cosmicOdometer(daysAlive);
  const pick = (name) => odo.find((o) => o.name === name);
  const odometer = [pick('Mercury'), pick('Mars'), pick('Jupiter'), pick('Saturn')];
  if (ageYears >= 84) odometer.push(pick('Uranus'));
  const next = nextWholeOrbit(daysAlive);

  const local = localDaysLived(daysAlive);
  const jupiterDays = local.find((l) => l.name === 'Jupiter').days;
  const venusDays = local.find((l) => l.name === 'Venus').days;

  const lm = lightMail(ageYears);

  const dateLabel = `${day} ${MONTHS[month - 1]} ${year}`;
  const weekday = weekdayOf(jdn);

  const callsign = cosmicCallsign(sig.hex);
  const fullName = `${callsign} of ${body.name}`;
  const jupiterOrbitsDone = Math.floor(pick('Jupiter').orbits);

  return {
    occasion: occ,
    date: { year, month, day, label: dateLabel, weekday },
    jdn,
    signature: sig.code,
    identity: {
      callsign,
      fullName,
      designation: `BAS-${jdn}-${body.id.toUpperCase().replace(/-/g, '')}`,
      // Real all the way out: the Sun sits in the Orion Arm, the Milky Way in
      // the Local Group, which belongs to the Laniakea Supercluster.
      address: [
        fullName,
        `${body.name}, ${body.kind}`,
        `Orbit ${jupiterOrbitsDone} of Jupiter · Sector ${profile.digitalRoot}`,
        'The Solar System, Orion Arm',
        'The Milky Way, Local Group',
        'Laniakea Supercluster',
        'The Observable Universe',
      ],
      line: `No name required — the cosmos issued you one. From today you travel as ${fullName}.`,
    },
    image: `img/${body.id}.jpg`,
    daysAlive,
    ageYears,
    destination: body,
    number: {
      ...profile,
      note: numberNote(profile),
      rootLine: `Digital root ${profile.digitalRoot} — the single digit left when you keep adding your day’s digits until one remains.`,
    },
    odometer: odometer.map((o) => ({ ...o, orbitsLabel: fmt(o.orbits, 2) })),
    nextOrbit: {
      ...next,
      line: `In ${fmt(next.inDays)} days you complete orbit ${next.next} of ${next.name}. Nobody else will throw you that party. Throw it yourself.`,
    },
    smile: [
      `You have lived about ${fmt(jupiterDays)} Jupiter days and only ${fmt(venusDays)} Venusian ones. Venus really does take its time.`,
      body.lightMinutes != null
        ? `Sunlight takes ${fmt(body.lightMinutes, 1)} minutes to reach ${body.name}. Your card took less.`
        : null,
    ].filter(Boolean),
    lightMail: { ...lm, line: lightMailLine(lm, year, occ.dateWord) },
    quantum: QUANTUM_LINES[sig.salt % QUANTUM_LINES.length],
    seasonLine:
      hemisphere === 'north' || hemisphere === 'south'
        ? `It was ${season(month, hemisphere)} where you were, in the ${hemisphere}ern hemisphere.`
        : null,
    permalink: { d: `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`, o: occasion, h: hemisphere },
  };
}
