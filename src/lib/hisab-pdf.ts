import type { Cost, Organization, Sale } from '@/types/api';
import { formatBdt, formatDate, formatNumber } from '@/lib/format';

function esc(value: string | number | undefined | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type HisabPdfLabels = {
  appName: string;
  invoiceNo: string;
  phone: string;
  product: string;
  qtyUnit: string;
  rate: string;
  amount: string;
  sl: string;
  salesSection: string;
  costsSection: string;
  totalIncome: string;
  totalCost: string;
  netResult: string;
  profit: string;
  loss: string;
  comments: string;
  authorizedSign: string;
  softwareBy: string;
  logoSoon: string;
  hisabParty: string;
  owner: string;
};

type BuildArgs = {
  org?: Organization | null;
  orgFallbackName: string;
  preparedBy?: string;
  costs: Cost[];
  sales: Sale[];
  labels: HisabPdfLabels;
  locale: 'en' | 'bn';
};

export function buildHisabInvoiceHtml({
  org,
  orgFallbackName,
  preparedBy,
  costs,
  sales,
  labels,
  locale,
}: BuildArgs) {
  const orgName = org?.name || orgFallbackName;
  const addressLine =
    [org?.address, org?.upazila, org?.district].filter(Boolean).join(', ') ||
    (locale === 'bn' ? 'বাংলাদেশ' : 'Bangladesh');
  const phone = org?.phone || '';
  const owner = org?.ownerName || preparedBy || '';
  const logoUrl = org?.logo;

  const totalCost = costs.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
  const totalIncome = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const net = totalIncome - totalCost;
  const isProfit = net >= 0;
  const resultLabel = isProfit ? labels.profit : labels.loss;
  const resultColor = isProfit ? '#1B7A3D' : '#C62828';

  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const invoiceNo = `INV-${y}${m}${d}-001`;
  const printedAt = now.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const saleRows =
    sales
      .flatMap((s) => {
        if (s.items?.length) {
          return s.items.map((it) => ({
            name: it.itemName || s.saleNumber || labels.salesSection,
            qty: `${formatNumber(it.quantity)} ${it.unit}`,
            rate: it.rate,
            amount: Number(it.quantity) * Number(it.rate),
            date: s.saleDate,
          }));
        }
        return [
          {
            name: s.saleNumber || labels.salesSection,
            qty: '—',
            rate: s.totalAmount,
            amount: s.totalAmount,
            date: s.saleDate,
          },
        ];
      })
      .map(
        (row, i) => `<tr>
      <td class="sl">${i + 1}</td>
      <td class="name">${esc(row.name)}<div class="sub">${esc(formatDate(row.date))}</div></td>
      <td class="num">${esc(row.qty)}</td>
      <td class="num">${esc(formatBdt(row.rate))}</td>
      <td class="num">${esc(formatBdt(row.amount))}</td>
    </tr>`
      )
      .join('') ||
    `<tr><td colspan="5" class="empty">—</td></tr>`;

  const costRows =
    costs
      .map(
        (c, i) => `<tr>
      <td class="sl">${i + 1}</td>
      <td class="name">${esc(c.categoryName ?? c.costType)}${
          c.description ? `<div class="sub">${esc(c.description)}</div>` : ''
        }<div class="sub">${esc(formatDate(c.costDate))}</div></td>
      <td class="num">${esc(formatNumber(c.quantity))} ${esc(c.unit || '')}</td>
      <td class="num">${esc(formatBdt(c.rate))}</td>
      <td class="num">${esc(formatBdt(c.totalAmount))}</td>
    </tr>`
      )
      .join('') ||
    `<tr><td colspan="5" class="empty">—</td></tr>`;

  const logoBlock = logoUrl
    ? `<img class="logo" src="${esc(logoUrl)}" alt="" />`
    : `<div class="logo logo-ph"><span>LOGO</span></div>`;

  const tableHead = `<thead><tr>
    <th class="sl">${esc(labels.sl)}</th>
    <th>${esc(labels.product)}</th>
    <th class="num">${esc(labels.qtyUnit)}</th>
    <th class="num">${esc(labels.rate)}</th>
    <th class="num">${esc(labels.amount)}</th>
  </tr></thead>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(orgName)}</title>
  <style>
    @page { margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 18px 22px 28px;
      background: #FDF4EC;
      color: #1a1a1a;
      font-family: "Noto Sans Bengali", "Hind Siliguri", "Kalpurush", Arial, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      position: relative;
    }
    .wm {
      position: fixed;
      top: 42%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 220px;
      height: 220px;
      border: 14px solid rgba(0,106,78,0.06);
      border-radius: 50%;
      z-index: 0;
      pointer-events: none;
    }
    .wm:after {
      content: "";
      position: absolute;
      inset: 28px;
      border: 8px solid rgba(0,106,78,0.05);
      border-radius: 50%;
    }
    .sheet { position: relative; z-index: 1; }

    .head {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 10px;
    }
    .logo {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      background: #fff;
      border: 2px solid #ddd;
    }
    .logo-ph {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed #b7c9bf;
      background: #f3faf6;
      color: #7a9185;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .farm-name {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      color: #111;
      letter-spacing: -0.3px;
    }
    .farm-meta {
      margin-top: 4px;
      font-size: 12px;
      color: #333;
    }
    .farm-meta div { margin-top: 1px; }

    .rule {
      border: 0;
      border-top: 2.5px solid #1B7A3D;
      margin: 10px 0 12px;
    }

    .inv-no {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .party {
      border: 1px solid #cfcfcf;
      background: #fff;
      padding: 10px 12px;
      margin-bottom: 14px;
      border-radius: 2px;
    }
    .party .t { font-weight: 700; font-size: 14px; }
    .party .p { margin-top: 2px; font-size: 12px; color: #333; }

    .sec {
      margin: 12px 0 4px;
      font-size: 12px;
      font-weight: 700;
      color: #1B7A3D;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #cfcfcf;
    }
    th {
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 6px;
      border: 1px solid #cfcfcf;
      background: #f3f3f3;
    }
    th.num, td.num { text-align: right; }
    th.sl, td.sl { width: 40px; text-align: center; }
    td {
      padding: 8px 6px;
      border: 1px solid #e0e0e0;
      vertical-align: top;
      font-size: 13px;
      background: #fff;
    }
    td.name .sub {
      font-size: 10px;
      color: #666;
      margin-top: 1px;
    }
    td.empty {
      text-align: center;
      color: #999;
      padding: 16px;
    }

    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-top: 14px;
    }
    .totals {
      width: 260px;
      font-size: 13px;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .totals .row.strong {
      font-weight: 800;
      border-top: 1px solid #bbb;
      margin-top: 4px;
      padding-top: 8px;
    }
    .totals .row.result {
      font-weight: 800;
      font-size: 15px;
      margin-top: 6px;
      padding-top: 8px;
      border-top: 2px solid #1B7A3D;
    }

    .foot-mid {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 36px;
      gap: 20px;
    }
    .comments {
      font-size: 12px;
      color: #444;
      max-width: 55%;
    }
    .sign {
      text-align: right;
      min-width: 150px;
    }
    .sign-line {
      border-bottom: 1px dotted #333;
      height: 28px;
      margin-bottom: 4px;
    }
    .sign-label { font-size: 12px; font-weight: 600; }

    .foot-bot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 22px;
      padding-top: 8px;
      font-size: 11px;
      color: #555;
    }
    .soft { font-weight: 600; }
  </style>
</head>
<body>
  <div class="wm"></div>
  <div class="sheet">
    <div class="head">
      ${logoBlock}
      <div>
        <h1 class="farm-name">${esc(orgName)}</h1>
        <div class="farm-meta">
          <div>${esc(addressLine)}</div>
          ${phone ? `<div>${esc(labels.phone)}: ${esc(phone)}</div>` : ''}
        </div>
      </div>
    </div>

    <hr class="rule" />

    <div class="inv-no">${esc(labels.invoiceNo)} ${esc(invoiceNo)}</div>

    <div class="party">
      <div class="t">${esc(labels.hisabParty)}${owner ? ` — ${esc(owner)}` : ''}</div>
      ${phone ? `<div class="p">${esc(labels.phone)}: ${esc(phone)}</div>` : ''}
      ${preparedBy ? `<div class="p">${esc(labels.owner)}: ${esc(preparedBy)}</div>` : ''}
    </div>

    <div class="sec">${esc(labels.salesSection)}</div>
    <table>
      ${tableHead}
      <tbody>${saleRows}</tbody>
    </table>

    <div class="sec">${esc(labels.costsSection)}</div>
    <table>
      ${tableHead}
      <tbody>${costRows}</tbody>
    </table>

    <div class="totals-wrap">
      <div class="totals">
        <div class="row">
          <span>${esc(labels.totalIncome)}</span>
          <span>${esc(formatBdt(totalIncome))}</span>
        </div>
        <div class="row">
          <span>${esc(labels.totalCost)}</span>
          <span>${esc(formatBdt(totalCost))}</span>
        </div>
        <div class="row result" style="color:${resultColor}">
          <span>${esc(labels.netResult)} (${esc(resultLabel)})</span>
          <span>${esc(formatBdt(Math.abs(net)))}</span>
        </div>
      </div>
    </div>

    <div class="foot-mid">
      <div class="comments">${esc(labels.comments)}</div>
      <div class="sign">
        <div class="sign-line"></div>
        <div class="sign-label">${esc(labels.authorizedSign)}</div>
      </div>
    </div>

    <div class="foot-bot">
      <div class="soft">${esc(labels.softwareBy)} ${esc(labels.appName)}</div>
      <div>${esc(printedAt)}</div>
    </div>
  </div>
</body>
</html>`;
}
