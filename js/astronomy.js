// Real astronomy, kept honest. Every number here is a published value
// (NASA fact sheets, Hipparcos/Gaia distances). Nothing is invented.

export const DAYS_PER_YEAR = 365.2422; // mean tropical year

/** Sidereal orbital periods in Earth days. */
export const ORBITS = [
  { name: 'Mercury', days: 87.969 },
  { name: 'Venus', days: 224.701 },
  { name: 'Mars', days: 686.98 },
  { name: 'Ceres', days: 1681.6 },
  { name: 'Jupiter', days: 4332.589 },
  { name: 'Saturn', days: 10759.22 },
  { name: 'Uranus', days: 30688.5 },
  { name: 'Neptune', days: 60182 },
  { name: 'Pluto', days: 90560 },
  { name: "Halley's Comet", days: 27759 },
];

/**
 * Length of a solar day (noon to noon) in Earth hours. Venus's solar day is
 * far shorter than its 243-day sidereal rotation because it spins backwards.
 */
export const SOLAR_DAY_HOURS = [
  { name: 'Mercury', hours: 4222.6 },
  { name: 'Venus', hours: 2802 },
  { name: 'Mars', hours: 24.66 },
  { name: 'Jupiter', hours: 9.93 },
  { name: 'Saturn', hours: 10.66 },
  { name: 'Uranus', hours: 17.24 },
  { name: 'Neptune', hours: 16.11 },
  { name: 'Pluto', hours: 153.3 },
];

/** Mean light travel time from the Sun, in minutes. */
export const LIGHT_MINUTES = {
  Mercury: 3.2, Venus: 6.0, Earth: 8.3, Mars: 12.7, Ceres: 23.0,
  Jupiter: 43.3, Saturn: 79.3, Uranus: 159.6, Neptune: 250.1, Pluto: 328.0,
};

/**
 * Stars with distances in light-years, chosen so that most human ages have
 * a neighbour within a year or two. Distances rounded to published values.
 */
export const STARS = [
  { name: 'Proxima Centauri', ly: 4.25, note: 'the nearest star to the Sun' },
  { name: "Barnard's Star", ly: 5.96, note: 'the fastest-moving star in our sky' },
  { name: 'Wolf 359', ly: 7.86, note: 'a faint red dwarf, famous mostly to Trekkies' },
  { name: 'Sirius', ly: 8.6, note: 'the brightest star in the night sky' },
  { name: 'Epsilon Eridani', ly: 10.5, note: 'a young sun with a dusty planet-forming disk' },
  { name: '61 Cygni', ly: 11.4, note: 'the first star whose distance was ever measured' },
  { name: 'Procyon', ly: 11.5, note: "the Little Dog's bright star" },
  { name: 'Tau Ceti', ly: 11.9, note: 'a sun-like star with at least four planets' },
  { name: 'Altair', ly: 16.7, note: 'a star spinning so fast it bulges at the equator' },
  { name: 'Vega', ly: 25.0, note: 'the star that will be our North Star in 12,000 years' },
  { name: 'Fomalhaut', ly: 25.1, note: 'a star ringed by a vast dusty belt' },
  { name: 'Pollux', ly: 33.8, note: 'an orange giant with a planet of its own' },
  { name: 'Arcturus', ly: 36.7, note: 'the brightest star of the northern spring' },
  { name: 'Capella', ly: 42.9, note: 'actually two giant stars orbiting each other' },
  { name: 'Castor', ly: 51, note: 'six stars pretending to be one' },
  { name: 'Aldebaran', ly: 65.3, note: "the red eye of Taurus" },
  { name: 'Regulus', ly: 79.3, note: "the heart of Leo, spinning near breakup speed" },
  { name: 'Mizar', ly: 83, note: 'the star in the Big Dipper’s handle with a hidden companion' },
  { name: 'Alkaid', ly: 104, note: 'the tip of the Big Dipper’s handle' },
  { name: 'Dubhe', ly: 123, note: 'the Big Dipper’s pointer star' },
  { name: 'Achernar', ly: 139, note: 'the flattest star known — spinning itself into a lens' },
  { name: 'Spica', ly: 250, note: 'the blue-white ear of grain in Virgo' },
  { name: 'Canopus', ly: 310, note: 'the second-brightest star in the sky' },
  { name: 'Polaris', ly: 433, note: 'the North Star, which is really three stars' },
  { name: 'Betelgeuse', ly: 548, note: 'a red supergiant preparing to explode' },
  { name: 'Antares', ly: 550, note: 'the rival of Mars, so large it would swallow Jupiter' },
  { name: 'Rigel', ly: 860, note: "Orion's blue-white foot" },
  { name: 'Deneb', ly: 2600, note: 'one of the most luminous stars we can see by eye' },
];

/** Age in Earth years from days alive. */
export function yearsFromDays(days) {
  return days / DAYS_PER_YEAR;
}

/** Orbits completed around the Sun for every body in ORBITS. */
export function cosmicOdometer(daysAlive) {
  return ORBITS.map(({ name, days }) => ({
    name,
    orbits: daysAlive / days,
    periodDays: days,
  }));
}

/** How many local solar days you have lived on each planet. */
export function localDaysLived(daysAlive) {
  return SOLAR_DAY_HOURS.map(({ name, hours }) => ({
    name,
    days: (daysAlive * 24) / hours,
  }));
}

/**
 * Light-mail: the star whose distance in light-years is closest to your age.
 * Light arriving from it tonight left it `ly` years ago — so we can say
 * exactly when in your life (or before it) that light departed. Always true.
 */
export function lightMail(ageYears) {
  let best = STARS[0];
  for (const s of STARS) {
    if (Math.abs(s.ly - ageYears) < Math.abs(best.ly - ageYears)) best = s;
  }
  const departedAgeYears = ageYears - best.ly; // negative = before you were born
  return { star: best, departedAgeYears };
}

/**
 * Next "cosmic birthday": the next date on which you complete a whole number
 * of orbits of some planet. Returns the soonest across all bodies.
 */
export function nextWholeOrbit(daysAlive) {
  let soonest = null;
  for (const { name, days } of ORBITS) {
    const done = Math.floor(daysAlive / days);
    const next = done + 1;
    const inDays = next * days - daysAlive;
    if (!soonest || inDays < soonest.inDays) soonest = { name, next, inDays };
  }
  return soonest;
}

// ── Moon phase ────────────────────────────────────────────────────────────
// Mean synodic month and a reference new moon: 6 January 2000, 18:14 UTC,
// which is Julian Date 2451550.26 (JD 2451550.0 = noon that day).
// A mean-lunation calculation ignores the Moon's uneven orbital speed, so
// it can be up to about a day off the true phase — plenty for naming the
// phase and quoting illumination to the nearest few percent.
export const SYNODIC_MONTH = 29.530588853;
export const REFERENCE_NEW_MOON_JD = 2451550.26;

// Primary phases (new, quarters, full) get a ±0.0375-cycle window (~1.1 days),
// which absorbs the mean-vs-true lunation drift of the simple method.
const PHASE_NAMES = [
  [0.0375, 'New Moon'], [0.2125, 'Waxing Crescent'], [0.2875, 'First Quarter'],
  [0.4625, 'Waxing Gibbous'], [0.5375, 'Full Moon'], [0.7125, 'Waning Gibbous'],
  [0.7875, 'Last Quarter'], [0.9625, 'Waning Crescent'], [1.0001, 'New Moon'],
];

/** Moon phase at noon on a Julian Day Number. */
export function moonPhase(jdn) {
  const cycles = (jdn + 0.5 - REFERENCE_NEW_MOON_JD) / SYNODIC_MONTH;
  const phase = cycles - Math.floor(cycles); // 0 = new, 0.5 = full
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const name = PHASE_NAMES.find(([upTo]) => phase < upTo)[1];
  return { phase, illumination, name, waxing: phase < 0.5, cycles };
}

// ── Birthday broadcast ────────────────────────────────────────────────────
/**
 * Light (and radio) that left Earth on the birth date is now `ageYears`
 * light-years out. Which star did it pass most recently, and which is next?
 */
export function birthdayBroadcast(ageYears) {
  const sorted = [...STARS].sort((a, b) => a.ly - b.ly);
  const passed = sorted.filter((s) => s.ly <= ageYears);
  const last = passed[passed.length - 1] || null;
  const next = sorted.find((s) => s.ly > ageYears) || null;
  return {
    distanceLy: ageYears,
    last,
    lastYearsAgo: last ? ageYears - last.ly : null,
    next,
    nextInYears: next ? next.ly - ageYears : null,
  };
}

// ── Where the Sun stood ───────────────────────────────────────────────────
// The Sun's apparent ecliptic longitude on the date (low-precision formula,
// good to ~0.01°), then which IAU constellation that longitude falls in.
// These are the astronomers' boundaries, fixed by the IAU in 1930 — not the
// twelve equal 30° "signs" of the horoscope, which drifted off the real
// constellations two millennia ago. The ecliptic crosses thirteen.

/** IAU constellation boundaries along the ecliptic, J2000 longitudes (degrees). */
export const ECLIPTIC_CONSTELLATIONS = [
  { name: 'Pisces',       from: 351.57, to: 29.05,  days: 38 },
  { name: 'Aries',        from: 29.05,  to: 53.47,  days: 25 },
  { name: 'Taurus',       from: 53.47,  to: 90.43,  days: 37 },
  { name: 'Gemini',       from: 90.43,  to: 118.26, days: 31 },
  { name: 'Cancer',       from: 118.26, to: 138.18, days: 21 },
  { name: 'Leo',          from: 138.18, to: 174.15, days: 37 },
  { name: 'Virgo',        from: 174.15, to: 217.80, days: 45 },
  { name: 'Libra',        from: 217.80, to: 241.14, days: 23 },
  { name: 'Scorpius',     from: 241.14, to: 248.03, days: 7 },
  { name: 'Ophiuchus',    from: 248.03, to: 266.60, days: 18 },
  { name: 'Sagittarius',  from: 266.60, to: 299.71, days: 32 },
  { name: 'Capricornus',  from: 299.71, to: 327.89, days: 28 },
  { name: 'Aquarius',     from: 327.89, to: 351.57, days: 24 },
];

/** The twelve tropical signs the horoscope uses: equal 30° slices from 0° Aries. */
export const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const norm360 = (x) => ((x % 360) + 360) % 360;
const rad = (deg) => (deg * Math.PI) / 180;

/** Apparent geocentric ecliptic longitude of the Sun at noon on a JDN, equinox of date,
 *  with the intermediate quantities so the card can show the working. */
export function sunLongitudeParts(jdn) {
  const n = jdn - 2451545.0; // days since J2000.0 (noon, 1 Jan 2000)
  const L = norm360(280.460 + 0.9856474 * n);   // mean longitude
  const g = norm360(357.528 + 0.9856003 * n);   // mean anomaly
  const lon = norm360(L + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2 * g)));
  return { n, L, g, lon };
}
export const sunLongitude = (jdn) => sunLongitudeParts(jdn).lon;

/**
 * Which constellation the Sun was in front of, plus what the horoscope would
 * have said. Longitude of date is brought to J2000 (precession ≈ 0.01397°/yr)
 * before comparing against the J2000 boundaries.
 */
export function sunConstellation(jdn, year) {
  const parts = sunLongitudeParts(jdn);
  const lonOfDate = parts.lon;
  const lonJ2000 = norm360(lonOfDate - 0.013969 * (year - 2000));
  const constellation = ECLIPTIC_CONSTELLATIONS.find(({ from, to }) =>
    from < to ? (lonJ2000 >= from && lonJ2000 < to) : (lonJ2000 >= from || lonJ2000 < to));
  const sign = ZODIAC_SIGNS[Math.floor(lonOfDate / 30)];
  // "Scorpius" vs the horoscope's "Scorpio", "Capricornus" vs "Capricorn".
  const same = constellation.name.startsWith(sign.slice(0, 5));
  return { ...parts, longitude: lonOfDate, longitudeJ2000: lonJ2000, constellation, sign, agree: same };
}
