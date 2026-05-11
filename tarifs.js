// ─────────────────────────────────────────────────────────────────────────────
// Trashomètre — Barème 2026 et calculs de taxe (logique pure, sans DOM)
// Source : PDF officiel Commune de Rixensart 2026
// ─────────────────────────────────────────────────────────────────────────────

export const FORFAITS = {
  1: 70,
  2: 105,
  3: 140,
  4: 181,
  5: 181,
};

/**
 * Quotas inclus dans la taxe forfaitaire (avant tarif proportionnel).
 * @param {number} persons - Nombre de personnes dans le ménage (1-5+).
 */
export function getQuotas(persons) {
  const p = Math.max(1, Math.min(persons, 5));
  return {
    noirLevees: 8,
    noirKg: p === 1 ? 15 : 12 * p,
    vertLevees: 20,
    vertKg: 35 * p,
  };
}

/**
 * Calcule le coût total et les surcoûts par conteneur selon le barème 2026.
 *
 * Tarifs proportionnels (au-delà du service minimum) :
 *  - ⬛ Levées : 1,60 €/levée (9-12), 2 €/levée (13+)
 *  - ⬛ Poids  : 0,60 €/kg (≤50 kg/pers), 1 €/kg (51-90), 2 €/kg (>90)
 *  - 🟩 Levées : 1 €/levée
 *  - 🟩 Poids  : 0,20 €/kg/habitant
 *
 * @param {number} nl - Levées noires (résiduel) cumulées
 * @param {number} nk - Kg noirs cumulés
 * @param {number} vl - Levées vertes (organique) cumulées
 * @param {number} vk - Kg verts cumulés
 * @param {number} persons - Taille du ménage
 * @returns {{cost:number, surcharge:number, noirSurcharge:number, vertSurcharge:number, forfait:number}}
 */
export function calcCost(nl, nk, vl, vk, persons) {
  const q = getQuotas(persons);
  const forfait = FORFAITS[Math.min(persons, 5)];
  let cost = forfait;
  let noirSurcharge = 0;
  let vertSurcharge = 0;

  // ⬛ Levées supplémentaires (au-delà de 8)
  if (nl > q.noirLevees) {
    const extra = nl - q.noirLevees;
    const tier1 = Math.min(extra, 4);          // 9e à 12e levée
    const tier2 = Math.max(extra - 4, 0);      // 13e et +
    const c = tier1 * 1.60 + tier2 * 2.00;
    cost += c;
    noirSurcharge += c;
  }

  // ⬛ Poids supplémentaire (par habitant/an)
  if (nk > q.noirKg) {
    const extraTotal = nk - q.noirKg;
    const perPers = extraTotal / persons;
    const t1 = Math.min(perPers, 50);                          // 0-50 kg
    const t2 = Math.min(Math.max(perPers - 50, 0), 40);        // 51-90 kg
    const t3 = Math.max(perPers - 90, 0);                      // 90+ kg
    const c = (t1 * 0.60 + t2 * 1.00 + t3 * 2.00) * persons;
    cost += c;
    noirSurcharge += c;
  }

  // 🟩 Levées supplémentaires (au-delà de 20)
  if (vl > q.vertLevees) {
    const c = (vl - q.vertLevees) * 1.00;
    cost += c;
    vertSurcharge += c;
  }

  // 🟩 Poids supplémentaire
  if (vk > q.vertKg) {
    const c = (vk - q.vertKg) * 0.20;
    cost += c;
    vertSurcharge += c;
  }

  return {
    cost,
    forfait,
    surcharge: cost - forfait,
    noirSurcharge,
    vertSurcharge,
  };
}

/**
 * Projection de fin d'année basée sur le rythme observé.
 *
 * Améliorations vs version naïve :
 *  - Si moins de 14 jours de données, retourne null (pas assez fiable)
 *  - Extrapole depuis la première entrée plutôt que depuis le 1er janvier
 *    → un user qui démarre l'app en mai n'a pas une projection énorme
 *
 * @param {Array<{date:string, type:string, kg:number}>} entries
 * @param {number} year
 * @param {number} persons
 * @param {Date} [now=new Date()]
 * @returns {null | {cost:number, surcharge:number, noirLevees:number, noirKg:number, vertLevees:number, vertKg:number, daysObserved:number, daysRemaining:number}}
 */
export function projectYear(entries, year, persons, now = new Date()) {
  const yearStr = String(year);
  const ye = entries.filter(e => e.date && e.date.startsWith(yearStr));
  if (ye.length === 0) return null;

  // Sort entries by date ascending to find first
  const sorted = [...ye].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(sorted[0].date + 'T00:00:00');
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  // Days between first entry and now (or end of year if past)
  const observationEnd = now < endOfYear ? now : endOfYear;
  const daysObserved = Math.max((observationEnd - firstDate) / 86400000, 1);

  // If too little data, projection is unreliable
  if (daysObserved < 14) return null;

  const daysRemaining = Math.max((endOfYear - observationEnd) / 86400000, 0);

  // Stats so far this year
  const noir = ye.filter(e => e.type === 'noir');
  const vert = ye.filter(e => e.type === 'vert');
  const stats = {
    noirLevees: noir.length,
    noirKg:     noir.reduce((s, e) => s + (e.kg || 0), 0),
    vertLevees: vert.length,
    vertKg:     vert.reduce((s, e) => s + (e.kg || 0), 0),
  };

  // Linear extrapolation: rate per day × days remaining
  const ratePerDay = {
    noirLevees: stats.noirLevees / daysObserved,
    noirKg:     stats.noirKg     / daysObserved,
    vertLevees: stats.vertLevees / daysObserved,
    vertKg:     stats.vertKg     / daysObserved,
  };

  const projected = {
    noirLevees: Math.round(stats.noirLevees + ratePerDay.noirLevees * daysRemaining),
    noirKg:     stats.noirKg     + ratePerDay.noirKg     * daysRemaining,
    vertLevees: Math.round(stats.vertLevees + ratePerDay.vertLevees * daysRemaining),
    vertKg:     stats.vertKg     + ratePerDay.vertKg     * daysRemaining,
  };

  const result = calcCost(
    projected.noirLevees, projected.noirKg,
    projected.vertLevees, projected.vertKg,
    persons
  );

  return {
    ...projected,
    cost: result.cost,
    surcharge: result.surcharge,
    daysObserved: Math.round(daysObserved),
    daysRemaining: Math.round(daysRemaining),
  };
}

/**
 * Stats annuelles à partir des entrées.
 */
export function getYearStats(entries, year) {
  const yearStr = String(year);
  const ye = entries.filter(e => e.date && e.date.startsWith(yearStr));
  const noir = ye.filter(e => e.type === 'noir');
  const vert = ye.filter(e => e.type === 'vert');
  return {
    noirLevees: noir.length,
    noirKg:     noir.reduce((s, e) => s + (e.kg || 0), 0),
    vertLevees: vert.length,
    vertKg:     vert.reduce((s, e) => s + (e.kg || 0), 0),
  };
}

/**
 * Donne le cumul mensuel pour un type de conteneur (utilisé pour le graphique).
 * Retourne 12 valeurs (un par mois), cumulatives.
 */
export function getMonthlyCumulative(entries, year, type, field = 'kg') {
  const result = new Array(12).fill(0);
  const yearStr = String(year);
  for (const e of entries) {
    if (!e.date || !e.date.startsWith(yearStr) || e.type !== type) continue;
    const month = parseInt(e.date.slice(5, 7)) - 1;
    if (month >= 0 && month < 12) {
      result[month] += field === 'kg' ? (e.kg || 0) : 1;
    }
  }
  // Make cumulative
  for (let i = 1; i < 12; i++) result[i] += result[i - 1];
  return result;
}

/**
 * Validation d'une entrée avant ajout.
 * @returns {string|null} - Message d'erreur ou null si OK
 */
export function validateEntry({ date, type, kg }) {
  if (!date) return 'date_required';
  if (!['noir', 'vert'].includes(type)) return 'type_invalid';
  if (kg < 0) return 'kg_negative';
  if (kg > 200) return 'kg_too_high';

  // Date checks
  const d = new Date(date + 'T00:00:00');
  if (isNaN(d.getTime())) return 'date_invalid';
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (d > today) return 'date_future';
  // Reasonable lower bound: don't allow entries more than 5 years in past
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  if (d < fiveYearsAgo) return 'date_too_old';

  return null;
}
