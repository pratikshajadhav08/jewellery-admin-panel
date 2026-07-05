import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Order } from './firestore/types';

// Update these with your real shop details - used as the invoice letterhead.
const SHOP = {
  name: 'Aurelia Fine Jewellery',
  tagline: 'Fine Jewellery / Est. 1998',
  address: 'Shop No. 4, Jewellers Lane, Mumbai, Maharashtra',
  phone: '+91 90000 00000',
  email: 'hello@aurelia-jewels.com',
  gstin: '27ABCDE1234F1Z5', // Replace with your actual GSTIN
};

// HSN code for articles of jewellery of precious metal (gold/silver).
// Verify this matches your specific goods with your accountant/CA.
const HSN_CODE = '7113';

// GST on gold/silver jewellery is currently 3% total (1.5% CGST + 1.5%
// SGST for intra-state sales). This assumes `order.total` is GST-inclusive
// (the price the customer actually pays), which is standard for retail
// pricing, and backs out the tax split from it. If your making charges are
// taxed at a different rate, or you make inter-state sales (IGST instead
// of CGST+SGST), adjust this calculation accordingly - confirm with your
// accountant before relying on this for compliance.
const GST_RATE = 0.03;

function computeGstBreakdown(totalInclusive: number) {
  const taxableValue = totalInclusive / (1 + GST_RATE);
  const totalTax = totalInclusive - taxableValue;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  return { taxableValue, cgst, sgst };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildInvoiceHtml(order: Order): string {
  const rows = order.items
    .map((item) => {
      const mainRow = `
        <tr>
          <td class="cell">${escapeHtml(item.name)}</td>
          <td class="cell center">${HSN_CODE}</td>
          <td class="cell center">${item.qty}</td>
          <td class="cell right">Rs. ${item.price.toLocaleString('en-IN')}</td>
          <td class="cell right">Rs. ${(item.price * item.qty).toLocaleString('en-IN')}</td>
        </tr>`;

      if (!item.weightGrams || !item.ratePerGram) return mainRow;

      const metalValue = item.weightGrams * item.ratePerGram;
      const making = item.makingChargePercent ?? 0;
      const wastage = item.wastagePercent ?? 0;
      const makingAmount = metalValue * (making / 100);
      const wastageAmount = metalValue * (wastage / 100);

      const breakdownRow = `
        <tr>
          <td class="cell breakdown" colspan="5">
            ${item.weightGrams}g &times; Rs. ${item.ratePerGram.toLocaleString('en-IN')}/g = Rs. ${metalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            &nbsp;+&nbsp; Making ${making}% (Rs. ${makingAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })})
            &nbsp;+&nbsp; Wastage ${wastage}% (Rs. ${wastageAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })})
          </td>
        </tr>`;

      return mainRow + breakdownRow;
    })
    .join('');

  const { taxableValue, cgst, sgst } = computeGstBreakdown(order.total);
  const netPayable = Math.max(order.total - (order.exchangeValue ?? 0), 0);

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Georgia', serif;
            color: #211B14;
            padding: 40px;
            margin: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #A77925;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .shop-name { font-size: 26px; font-weight: bold; color: #211B14; margin: 0; }
          .shop-tagline { font-size: 11px; color: #A77925; letter-spacing: 1px; margin-top: 4px; text-transform: uppercase; }
          .shop-contact { font-size: 11px; color: #695D4D; margin-top: 10px; line-height: 1.6; font-family: Arial, sans-serif; }
          .invoice-meta { text-align: right; font-family: Arial, sans-serif; }
          .invoice-title { font-size: 18px; font-weight: bold; color: #A77925; letter-spacing: 1px; }
          .invoice-meta div { font-size: 12px; color: #695D4D; margin-top: 4px; }
          .bill-to { margin-bottom: 24px; font-family: Arial, sans-serif; }
          .bill-to-label { font-size: 10px; color: #958774; letter-spacing: 1px; text-transform: uppercase; }
          .bill-to-name { font-size: 15px; font-weight: bold; margin-top: 4px; }
          .bill-to-address { font-size: 12px; color: #695D4D; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; margin-bottom: 24px; }
          thead th {
            text-align: left;
            font-size: 10.5px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #958774;
            border-bottom: 1px solid #E2D4BF;
            padding: 8px 6px;
          }
          .cell { font-size: 13px; padding: 10px 6px; border-bottom: 1px solid #F0E7DA; }
          .cell.breakdown {
            font-size: 10.5px;
            color: #958774;
            padding: 0 6px 10px 6px;
            border-bottom: 1px solid #F0E7DA;
            font-style: italic;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .totals { display: flex; justify-content: flex-end; font-family: Arial, sans-serif; }
          .totals-box { width: 240px; }
          .totals-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; color: #695D4D; }
          .totals-row.grand { border-top: 2px solid #A77925; margin-top: 6px; padding-top: 12px; font-size: 17px; font-weight: bold; color: #211B14; }
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #E2D4BF;
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #958774;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <p class="shop-name">${escapeHtml(SHOP.name)}</p>
            <div class="shop-tagline">${escapeHtml(SHOP.tagline)}</div>
            <div class="shop-contact">
              ${escapeHtml(SHOP.address)}<br />
              ${escapeHtml(SHOP.phone)} &nbsp;/&nbsp; ${escapeHtml(SHOP.email)}<br />
              GSTIN: ${escapeHtml(SHOP.gstin)}
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-title">TAX INVOICE</div>
            <div>Order ID: ${escapeHtml(order.id)}</div>
            <div>Date: ${escapeHtml(order.date)}</div>
            <div>Status: ${escapeHtml(order.status)}</div>
          </div>
        </div>

        <div class="bill-to">
          <div class="bill-to-label">Bill To</div>
          <div class="bill-to-name">${escapeHtml(order.customer)}</div>
          <div class="bill-to-address">${escapeHtml(order.address)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="center">HSN</th>
              <th class="center">Qty</th>
              <th class="right">Price</th>
              <th class="right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-box">
            <div class="totals-row">
              <span>Taxable Value</span>
              <span>Rs. ${taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div class="totals-row">
              <span>CGST @ 1.5%</span>
              <span>Rs. ${cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div class="totals-row">
              <span>SGST @ 1.5%</span>
              <span>Rs. ${sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div class="totals-row grand">
              <span>Total (Incl. GST)</span>
              <span>Rs. ${order.total.toLocaleString('en-IN')}</span>
            </div>
            ${
              order.exchangeValue
                ? `
            <div class="totals-row">
              <span>Less: ${escapeHtml(order.exchangeDescription ?? 'Old Gold Exchange')}</span>
              <span>- Rs. ${order.exchangeValue.toLocaleString('en-IN')}</span>
            </div>
            <div class="totals-row grand">
              <span>Net Payable</span>
              <span>Rs. ${netPayable.toLocaleString('en-IN')}</span>
            </div>
            `
                : ''
            }
            ${
              order.amountPaid !== undefined
                ? `
            <div class="totals-row">
              <span>Amount Paid</span>
              <span>Rs. ${order.amountPaid.toLocaleString('en-IN')}</span>
            </div>
            <div class="totals-row">
              <span>Balance Due</span>
              <span>Rs. ${Math.max(netPayable - order.amountPaid, 0).toLocaleString('en-IN')}</span>
            </div>
            `
                : ''
            }
            <div class="totals-row">
              <span>Payment Method</span>
              <span>${escapeHtml(order.payment)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          Thank you for shopping with ${escapeHtml(SHOP.name)}. This is a computer-generated invoice.
        </div>
      </body>
    </html>
  `;
}

/**
 * Renders the given order as a PDF invoice and hands it off for the user to
 * save/share/print. On native (iOS/Android) it generates a real PDF file and
 * opens the share sheet. On web, expo-print has no filesystem to write to,
 * so it opens the browser's print dialog instead (which lets the user choose
 * "Save as PDF").
 */
export async function generateAndShareInvoice(order: Order): Promise<void> {
  const html = buildInvoiceHtml(order);

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Invoice - ${order.id}` });
  }
}