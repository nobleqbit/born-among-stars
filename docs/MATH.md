# How a card is made

Every line on a boarding pass is either (a) arithmetic you can check by hand, (b) a published astronomical value, or (c) a fair hash. Nothing is invented, and nothing about you is stored. Here is the whole pipeline.

## 1. Your date becomes one integer: the Julian Day Number

Astronomers don't use calendars; they count days. The **Julian Day Number (JDN)** is the number of days since noon on 1 January 4713 BC. For a Gregorian date `(Y, M, D)`:

```
a   = floor((14 − M) / 12)
y   = Y + 4800 − a
m   = M + 12a − 3
JDN = D + floor((153m + 2) / 5) + 365y + floor(y/4) − floor(y/100) + floor(y/400) − 32045
```

Example: 14 March 1990 → **2447965**. (Check: 1 January 1970 → 2440588, a well-known value.)

The JDN is the seed for everything below. `JDN mod 7` also gives the weekday directly (0 = Monday).

## 2. The number itself

Plain number theory on the JDN:

- **Prime factorisation** — e.g. 2447965 = 5 × 13 × 13 × 2897. A repeated prime earns the "entangled with itself" line; a prime JDN earns "indivisible".
- **Digital root** — repeatedly sum the digits until one remains: `1 + (n − 1) mod 9`.
- **Palindrome check** — the string reads the same reversed.

None of this predicts anything. It's a fingerprint of the day.

## 3. Cosmic odometer

Days alive = today's JDN − your JDN. Divide by each body's sidereal orbital period (NASA planetary fact sheets):

| Body | Period (Earth days) |
|---|---|
| Mercury | 87.969 |
| Venus | 224.701 |
| Mars | 686.98 |
| Ceres | 1681.6 |
| Jupiter | 4332.589 |
| Saturn | 10759.22 |
| Uranus | 30688.5 |
| Neptune | 60182 |
| Pluto | 90560 |
| Halley's Comet | 27759 |

"3.08 Jupiter orbits" means you have been alive for 3.08 Jupiter years. The **next whole orbit** line finds the soonest date on which you complete an integer number of orbits of any body — a birthday only the solar system keeps.

Local days lived use each planet's **solar day** (noon to noon), e.g. Jupiter 9.93 h, Venus 2802 h (Venus rotates backwards, so its solar day is much shorter than its 243-day sidereal rotation).

## 4. Light-mail

Light from a star `d` light-years away left it `d` years ago. So we choose the catalogued star whose distance is closest to your age in years, and state exactly when that light departed relative to your life:

- |age − d| < 1 → "left around the time you were born"
- age > d → "left when you were about (age − d) years old"
- age < d → "left about (d − age) years before you were born"

All three are literally true. Distances are rounded published values (Hipparcos/Gaia). The list runs from Proxima Centauri (4.25 ly) to Deneb (2600 ly), spaced so most human ages have a neighbour within a year or two.

### Your birthday broadcast

The mirror image of light-mail. Light and radio that left Earth on your date have travelled `age` light-years by now. We sort the same star table by distance and report the last star that light has already passed (`ly ≤ age`) and the next one it will reach (`ly > age`), with the years since/until. For anyone under 4.25 years the broadcast hasn't reached Proxima Centauri yet, and the card says so.

## 4b. The Moon that night

A mean-lunation calculation. It ignores the Moon's uneven orbital speed, so it can be up to about a day off the true phase — plenty to name the phase and quote illumination to a few percent:

```
lunations = (JDN + 0.5 − 2451550.26) / 29.530588853
φ         = lunations − floor(lunations)        0 = new, 0.5 = full
illum     = (1 − cos 2πφ) / 2
```

`2451550.26` is the Julian Date of the new moon of 6 January 2000, 18:14 UTC (JD 2451550.0 is noon that day); `29.530588853` days is the mean synodic month. Names follow the usual eight phases with the primary phases (new, quarters, full) given a ±0.0375-cycle window (about 1.1 days), which absorbs the drift between the mean lunation used here and the true one. The little moon drawn on the card uses the same φ: the terminator is an ellipse of x-radius |cos 2πφ|, lit on the right while waxing.

## 5. The destination (the only random part — and it's not random)

```
hash  = SHA-256("born-among-stars|" + JDN + "|" + occasion)
index = int(hash[0:8], 16) mod catalogSize
code  = hash[0:8] + "-" + hash[8:16]   ← printed as SIG on the card
```

This is a **fair, reproducible assignment**, not a prediction. The same date and occasion always produce the same destination and the same SIG, so a card can be shared as a link and regenerated identically. Changing the occasion changes the hash, so your birthday and your anniversary land in different places. A second slice of the hash picks the quantum note.

We say this plainly on the site because the delight should come from the real astronomy attached to your date, not from pretending the universe chose you.

## 5b. Show the working

Every card carries a "Show the working" panel under *The rest of the manifest* that prints all of the above with *that card's* numbers substituted — the JDN formula line by line, the factorisation, each odometer division, the light-mail nearest-neighbour test, the lunation arithmetic, and the first 16 hex digits of the hash with the `mod` that picks the destination. Nothing on the card is asserted without the arithmetic being one click away.

## 6. Privacy, structurally

There is no backend. The page is static HTML/JS served from GitHub Pages; all computation runs in your browser; the permalink encodes only `d=YYYYMMDD`, `o=occasion`, and optionally `h=hemisphere`. No name is asked for, nothing is sent, nothing is stored. You can confirm this in your browser's network inspector: after the page loads, there are no requests.

## 7. Cosmic identity

We never ask for a name, so the card issues one — deterministically, from the same SHA-256 as the destination:

- **Callsign** — the hash bytes (from byte 8 onward) build 2 or 3 strict consonant–vowel syllables (onsets `v l r s n k th z d m t sh f h c ly`, vowels weighted toward `a e o`, an occasional vowel-initial opener like `Or-`/`El-`) plus one soft ending (`-n -r -th -s -l -ne -ra -na`). The construction guarantees no vowel pile-ups or consonant clusters, never echoes a consonant or vowel across consecutive syllables, never stacks two sibilants, and never uses a letter more than twice; a length check (4–8 letters) and a blocklist of real words and near-words reject the rest and move to the next bytes. Same date and occasion → same callsign, forever. The full name is `<callsign> of <destination>`.
- **Designation** — `BAS-<JDN>-<DESTINATION ID>`, e.g. `BAS-2447965-IO`. Plain concatenation; readable as a catalogue entry.
- **Address** — seven lines running outward, and every line past the first two is real: your destination; `Orbit N of Jupiter` (whole Jupiter orbits you've completed) and `Sector D` (your digital root); **the Solar System, Orion Arm** (the Sun really does sit in the Orion–Cygnus Arm); **the Milky Way, Local Group**; **Laniakea Supercluster** (our home supercluster, mapped in 2014); **the Observable Universe**.

## Sources

- Julian Day algorithm: Meeus, *Astronomical Algorithms*; also the standard USNO formulation.
- Orbital periods and day lengths: NASA Planetary Fact Sheets (nssdc.gsfc.nasa.gov).
- Star distances: Hipparcos / Gaia DR3 as commonly tabulated.
- Catalogue facts: NASA, ESA, and mission pages for each body; each entry's three facts are individually checkable.
