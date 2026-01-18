/**
 * Données Mock pour le Dashboard NjangiTech
 * Génération de données réalistes pour les 12 derniers mois
 */

// Génération de dates pour les 12 derniers mois
const generateMonthlyDates = () => {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      full: date,
      short: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      long: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    });
  }
  
  return months;
};

const monthlyDates = generateMonthlyDates();

/**
 * 1. Évolution de la Caisse (AreaChart)
 * Simule une croissance progressive avec des fluctuations réalistes
 */
export const caisseEvolutionData = monthlyDates.map((month, index) => {
  const baseAmount = 500000; // Montant de départ: 500,000 XAF
  const growthRate = 1.08; // Croissance de 8% par mois en moyenne
  const randomVariation = 0.9 + Math.random() * 0.2; // Variation de ±10%
  
  const totalCaisse = Math.round(baseAmount * Math.pow(growthRate, index) * randomVariation);
  const cotisations = Math.round(totalCaisse * 0.65); // 65% cotisations
  const interetsCredits = Math.round(totalCaisse * 0.25); // 25% intérêts
  const penalites = Math.round(totalCaisse * 0.10); // 10% pénalités
  
  return {
    date: month.short,
    dateFull: month.long,
    totalCaisse,
    cotisations,
    interetsCredits,
    penalites,
  };
});

/**
 * 2. Répartition du Budget Actuel (DonutChart)
 * État actuel des fonds avec allocations réalistes
 */
export const budgetRepartitionData = [
  {
    name: "Liquidités Disponibles",
    montant: 2450000,
    pourcentage: 45,
    color: "emerald", // Couleur principale
  },
  {
    name: "Crédits en Cours",
    montant: 1800000,
    pourcentage: 33,
    color: "blue",
  },
  {
    name: "Projets FIAC",
    montant: 850000,
    pourcentage: 16,
    color: "violet",
  },
  {
    name: "Réserve Sécurité",
    montant: 350000,
    pourcentage: 6,
    color: "amber",
  },
];

/**
 * 3. Performance des Cotisations (BarChart)
 * Comparaison Attendu vs Perçu pour les 12 dernières séances
 */
export const cotisationsPerformanceData = monthlyDates.map((month, index) => {
  const baseMontant = 400000 + (index * 15000); // Croissance progressive
  const tauxRecouvrement = 0.82 + (Math.random() * 0.16); // Entre 82% et 98%
  
  const montantAttendu = Math.round(baseMontant);
  const montantPercu = Math.round(baseMontant * tauxRecouvrement);
  const ecart = montantAttendu - montantPercu;
  
  return {
    seance: `Séance ${index + 1}`,
    date: month.short,
    montantAttendu,
    montantPercu,
    ecart,
    tauxRecouvrement: Math.round(tauxRecouvrement * 100),
  };
});

/**
 * 4. Indicateurs de Performance (KPIs)
 * Données pour les cartes avec BadgeDelta
 */
export const kpiData = {
  membresActifs: {
    valeurActuelle: 127,
    valeurPrecedente: 118,
    variation: 9,
    variationPourcentage: 7.6,
    type: 'increase' as const,
    tendance: 'positive' as const,
  },
  interetsCredits: {
    valeurActuelle: 1850000,
    valeurPrecedente: 1620000,
    variation: 230000,
    variationPourcentage: 14.2,
    type: 'increase' as const,
    tendance: 'positive' as const,
  },
  penalitesAttente: {
    valeurActuelle: 385000,
    valeurPrecedente: 520000,
    variation: -135000,
    variationPourcentage: -26.0,
    type: 'decrease' as const,
    tendance: 'positive' as const, // Diminution des pénalités est positif
  },
  tauxRecouvrement: {
    valeurActuelle: 94.5,
    valeurPrecedente: 89.2,
    variation: 5.3,
    variationPourcentage: 5.9,
    type: 'increase' as const,
    tendance: 'positive' as const,
  },
  creditsEnCours: {
    valeurActuelle: 12,
    valeurPrecedente: 15,
    variation: -3,
    variationPourcentage: -20.0,
    type: 'decrease' as const,
    tendance: 'neutral' as const,
  },
  montantMoyenCotisation: {
    valeurActuelle: 45000,
    valeurPrecedente: 42000,
    variation: 3000,
    variationPourcentage: 7.1,
    type: 'increase' as const,
    tendance: 'positive' as const,
  },
};

/**
 * Données supplémentaires: Analyse des Crédits
 */
export const creditsAnalysisData = [
  {
    statut: "Remboursés à temps",
    nombre: 45,
    montant: 6750000,
    color: "emerald",
  },
  {
    statut: "En cours (bon)",
    nombre: 8,
    montant: 1200000,
    color: "blue",
  },
  {
    statut: "Retard léger",
    nombre: 3,
    montant: 450000,
    color: "amber",
  },
  {
    statut: "Défaillants",
    nombre: 1,
    montant: 150000,
    color: "red",
  },
];

/**
 * Données supplémentaires: Activité des Séances
 */
export const seancesActivityData = monthlyDates.map((month, index) => {
  const tauxPresence = 75 + Math.random() * 20; // Entre 75% et 95%
  const nombrePresents = Math.round((100 + index * 2) * (tauxPresence / 100));
  const nombreAbsents = Math.round((100 + index * 2) - nombrePresents);
  
  return {
    date: month.short,
    presents: nombrePresents,
    absents: nombreAbsents,
    tauxPresence: Math.round(tauxPresence),
  };
});

/**
 * Utilitaire: Formatage des montants en XAF
 */
export const formatMontantXAF = (montant: number | string): string => {
  const value = typeof montant === 'string' ? parseFloat(montant) : montant;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Utilitaire: Formatage des pourcentages
 */
export const formatPourcentage = (valeur: number): string => {
  return `${valeur > 0 ? '+' : ''}${valeur.toFixed(1)}%`;
};
