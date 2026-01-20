import PDFDocument from 'pdfkit';

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
      msrp?: number;
    };
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  installationFee?: number;
  miscExpenses?: number;
  msrpTotal?: number;
  notes?: string;
  companyInfo?: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  clientView?: boolean;
}

export function generateQuotePDF(quote: QuoteData): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate MSRP total from items if not provided
  const msrpTotal = quote.msrpTotal || quote.items.reduce((sum, item) =>
    sum + ((item.product.msrp || item.unitPrice) * item.quantity), 0);

  const packagePrice = quote.subtotal + (quote.installationFee || 0);
  const totalSavings = msrpTotal - quote.subtotal;

  if (quote.clientView) {
    // CLIENT-FACING PDF - Value-focused presentation
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#1e40af').text('CABINET QUOTE', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica').fillColor('#666666').text('Premium Cabinets at Exceptional Value', { align: 'center' });
    doc.moveDown(0.5);

    if (quote.companyInfo) {
      doc.fontSize(10).fillColor('#333333');
      doc.text(quote.companyInfo.name, { align: 'center' });
      if (quote.companyInfo.address) doc.text(quote.companyInfo.address, { align: 'center' });
      doc.text(`${quote.companyInfo.email} • ${quote.companyInfo.phone}`, { align: 'center' });
      doc.moveDown(1);
    }

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#1e40af').lineWidth(2).stroke();
    doc.moveDown(1);

    // Quote & Customer Info
    const leftColumn = 50;
    const rightColumn = 320;
    const startY = doc.y;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('Quote Details', leftColumn, startY);
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    doc.text(`Quote #: ${quote.quoteNumber}`, leftColumn);
    doc.text(`Date: ${formatDate(quote.createdAt)}`, leftColumn);
    doc.text(`Collection: ${quote.collection.name}`, leftColumn);
    doc.text(`Style: ${quote.style.name}`, leftColumn);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('Prepared For', rightColumn, startY);
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    doc.text(`${quote.customer.firstName} ${quote.customer.lastName}`, rightColumn);
    doc.text(quote.customer.email, rightColumn);
    doc.text(quote.customer.phone, rightColumn);
    if (quote.customer.address) {
      doc.text(quote.customer.address, rightColumn);
      doc.text(`${quote.customer.city}, ${quote.customer.state} ${quote.customer.zipCode}`, rightColumn);
    }

    doc.moveDown(2);

    // Value Summary Box
    const boxY = doc.y;
    doc.rect(50, boxY, 500, 80).fillColor('#f0f9ff').fill();
    doc.rect(50, boxY, 500, 80).strokeColor('#1e40af').lineWidth(1).stroke();

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af').text('YOUR SAVINGS SUMMARY', 70, boxY + 15);

    doc.fontSize(11).font('Helvetica').fillColor('#666666');
    doc.text(`Retail Market Value:`, 70, boxY + 40);
    doc.text(`${formatCurrency(msrpTotal)}`, 250, boxY + 40, { width: 100, align: 'right', strike: true });

    doc.font('Helvetica-Bold').fillColor('#16a34a');
    doc.text(`You Save:`, 380, boxY + 40);
    doc.text(`${formatCurrency(totalSavings)}`, 450, boxY + 40, { width: 80, align: 'right' });

    doc.y = boxY + 100;

    // Items Table
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('Item', 50, tableTop, { width: 80 });
    doc.text('Description', 130, tableTop, { width: 250 });
    doc.text('Qty', 380, tableTop, { width: 40, align: 'center' });
    doc.text('Price', 420, tableTop, { width: 80, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#e5e7eb').stroke();

    let itemY = tableTop + 25;
    doc.font('Helvetica').fillColor('#333333').fontSize(9);

    quote.items.forEach((item) => {
      if (itemY > 680) {
        doc.addPage();
        itemY = 50;
      }
      doc.text(item.product.itemCode, 50, itemY, { width: 80 });
      doc.text(item.product.description, 130, itemY, { width: 250 });
      doc.text(item.quantity.toString(), 380, itemY, { width: 40, align: 'center' });
      doc.text(formatCurrency(item.total), 420, itemY, { width: 80, align: 'right' });
      itemY += 18;
    });

    itemY += 15;
    doc.moveTo(50, itemY).lineTo(550, itemY).strokeColor('#1e40af').lineWidth(1).stroke();
    itemY += 20;

    // Totals - Client View
    const totalsX = 350;
    doc.fontSize(10).font('Helvetica').fillColor('#666666');
    doc.text('Cabinet Package:', totalsX, itemY);
    doc.text(formatCurrency(quote.subtotal), 470, itemY, { width: 80, align: 'right' });
    itemY += 18;

    if (quote.installationFee && quote.installationFee > 0) {
      doc.text('Professional Installation:', totalsX, itemY);
      doc.text(formatCurrency(quote.installationFee), 470, itemY, { width: 80, align: 'right' });
      itemY += 18;
    }

    doc.text(`Tax (${(quote.taxRate * 100).toFixed(2)}%):`, totalsX, itemY);
    doc.text(formatCurrency(quote.taxAmount), 470, itemY, { width: 80, align: 'right' });
    itemY += 20;

    doc.moveTo(350, itemY).lineTo(550, itemY).strokeColor('#1e40af').stroke();
    itemY += 15;

    // Package Total
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('TOTAL PACKAGE:', totalsX, itemY);
    doc.text(formatCurrency(quote.total + (quote.installationFee || 0)), 450, itemY, { width: 100, align: 'right' });

    // Footer
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    doc.text('Thank you for choosing us for your cabinet needs!', 50, 730, { align: 'center', width: 500 });

  } else {
    // INSTALLER VIEW - Full cost breakdown
    doc.fontSize(24).font('Helvetica-Bold').text('QUOTE - INTERNAL', { align: 'center' });
    doc.moveDown(0.5);

    if (quote.companyInfo) {
      doc.fontSize(10).font('Helvetica');
      doc.text(quote.companyInfo.name, { align: 'center' });
      if (quote.companyInfo.address) doc.text(quote.companyInfo.address, { align: 'center' });
      doc.text(`${quote.companyInfo.email} • ${quote.companyInfo.phone}`, { align: 'center' });
      doc.moveDown(1);
    }

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    const leftColumn = 50;
    const rightColumn = 320;
    const startY = doc.y;

    doc.fontSize(12).font('Helvetica-Bold').text('Quote Information', leftColumn, startY);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Quote Number: ${quote.quoteNumber}`, leftColumn);
    doc.text(`Date: ${formatDate(quote.createdAt)}`, leftColumn);
    doc.text(`Collection: ${quote.collection.name}`, leftColumn);
    doc.text(`Style: ${quote.style.name}`, leftColumn);

    doc.fontSize(12).font('Helvetica-Bold').text('Customer', rightColumn, startY);
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

    // Items Table with MSRP
    const tableTop = doc.y;
    const headers = ['Item', 'Description', 'Qty', 'MSRP', 'Your Cost', 'Total'];
    const colPos = [50, 110, 300, 340, 410, 480];

    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, colPos[i], tableTop, { width: 60, align: i >= 2 ? 'right' : 'left' });
    });

    doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).stroke();

    let itemY = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    quote.items.forEach((item) => {
      if (itemY > 680) {
        doc.addPage();
        itemY = 50;
      }
      const msrp = item.product.msrp || item.unitPrice;
      doc.text(item.product.itemCode, colPos[0], itemY, { width: 60 });
      doc.text(item.product.description.substring(0, 35), colPos[1], itemY, { width: 190 });
      doc.text(item.quantity.toString(), colPos[2], itemY, { width: 40, align: 'right' });
      doc.text(formatCurrency(msrp), colPos[3], itemY, { width: 60, align: 'right' });
      doc.text(formatCurrency(item.unitPrice), colPos[4], itemY, { width: 60, align: 'right' });
      doc.text(formatCurrency(item.total), colPos[5], itemY, { width: 70, align: 'right' });
      itemY += 15;
    });

    itemY += 10;
    doc.moveTo(50, itemY).lineTo(550, itemY).stroke();
    itemY += 15;

    // Cost Breakdown
    const totalsX = 350;
    doc.fontSize(10).font('Helvetica');

    doc.text('MSRP Total:', totalsX, itemY);
    doc.text(formatCurrency(msrpTotal), 470, itemY, { width: 80, align: 'right' });
    itemY += 18;

    doc.text('Wholesale Cost (Cabinets):', totalsX, itemY);
    doc.text(formatCurrency(quote.subtotal), 470, itemY, { width: 80, align: 'right' });
    itemY += 18;

    if (quote.installationFee && quote.installationFee > 0) {
      doc.text('Installation Labor:', totalsX, itemY);
      doc.text(formatCurrency(quote.installationFee), 470, itemY, { width: 80, align: 'right' });
      itemY += 18;
    }

    if (quote.miscExpenses && quote.miscExpenses > 0) {
      doc.text('Misc Expenses:', totalsX, itemY);
      doc.text(formatCurrency(quote.miscExpenses), 470, itemY, { width: 80, align: 'right' });
      itemY += 18;
    }

    doc.moveTo(350, itemY).lineTo(550, itemY).stroke();
    itemY += 10;

    const internalTotal = quote.subtotal + (quote.installationFee || 0) + (quote.miscExpenses || 0);
    doc.font('Helvetica-Bold');
    doc.text('INTERNAL COST (Break-even):', totalsX, itemY);
    doc.text(formatCurrency(internalTotal), 470, itemY, { width: 80, align: 'right' });
    itemY += 25;

    doc.text(`Tax (${(quote.taxRate * 100).toFixed(2)}%):`, totalsX, itemY);
    doc.text(formatCurrency(quote.taxAmount), 470, itemY, { width: 80, align: 'right' });
    itemY += 18;

    doc.moveTo(350, itemY).lineTo(550, itemY).stroke();
    itemY += 10;

    doc.fontSize(12);
    doc.text('CLIENT TOTAL:', totalsX, itemY);
    doc.text(formatCurrency(quote.total + (quote.installationFee || 0)), 450, itemY, { width: 100, align: 'right' });
    itemY += 20;

    const margin = (quote.total + (quote.installationFee || 0)) - internalTotal;
    doc.fillColor('#16a34a');
    doc.text('PROFIT MARGIN:', totalsX, itemY);
    doc.text(formatCurrency(margin), 450, itemY, { width: 100, align: 'right' });
  }

  if (quote.notes) {
    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('Notes:');
    doc.fontSize(10).font('Helvetica').text(quote.notes, { width: 500 });
  }

  doc.end();
  return doc;
}
