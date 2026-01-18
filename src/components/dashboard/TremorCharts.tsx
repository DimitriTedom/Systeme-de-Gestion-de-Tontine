/**
 * Composants Tremor personnalisés pour NjangiTech Dashboard
 * Avec thème émeraude (emerald) et marine
 */

import { Card } from '@tremor/react';
import { AreaChart } from '@tremor/react';
import { DonutChart } from '@tremor/react';
import { BarChart } from '@tremor/react';
import { BadgeDelta } from '@tremor/react';

// Utility formatters
const formatMontantXAF = (montant: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(montant);
};

const formatPourcentage = (pourcentage: number): string => {
  return `${pourcentage.toFixed(1)}%`;
};

/**
 * 1. Evolution de la Caisse (AreaChart)
 */
interface EvolutionCaisseProps {
  data: Array<{
    date: string;
    dateFull: string;
    totalCaisse: number;
    cotisations: number;
    interetsCredits: number;
    penalites: number;
  }>;
}

export function EvolutionCaisseChart({ data }: EvolutionCaisseProps) {
  return (
    <Card className="glass-card border-emerald-200 dark:border-emerald-900">
      <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
        Évolution de la Caisse
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Progression des fonds sur 12 mois
      </p>
      <AreaChart
        className="h-80 mt-4"
        data={data}
        index="date"
        categories={["cotisations", "interetsCredits", "penalites"]}
        colors={["emerald", "blue", "amber"]}
        valueFormatter={(number: number) => formatMontantXAF(number)}
        showLegend={true}
        showGridLines={true}
        curveType="natural"
        yAxisWidth={80}
        showAnimation={true}
      />
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-emerald-100 dark:border-emerald-900">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Cotisations</p>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {formatMontantXAF(data[data.length - 1].cotisations)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Intérêts</p>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            {formatMontantXAF(data[data.length - 1].interetsCredits)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Pénalités</p>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            {formatMontantXAF(data[data.length - 1].penalites)}
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * 2. Répartition du Budget (DonutChart)
 */
interface BudgetRepartitionProps {
  data: Array<{
    name: string;
    montant: number;
    pourcentage: number;
  }>;
}

export function BudgetRepartitionChart({ data }: BudgetRepartitionProps) {
  const totalBudget = data.reduce((sum, item) => sum + item.montant, 0);

  return (
    <Card className="glass-card border-emerald-200 dark:border-emerald-900">
      <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
        Répartition du Budget Actuel
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Allocation des fonds disponibles
      </p>
      <div className="flex flex-col items-center justify-center">
        <DonutChart
          className="h-72"
          data={data}
          category="montant"
          index="name"
          valueFormatter={(number: number) => formatMontantXAF(number)}
          colors={["emerald", "blue", "violet", "amber"]}
          showAnimation={true}
          showTooltip={true}
        />
        <div className="mt-6 w-full">
          <div className="text-center mb-4 pb-4 border-b border-emerald-100 dark:border-emerald-900">
            <p className="text-xs text-muted-foreground">Budget Total</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatMontantXAF(totalBudget)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: 
                      item.name.includes('Liquidités') ? '#10b981' : 
                      item.name.includes('Crédits') ? '#3b82f6' : 
                      item.name.includes('Projets') ? '#8b5cf6' : 
                      '#f59e0b' 
                  }}
                />
                <div className="flex-1">
                  <p className="text-xs font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.pourcentage}% • {formatMontantXAF(item.montant)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * 3. Performance des Cotisations (BarChart)
 */
interface CotisationsPerformanceProps {
  data: Array<{
    seance: string;
    date: string;
    montantAttendu: number;
    montantPercu: number;
    ecart: number;
    tauxRecouvrement: number;
  }>;
}

export function CotisationsPerformanceChart({ data }: CotisationsPerformanceProps) {
  // Prendre seulement les 6 dernières séances pour la lisibilité
  const recentData = data.slice(-6);
  
  const moyenneTauxRecouvrement = 
    recentData.reduce((sum, item) => sum + item.tauxRecouvrement, 0) / recentData.length;

  return (
    <Card className="glass-card border-emerald-200 dark:border-emerald-900">
      <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
        Performance des Cotisations
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Comparaison Attendu vs Perçu (6 dernières séances)
      </p>
      <BarChart
        className="h-80 mt-4"
        data={recentData}
        index="date"
        categories={["montantAttendu", "montantPercu"]}
        colors={["slate", "emerald"]}
        valueFormatter={(number: number) => formatMontantXAF(number)}
        showLegend={true}
        showGridLines={true}
        yAxisWidth={80}
        showAnimation={true}
        layout="vertical"
      />
      <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Taux de Recouvrement Moyen</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {moyenneTauxRecouvrement.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Écart Total</p>
            <p className="text-lg font-semibold text-amber-700 dark:text-amber-400">
              {formatMontantXAF(recentData.reduce((sum, item) => sum + item.ecart, 0))}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * 4. Carte KPI avec BadgeDelta
 */
interface KPICardProps {
  title: string;
  icon: React.ReactNode;
  valeurActuelle: number | string;
  unite?: string;
  variation: number;
  variationPourcentage: number;
  tendance: 'positive' | 'negative' | 'neutral';
  description?: string;
  formatValeur?: (valeur: number | string) => string;
}

export function KPICard({
  title,
  icon,
  valeurActuelle,
  unite = '',
  variation,
  variationPourcentage,
  tendance,
  description,
  formatValeur,
}: KPICardProps) {
  const deltaType = variation > 0 ? 'increase' : variation < 0 ? 'decrease' : 'unchanged';

  const valeurFormatee = formatValeur 
    ? formatValeur(valeurActuelle)
    : typeof valeurActuelle === 'number' 
      ? valeurActuelle.toLocaleString('fr-FR')
      : valeurActuelle;

  return (
    <Card className="glass-card border-emerald-200 dark:border-emerald-900 overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            {valeurFormatee}
          </p>
          {unite && (
            <span className="text-sm text-muted-foreground">{unite}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <BadgeDelta
            deltaType={deltaType}
            size="xs"
            className={`
              ${tendance === 'positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : ''}
              ${tendance === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}
              ${tendance === 'neutral' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : ''}
            `}
          >
            {formatPourcentage(variationPourcentage)}
          </BadgeDelta>
          <p className="text-xs text-muted-foreground">
            {description || 'vs mois dernier'}
          </p>
        </div>
      </div>
    </Card>
  );
}
