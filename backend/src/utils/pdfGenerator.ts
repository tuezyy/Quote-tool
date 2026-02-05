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
  subtotal: number;              // Wholesale cabinet cost (our cost)
  clientCabinetPrice?: number;   // What we charge customer for cabinets
  taxRate: number;
  taxAmount: number;
  total: number;                 // Client total = clientCabinetPrice + tax
  installationFee?: number;      // Our labor cost (internal only - NOT shown to customer)
  miscExpenses?: number;         // Other internal costs
  msrpTotal?: number;            // Retail value for "you save" display
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

  // Client pricing - installation and misc are charges TO the customer
  const clientCabinetPrice = quote.clientCabinetPrice || quote.subtotal;
  const clientSubtotal = clientCabinetPrice + (quote.installationFee || 0) + (quote.miscExpenses || 0);
  const totalSavings = msrpTotal - clientSubtotal;

  // Profit = what we charge (before tax) - wholesale cost
  const profit = clientSubtotal - quote.subtotal;

  // Calculate quote expiration (30 days from creation)
  const expirationDate = new Date(quote.createdAt);
  expirationDate.setDate(expirationDate.getDate() + 30);

  if (quote.clientView) {
    // CLIENT-FACING PDF - Professional sales presentation
    // NO installation costs shown - only cabinet pricing

    doc.fontSize(28).font('Helvetica-Bold').fillColor('#1e40af').text('CABINET QUOTE', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica').fillColor('#666666').text('Premium Quality Cabinets at Exceptional Value', { align: 'center' });
    doc.moveDown(0.5);

    if (quote.companyInfo) {
      doc.fontSize(10).fillColor('#333333');
      doc.text(quote.companyInfo.name, { align: 'center' });
      if (quote.companyInfo.address) doc.text(quote.companyInfo.address, { align: 'center' });
      doc.text(`${quote.companyInfo.email} | ${quote.companyInfo.phone}`, { align: 'center' });
      doc.moveDown(1);
    }

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#1e40af').lineWidth(2).stroke();
    doc.moveDown(1);

    // Quote & Customer Info - Side by side
    const leftColumn = 50;
    const rightColumn = 320;
    const startY = doc.y;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('Quote Details', leftColumn, startY);
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    doc.text(`Quote #: ${quote.quoteNumber}`, leftColumn);
    doc.text(`Date: ${formatDate(quote.createdAt)}`, leftColumn);
    doc.text(`Valid Until: ${formatDate(expirationDate)}`, leftColumn);
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

    // Value Summary Box - Highlight savings
    const boxY = doc.y;
    doc.rect(50, boxY, 500, 85).fillColor('#f0f9ff').fill();
    doc.rect(50, boxY, 500, 85).strokeColor('#1e40af').lineWidth(2).stroke();

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af').text('YOUR EXCLUSIVE SAVINGS', 70, boxY + 12);

    doc.fontSize(11).font('Helvetica').fillColor('#666666');
    doc.text(`Retail Market Value:`, 70, boxY + 38);
    doc.font('Helvetica').fillColor('#999999');
    const msrpText = formatCurrency(msrpTotal);
    doc.text(msrpText, 220, boxY + 38, { width: 100, align: 'right' });
    // Draw strikethrough line manually
    const msrpWidth = doc.widthOfString(msrpText);
    doc.moveTo(320 - msrpWidth, boxY + 44).lineTo(320, boxY + 44).strokeColor('#999999').lineWidth(0.5).stroke();

    doc.font('Helvetica-Bold').fillColor('#16a34a').fontSize(13);
    doc.text(`You Save:`, 360, boxY + 35);
    doc.text(`${formatCurrency(totalSavings)}`, 440, boxY + 35, { width: 90, align: 'right' });

    if (totalSavings > 0) {
      const savingsPercent = msrpTotal > 0 ? Math.round((totalSavings / msrpTotal) * 100) : 0;
      doc.fontSize(10).font('Helvetica').fillColor('#16a34a');
      doc.text(`(${savingsPercent}% OFF Retail)`, 440, boxY + 55, { width: 90, align: 'right' });
    }

    doc.y = boxY + 105;

    // Items Table - Clean presentation
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('Item Code', 50, tableTop, { width: 80 });
    doc.text('Description', 130, tableTop, { width: 250 });
    doc.text('Qty', 390, tableTop, { width: 30, align: 'center' });
    doc.text('Price', 430, tableTop, { width: 70, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#d1d5db').stroke();

    let itemY = tableTop + 25;
    doc.font('Helvetica').fillColor('#333333').fontSize(9);

    quote.items.forEach((item) => {
      if (itemY > 620) {
        doc.addPage();
        itemY = 50;
      }
      doc.text(item.product.itemCode, 50, itemY, { width: 80 });
      doc.text(item.product.description, 130, itemY, { width: 260 });
      doc.text(item.quantity.toString(), 390, itemY, { width: 30, align: 'center' });
      doc.text(formatCurrency(item.total), 430, itemY, { width: 70, align: 'right' });
      itemY += 18;
    });

    itemY += 10;
    doc.moveTo(50, itemY).lineTo(550, itemY).strokeColor('#1e40af').lineWidth(1).stroke();
    itemY += 20;

    // Totals - Show all charges to customer
    const totalsX = 350;
    doc.fontSize(11).font('Helvetica').fillColor('#333333');
    doc.text('Cabinet Package:', totalsX, itemY);
    doc.text(formatCurrency(clientCabinetPrice), 470, itemY, { width: 80, align: 'right' });
    itemY += 18;

    if (quote.installationFee && quote.installationFee > 0) {
      doc.text('Installation:', totalsX, itemY);
      doc.text(formatCurrency(quote.installationFee), 470, itemY, { width: 80, align: 'right' });
      itemY += 18;
    }

    if (quote.miscExpenses && quote.miscExpenses > 0) {
      doc.text('Additional Services:', totalsX, itemY);
      doc.text(formatCurrency(quote.miscExpenses), 470, itemY, { width: 80, align: 'right' });
      itemY += 18;
    }

    doc.text('Subtotal:', totalsX, itemY);
    doc.text(formatCurrency(clientSubtotal), 470, itemY, { width: 80, align: 'right' });
    itemY += 18;

    doc.text(`Sales Tax (${(quote.taxRate * 100).toFixed(2)}%):`, totalsX, itemY);
    doc.text(formatCurrency(quote.taxAmount), 470, itemY, { width: 80, align: 'right' });
    itemY += 22;

    doc.moveTo(350, itemY).lineTo(550, itemY).strokeColor('#1e40af').lineWidth(2).stroke();
    itemY += 15;

    // Total - Prominent display
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('TOTAL:', totalsX, itemY);
    doc.text(formatCurrency(quote.total), 430, itemY, { width: 120, align: 'right' });

    // Terms and Warranty Section
    itemY += 50;
    if (itemY > 650) {
      doc.addPage();
      itemY = 50;
    }

    doc.moveTo(50, itemY).lineTo(550, itemY).strokeColor('#e5e7eb').stroke();
    itemY += 15;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('TERMS & CONDITIONS', 50, itemY);
    itemY += 18;
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text('Payment Terms: 50% deposit required to begin order. Balance due upon delivery.', 50, itemY, { width: 500 });
    itemY += 12;
    doc.text(`Quote Validity: This quote is valid for 30 days from the date issued (expires ${formatDate(expirationDate)}).`, 50, itemY, { width: 500 });
    itemY += 12;
    doc.text('Lead Time: Standard lead time is 2-4 weeks from order confirmation. Rush orders may be available.', 50, itemY, { width: 500 });
    itemY += 18;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af').text('WARRANTY INFORMATION', 50, itemY);
    itemY += 18;
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text('All cabinets come with a limited lifetime warranty covering defects in materials and workmanship.', 50, itemY, { width: 500 });
    itemY += 12;
    doc.text('Warranty does not cover normal wear and tear, misuse, or damage from improper installation.', 50, itemY, { width: 500 });

    // Footer with call to action
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('Ready to transform your space?', 50, 710, { align: 'center', width: 500 });
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    doc.text('Contact us today to confirm your order and begin your cabinet project!', 50, 725, { align: 'center', width: 500 });

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

    // Cost Breakdown - Two sections: OUR COST vs WHAT WE CHARGE
    const totalsX = 50;

    // Section 1: OUR COST (wholesale only)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text('OUR COST (What We Pay)', totalsX, itemY);
    itemY += 18;

    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    doc.text('Wholesale Cabinet Cost:', totalsX, itemY);
    doc.text(formatCurrency(quote.subtotal), 200, itemY, { width: 80, align: 'right' });
    itemY += 18;

    doc.font('Helvetica-Bold').fillColor('#dc2626');
    doc.text('OUR TOTAL COST:', totalsX, itemY);
    doc.text(formatCurrency(quote.subtotal), 200, itemY, { width: 80, align: 'right' });
    itemY += 30;

    // Section 2: WHAT WE CHARGE (all charges to customer)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#16a34a');
    doc.text('WHAT WE CHARGE (Customer Pays)', totalsX, itemY);
    itemY += 18;

    doc.fontSize(10).font('Helvetica').fillColor('#666666');
    doc.text('MSRP Total (Retail Value):', totalsX, itemY);
    const msrpTextInternal = formatCurrency(msrpTotal);
    doc.text(msrpTextInternal, 200, itemY, { width: 80, align: 'right' });
    // Draw strikethrough line manually
    const msrpWidthInternal = doc.widthOfString(msrpTextInternal);
    doc.moveTo(280 - msrpWidthInternal, itemY + 5).lineTo(280, itemY + 5).strokeColor('#666666').lineWidth(0.5).stroke();
    itemY += 15;

    doc.fillColor('#333333');
    doc.text('Cabinet Price:', totalsX, itemY);
    doc.text(formatCurrency(clientCabinetPrice), 200, itemY, { width: 80, align: 'right' });
    itemY += 15;

    if (quote.installationFee && quote.installationFee > 0) {
      doc.text('Installation Fee:', totalsX, itemY);
      doc.text(formatCurrency(quote.installationFee), 200, itemY, { width: 80, align: 'right' });
      itemY += 15;
    }

    if (quote.miscExpenses && quote.miscExpenses > 0) {
      doc.text('Misc/Other Fees:', totalsX, itemY);
      doc.text(formatCurrency(quote.miscExpenses), 200, itemY, { width: 80, align: 'right' });
      itemY += 15;
    }

    doc.text('Subtotal:', totalsX, itemY);
    doc.text(formatCurrency(clientSubtotal), 200, itemY, { width: 80, align: 'right' });
    itemY += 15;

    doc.text(`Tax (${(quote.taxRate * 100).toFixed(2)}%):`, totalsX, itemY);
    doc.text(formatCurrency(quote.taxAmount), 200, itemY, { width: 80, align: 'right' });
    itemY += 18;

    doc.font('Helvetica-Bold').fillColor('#16a34a');
    doc.text('CLIENT TOTAL:', totalsX, itemY);
    doc.text(formatCurrency(quote.total), 200, itemY, { width: 80, align: 'right' });
    itemY += 30;

    // Section 3: PROFIT SUMMARY
    doc.moveTo(50, itemY).lineTo(300, itemY).strokeColor('#333333').stroke();
    itemY += 15;

    // Profit = what we charge (before tax) - wholesale cost
    const profitMargin = clientSubtotal > 0 ? (profit / clientSubtotal) * 100 : 0;
    const isProfitable = profit >= 0;

    doc.fontSize(12).font('Helvetica-Bold');
    if (isProfitable) {
      doc.fillColor('#16a34a');
      doc.text('PROFIT:', totalsX, itemY);
      doc.text(`${formatCurrency(profit)} (${profitMargin.toFixed(1)}%)`, 150, itemY, { width: 130, align: 'right' });
    } else {
      doc.fillColor('#dc2626');
      doc.text('LOSS:', totalsX, itemY);
      doc.text(`${formatCurrency(Math.abs(profit))} (${Math.abs(profitMargin).toFixed(1)}%)`, 150, itemY, { width: 130, align: 'right' });
      itemY += 25;
      doc.fontSize(10).fillColor('#dc2626');
      doc.text('WARNING: This quote is below cost!', totalsX, itemY);
    }
  }

  if (quote.notes) {
    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('Notes:');
    doc.fontSize(10).font('Helvetica').text(quote.notes, { width: 500 });
  }

  doc.end();
  return doc;
}
