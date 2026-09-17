// Julian Day Number and the number theory we hang off it.
//
// The JDN is the count of days since noon on 1 January 4713 BC (proleptic
// Julian calendar). It is the timekeeping system astronomers actually use —
// every date collapses to one integer, and that integer is the seed for
// everything else on the card.

/** Gregorian calendar date → Julian Day Number (integer, noon-based). */
export function julianDayNumber(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/** Julian Day Number → { year, month, day } (Gregorian). */
export function fromJulianDayNumber(jdn) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10),
  };
}

/** JDN of today's date in the viewer's local timezone. */
export function todayJDN(now = new Date()) {
  return julianDayNumber(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Prime factorisation, smallest factor first, with repeats. */
export function primeFactors(n) {
  const out = [];
  let x = n;
  for (let p = 2; p * p <= x; p += p === 2 ? 1 : 2) {
    while (x % p === 0) {
      out.push(p);
      x /= p;
    }
  }
  if (x > 1) out.push(x);
  return out;
}

export function isPrime(n) {
  return n > 1 && primeFactors(n).length === 1;
}

/** Repeated digit sum until a single digit (1–9). */
export function digitalRoot(n) {
  return n === 0 ? 0 : 1 + ((n - 1) % 9);
}

export function isPalindrome(n) {
  const s = String(n);
  return s === [...s].reverse().join('');
}

/** Sum of the digits, once. */
export function digitSum(n) {
  return String(n).split('').reduce((acc, ch) => acc + Number(ch), 0);
}

/**
 * Everything the card says about the number itself, in one object.
 * All of it is plain arithmetic anyone can check by hand.
 */
export function numberProfile(jdn) {
  const factors = primeFactors(jdn);
  const counts = new Map();
  for (const f of factors) counts.set(f, (counts.get(f) || 0) + 1);
  const repeated = [...counts.entries()].filter(([, c]) => c > 1).map(([p]) => p);
  return {
    jdn,
    factors,
    factorString: factors.join(' × '),
    isPrime: factors.length === 1,
    distinctPrimes: counts.size,
    repeatedPrimes: repeated,
    largestPrime: factors[factors.length - 1],
    digitalRoot: digitalRoot(jdn),
    digitSum: digitSum(jdn),
    isPalindrome: isPalindrome(jdn),
    isEven: jdn % 2 === 0,
    mod7: jdn % 7, // weekday: 0 = Monday in JDN convention
  };
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Day of the week straight from the JDN — no Date object needed. */
export function weekdayOf(jdn) {
  return WEEKDAYS[jdn % 7];
}
