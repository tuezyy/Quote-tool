import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface QuoteData {
  quoteNumber: string;
  createdAt: Date;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  collection: {
    name: string;
  };
  style: {
    name: string;
  };
  items: Array<{
    product: {
      itemCode: string;
      description: string;
    };
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  companyInfo?: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
}

export async function generateQuotePDF(quote: QuoteData): Promise<Readable> {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('QUOTE', { align: 'center' });
  doc.moveDown(0.5);

  // Company Info (if provided)
  if (quote.companyInfo) {
    doc.fontSize(10).font('Helvetica');
    doc.text(quote.companyInfo.name, { align: 'center' });
    if (quote.companyInfo.address) {
      doc.text(quote.companyInfo.address, { align: 'center' });
    }
    doc.text(`${quote.companyInfo.email} • ${quote.companyInfo.phone}`, { align: 'center' });
    doc.moveDown(1);
  }

  // Draw separator line
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // Quote Info and Customer Info side by side
  const leftColumn = 50;
  const rightColumn = 320;
  const startY = doc.y;

  // Left Column - Quote Info
  doc.fontSize(12).font('Helvetica-Bold').text('Quote Information', leftColumn, startY);
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Quote Number: ${quote.quoteNumber}`, leftColumn);
  doc.text(`Date: ${formatDate(quote.createdAt)}`, leftColumn);
  doc.text(`Collection: ${quote.collection.name}`, leftColumn);
  doc.text(`Style: ${quote.style.name}`, leftColumn);

  // Right Column - Customer Info
  doc.fontSize(12).font('Helvetica-Bold').text('Bill To', rightColumn, startY);
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text(`${quote.customer.firstName} ${quote.customer.lastName}`, rightColumn);
  doc.text(quote.customer.email, rightColumn);
  doc.text(quote.customer.phone, rightColumn);
  if (quote.customer.address) {
    doc.text(quote.customer.address, rightColumn);
    doc.text(`${quote.customer.city}, ${quote.customer.state} ${quote.customer.zipCode}`, rightColumn);
  }

  doc.moveDown(2);

  // Items Table
  const tableTop = doc.y;
  const tableHeaders = ['Item Code', 'Description', 'Qty', 'Unit Price', 'Total'];
  const columnWidths = [80, 220, 40, 80, 80];
  const columnPositions = [50, 130, 350, 390, 470];

  // Table Header
  doc.fontSize(10).font('Helvetica-Bold');
  tableHeaders.forEach((header, i) => {
    const align = i >= 2 ? 'right' : 'left';
    doc.text(header, columnPositions[i], tableTop, {
      width: columnWidths[i],
      align: align
    });
  });

  // Draw line under header
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let itemY = tableTop + 25;
  doc.font('Helvetica').fontSize(9);

  // Table Rows
  quote.items.forEach((item, index) => {
    // Check if we need a new page
    if (itemY > 700) {
      doc.addPage();
      itemY = 50;
    }

    const row = [
      item.product.itemCode,
      item.product.description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(item.total)
    ];

    row.forEach((text, i) => {
      const align = i >= 2 ? 'right' : 'left';
      doc.text(text, columnPositions[i], itemY, {
        width: columnWidths[i],
        align: align
      });
    });

    itemY += 20;

    // Draw subtle line between rows
    if (index < quote.items.length - 1) {
      doc.strokeColor('#EEEEEE').moveTo(50, itemY - 5).lineTo(550, itemY - 5).stroke();
      doc.strokeColor('#000000');
    }
  });

  // Draw line before totals
  itemY += 10;
  doc.moveTo(50, itemY).lineTo(550, itemY).stroke();
  itemY += 15;

  // Totals
  const totalsX = 390;
  doc.fontSize(10).font('Helvetica');

  doc.text('Subtotal:', totalsX, itemY);
  doc.text(formatCurrency(quote.subtotal), 470, itemY, { width: 80, align: 'right' });
  itemY += 20;

  doc.text(`Tax (${(quote.taxRate * 100).toFixed(2)}%):`, totalsX, itemY);
  doc.text(formatCurrency(quote.taxAmount), 470, itemY, { width: 80, align: 'right' });
  itemY += 20;

  // Draw line before total
  doc.strokeColor('#000000').moveTo(390, itemY).lineTo(550, itemY).stroke();
  itemY += 15;

  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('Total:', totalsX, itemY);
  doc.text(formatCurrency(quote.total), 470, itemY, { width: 80, align: 'right' });

  // Notes
  if (quote.notes) {
    itemY += 40;
    if (itemY > 650) {
      doc.addPage();
      itemY = 50;
    }
    doc.fontSize(12).font('Helvetica-Bold').text('Notes:', 50, itemY);
    itemY += 20;
    doc.fontSize(10).font('Helvetica').text(quote.notes, 50, itemY, {
      width: 500,
      align: 'left'
    });
  }

  // Footer
  const bottomY = 750;
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  doc.text(
    'Thank you for your business!',
    50,
    bottomY,
    { align: 'center', width: 500 }
  );

  // Finalize PDF
  doc.end();

  return doc;
}
