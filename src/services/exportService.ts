import { CampRegistration } from '@/types/campRegistration';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import QRCode from 'qrcode';

export const exportService = {
  // Export registrations to CSV
  exportToCSV: (registrations: CampRegistration[], filename: string = 'registrations.csv') => {
    const headers = [
      'Registration Number',
      'Parent Name',
      'Email',
      'Phone',
      'Camp Type',
      'Children Count',
      'Total Amount',
      'Payment Status',
      'Payment Method',
      'Registration Type',
      'Date Created',
    ];

    const rows = registrations.map(reg => [
      reg.registration_number || '',
      reg.parent_name,
      reg.email,
      reg.phone,
      reg.camp_type,
      reg.children.length,
      reg.total_amount,
      reg.payment_status,
      reg.payment_method,
      reg.registration_type,
      new Date(reg.created_at!).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  },

  // Export registrations to Excel (CSV format, can be opened in Excel)
  exportToExcel: (registrations: CampRegistration[], filename: string = 'registrations.xlsx') => {
    // For now, using CSV format which Excel can open
    // You can enhance this with proper xlsx library later
    exportService.exportToCSV(registrations, filename.replace('.xlsx', '.csv'));
  },

  // Export to PDF with detailed formatting
  exportToPDF: (registrations: CampRegistration[], filename: string = 'registrations.pdf') => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Camp Registrations Report', 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Registrations: ${registrations.length}`, 14, 34);

    // Prepare table data
    const tableData = registrations.map(reg => [
      reg.registration_number || '',
      reg.parent_name,
      reg.camp_type,
      reg.children.length.toString(),
      `KES ${reg.total_amount.toFixed(2)}`,
      reg.payment_status,
      new Date(reg.created_at!).toLocaleDateString(),
    ]);

    // Add table
    autoTable(doc, {
      head: [['Reg #', 'Parent', 'Camp', 'Kids', 'Amount', 'Payment', 'Date']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [34, 139, 34] },
    });

    doc.save(filename);
  },

  // Export QR codes as a ZIP file
  exportQRCodes: async (registrations: CampRegistration[], filename: string = 'qr-codes.zip') => {
    const zip = new JSZip();
    
    for (const reg of registrations) {
      try {
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(reg.qr_code_data, {
          width: 500,
          margin: 2,
        });
        
        // Convert data URL to blob
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        
        // Add to zip with registration number as filename
        const qrFilename = `${reg.registration_number || reg.id}_QR.png`;
        zip.file(qrFilename, blob);
      } catch (error) {
        console.error(`Error generating QR for ${reg.registration_number}:`, error);
      }
    }

    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, filename);
  },

  // Export detailed registration list with children
  exportDetailedPDF: (registrations: CampRegistration[], filename: string = 'detailed-registrations.pdf') => {
    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(18);
    doc.text('Detailed Camp Registrations', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
    yPosition += 10;

    registrations.forEach((reg, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      // Registration header
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${reg.parent_name} - ${reg.registration_number}`, 14, yPosition);
      yPosition += 6;

      // Registration details
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Camp: ${reg.camp_type} | Payment: ${reg.payment_status} | Amount: KES ${reg.total_amount}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Email: ${reg.email} | Phone: ${reg.phone}`, 14, yPosition);
      yPosition += 7;

      // Children details
      doc.setFont(undefined, 'bold');
      doc.text('Children:', 14, yPosition);
      yPosition += 5;
      doc.setFont(undefined, 'normal');

      reg.children.forEach((child, childIndex) => {
        doc.text(
          `  ${childIndex + 1}. ${child.childName} (Age: ${child.ageRange}) - ${child.selectedDates.length} days`,
          14,
          yPosition
        );
        yPosition += 5;
      });

      yPosition += 5; // Space between registrations
    });

    doc.save(filename);
  },

  // Export program registrations to CSV
  exportProgramToCSV: (registrations: any[], programType: string, filename?: string) => {
    const headers = [
      'ID',
      'Email',
      'Phone',
      'Status',
      'Date Created',
    ];

    // Add program-specific headers
    if (registrations[0]?.parent_name) headers.splice(1, 0, 'Parent Name');
    if (registrations[0]?.parent_leader) headers.splice(1, 0, 'Parent/Leader');
    if (registrations[0]?.school_name) headers.splice(1, 0, 'School Name');
    if (registrations[0]?.participants) headers.push('Participants Count');
    if (registrations[0]?.children) headers.push('Children Count');

    const rows = registrations.map(reg => {
      const row = [
        reg.id.substring(0, 8),
        reg.email,
        reg.phone,
        reg.status,
        new Date(reg.created_at).toLocaleString(),
      ];

      if (reg.parent_name) row.splice(1, 0, reg.parent_name);
      if (reg.parent_leader) row.splice(1, 0, reg.parent_leader);
      if (reg.school_name) row.splice(1, 0, reg.school_name);
      if (reg.participants) row.push(reg.participants.length || 0);
      if (reg.children) row.push(reg.children.length || 0);

      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const defaultFilename = `${programType}-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, filename || defaultFilename);
  },

  // Export program registrations to PDF
  exportProgramToPDF: (registrations: any[], programType: string, filename?: string) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`${programType} Registrations`, 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Registrations: ${registrations.length}`, 14, 34);

    const tableData = registrations.map(reg => [
      reg.id.substring(0, 8),
      reg.parent_name || reg.parent_leader || reg.school_name || 'N/A',
      reg.email,
      reg.status,
      new Date(reg.created_at).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [['ID', 'Name', 'Email', 'Status', 'Date']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [34, 139, 34] },
    });

    const defaultFilename = `${programType}-registrations-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename || defaultFilename);
  },

  // Calculate program registrations summary
  calculateProgramSummary: (registrations: any[], programType: string) => {
    const statusCounts: Record<string, number> = {};
    registrations.forEach(reg => {
      statusCounts[reg.status] = (statusCounts[reg.status] || 0) + 1;
    });

    const totalParticipants = registrations.reduce((sum, reg) => {
      if (reg.participants) return sum + (reg.participants.length || 0);
      if (reg.children) return sum + (reg.children.length || 0);
      return sum + 1;
    }, 0);

    // Date distribution
    const dateDistribution: Record<string, number> = {};
    registrations.forEach(reg => {
      const date = new Date(reg.created_at).toLocaleDateString();
      dateDistribution[date] = (dateDistribution[date] || 0) + 1;
    });

    return {
      totalRegistrations: registrations.length,
      statusCounts,
      totalParticipants,
      dateDistribution,
      programType,
    };
  },

  // Calculate summary statistics
  calculateSummary: (registrations: CampRegistration[]) => {
    const totalRevenue = registrations.reduce((sum, reg) => sum + reg.total_amount, 0);
    const paidRevenue = registrations
      .filter(reg => reg.payment_status === 'paid')
      .reduce((sum, reg) => sum + reg.total_amount, 0);
    const unpaidRevenue = registrations
      .filter(reg => reg.payment_status === 'unpaid')
      .reduce((sum, reg) => sum + reg.total_amount, 0);
    const partialRevenue = registrations
      .filter(reg => reg.payment_status === 'partial')
      .reduce((sum, reg) => sum + reg.total_amount, 0);

    const totalChildren = registrations.reduce((sum, reg) => sum + reg.children.length, 0);

    const campTypeCounts: Record<string, number> = {};
    registrations.forEach(reg => {
      campTypeCounts[reg.camp_type] = (campTypeCounts[reg.camp_type] || 0) + 1;
    });

    return {
      totalRegistrations: registrations.length,
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      partialRevenue,
      totalChildren,
      campTypeCounts,
      averagePerRegistration: registrations.length > 0 ? totalRevenue / registrations.length : 0,
    };
  },
};
