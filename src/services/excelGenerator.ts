import ExcelJS from 'exceljs';
import { DetailedMemberFinancialReport } from './reportService';

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
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export async function generateMemberFinancialExcel(data: DetailedMemberFinancialReport): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NjangiTech';
  workbook.created = new Date();

  // Create worksheet
  const worksheet = workbook.addWorksheet('Situation Financière', {
    properties: { tabColor: { argb: 'FF1E40AF' } },
    views: [{ showGridLines: true }],
  });

  // Set column widths
  worksheet.columns = [
    { width: 15 }, // Column A
    { width: 25 }, // Column B
    { width: 15 }, // Column C
    { width: 20 }, // Column D
    { width: 20 }, // Column E
  ];

  // ===== HEADER SECTION =====
  worksheet.mergeCells('A1:E1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'NjangiTech - Situation Financière du Membre';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;

  // Member Info
  let currentRow = 3;
  worksheet.getCell(`A${currentRow}`).value = 'Membre :';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = `${data.member.prenom} ${data.member.nom}`;
  
  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = 'Email :';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = data.member.email;
  
  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = 'Téléphone :';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = data.member.telephone;

  currentRow += 2;

  // ===== CONTRIBUTIONS SECTION =====
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  const contributionsTitleCell = worksheet.getCell(`A${currentRow}`);
  contributionsTitleCell.value = '📊 COTISATIONS';
  contributionsTitleCell.font = { size: 14, bold: true, color: { argb: 'FF1E40AF' } };
  contributionsTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0F2FE' },
  };
  contributionsTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(currentRow).height = 25;
  
  currentRow++;

  // Contributions table header
  const contribHeaderRow = worksheet.getRow(currentRow);
  contribHeaderRow.values = ['Date', 'Tontine', 'Séance N°', 'Montant', 'Mode Paiement'];
  contribHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  contribHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF22C55E' }, // Green
  };
  contribHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  contribHeaderRow.height = 20;
  
  currentRow++;

  // Contributions data
  data.contributions.forEach((contrib) => {
    const row = worksheet.getRow(currentRow);
    row.values = [
      contrib.date ? formatDate(contrib.date) : 'N/A',
      contrib.tontine,
      contrib.session,
      contrib.montant,
      contrib.mode_paiement,
    ];
    
    // Format amount cell
    const amountCell = worksheet.getCell(`D${currentRow}`);
    amountCell.numFmt = '#,##0 "XAF"';
    amountCell.alignment = { horizontal: 'right' };
    
    row.alignment = { vertical: 'middle' };
    currentRow++;
  });

  // Contributions total
  const contribTotalRow = worksheet.getRow(currentRow);
  contribTotalRow.values = ['', '', 'TOTAL', data.total_contributions, ''];
  contribTotalRow.font = { bold: true };
  contribTotalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF9FAFB' },
  };
  const totalContribCell = worksheet.getCell(`D${currentRow}`);
  totalContribCell.numFmt = '#,##0 "XAF"';
  totalContribCell.alignment = { horizontal: 'right' };
  contribTotalRow.height = 22;
  
  currentRow += 2;

  // ===== CREDITS SECTION =====
  if (data.credits.length > 0) {
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const creditsTitleCell = worksheet.getCell(`A${currentRow}`);
    creditsTitleCell.value = '💳 CRÉDITS EN COURS';
    creditsTitleCell.font = { size: 14, bold: true, color: { argb: 'FFDC2626' } };
    creditsTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF2F2' },
    };
    creditsTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getRow(currentRow).height = 25;
    
    currentRow++;

    // Credits table header
    const creditsHeaderRow = worksheet.getRow(currentRow);
    creditsHeaderRow.values = ['Date Décaissement', 'Montant', 'Taux (%)', 'Solde Restant', 'Statut'];
    creditsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    creditsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEF4444' }, // Red
    };
    creditsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    creditsHeaderRow.height = 20;
    
    currentRow++;

    // Credits data
    data.credits.forEach((credit) => {
      const row = worksheet.getRow(currentRow);
      row.values = [
        credit.date_decaissement ? formatDate(credit.date_decaissement) : 'N/A',
        credit.montant,
        credit.taux_interet,
        credit.solde_restant,
        credit.statut,
      ];
      
      // Format amount cells
      worksheet.getCell(`B${currentRow}`).numFmt = '#,##0 "XAF"';
      worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'right' };
      
      worksheet.getCell(`D${currentRow}`).numFmt = '#,##0 "XAF"';
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: 'right' };
      
      worksheet.getCell(`C${currentRow}`).numFmt = '0.00"%"';
      worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center' };
      
      row.alignment = { vertical: 'middle' };
      currentRow++;
    });

    // Credits total
    const creditsTotalRow = worksheet.getRow(currentRow);
    creditsTotalRow.values = ['', '', 'TOTAL DETTES', data.total_debts, ''];
    creditsTotalRow.font = { bold: true };
    creditsTotalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' },
    };
    const totalDebtsCell = worksheet.getCell(`D${currentRow}`);
    totalDebtsCell.numFmt = '#,##0 "XAF"';
    totalDebtsCell.alignment = { horizontal: 'right' };
    creditsTotalRow.height = 22;
    
    currentRow += 2;
  }

  // ===== PENALTIES SECTION =====
  if (data.penalties.length > 0) {
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const penaltiesTitleCell = worksheet.getCell(`A${currentRow}`);
    penaltiesTitleCell.value = '⚠️ PÉNALITÉS';
    penaltiesTitleCell.font = { size: 14, bold: true, color: { argb: 'FFF59E0B' } };
    penaltiesTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFBEB' },
    };
    penaltiesTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getRow(currentRow).height = 25;
    
    currentRow++;

    // Penalties table header
    const penaltiesHeaderRow = worksheet.getRow(currentRow);
    penaltiesHeaderRow.values = ['Date', 'Séance N°', 'Montant', 'Raison', 'Statut'];
    penaltiesHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    penaltiesHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF59E0B' }, // Yellow/Orange
    };
    penaltiesHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    penaltiesHeaderRow.height = 20;
    
    currentRow++;

    // Penalties data
    data.penalties.forEach((penalty) => {
      const row = worksheet.getRow(currentRow);
      row.values = [
        penalty.date ? formatDate(penalty.date) : 'N/A',
        penalty.session,
        penalty.montant,
        penalty.raison,
        penalty.statut,
      ];
      
      // Format amount cell
      const amountCell = worksheet.getCell(`C${currentRow}`);
      amountCell.numFmt = '#,##0 "XAF"';
      amountCell.alignment = { horizontal: 'right' };
      
      row.alignment = { vertical: 'middle' };
      currentRow++;
    });

    // Penalties total
    const penaltiesTotalRow = worksheet.getRow(currentRow);
    penaltiesTotalRow.values = ['', 'TOTAL PÉNALITÉS', data.total_penalties, '', ''];
    penaltiesTotalRow.font = { bold: true };
    penaltiesTotalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' },
    };
    const totalPenaltiesCell = worksheet.getCell(`C${currentRow}`);
    totalPenaltiesCell.numFmt = '#,##0 "XAF"';
    totalPenaltiesCell.alignment = { horizontal: 'right' };
    penaltiesTotalRow.height = 22;
    
    currentRow += 2;
  }

  // ===== NET BALANCE SECTION =====
  currentRow++;
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  const balanceLabelCell = worksheet.getCell(`A${currentRow}`);
  balanceLabelCell.value = 'SOLDE NET (Cotisations - Dettes - Pénalités) :';
  balanceLabelCell.font = { size: 13, bold: true };
  balanceLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };
  
  const balanceValueCell = worksheet.getCell(`E${currentRow}`);
  balanceValueCell.value = data.net_balance;
  balanceValueCell.numFmt = '#,##0 "XAF"';
  balanceValueCell.font = { size: 14, bold: true, color: { argb: data.net_balance >= 0 ? 'FF22C55E' : 'FFEF4444' } };
  balanceValueCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: data.net_balance >= 0 ? 'FFD1FAE5' : 'FFFEE2E2' },
  };
  balanceValueCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(currentRow).height = 30;

  // Add borders to all cells with data
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    }
  });

  // Generate Excel file as Blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Helper function to download the Excel file
export function downloadExcelFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
