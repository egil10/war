// country name -> ISO 3166-1 alpha-2 (lowercase) for flagcdn.
// Historical states deliberately fall through to a lettered badge.
const ISO: Record<string, string> = {
  "United States": "us",
  "United Kingdom": "gb",
  France: "fr",
  China: "cn",
  Germany: "de",
  Japan: "jp",
  Italy: "it",
  Russia: "ru",
  Spain: "es",
  Greece: "gr",
  Iran: "ir",
  Tunisia: "tn",
  Mongolia: "mn",
  Turkey: "tr",
  Egypt: "eg",
  Israel: "il",
  "Czech Republic": "cz",
  Netherlands: "nl",
  Poland: "pl",
  Sweden: "se",
  Denmark: "dk",
  Austria: "at",
  India: "in",
  Mexico: "mx",
  Peru: "pe",
  Brazil: "br",
  Argentina: "ar",
  Uruguay: "uy",
  Bolivia: "bo",
  Chile: "cl",
  Sudan: "sd",
  "South Africa": "za",
  Serbia: "rs",
  Colombia: "co",
  Venezuela: "ve",
  Finland: "fi",
  Taiwan: "tw",
  Jordan: "jo",
  Syria: "sy",
  Iraq: "iq",
  Vietnam: "vn",
  "North Vietnam": "vn",
  "South Vietnam": "vn",
  Cambodia: "kh",
  Laos: "la",
  Malaysia: "my",
  Australia: "au",
  Algeria: "dz",
  Cuba: "cu",
  "Saudi Arabia": "sa",
  Nigeria: "ng",
  Bangladesh: "bd",
  Pakistan: "pk",
  Lebanon: "lb",
  "Sri Lanka": "lk",
  Angola: "ao",
  Mozambique: "mz",
  Eritrea: "er",
  Ethiopia: "et",
  Armenia: "am",
  Azerbaijan: "az",
  Croatia: "hr",
  "Bosnia and Herzegovina": "ba",
  Rwanda: "rw",
  "Democratic Republic of the Congo": "cd",
  Zimbabwe: "zw",
  Uganda: "ug",
  Afghanistan: "af",
  Libya: "ly",
  Yemen: "ye",
  Mali: "ml",
  "South Sudan": "ss",
  Ukraine: "ua",
  Haiti: "ht",
  Georgia: "ge",
  "South Korea": "kr",
  "North Korea": "kp",
};

function monogram(name: string): string {
  const words = name.replace(/[^A-Za-z\s-]/g, "").split(/[\s-]+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}

export function Flag({ name, size = 22 }: { name: string; size?: number }) {
  const code = ISO[name];
  if (code) {
    const h = Math.round(size * 1.5);
    return (
      <img
        src={`https://flagcdn.com/h${h <= 20 ? 20 : h <= 24 ? 24 : 40}/${code}.png`}
        srcSet={`https://flagcdn.com/h80/${code}.png 2x`}
        alt={name}
        title={name}
        width={Math.round(size * 1.4)}
        height={size}
        className="inline-block rounded-[3px] border border-border/70 object-cover shadow-sm"
        style={{ height: size, width: "auto" }}
        loading="lazy"
      />
    );
  }
  return (
    <span
      title={name}
      className="inline-flex items-center justify-center rounded-[3px] border border-border bg-surface font-mono text-[10px] font-semibold text-muted"
      style={{ height: size, minWidth: Math.round(size * 1.4), padding: "0 4px" }}
    >
      {monogram(name)}
    </span>
  );
}

export function FlagRow({ names, size = 22 }: { names: string[]; size?: number }) {
  const shown = names.slice(0, 5);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((n, i) => (
        <Flag key={`${n}-${i}`} name={n} size={size} />
      ))}
    </div>
  );
}
