/** All ISO 3166-1 alpha-2 country codes (249). Names come from Intl.DisplayNames with a few overrides. */
const CODES = (
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI ' +
  'CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR ' +
  'GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU ' +
  'LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL ' +
  'PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO ' +
  'TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
).split(' ');

const OVERRIDES: Record<string, string> = {
  GB: 'United Kingdom', IE: 'Ireland', US: 'United States', HK: 'Hong Kong', MO: 'Macao', KR: 'South Korea', KP: 'North Korea',
  PS: 'Palestinian Territories', CD: 'Congo (DRC)', CG: 'Congo (Republic)', CI: "Côte d'Ivoire", MM: 'Myanmar', VA: 'Vatican City',
  UM: 'U.S. Outlying Islands', VI: 'U.S. Virgin Islands', VG: 'British Virgin Islands', FM: 'Micronesia', TL: 'Timor-Leste',
};

export interface Country { code: string; name: string; flag: string }

/** Flag emoji from regional-indicator code points (no image assets needed). */
export function flagOf(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

let names: Intl.DisplayNames | null = null;
function nameOf(code: string): string {
  if (OVERRIDES[code]) return OVERRIDES[code];
  try {
    names ??= new Intl.DisplayNames(['en-GB'], { type: 'region' });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Pinned to the top of every country list (spec: UK, Ireland, divider, then A to Z). */
export const PINNED_COUNTRIES = ['GB', 'IE'] as const;

let all: Country[] | null = null;
/** UK, Ireland, then every other country A to Z. */
export function allCountries(): Country[] {
  if (all) return all;
  const list = CODES.map((code) => ({ code, name: nameOf(code), flag: flagOf(code) }));
  const pinned = PINNED_COUNTRIES.map((c) => list.find((x) => x.code === c)!);
  const rest = list.filter((x) => !PINNED_COUNTRIES.includes(x.code as 'GB')).sort((a, b) => a.name.localeCompare(b.name, 'en'));
  all = [...pinned, ...rest];
  return all;
}

const byCode = new Map<string, Country>();
export function countryByCode(code: string): Country {
  if (!byCode.size) allCountries().forEach((c) => byCode.set(c.code, c));
  return byCode.get(code) ?? { code, name: code, flag: flagOf(code) };
}
export const countryName = (code: string) => countryByCode(code).name;
