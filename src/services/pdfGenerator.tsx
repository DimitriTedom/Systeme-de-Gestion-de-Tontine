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
  const { dashboard, projects, emergency_fund, session_trends, tontines } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>NjangiTech</Text>
          <Text style={styles.title}>Synthèse Assemblée Générale</Text>
          <Text style={styles.subtitle}>Tableau de Bord Financier</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs Financiers</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Cotisations :</Text>
            <Text style={styles.infoValue}>{formatCurrency(dashboard.total_contributions)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Caisse en Main :</Text>
            <Text style={styles.infoValue}>{formatCurrency(dashboard.cash_in_hand)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Crédits Décaissés :</Text>
            <Text style={styles.infoValue}>{formatCurrency(dashboard.total_credits_disbursed)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tontines Actives</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellLarge}>Nom Tontine</Text>
              <Text style={styles.tableCell}>Membres</Text>
              <Text style={styles.tableCell}>Cotisation</Text>
            </View>
            
            {tontines.map((tontine, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCellLarge}>{tontine.nom_tontine}</Text>
                <Text style={styles.tableCell}>{tontine.nombre_membres}</Text>
                <Text style={styles.tableCell}>{formatCurrency(tontine.montant_cotisation)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Page 1/2 - Généré le {new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>NjangiTech</Text>
          <Text style={styles.title}>Projets et Investissements</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liste des Projets</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellLarge}>Projet</Text>
              <Text style={styles.tableCell}>Budget</Text>
              <Text style={styles.tableCell}>Alloué</Text>
              <Text style={styles.tableCell}>Statut</Text>
            </View>
            
            {projects.list.map((project, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCellLarge}>{project.nom_projet}</Text>
                <Text style={styles.tableCell}>{formatCurrency(project.budget)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(project.montant_alloue)}</Text>
                <Text style={styles.tableCell}>{project.statut}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Page 2/2 - Généré le {new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
      </Page>
    </Document>
  );
};
