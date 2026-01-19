import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Membre } from '@/types/database.types';

/**
 * Beautiful PDF export utility with custom templates
 */

// Common PDF styling - using tuples for RGB colors
const colors = {
  primary: [16, 185, 129] as [number, number, number], // Emerald 600
  secondary: [100, 116, 139] as [number, number, number], // Slate 500
  accent: [245, 158, 11] as [number, number, number], // Amber 500
  dark: [15, 23, 42] as [number, number, number], // Slate 900
  light: [248, 250, 252] as [number, number, number], // Slate 50
};

function addHeader(doc: jsPDF, title: string) {
  // Logo/Brand area (if you have a logo, add it here)
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 15, 25);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('NjangiTech - Système de Gestion de Tontine', 15, 33);
  
  // Date
  const date = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(date, 195, 33, { align: 'right' });
}

function addFooter(doc: jsPDF, pageNumber: number) {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFillColor(...colors.light);
  doc.rect(0, pageHeight - 20, 210, 20, 'F');
  
  doc.setTextColor(...colors.secondary);
  doc.setFontSize(8);
  doc.text(
    `Page ${pageNumber} • © ${new Date().getFullYear()} NjangiTech`,
    105,
    pageHeight - 10,
    { align: 'center' }
  );
}

/**
 * Export members list to PDF
 */
export function exportMembersToPDF(members: Membre[]) {
  const doc = new jsPDF();
  
  addHeader(doc, 'Liste des Membres');
  
  // Summary cards
  const activeCount = members.filter(m => m.statut === 'Actif').length;
  const inactiveCount = members.filter(m => m.statut === 'Inactif').length;
  
  doc.setFillColor(...colors.light);
  doc.roundedRect(15, 50, 60, 25, 3, 3, 'F');
  doc.roundedRect(80, 50, 60, 25, 3, 3, 'F');
  doc.roundedRect(145, 50, 50, 25, 3, 3, 'F');
  
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.text('Total Membres', 20, 58);
  doc.text('Actifs', 85, 58);
  doc.text('Inactifs', 150, 58);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text(members.length.toString(), 45, 70, { align: 'center' });
  doc.setTextColor(16, 185, 129); // Green
  doc.text(activeCount.toString(), 110, 70, { align: 'center' });
  doc.setTextColor(...colors.secondary);
  doc.text(inactiveCount.toString(), 170, 70, { align: 'center' });
  
  // Table
  autoTable(doc, {
    startY: 85,
    head: [['Nom', 'Prénom', 'Email', 'Téléphone', 'Statut']],
    body: members.map(m => [
      m.nom,
      m.prenom,
      m.email || '-',
      m.telephone || '-',
      m.statut,
    ]),
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: colors.dark,
    },
    alternateRowStyles: {
      fillColor: colors.light,
    },
    margin: { left: 15, right: 15 },
    didDrawPage: (data) => {
      addFooter(doc, data.pageNumber);
    },
  });
  
  doc.save(`membres-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export session report to PDF
 */
export function exportSessionReportToPDF(session: any, contributions: any[], penalties: any[]) {
  const doc = new jsPDF();
  
  addHeader(doc, `Rapport de Séance #${session.numero_seance}`);
  
  // Session info
  doc.setFontSize(12);
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations de la Séance', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const sessionInfo = [
    ['Date', new Date(session.date).toLocaleDateString('fr-FR')],
    ['Lieu', session.lieu],
    ['Présents', `${session.nombre_presents} membres`],
    ['Total Cotisations', `${new Intl.NumberFormat('fr-FR').format(session.total_cotisations)} XAF`],
    ['Total Pénalités', `${new Intl.NumberFormat('fr-FR').format(session.total_penalites)} XAF`],
  ];
  
  let y = 65;
  sessionInfo.forEach(([label, value]) => {
    doc.setTextColor(...colors.secondary);
    doc.text(`${label}:`, 20, y);
    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 60, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
  });
  
  // Contributions table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Cotisations', 15, y + 10);
  
  autoTable(doc, {
    startY: y + 15,
    head: [['Membre', 'Montant', 'Statut', 'Date']],
    body: contributions.map(c => [
      `${c.membre?.nom} ${c.membre?.prenom}`,
      `${new Intl.NumberFormat('fr-FR').format(c.montant)} XAF`,
      c.statut === 'complete' ? '✓ Complet' : '○ En attente',
      new Date(c.date).toLocaleDateString('fr-FR'),
    ]),
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: colors.dark,
    },
    alternateRowStyles: {
      fillColor: colors.light,
    },
    margin: { left: 15, right: 15 },
  });
  
  // If there are penalties
  if (penalties.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || y + 60;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...colors.dark);
    doc.text('Pénalités', 15, finalY + 15);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Membre', 'Montant', 'Motif', 'Statut']],
      body: penalties.map(p => [
        `${p.membre?.nom} ${p.membre?.prenom}`,
        `${new Intl.NumberFormat('fr-FR').format(p.montant)} XAF`,
        p.motif,
        p.statut === 'paye' ? '✓ Payé' : '○ Non payé',
      ]),
      headStyles: {
        fillColor: colors.accent,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: colors.dark,
      },
      alternateRowStyles: {
        fillColor: colors.light,
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        addFooter(doc, data.pageNumber);
      },
    });
  }
  
  addFooter(doc, 1);
  
  doc.save(`seance-${session.numero_seance}-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export financial summary to PDF
 */
export function exportFinancialSummaryToPDF(data: {
  totalCash: number;
  totalContributions: number;
  totalCredits: number;
  totalPenalties: number;
  sessions: any[];
}) {
  const doc = new jsPDF();
  
  addHeader(doc, 'Synthèse Financière');
  
  // Financial summary cards
  const cards = [
    { label: 'Caisse Totale', value: data.totalCash, color: colors.primary },
    { label: 'Cotisations', value: data.totalContributions, color: colors.primary },
    { label: 'Crédits Octroyés', value: data.totalCredits, color: colors.accent },
    { label: 'Pénalités', value: data.totalPenalties, color: colors.secondary },
  ];
  
  let x = 15;
  let y = 50;
  
  cards.forEach((card, index) => {
    if (index === 2) {
      x = 15;
      y = 90;
    }
    
    doc.setFillColor(...card.color);
    doc.roundedRect(x, y, 90, 30, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + 5, y + 10);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const formattedValue = new Intl.NumberFormat('fr-FR').format(card.value) + ' XAF';
    doc.text(formattedValue, x + 5, y + 24);
    
    x += 95;
  });
  
  // Sessions table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.dark);
  doc.text('Historique des Séances', 15, 135);
  
  autoTable(doc, {
    startY: 140,
    head: [['Séance', 'Date', 'Présents', 'Cotisations', 'Pénalités']],
    body: data.sessions.map(s => [
      `#${s.numero_seance}`,
      new Date(s.date).toLocaleDateString('fr-FR'),
      s.nombre_presents,
      `${new Intl.NumberFormat('fr-FR').format(s.total_cotisations)} XAF`,
      `${new Intl.NumberFormat('fr-FR').format(s.total_penalites)} XAF`,
    ]),
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: colors.dark,
    },
    alternateRowStyles: {
      fillColor: colors.light,
    },
    margin: { left: 15, right: 15 },
    didDrawPage: (data) => {
      addFooter(doc, data.pageNumber);
    },
  });
  
  doc.save(`synthese-financiere-${new Date().toISOString().split('T')[0]}.pdf`);
}
