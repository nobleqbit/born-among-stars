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
