// Turns inputs into a complete "cosmic boarding pass" object.
// Pure data out — rendering lives in render.js.

import { julianDayNumber, todayJDN, numberProfile, weekdayOf } from './julian.js';
import {
  yearsFromDays, cosmicOdometer, localDaysLived, lightMail, nextWholeOrbit,
  moonPhase, birthdayBroadcast, DAYS_PER_YEAR, SYNODIC_MONTH, REFERENCE_NEW_MOON_JD,
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

// Names are built as strict consonant–vowel syllables (plus one soft ending),
// so a vowel never lands next to another vowel across a boundary and no hard
// consonant clusters form. "Vitho", "Soren", "Kaleth" — never "Viur".
const ONSETS = ['v', 'l', 'r', 's', 'n', 'k', 'th', 'z', 'd', 'm', 't', 'sh', 'f', 'h'];
const SINGLE_ONSETS = ONSETS.filter((c) => c.length === 1);
const SIBILANTS = new Set(['s', 'sh', 'th', 'z']);
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'o']; // weighted toward open vowels
const OPENERS = ['Or', 'El', 'An', 'Il', 'Ar', 'Es']; // occasional vowel-initial first syllable
const ENDINGS = ['n', 'r', 'th', 'l', 'ne', 'ra', 'na', 'n', 'r', ''];
// Real words and near-words a random generator must never produce.
const BLOCKLIST = ['sex', 'ass', 'tit', 'cum', 'fag', 'nig', 'cok', 'dic', 'fuk', 'shi', 'kil',
  'anal', 'anus', 'arso', 'semen', 'samen', 'satan', 'nazi', 'rape', 'hell', 'porn', 'dildo',
  'moron', 'loser', 'fart', 'poop', 'meth', 'thater', 'damn', 'shat', 'turd', 'vomit', 'hate',
  'dead', 'death', 'dumb', 'fool'];

function cosmicCallsign(hex, start = 8) {
  const bytes = hex.match(/.{2}/g).map((h) => parseInt(h, 16));
  const at = (i) => bytes[(start + i) % bytes.length];
  for (let attempt = 0; attempt < 10; attempt++) {
    const o = attempt * 7;
    const count = at(o) % 10 < 7 ? 2 : 3; // mostly two syllables; three stay rare
    let name = '';
    let afterOpener = false;
    let prevOnset = null;
    let prevVowel = null;
    for (let i = 0; i < count; i++) {
      if (i === 0 && at(o + 1) % 4 === 0) {
        name += OPENERS[at(o + 2) % OPENERS.length];
        afterOpener = true;
        continue;
      }
      // An opener already ends in a consonant, so the next onset must be a
      // single letter — otherwise "Es" + "sha" piles up three consonants.
      const onsets = afterOpener ? SINGLE_ONSETS : ONSETS;
      let oi = at(o + 2 + i * 2) % onsets.length;
      // Don't echo the previous consonant, and don't stack sibilants
      // ("Fofar", "Thashene"): step to the next onset until it's clean.
      for (let k = 0; k < onsets.length; k++) {
        const c = onsets[(oi + k) % onsets.length];
        if (c !== prevOnset && !(SIBILANTS.has(c) && SIBILANTS.has(prevOnset))) { oi = (oi + k) % onsets.length; break; }
      }
      let vi = at(o + 3 + i * 2) % VOWELS.length;
      if (VOWELS[vi] === prevVowel) vi = (vi + 1) % VOWELS.length; // "Tonenin", "Metanan"
      name += onsets[oi] + VOWELS[vi];
      prevOnset = onsets[oi];
      prevVowel = VOWELS[vi];
      afterOpener = false;
    }
    name += ENDINGS[at(o + 6) % ENDINGS.length];
    name = name[0].toUpperCase() + name.slice(1);
    const lower = name.toLowerCase();
    const letterCounts = {};
    for (const ch of lower) letterCounts[ch] = (letterCounts[ch] || 0) + 1;
    const ok = name.length >= 4 && name.length <= 8           // crisp: "Thanera", never "Shuhavora"
      && !/[aeiou]{3}/.test(lower)                       // no vowel pile-ups
      && Math.max(...Object.values(letterCounts)) <= 2     // no letter more than twice
      && !BLOCKLIST.some((b) => lower.includes(b));
    if (ok) return name;
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

const cap = (s) => s[0].toUpperCase() + s.slice(1);

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

  // The Moon that night, and where the light that left Earth that day is now.
  const moon = moonPhase(jdn);
  const bc = birthdayBroadcast(ageYears);
  const broadcastLine = bc.last
    ? `Meanwhile the light — and the radio — that left Earth the day you were ${occ.dateWord} is ${fmt(ageYears, 1)} light-years out. It passed ${bc.last.name} about ${bc.lastYearsAgo < 1 ? 'this year' : fmt(bc.lastYearsAgo) + (bc.lastYearsAgo < 2 ? ' year ago' : ' years ago')}${bc.next ? `; it reaches ${bc.next.name} in ${bc.nextInYears < 1 ? 'less than a year' : fmt(bc.nextInYears) + (bc.nextInYears < 2 ? ' year' : ' years')}.` : '.'}`
    : `Meanwhile the light that left Earth the day you were ${occ.dateWord} is ${fmt(ageYears, 1)} light-years out — it hasn't reached the nearest star yet. Proxima Centauri is ${bc.next.ly} light-years away; your broadcast arrives there in ${fmt(bc.nextInYears, 1)} years.`;

  // "Show the working": the actual arithmetic behind this card, numbers in.
  const a = Math.floor((14 - month) / 12);
  const yy = year + 4800 - a;
  const mm = month + 12 * a - 3;
  const cycles = (jdn + 0.5 - REFERENCE_NEW_MOON_JD) / SYNODIC_MONTH;
  const working = [
    `Julian Day Number`,
    `  a = floor((14 − ${month}) / 12) = ${a}`,
    `  y = ${year} + 4800 − ${a} = ${yy}`,
    `  m = ${month} + 12·${a} − 3 = ${mm}`,
    `  JDN = ${day} + floor((153·${mm} + 2)/5) + 365·${yy} + floor(${yy}/4) − floor(${yy}/100) + floor(${yy}/400) − 32045`,
    `      = ${day} + ${Math.floor((153 * mm + 2) / 5)} + ${365 * yy} + ${Math.floor(yy / 4)} − ${Math.floor(yy / 100)} + ${Math.floor(yy / 400)} − 32045 = ${jdn}`,
    `  weekday = ${jdn} mod 7 = ${jdn % 7} → ${weekdayOf(jdn)}`,
    ``,
    `Days alive`,
    `  today (JDN ${today}) − ${jdn} = ${daysAlive} days ÷ ${DAYS_PER_YEAR} = ${ageYears.toFixed(2)} years`,
    ``,
    `The number itself`,
    `  ${jdn} = ${profile.factorString}`,
    `  digital root: 1 + (${jdn} − 1) mod 9 = ${profile.digitalRoot}`,
    ``,
    `Cosmic odometer`,
    ...odometer.map((o) => `  ${daysAlive} ÷ ${o.periodDays} = ${o.orbits.toFixed(2)} ${o.name} orbits`),
    ``,
    `Light-mail`,
    `  nearest star to ${ageYears.toFixed(2)} ly: ${lm.star.name} at ${lm.star.ly} ly (|Δ| = ${Math.abs(lm.departedAgeYears).toFixed(2)} yr)`,
    ``,
    `The Moon that night`,
    `  (${jdn} + 0.5 − ${REFERENCE_NEW_MOON_JD}) ÷ ${SYNODIC_MONTH} = ${cycles.toFixed(3)} lunations`,
    `  fractional part ${moon.phase.toFixed(3)} → ${moon.name}; illumination (1 − cos 2πφ)/2 = ${Math.round(moon.illumination * 100)}%`,
    ``,
    `Destination`,
    `  SHA-256("born-among-stars|${jdn}|${occasion}") = ${sig.hex.slice(0, 16)}…`,
    `  0x${sig.hex.slice(0, 8)} mod ${CATALOG_SIZE} = ${sig.index} → ${body.name}`,
  ];

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
    lightMail: { ...lm, line: lightMailLine(lm, year, occ.dateWord), broadcast: broadcastLine },
    moon: {
      ...moon,
      percent: Math.round(moon.illumination * 100),
      label: `${moon.name} · ${Math.round(moon.illumination * 100)}% lit`,
    },
    working,
    quantum: QUANTUM_LINES[sig.salt % QUANTUM_LINES.length],
    seasonLine:
      hemisphere === 'north' || hemisphere === 'south'
        ? `It was ${season(month, hemisphere)} where you were, in the ${hemisphere}ern hemisphere.`
        : null,
    // Compact form for the ticket-fields row.
    seasonShort:
      hemisphere === 'north' || hemisphere === 'south'
        ? `${cap(season(month, hemisphere))} · ${cap(hemisphere)}ern hemisphere`
        : null,
    permalink: { d: `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`, o: occasion, h: hemisphere },
  };
}
