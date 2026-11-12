// Controllo del catalogo contro la lettura del libro (INC-040): ogni muscolo nominato nella frase dei muscoli lavorati
// di docs/sources/delavier-catalog/lettura.md deve finire, secondo la tabella di §4
// (docs/archive/features/INC-034_delavier-catalog.md), nelle voci del catalogo con quella pagina, salvo le eccezioni
// qui sotto, ognuna con la regola che la decide. docs/sources è fuori da git (copyright): senza il file il test salta.
// Controlla solo la presenza del gruppo, non il valore (1 o 0,5 dipende dalle regole di §1, non da un dizionario).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { MuscleGroup } from '../lib/archive/types';
import { BASE_CATALOG } from './catalog';

const READING = 'docs/sources/delavier-catalog/lettura.md';

const DELTS: MuscleGroup[] = ['front-delts', 'side-delts', 'rear-delts'];
const FOREARM_FLEXORS: MuscleGroup[] = ['biceps', 'brachialis', 'forearms'];

// Tabella di §4 come nomi del libro → gruppi; [] = «—». Prima i nomi più lunghi: «biceps femoris» prima di «biceps».
const TABLE: [string, MuscleGroup[]][] = ([
  ['posterior fascicles of the deltoid', ['rear-delts']],
  ['anterior deltoid', ['front-delts']], ['middle deltoid', ['side-delts']], ['lateral deltoid', ['side-delts']],
  ['posterior deltoid', ['rear-delts']], ['shoulder group', DELTS], ['deltoid', DELTS],
  ['supraspinatus', ['side-delts']], ['infraspinatus', ['rear-delts']], ['teres minor', ['rear-delts']],
  ['subscapularis', []], ['coracobrachialis', []],
  ['pectoralis minor', []], ['pectoral', ['chest']], ['serratus', []],
  ['latissimus dorsi', ['lats']], ['teres major', ['lats']],
  ['rhomboid', ['traps']], ['trapezius', ['traps']], ['levator scapulae', ['traps']],
  ['biceps femoris', ['hamstrings']], ['biceps', ['biceps']], ['brachialis', ['brachialis']],
  ['brachioradialis', ['forearms']], ['long supinator', ['forearms']],
  ['forearm flexors', FOREARM_FLEXORS], ['flexors of the forearm', FOREARM_FLEXORS], ['arm flexors', FOREARM_FLEXORS],
  ['flexor digitorum longus', []], ['flexor hallucis', []], ['tibialis', []], ['peroneus', []],
  ['flexor muscles of the hip', ['hip-flexors']], ['hip flexors', ['hip-flexors']],
  ['wrist flexor', ['forearms']], ['flexor carpi', ['forearms']], ['flexors digitorum', ['forearms']],
  ['palmaris', ['forearms']], ['pronator', ['forearms']],
  ['extensor muscles of the spine', ['lower-back']], ['extensor muscles of the wrist', ['forearms']],
  ['wrist extensors', ['forearms']], ['extensor carpi', ['forearms']], ['extensor digit', ['forearms']],
  ['forearm', ['forearms']],
  ['triceps surae', ['calves']], ['triceps', ['triceps']], ['anconeus', ['triceps']],
  ['rectus abdominis', ['abs']], ['oblique', ['abs']], ['transversus', ['abs']], ['abdominal', ['abs']],
  ['erector', ['lower-back']], ['spinal', ['lower-back']], ['sacrolumbar', ['lower-back']],
  ['lumbosacral', ['lower-back']], ['quadratus lumborum', ['lower-back']], ['lumbar', ['lower-back']],
  ['deep muscles of the back', ['lower-back']],
  ['gluteus', ['glutes']], ['gluteal', ['glutes']], ['piriformis', ['glutes']],
  ['tensor fasciae latae', ['hip-flexors']], // §4, INC-040: Delavier p. 174
  ['rectus femoris', ['quads']], ['quadriceps', ['quads']],
  ['hamstring', ['hamstrings']], ['semitendinosus', ['hamstrings']], ['semimembranosus', ['hamstrings']],
  ['adductor', ['adductors']], ['pectineus', ['adductors']], ['gracilis', ['adductors']], ['sartorius', []],
  ['iliopsoas', ['hip-flexors']], ['psoas', ['hip-flexors']],
  ['gastrocnemius', ['calves']], ['soleus', ['calves']], ['popliteus', ['popliteus']],
  ['sternocleidomastoid', []], ['splenius', []],
] as [string, MuscleGroup[]][]).sort((a, b) => b[0].length - a[0].length);

// Pagina:gruppo → regola per cui il gruppo nominato non va nella voce.
const EXCEPTIONS: Record<string, string> = {
  '42:traps': 'P4: solo sopra l\'orizzontale, scelta facoltativa',
  '44:traps': 'P10: romboidi come fissatori della scapola',
  '50:traps': 'P4: «if», scelta',
  '57:traps': 'P4: solo sopra l\'orizzontale, scelta',
  '69:front-delts': 'P4: solo con i gomiti stretti, scelta',
  '73:rear-delts': 'P8: «posterior» è un refuso, vanno gli anteriori',
  '83:traps': 'P10: «the last three muscles stabilize the scapula»',
  '101:abs': 'il libro dice che l\'appoggio elimina il lavoro',
  '101:lower-back': 'il libro dice che l\'appoggio elimina il lavoro',
  '126:hamstrings': 'P17: Kubo 2019 e Plotkin 2023 smentiscono il libro',
  '136:glutes': 'P4: dipende dai piedi più avanti, scelta',
  '156:hip-flexors': 'P23: ileopsoas allungato dal passo lungo, non lavorato',
  '174:hip-flexors': 'P4: flessori dell\'anca solo nella variante a piedi più bassi',
  '174:quads': 'P4: retto femorale solo nella variante a piedi più bassi',
  '175:hip-flexors': 'P4: ileopsoas solo allontanando il busto dalla panca',
};

function namedGroups(phrase: string): Set<MuscleGroup> {
  const found = new Set<MuscleGroup>();
  let rest = phrase.toLowerCase();
  for (const [name, groups] of TABLE) {
    if (!rest.includes(name)) continue;
    groups.forEach((g) => found.add(g));
    rest = rest.split(name).join(' ');
  }
  return found;
}

// Pagine del libro di ogni voce, dal commento «// Delavier p. N» o «pp. N e M»; le voci «fuori dal libro» no.
function catalogPages(): Map<number, string[]> {
  const source = readFileSync('src/data/catalog.ts', 'utf8');
  const pages = new Map<number, string[]>();
  for (const [, id, comment] of source.matchAll(/^\s*'([^']+)': entry\(.*\/\/ (.*)$/gm)) {
    const m = comment.match(/^Delavier pp?\. (\d+)(?: e (\d+))?/);
    if (!m) continue;
    for (const p of [m[1], m[2]].filter(Boolean).map(Number)) pages.set(p, [...(pages.get(p) ?? []), id]);
  }
  return pages;
}

describe.skipIf(!existsSync(READING))('catalogo contro lettura.md', () => {
  it('ogni muscolo della frase dei muscoli lavorati finisce nelle voci con quella pagina', () => {
    const pages = catalogPages();
    const problems: string[] = [];
    const used = new Set<string>();
    let checked = 0;
    for (const line of readFileSync(READING, 'utf8').split('\n')) {
      const fields = line.split(' · ');
      const page = Number(fields[2]?.match(/^\d+/)?.[0]);
      const quotes = fields[3]?.match(/«[^»]*»/g);
      if (!page || !quotes) continue;
      const ids = pages.get(page) ?? [];
      if (ids.length === 0) problems.push(`p. ${page}: nessuna voce nel catalogo`);
      for (const group of namedGroups(quotes.join(' '))) {
        if (EXCEPTIONS[`${page}:${group}`]) {
          used.add(`${page}:${group}`);
          continue;
        }
        for (const id of ids) if (!BASE_CATALOG[id].muscles[group]) problems.push(`p. ${page} ${id}: manca ${group}`);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(120);
    expect(problems).toEqual([]);
    expect(Object.keys(EXCEPTIONS).filter((k) => !used.has(k))).toEqual([]); // un'eccezione che non serve più va tolta
  });
});
