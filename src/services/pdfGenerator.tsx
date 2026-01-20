import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { SessionReportData, AGSynthesisReport } from './reportService';

// Define styles for professional PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#047857', // Emerald-700
    color: 'white',
    borderRadius: 5,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 3,
    color: '#d1fae5', // Light emerald
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#047857', // Emerald-700
    borderBottom: '2px solid #047857',
    paddingBottom: 4,
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#ffffff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#d1fae5', // Emerald-100
    borderBottomWidth: 2,
    borderBottomColor: '#047857',
    paddingVertical: 10,
    paddingHorizontal: 6,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellLarge: {
    flex: 2,
    fontSize: 9,
  },
  beneficiaryBox: {
    padding: 15,
    backgroundColor: '#ecfdf5', // Emerald-50
    borderRadius: 8,
    borderLeft: '5px solid #047857', // Emerald-700
    marginBottom: 15,
  },
  beneficiaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#047857',
  },
  beneficiaryText: {
    fontSize: 10,
    marginBottom: 4,
    color: '#064e3b', // Emerald-900
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120,
    fontSize: 9,
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: '1px solid #e0e0e0',
    paddingTop: 10,
  },
  absenceItem: {
    fontSize: 9,
    marginBottom: 3,
    paddingLeft: 10,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#d1fae5', // Emerald-100
    borderTopWidth: 2,
    borderTopColor: '#047857',
    paddingVertical: 10,
    paddingHorizontal: 6,
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 10,
  },
});

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(amount) + ' XAF';
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Session Report PDF Document
export const SessionReportDocument: React.FC<{ data: SessionReportData }> = ({ data }) => {
  const { session, tontine, contributions, beneficiary, absences, penalties } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Banner */}
        <View style={styles.header}>
          <Text style={styles.logo}>NjangiTech</Text>
          <Text style={styles.title}>Rapport de Séance</Text>
          <Text style={styles.subtitle}>
            {tontine.nom_tontine} - Séance N° {session.numero_seance}
          </Text>
          <Text style={styles.subtitle}>
            {session.date_seance ? formatDate(session.date_seance) : 'Date non spécifiée'}
          </Text>
        </View>

        {/* Session Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la Séance</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lieu :</Text>
            <Text style={styles.infoValue}>{session.lieu || 'Non spécifié'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ordre du jour :</Text>
            <Text style={styles.infoValue}>{session.ordre_du_jour || 'Non spécifié'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre de présents :</Text>
            <Text style={styles.infoValue}>{session.nombre_presents}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total cotisations :</Text>
            <Text style={styles.infoValue}>{formatCurrency(session.total_cotisations)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total pénalités :</Text>
            <Text style={styles.infoValue}>{formatCurrency(session.total_penalites)}</Text>
          </View>
        </View>

        {/* Beneficiary Section */}
        {beneficiary && (
          <View style={styles.section}>
            <View style={styles.beneficiaryBox}>
              <Text style={styles.beneficiaryTitle}>Bénéficiaire du Tour</Text>
              <Text style={styles.beneficiaryText}>
                Nom : {beneficiary.prenom} {beneficiary.nom}
              </Text>
              <Text style={styles.beneficiaryText}>
                Montant reçu : {formatCurrency(beneficiary.montant_recu)}
              </Text>
              <Text style={styles.beneficiaryText}>
                Date de réception : {beneficiary.date_reception ? formatDate(beneficiary.date_reception) : 'N/A'}
              </Text>
            </View>
          </View>
        )}

        {/* Contributions Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cotisations Perçues</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellLarge}>Membre</Text>
              <Text style={styles.tableCell}>Montant</Text>
              <Text style={styles.tableCell}>Mode Paiement</Text>
              <Text style={styles.tableCell}>Statut</Text>
            </View>
            
            {contributions.map((contrib, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCellLarge}>
                  {contrib.prenom} {contrib.nom}
                </Text>
                <Text style={styles.tableCell}>{formatCurrency(contrib.montant_paye)}</Text>
                <Text style={styles.tableCell}>{contrib.mode_paiement}</Text>
                <Text style={styles.tableCell}>
                  {contrib.present ? 'Présent' : 'Absent'}
                </Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.tableCellLarge}>TOTAL</Text>
              <Text style={styles.tableCell}>
                {formatCurrency(contributions.reduce((sum, c) => sum + c.montant_paye, 0))}
              </Text>
              <Text style={styles.tableCell}></Text>
              <Text style={styles.tableCell}></Text>
            </View>
          </View>
        </View>

        {/* Penalties */}
        {penalties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pénalités</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellLarge}>Membre</Text>
                <Text style={styles.tableCell}>Montant</Text>
                <Text style={styles.tableCellLarge}>Raison</Text>
                <Text style={styles.tableCell}>Statut</Text>
              </View>
              
              {penalties.map((penalty, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCellLarge}>
                    {penalty.prenom} {penalty.nom}
                  </Text>
                  <Text style={styles.tableCell}>{formatCurrency(penalty.montant)}</Text>
                  <Text style={styles.tableCellLarge}>{penalty.raison}</Text>
                  <Text style={styles.tableCell}>{penalty.statut}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Absences */}
        {absences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membres Absents ({absences.length})</Text>
            {absences.map((absent, index) => (
              <Text key={index} style={styles.absenceItem}>
                • {absent.prenom} {absent.nom}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
          </Text>
          <Text>NjangiTech - Système de Gestion de Tontine</Text>
        </View>
      </Page>
    </Document>
  );
};

// AG Synthesis Report PDF Document  
export const AGSynthesisDocument: React.FC<{ data: AGSynthesisReport }> = ({ data }) => {
  const { dashboard, projects, emergency_fund, session_trends, tontines, credits_summary, member_participation, financial_ratios, generated_date, report_period } = data;

  return (
    <Document>
      {/* Page 1: Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>NjangiTech</Text>
          <Text style={styles.title}>Synthèse Assemblée Générale</Text>
          <Text style={styles.subtitle}>Rapport Complet de l'État de l'Organisation</Text>
          <Text style={styles.subtitle}>Généré le {formatDate(generated_date)}</Text>
        </View>

        {/* Executive Summary - Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tableau de Bord Financier</Text>
          
          <View style={{...styles.infoRow, backgroundColor: '#ecfdf5', padding: 8, borderRadius: 4, marginBottom: 6}}>
            <Text style={{...styles.infoLabel, color: '#047857', fontWeight: 'bold'}}>💰 Caisse en Main (Net) :</Text>
            <Text style={{...styles.infoValue, color: '#047857', fontSize: 11, fontWeight: 'bold'}}>{formatCurrency(dashboard.cash_in_hand)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Cotisations Collectées :</Text>
            <Text style={styles.infoValue}>{formatCurrency(dashboard.total_contributions)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pénalités Émises / Collectées :</Text>
            <Text style={styles.infoValue}>{formatCurrency(dashboard.total_penalties)} / {formatCurrency(dashboard.total_penalties_collected)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Crédits Décaissés :</Text>
            <Text style={styles.infoValue}>{formatCurrency(dashboard.total_credits_disbursed)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Crédits Restants (Solde) :</Text>
            <Text style={styles.infoValue}>{formatCurrency(dashboard.total_credits_remaining)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Remboursements Crédits Reçus :</Text>
            <Text style={styles.infoValue}>{formatCurrency(dashboard.total_credit_repayments)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tours Distribués :</Text>
            <Text style={styles.infoValue}>{formatCurrency(dashboard.total_tours_distributed)}</Text>
          </View>
        </View>

        {/* Members Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques des Membres</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Membres :</Text>
            <Text style={styles.infoValue}>{dashboard.total_members}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Membres Actifs :</Text>
            <Text style={styles.infoValue}>{dashboard.active_members} ({dashboard.total_members > 0 ? ((dashboard.active_members / dashboard.total_members) * 100).toFixed(1) : 0}%)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Membres Inactifs :</Text>
            <Text style={styles.infoValue}>{dashboard.inactive_members}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taux de Présence Moyen :</Text>
            <Text style={styles.infoValue}>{member_participation.average_attendance.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Financial Ratios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ratios Financiers</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taux de Collecte (Cotisations) :</Text>
            <Text style={styles.infoValue}>{financial_ratios.collection_rate.toFixed(1)}%</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taux de Recouvrement (Crédits) :</Text>
            <Text style={styles.infoValue}>{financial_ratios.credit_recovery_rate.toFixed(1)}%</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taux de Paiement (Pénalités) :</Text>
            <Text style={styles.infoValue}>{financial_ratios.penalty_collection_rate.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Period */}
        <View style={{...styles.section, backgroundColor: '#f0fdf4', padding: 10, borderRadius: 5, borderLeft: '3px solid #047857'}}>
          <Text style={{fontSize: 9, marginBottom: 3, color: '#047857', fontWeight: 'bold'}}>📅 Période du Rapport</Text>
          <Text style={{fontSize: 9, color: '#064e3b'}}>
            {report_period.start_date ? `Du ${formatDate(report_period.start_date)} au ${formatDate(report_period.end_date)}` : 'Depuis le début des opérations'}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Page 1/4 - Généré le {formatDate(generated_date)}</Text>
          <Text>NjangiTech - Rapport Confidentiel</Text>
        </View>
      </Page>

      {/* Page 2: Tontines & Credits */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>NjangiTech</Text>
          <Text style={styles.title}>Tontines & Crédits</Text>
        </View>

        {/* Tontines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tontines Actives ({tontines.length})</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellLarge}>Nom Tontine</Text>
              <Text style={styles.tableCell}>Type</Text>
              <Text style={styles.tableCell}>Membres</Text>
              <Text style={styles.tableCell}>Cotisation</Text>
              <Text style={styles.tableCell}>Statut</Text>
            </View>
            
            {tontines.map((tontine, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCellLarge}>{tontine.nom_tontine}</Text>
                <Text style={styles.tableCell}>{tontine.type}</Text>
                <Text style={styles.tableCell}>{tontine.nombre_membres}</Text>
                <Text style={styles.tableCell}>{formatCurrency(tontine.montant_cotisation)}</Text>
                <Text style={styles.tableCell}>{tontine.statut}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Credits Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synthèse des Crédits</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Crédits Actifs (En cours) :</Text>
            <Text style={styles.infoValue}>{credits_summary.total_active}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Crédits Remboursés :</Text>
            <Text style={styles.infoValue}>{credits_summary.total_completed}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Crédits en Défaut :</Text>
            <Text style={styles.infoValue}>{credits_summary.total_defaulted}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Montant Moyen par Crédit :</Text>
            <Text style={styles.infoValue}>{formatCurrency(credits_summary.average_amount)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Intérêts Gagnés (Estimés) :</Text>
            <Text style={styles.infoValue}>{formatCurrency(credits_summary.total_interest_earned)}</Text>
          </View>
        </View>

        {/* Emergency Fund */}
        <View style={{...styles.section, ...styles.beneficiaryBox}}>
          <Text style={styles.beneficiaryTitle}>🏦 Caisse de Secours</Text>
          <Text style={styles.beneficiaryText}>Montant Réservé : {formatCurrency(emergency_fund.amount)}</Text>
          <Text style={styles.beneficiaryText}>Objectif (5% cotisations) : {formatCurrency(emergency_fund.target)}</Text>
          <Text style={styles.beneficiaryText}>Taux d'Atteinte : {emergency_fund.percentage.toFixed(1)}%</Text>
        </View>

        <View style={styles.footer}>
          <Text>Page 2/4 - Généré le {formatDate(generated_date)}</Text>
        </View>
      </Page>

      {/* Page 3: Projects & Top Contributors */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>NjangiTech</Text>
          <Text style={styles.title}>Projets & Contributeurs</Text>
        </View>

        {/* Projects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projets ({projects.list.length})</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Budget Total :</Text>
            <Text style={styles.infoValue}>{formatCurrency(projects.total_budget)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Montant Alloué :</Text>
            <Text style={styles.infoValue}>{formatCurrency(projects.total_allocated)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Restant Disponible :</Text>
            <Text style={styles.infoValue}>{formatCurrency(projects.remaining)}</Text>
          </View>

          {projects.list.length > 0 && (
            <View style={{...styles.table, marginTop: 10}}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellLarge}>Projet</Text>
                <Text style={styles.tableCell}>Budget</Text>
                <Text style={styles.tableCell}>Alloué</Text>
                <Text style={styles.tableCell}>Statut</Text>
              </View>
              
              {projects.list.slice(0, 8).map((project, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCellLarge}>{project.nom_projet}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(project.budget)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(project.montant_alloue)}</Text>
                  <Text style={styles.tableCell}>{project.statut}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Top Contributors */}
        {member_participation.top_contributors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Top 5 Contributeurs</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellLarge}>Membre</Text>
                <Text style={styles.tableCell}>Total Cotisé</Text>
              </View>
              
              {member_participation.top_contributors.map((contributor, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCellLarge}>
                    {index === 0 && '🥇 '}{index === 1 && '🥈 '}{index === 2 && '🥉 '}
                    {contributor.prenom} {contributor.nom}
                  </Text>
                  <Text style={{...styles.tableCell, fontWeight: 'bold', color: '#047857'}}>
                    {formatCurrency(contributor.total_contributed)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Page 3/4 - Généré le {formatDate(generated_date)}</Text>
        </View>
      </Page>

      {/* Page 4: Session Trends */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>NjangiTech</Text>
          <Text style={styles.title}>Tendances & Historique</Text>
        </View>

        {/* Session Trends */}
        {session_trends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique des Sessions (10 dernières)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCell}>N° Session</Text>
                <Text style={styles.tableCellLarge}>Date</Text>
                <Text style={styles.tableCell}>Cotisations</Text>
                <Text style={styles.tableCell}>Présents</Text>
              </View>
              
              {session_trends.map((session, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{session.numero_seance}</Text>
                  <Text style={styles.tableCellLarge}>{formatDate(session.date)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(session.total_cotisations)}</Text>
                  <Text style={styles.tableCell}>{session.nombre_presents}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary Note */}
        <View style={{...styles.section, backgroundColor: '#f0fdf4', padding: 12, borderRadius: 5, borderLeft: '4px solid #047857'}}>
          <Text style={{fontSize: 10, fontWeight: 'bold', color: '#047857', marginBottom: 6}}>📊 Résumé de Performance</Text>
          <Text style={{fontSize: 9, color: '#064e3b', marginBottom: 3}}>
            • L'organisation compte {dashboard.active_members} membres actifs sur {dashboard.total_members} inscrits
          </Text>
          <Text style={{fontSize: 9, color: '#064e3b', marginBottom: 3}}>
            • Taux de présence moyen : {member_participation.average_attendance.toFixed(1)}%
          </Text>
          <Text style={{fontSize: 9, color: '#064e3b', marginBottom: 3}}>
            • Taux de collecte des cotisations : {financial_ratios.collection_rate.toFixed(1)}%
          </Text>
          <Text style={{fontSize: 9, color: '#064e3b', marginBottom: 3}}>
            • Santé financière : {dashboard.cash_in_hand > 0 ? 'Positive' : 'À surveiller'} ({formatCurrency(dashboard.cash_in_hand)} en caisse)
          </Text>
          <Text style={{fontSize: 9, color: '#064e3b'}}>
            • {credits_summary.total_active} crédits actifs pour un montant total de {formatCurrency(dashboard.total_credits_remaining)}
          </Text>
        </View>

        {/* Signatures section */}
        <View style={{marginTop: 30, flexDirection: 'row', justifyContent: 'space-between'}}>
          <View style={{width: '45%', borderTop: '1px solid #000', paddingTop: 8}}>
            <Text style={{fontSize: 9, textAlign: 'center'}}>Président(e)</Text>
          </View>
          <View style={{width: '45%', borderTop: '1px solid #000', paddingTop: 8}}>
            <Text style={{fontSize: 9, textAlign: 'center'}}>Trésorier(ère)</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Page 4/4 - Fin du Rapport</Text>
          <Text>Ce document est confidentiel et réservé aux membres de l'organisation</Text>
        </View>
      </Page>
    </Document>
  );
};
