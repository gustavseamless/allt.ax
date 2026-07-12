/**
 * Swedish synonym / colloquial-term expansion for local search.
 *
 * Maps informal user language ("bilfix", "klippa mig", "rörmokare") to the
 * canonical category slugs and search terms used in the database. This layer
 * runs before the PostgreSQL full-text query so that searches without exact
 * word matches still find the right businesses.
 */

export interface SynonymRule {
  /** Terms/phrases (lowercase) that trigger the rule. Matched on whole words or as substring for compounds. */
  triggers: string[];
  /** Category slugs to boost/match. */
  categorySlugs: string[];
  /** Extra terms appended to the full-text query. */
  extraTerms: string[];
  /** If true, the rule also implies the "open now" intent. */
  openNow?: boolean;
}

export const SYNONYM_RULES: SynonymRule[] = [
  {
    triggers: ["bilfix", "bilverkstad", "bilverkstäder", "laga bilen", "bilreparation", "verkstad", "bilservice", "besiktning"],
    categorySlugs: ["bilverkstader", "dack-och-bilservice"],
    extraTerms: ["bilverkstad", "bilservice"],
  },
  {
    triggers: ["däck", "däckbyte", "hjulskifte", "vinterdäck", "sommardäck"],
    categorySlugs: ["dack-och-bilservice"],
    extraTerms: ["däck"],
  },
  {
    triggers: ["rörmokare", "rörläggare", "avlopp", "vattenläcka", "värmepump", "rör"],
    categorySlugs: ["vvs"],
    extraTerms: ["vvs", "rörmokare"],
  },
  {
    triggers: ["elektriker", "elinstallation", "elfel", "eljour", "solceller", "laddbox", "elarbete"],
    categorySlugs: ["elektriker"],
    extraTerms: ["elektriker", "elinstallation"],
  },
  {
    triggers: ["klippa mig", "klippning", "frisör", "frisörer", "hårklippning", "barberare", "frissa"],
    categorySlugs: ["frisorer"],
    extraTerms: ["frisör", "klippning"],
  },
  {
    triggers: ["mat ikväll", "äta ute", "middag", "restaurang", "restauranger", "mat", "lunch", "dagens lunch", "käk"],
    categorySlugs: ["restauranger"],
    extraTerms: ["restaurang", "mat"],
  },
  {
    triggers: ["mat ikväll", "äta nu", "öppen restaurang", "restaurang öppet nu"],
    categorySlugs: ["restauranger"],
    extraTerms: ["restaurang"],
    openNow: true,
  },
  {
    triggers: ["fika", "kafé", "café", "kaffe", "bulle"],
    categorySlugs: ["cafeer"],
    extraTerms: ["café", "fika"],
  },
  {
    triggers: ["öl", "bar", "pub", "drink", "afterwork"],
    categorySlugs: ["barer"],
    extraTerms: ["bar", "pub"],
  },
  {
    triggers: ["sova", "övernattning", "hotell", "boende", "stuga", "gästhem", "vandrarhem"],
    categorySlugs: ["hotell-och-boende"],
    extraTerms: ["hotell", "boende"],
  },
  {
    triggers: ["bygga", "renovera", "renovering", "snickare", "byggfirma", "hantverkare", "altan", "husbygge"],
    categorySlugs: ["bygg-och-renovering"],
    extraTerms: ["bygg", "renovering"],
  },
  {
    triggers: ["måla", "målare", "tapetsera", "måleri"],
    categorySlugs: ["maleri"],
    extraTerms: ["måleri", "målare"],
  },
  {
    triggers: ["städa", "städhjälp", "städfirma", "hemstäd", "flyttstäd", "storstädning", "städning"],
    categorySlugs: ["stadning"],
    extraTerms: ["städning"],
  },
  {
    triggers: ["bokföring", "bokförare", "redovisning", "bokslut", "deklaration", "revisor", "ekonomibyrå"],
    categorySlugs: ["redovisning"],
    extraTerms: ["redovisning", "bokföring"],
  },
  {
    triggers: ["advokat", "jurist", "juridisk hjälp", "avtal", "bouppteckning"],
    categorySlugs: ["juridik"],
    extraTerms: ["juridik", "advokat"],
  },
  {
    triggers: ["gym", "träna", "träning", "yoga", "pass"],
    categorySlugs: ["traning"],
    extraTerms: ["träning", "gym"],
  },
  {
    triggers: ["massage", "hudvård", "naglar", "skönhet", "spa", "fotvård"],
    categorySlugs: ["skonhet-och-halsa"],
    extraTerms: ["skönhet", "hälsa"],
  },
  {
    triggers: ["taxi", "skjuts", "flygtaxi", "transfer"],
    categorySlugs: ["taxi"],
    extraTerms: ["taxi"],
  },
  {
    triggers: ["båt", "båtar", "båtservice", "marina", "utombordare", "båtmotor", "vinterförvaring båt"],
    categorySlugs: ["batar-och-marina-tjanster"],
    extraTerms: ["båt", "marin"],
  },
  {
    triggers: ["gästhamn", "hamn", "båtplats"],
    categorySlugs: ["gasthamnar"],
    extraTerms: ["gästhamn"],
  },
  {
    triggers: ["datorhjälp", "it-support", "hemsida", "webbutveckling", "it", "dator"],
    categorySlugs: ["it-och-teknik"],
    extraTerms: ["it", "teknik"],
  },
  {
    triggers: ["fotograf", "bröllopsfoto", "fotografering", "video", "film"],
    categorySlugs: ["foto-och-video"],
    extraTerms: ["foto", "fotograf"],
  },
  {
    triggers: ["mataffär", "livsmedel", "matbutik", "handla mat"],
    categorySlugs: ["livsmedel"],
    extraTerms: ["livsmedel", "butik"],
  },
  {
    triggers: ["kläder", "klädbutik", "shopping", "mode"],
    categorySlugs: ["klader"],
    extraTerms: ["kläder", "butik"],
  },
  {
    triggers: ["försäkring", "försäkra"],
    categorySlugs: ["forsakring"],
    extraTerms: ["försäkring"],
  },
  {
    triggers: ["bank", "lån", "bolån", "sparande"],
    categorySlugs: ["banker-och-finans"],
    extraTerms: ["bank", "finans"],
  },
  {
    triggers: ["fastighetsskötsel", "vaktmästare", "gräsklippning", "snöröjning", "trädgård"],
    categorySlugs: ["fastighetsskotsel"],
    extraTerms: ["fastighetsskötsel"],
  },
  {
    triggers: ["köpa bil", "bilhandlare", "begagnade bilar", "bilförsäljning"],
    categorySlugs: ["bilforsaljning"],
    extraTerms: ["bilförsäljning", "bilar"],
  },
  {
    triggers: ["marknadsföring", "reklam", "annonsering", "reklambyrå"],
    categorySlugs: ["marknadsforing"],
    extraTerms: ["marknadsföring"],
  },
  {
    triggers: ["barnvakt", "lekpark", "barnaktiviteter", "aktiviteter med barn", "familjeaktiviteter"],
    categorySlugs: ["barn-och-familj", "underhallning"],
    extraTerms: ["barn", "familj", "aktiviteter"],
  },
  {
    triggers: ["läkare", "tandläkare", "hälsovård", "sjukvård", "vård"],
    categorySlugs: ["vard"],
    extraTerms: ["vård"],
  },
  {
    triggers: ["kurs", "utbildning", "körkort", "trafikskola"],
    categorySlugs: ["utbildning"],
    extraTerms: ["utbildning"],
  },
];

/** Intent keywords for "open now". */
const OPEN_NOW_PATTERNS = [/öppet nu/, /öppna nu/, /öppen nu/, /open now/, /ikväll/, /just nu/];

/** Intent keywords for "near me". */
const NEAR_ME_PATTERNS = [/nära mig/, /i närheten/, /near me/, /närmaste/];

export interface QueryIntent {
  /** Cleaned query with intent phrases removed. */
  cleanedQuery: string;
  /** Category slugs implied by synonyms. */
  categorySlugs: string[];
  /** Additional full-text terms from synonyms. */
  extraTerms: string[];
  openNow: boolean;
  nearMe: boolean;
  /** Municipality name detected inside the query, if any. */
  municipalityInQuery: string | null;
}

const MUNICIPALITY_NAMES = [
  "mariehamn", "jomala", "finström", "finstrom", "lemland", "saltvik", "eckerö", "eckero",
  "sund", "hammarland", "lumparland", "geta", "vårdö", "vardo", "kumlinge", "kökar", "kokar",
  "brändö", "brando", "sottunga", "föglö", "foglo", "godby",
];

const MUNICIPALITY_ALIASES: Record<string, string> = {
  finstrom: "finström",
  eckero: "eckerö",
  vardo: "vårdö",
  kokar: "kökar",
  brando: "brändö",
  foglo: "föglö",
  godby: "finström",
};

/** Words that carry no search meaning and are stripped before matching. */
const STOP_WORDS = new Set([
  "på", "i", "åland", "aland", "och", "med", "för", "till", "en", "ett", "vid", "hos", "som", "att",
]);

export function parseQueryIntent(rawQuery: string): QueryIntent {
  let q = rawQuery.toLowerCase().trim();

  let openNow = false;
  for (const p of OPEN_NOW_PATTERNS) {
    if (p.test(q)) {
      openNow = true;
      q = q.replace(p, " ");
    }
  }

  let nearMe = false;
  for (const p of NEAR_ME_PATTERNS) {
    if (p.test(q)) {
      nearMe = true;
      q = q.replace(p, " ");
    }
  }

  let municipalityInQuery: string | null = null;
  for (const name of MUNICIPALITY_NAMES) {
    const re = new RegExp(`(^|\\s)${name}(\\s|$)`);
    if (re.test(q)) {
      municipalityInQuery = MUNICIPALITY_ALIASES[name] ?? name;
      q = q.replace(re, " ");
      break;
    }
  }

  const categorySlugs = new Set<string>();
  const extraTerms = new Set<string>();
  const normalized = ` ${q} `;

  for (const rule of SYNONYM_RULES) {
    for (const trigger of rule.triggers) {
      const hit =
        trigger.includes(" ")
          ? q.includes(trigger)
          : normalized.includes(` ${trigger} `) || q === trigger;
      if (hit) {
        rule.categorySlugs.forEach((s) => categorySlugs.add(s));
        rule.extraTerms.forEach((t) => extraTerms.add(t));
        if (rule.openNow) openNow = true;
        break;
      }
    }
  }

  const cleanedQuery = q
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w))
    .join(" ");

  return {
    cleanedQuery,
    categorySlugs: Array.from(categorySlugs),
    extraTerms: Array.from(extraTerms),
    openNow,
    nearMe,
    municipalityInQuery,
  };
}
