export interface DepartmentMeta {
  code: string;
  nom: string;
  prefecture: string;
  region: string;
  isDrom: boolean;
  aliases?: string[];
}

const RAW_DEPARTMENTS: Record<string, Omit<DepartmentMeta, 'isDrom'>> = {
  '01': { code: '01', nom: 'Ain', prefecture: 'Bourg-en-Bresse', region: 'Auvergne-Rhône-Alpes' },
  '02': { code: '02', nom: 'Aisne', prefecture: 'Laon', region: 'Hauts-de-France' },
  '03': { code: '03', nom: 'Allier', prefecture: 'Moulins', region: 'Auvergne-Rhône-Alpes' },
  '04': { code: '04', nom: 'Alpes-de-Haute-Provence', prefecture: 'Digne-les-Bains', region: "Provence-Alpes-Côte d'Azur", aliases: ['alpes haute provence'] },
  '05': { code: '05', nom: 'Hautes-Alpes', prefecture: 'Gap', region: "Provence-Alpes-Côte d'Azur" },
  '06': { code: '06', nom: 'Alpes-Maritimes', prefecture: 'Nice', region: "Provence-Alpes-Côte d'Azur" },
  '07': { code: '07', nom: 'Ardèche', prefecture: 'Privas', region: 'Auvergne-Rhône-Alpes' },
  '08': { code: '08', nom: 'Ardennes', prefecture: 'Charleville-Mézières', region: 'Grand Est' },
  '09': { code: '09', nom: 'Ariège', prefecture: 'Foix', region: 'Occitanie' },
  '10': { code: '10', nom: 'Aube', prefecture: 'Troyes', region: 'Grand Est' },
  '11': { code: '11', nom: 'Aude', prefecture: 'Carcassonne', region: 'Occitanie' },
  '12': { code: '12', nom: 'Aveyron', prefecture: 'Rodez', region: 'Occitanie' },
  '13': { code: '13', nom: 'Bouches-du-Rhône', prefecture: 'Marseille', region: "Provence-Alpes-Côte d'Azur" },
  '14': { code: '14', nom: 'Calvados', prefecture: 'Caen', region: 'Normandie' },
  '15': { code: '15', nom: 'Cantal', prefecture: 'Aurillac', region: 'Auvergne-Rhône-Alpes' },
  '16': { code: '16', nom: 'Charente', prefecture: 'Angoulême', region: 'Nouvelle-Aquitaine' },
  '17': { code: '17', nom: 'Charente-Maritime', prefecture: 'La Rochelle', region: 'Nouvelle-Aquitaine' },
  '18': { code: '18', nom: 'Cher', prefecture: 'Bourges', region: 'Centre-Val de Loire' },
  '19': { code: '19', nom: 'Corrèze', prefecture: 'Tulle', region: 'Nouvelle-Aquitaine' },
  '2A': { code: '2A', nom: 'Corse-du-Sud', prefecture: 'Ajaccio', region: 'Corse', aliases: ['corse sud'] },
  '2B': { code: '2B', nom: 'Haute-Corse', prefecture: 'Bastia', region: 'Corse' },
  '21': { code: '21', nom: "Côte-d'Or", prefecture: 'Dijon', region: 'Bourgogne-Franche-Comté', aliases: ['cote dor', 'cotes dor'] },
  '22': { code: '22', nom: "Côtes-d'Armor", prefecture: 'Saint-Brieuc', region: 'Bretagne', aliases: ['cotes darmor', 'cotes armor'] },
  '23': { code: '23', nom: 'Creuse', prefecture: 'Guéret', region: 'Nouvelle-Aquitaine' },
  '24': { code: '24', nom: 'Dordogne', prefecture: 'Périgueux', region: 'Nouvelle-Aquitaine' },
  '25': { code: '25', nom: 'Doubs', prefecture: 'Besançon', region: 'Bourgogne-Franche-Comté' },
  '26': { code: '26', nom: 'Drôme', prefecture: 'Valence', region: 'Auvergne-Rhône-Alpes' },
  '27': { code: '27', nom: 'Eure', prefecture: 'Évreux', region: 'Normandie' },
  '28': { code: '28', nom: 'Eure-et-Loir', prefecture: 'Chartres', region: 'Centre-Val de Loire' },
  '29': { code: '29', nom: 'Finistère', prefecture: 'Quimper', region: 'Bretagne' },
  '30': { code: '30', nom: 'Gard', prefecture: 'Nîmes', region: 'Occitanie' },
  '31': { code: '31', nom: 'Haute-Garonne', prefecture: 'Toulouse', region: 'Occitanie' },
  '32': { code: '32', nom: 'Gers', prefecture: 'Auch', region: 'Occitanie' },
  '33': { code: '33', nom: 'Gironde', prefecture: 'Bordeaux', region: 'Nouvelle-Aquitaine' },
  '34': { code: '34', nom: 'Hérault', prefecture: 'Montpellier', region: 'Occitanie' },
  '35': { code: '35', nom: 'Ille-et-Vilaine', prefecture: 'Rennes', region: 'Bretagne' },
  '36': { code: '36', nom: 'Indre', prefecture: 'Châteauroux', region: 'Centre-Val de Loire' },
  '37': { code: '37', nom: 'Indre-et-Loire', prefecture: 'Tours', region: 'Centre-Val de Loire' },
  '38': { code: '38', nom: 'Isère', prefecture: 'Grenoble', region: 'Auvergne-Rhône-Alpes' },
  '39': { code: '39', nom: 'Jura', prefecture: 'Lons-le-Saunier', region: 'Bourgogne-Franche-Comté' },
  '40': { code: '40', nom: 'Landes', prefecture: 'Mont-de-Marsan', region: 'Nouvelle-Aquitaine' },
  '41': { code: '41', nom: 'Loir-et-Cher', prefecture: 'Blois', region: 'Centre-Val de Loire' },
  '42': { code: '42', nom: 'Loire', prefecture: 'Saint-Étienne', region: 'Auvergne-Rhône-Alpes' },
  '43': { code: '43', nom: 'Haute-Loire', prefecture: 'Le Puy-en-Velay', region: 'Auvergne-Rhône-Alpes' },
  '44': { code: '44', nom: 'Loire-Atlantique', prefecture: 'Nantes', region: 'Pays de la Loire' },
  '45': { code: '45', nom: 'Loiret', prefecture: 'Orléans', region: 'Centre-Val de Loire' },
  '46': { code: '46', nom: 'Lot', prefecture: 'Cahors', region: 'Occitanie' },
  '47': { code: '47', nom: 'Lot-et-Garonne', prefecture: 'Agen', region: 'Nouvelle-Aquitaine' },
  '48': { code: '48', nom: 'Lozère', prefecture: 'Mende', region: 'Occitanie' },
  '49': { code: '49', nom: 'Maine-et-Loire', prefecture: 'Angers', region: 'Pays de la Loire' },
  '50': { code: '50', nom: 'Manche', prefecture: 'Saint-Lô', region: 'Normandie' },
  '51': { code: '51', nom: 'Marne', prefecture: 'Châlons-en-Champagne', region: 'Grand Est' },
  '52': { code: '52', nom: 'Haute-Marne', prefecture: 'Chaumont', region: 'Grand Est' },
  '53': { code: '53', nom: 'Mayenne', prefecture: 'Laval', region: 'Pays de la Loire' },
  '54': { code: '54', nom: 'Meurthe-et-Moselle', prefecture: 'Nancy', region: 'Grand Est' },
  '55': { code: '55', nom: 'Meuse', prefecture: 'Bar-le-Duc', region: 'Grand Est' },
  '56': { code: '56', nom: 'Morbihan', prefecture: 'Vannes', region: 'Bretagne' },
  '57': { code: '57', nom: 'Moselle', prefecture: 'Metz', region: 'Grand Est' },
  '58': { code: '58', nom: 'Nièvre', prefecture: 'Nevers', region: 'Bourgogne-Franche-Comté' },
  '59': { code: '59', nom: 'Nord', prefecture: 'Lille', region: 'Hauts-de-France' },
  '60': { code: '60', nom: 'Oise', prefecture: 'Beauvais', region: 'Hauts-de-France' },
  '61': { code: '61', nom: 'Orne', prefecture: 'Alençon', region: 'Normandie' },
  '62': { code: '62', nom: 'Pas-de-Calais', prefecture: 'Arras', region: 'Hauts-de-France' },
  '63': { code: '63', nom: 'Puy-de-Dôme', prefecture: 'Clermont-Ferrand', region: 'Auvergne-Rhône-Alpes' },
  '64': { code: '64', nom: 'Pyrénées-Atlantiques', prefecture: 'Pau', region: 'Nouvelle-Aquitaine' },
  '65': { code: '65', nom: 'Hautes-Pyrénées', prefecture: 'Tarbes', region: 'Occitanie' },
  '66': { code: '66', nom: 'Pyrénées-Orientales', prefecture: 'Perpignan', region: 'Occitanie' },
  '67': { code: '67', nom: 'Bas-Rhin', prefecture: 'Strasbourg', region: 'Grand Est' },
  '68': { code: '68', nom: 'Haut-Rhin', prefecture: 'Colmar', region: 'Grand Est' },
  '69': { code: '69', nom: 'Rhône', prefecture: 'Lyon', region: 'Auvergne-Rhône-Alpes' },
  '70': { code: '70', nom: 'Haute-Saône', prefecture: 'Vesoul', region: 'Bourgogne-Franche-Comté' },
  '71': { code: '71', nom: 'Saône-et-Loire', prefecture: 'Mâcon', region: 'Bourgogne-Franche-Comté' },
  '72': { code: '72', nom: 'Sarthe', prefecture: 'Le Mans', region: 'Pays de la Loire' },
  '73': { code: '73', nom: 'Savoie', prefecture: 'Chambéry', region: 'Auvergne-Rhône-Alpes' },
  '74': { code: '74', nom: 'Haute-Savoie', prefecture: 'Annecy', region: 'Auvergne-Rhône-Alpes' },
  '75': { code: '75', nom: 'Paris', prefecture: 'Paris', region: 'Île-de-France' },
  '76': { code: '76', nom: 'Seine-Maritime', prefecture: 'Rouen', region: 'Normandie' },
  '77': { code: '77', nom: 'Seine-et-Marne', prefecture: 'Melun', region: 'Île-de-France' },
  '78': { code: '78', nom: 'Yvelines', prefecture: 'Versailles', region: 'Île-de-France' },
  '79': { code: '79', nom: 'Deux-Sèvres', prefecture: 'Niort', region: 'Nouvelle-Aquitaine' },
  '80': { code: '80', nom: 'Somme', prefecture: 'Amiens', region: 'Hauts-de-France' },
  '81': { code: '81', nom: 'Tarn', prefecture: 'Albi', region: 'Occitanie' },
  '82': { code: '82', nom: 'Tarn-et-Garonne', prefecture: 'Montauban', region: 'Occitanie' },
  '83': { code: '83', nom: 'Var', prefecture: 'Toulon', region: "Provence-Alpes-Côte d'Azur" },
  '84': { code: '84', nom: 'Vaucluse', prefecture: 'Avignon', region: "Provence-Alpes-Côte d'Azur" },
  '85': { code: '85', nom: 'Vendée', prefecture: 'La Roche-sur-Yon', region: 'Pays de la Loire' },
  '86': { code: '86', nom: 'Vienne', prefecture: 'Poitiers', region: 'Nouvelle-Aquitaine' },
  '87': { code: '87', nom: 'Haute-Vienne', prefecture: 'Limoges', region: 'Nouvelle-Aquitaine' },
  '88': { code: '88', nom: 'Vosges', prefecture: 'Épinal', region: 'Grand Est' },
  '89': { code: '89', nom: 'Yonne', prefecture: 'Auxerre', region: 'Bourgogne-Franche-Comté' },
  '90': { code: '90', nom: 'Territoire de Belfort', prefecture: 'Belfort', region: 'Bourgogne-Franche-Comté', aliases: ['belfort'] },
  '91': { code: '91', nom: 'Essonne', prefecture: 'Évry-Courcouronnes', region: 'Île-de-France' },
  '92': { code: '92', nom: 'Hauts-de-Seine', prefecture: 'Nanterre', region: 'Île-de-France' },
  '93': { code: '93', nom: 'Seine-Saint-Denis', prefecture: 'Bobigny', region: 'Île-de-France' },
  '94': { code: '94', nom: 'Val-de-Marne', prefecture: 'Créteil', region: 'Île-de-France' },
  '95': { code: '95', nom: "Val-d'Oise", prefecture: 'Cergy', region: 'Île-de-France', aliases: ['val doise'] },
  '971': { code: '971', nom: 'Guadeloupe', prefecture: 'Basse-Terre', region: 'Guadeloupe' },
  '972': { code: '972', nom: 'Martinique', prefecture: 'Fort-de-France', region: 'Martinique' },
  '973': { code: '973', nom: 'Guyane', prefecture: 'Cayenne', region: 'Guyane' },
  '974': { code: '974', nom: 'La Réunion', prefecture: 'Saint-Denis', region: 'La Réunion', aliases: ['reunion'] },
  '976': { code: '976', nom: 'Mayotte', prefecture: 'Mamoudzou', region: 'Mayotte' },
};

export const DEPARTMENTS_META: Record<string, DepartmentMeta> = Object.fromEntries(
  Object.entries(RAW_DEPARTMENTS).map(([code, meta]) => [
    code,
    { ...meta, isDrom: code.startsWith('97') },
  ])
);

export const ORDERED_DEPARTMENT_CODES: string[] = Object.keys(DEPARTMENTS_META).sort((a, b) => {
  const numA = a === '2A' ? 20.1 : a === '2B' ? 20.2 : parseInt(a, 10);
  const numB = b === '2A' ? 20.1 : b === '2B' ? 20.2 : parseInt(b, 10);
  return numA - numB;
});

export function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’\-_,./]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCode(str: string): string {
  const cleaned = str.trim().toUpperCase().replace(/\s+/g, '');
  if (/^[1-9]$/.test(cleaned)) {
    return `0${cleaned}`;
  }
  return cleaned;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export type TextAcceptMode = 'both' | 'name' | 'code';

export function checkDepartmentAnswer(
  rawInput: string,
  target: DepartmentMeta,
  acceptMode: TextAcceptMode
): { isCorrect: boolean; matchedBy?: 'code' | 'name' | 'approx' } {
  const trimmed = rawInput.trim();
  if (!trimmed) return { isCorrect: false };

  // 1. Code match
  if (acceptMode === 'both' || acceptMode === 'code') {
    const codeInput = normalizeCode(trimmed);
    if (codeInput === target.code.toUpperCase()) {
      return { isCorrect: true, matchedBy: 'code' };
    }
  }

  // 2. Name match
  if (acceptMode === 'both' || acceptMode === 'name') {
    const normInput = normalizeText(trimmed);
    const normTarget = normalizeText(target.nom);

    const candidates = [normTarget];
    // Strip leading article if user omitted it (e.g., "reunion")
    if (normTarget.startsWith('la ')) candidates.push(normTarget.slice(3));
    if (normTarget.startsWith('le ')) candidates.push(normTarget.slice(3));
    if (target.aliases) {
      for (const alias of target.aliases) {
        candidates.push(normalizeText(alias));
      }
    }

    // Also allow joined words without spaces (e.g. "cotedor", "valdoise")
    const joinedInput = normInput.replace(/\s+/g, '');
    for (const c of candidates) {
      if (normInput === c || joinedInput === c.replace(/\s+/g, '')) {
        return { isCorrect: true, matchedBy: 'name' };
      }
    }

    // Gentle typo tolerance for longer names (>= 6 chars)
    if (normInput.length >= 5) {
      for (const c of candidates) {
        const threshold = c.length >= 10 ? 2 : c.length >= 6 ? 1 : 0;
        if (threshold > 0 && levenshtein(normInput, c) <= threshold) {
          return { isCorrect: true, matchedBy: 'approx' };
        }
      }
    }
  }

  return { isCorrect: false };
}
