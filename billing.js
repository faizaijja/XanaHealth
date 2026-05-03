
const patients = {
  raekwon: { name:'Raekwon Gbeho', invoice:'#03336/2021', total:12144, recNum:'152', date:'23/05/2023 - 10:14', insurance:'RSSB', copay:15, dept:'Consultation', visitNo:'V/RG/0336/2023', fileNo:'F/001/7', status:'partial', doctor:'Dr. Uwimana' },
  milani:  { name:'Milani Mostafa', invoice:'#03337/2021', total:10000, recNum:'153', date:'24/05/2023 - 11:05', insurance:'MMI', copay:20, dept:'Laboratory', visitNo:'V/MM/0337/2023', fileNo:'F/002/7', status:'unpaid', doctor:'Dr. Nkusi' },
  imani:   { name:'Imani Adimbaki', invoice:'#03338/2021', total:6919, recNum:'154', date:'05/12/2023 - 12:34', insurance:'RSSB', copay:15, dept:'Pharmacy', visitNo:'V/IA/0338/2023', fileNo:'F/003/7', status:'paid', doctor:'Dr. Habimana' },
  kwame:   { name:'Kwame Mensah', invoice:'#03339/2021', total:17500, recNum:'155', date:'26/05/2023 - 09:22', insurance:'Activa', copay:25, dept:'Radiology', visitNo:'V/KM/0339/2023', fileNo:'F/004/7', status:'unpaid', doctor:'Dr. Mutoni' },
};
const defaultItems = {
  raekwon: { 'Medical Acts': [ { name:'Intra oral peri apical x-ray', note:'16', qty:1, unitCost:16000, insPct:85 }, { name:'Indirect pulp caping', note:'tooth 16', qty:1, unitCost:23000, insPct:85 } ] },
  milani:  { 'Laboratory': [ { name:'Full blood count (NFS)', note:'', qty:1, unitCost:500, insPct:80 }, { name:'Malaria RDT', note:'', qty:1, unitCost:200, insPct:80 } ] },
  imani:   { 'Pharmacy': [ { name:'Amoxicillin 500mg caps', note:'Take 3×/day ×7 days', qty:21, unitCost:200, insPct:85 }, { name:'Ibuprofen 400mg tabs', note:'As needed', qty:10, unitCost:100, insPct:85 } ] },
  kwame:   { 'Radiology': [ { name:'Chest X-ray', note:'', qty:1, unitCost:8000, insPct:75 } ] },
};

let currentPatientId = null, invoiceItems = {}, payments = [], totalPaid = 0;
let currentReceiptHTML = '';
let currentInsPct = 0; // summary-level insurance %

function addItemToInvoice() {
  const prodSel = document.getElementById('productSelect').value;
  if (!prodSel) { alert('Please select a product'); return; }
  const parts = prodSel.split('|');
  const name = parts[0], category = parts[1], unitCost = Number(parts[2]);
  const qty = Number(document.getElementById('qtyInput').value) || 1;
  const note = document.getElementById('itemNote').value.trim();
  if (!invoiceItems[category]) invoiceItems[category] = [];
  invoiceItems[category].push({ name, note, qty, unitCost });
  renderInvoiceTables();
  document.getElementById('productSelect').value = '';
  document.getElementById('qtyInput').value = 1;
  document.getElementById('itemNote').value = '';
  document.getElementById('productInfoBox').style.display = 'none';
}

function deleteItem(category, idx) {
  invoiceItems[category].splice(idx, 1);
  if (!invoiceItems[category].length) delete invoiceItems[category];
  renderInvoiceTables();
}

function renderInvoiceTables() {
  const container = document.getElementById('categoryTablesContainer');
  container.innerHTML = '';
  const categories = Object.keys(invoiceItems);
  let grandTotal = 0, totalItems = 0;

  if (!categories.length) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px">No items added yet.</div>';
  }

  categories.forEach(cat => {
    const items = invoiceItems[cat];
    let catTotal = 0;

    const hdr = document.createElement('div');
    hdr.className = 'category-header';
    hdr.innerHTML = `<span class="category-title">${cat}</span>`;
    container.appendChild(hdr);

    const tbl = document.createElement('table');
    tbl.className = 'items-table';
    tbl.innerHTML = `<thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th></th></tr></thead>`;
    const tbody = document.createElement('tbody');

    items.forEach((item, idx) => {
      const lt = item.qty * item.unitCost;
      catTotal += lt; totalItems++;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx+1}</td><td>${item.name}${item.note ? `<div class="item-note">ⓘ ${item.note}</div>` : ''}</td><td>${item.qty}</td><td>${item.unitCost.toLocaleString()}</td><td>${lt.toLocaleString()}</td><td><button class="del-btn" onclick="deleteItem('${cat}',${idx})"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button></td>`;
      tbody.appendChild(tr);
    });

    // Subtotal row inside table
    const stRow = document.createElement('tr');
    stRow.className = 'subtotal-row';
    stRow.innerHTML = `<td colspan="4" style="text-align:left;padding-left:12px;font-size:11px">Sub-total (${cat}):</td><td>${catTotal.toLocaleString()}</td><td></td>`;
    tbody.appendChild(stRow);
    tbl.appendChild(tbody);
    container.appendChild(tbl);
    grandTotal += catTotal;
  });

  document.getElementById('invItemCount').textContent = `(${totalItems})`;

  // Insurance calculated on grand total
  const insAmt = Math.round(grandTotal * currentInsPct / 100);
  const patContrib = grandTotal - insAmt;
  const balance = patContrib - totalPaid;

  document.getElementById('sumSubtotal').textContent = grandTotal.toLocaleString();
  document.getElementById('sumInsurance').textContent = insAmt.toLocaleString();
  document.getElementById('sumPatient').textContent = patContrib.toLocaleString();
  document.getElementById('sumPaid').textContent = totalPaid.toLocaleString();
  document.getElementById('sumBalance').textContent = balance > 0 ? `-${balance.toLocaleString()}` : balance.toLocaleString();
  document.getElementById('sumBalance').style.color = balance > 0 ? '#ef4444' : '#059669';

  // Only show Record Payment if there's a balance AND invoice isn't fully paid
  const p = currentPatientId ? patients[currentPatientId] : null;
  const isPaid = p && p.status === 'paid';
  document.getElementById('recordPaymentCard').style.display = (balance > 0 && !isPaid) ? 'block' : 'none';
}

function onSummaryInsuranceChange() {
  const sel = document.getElementById('summaryInsuranceSelect').value;
  const parts = sel.split('|');
  currentInsPct = Number(parts[1]);
  const label = document.getElementById('sumInsPctLabel');
  label.textContent = currentInsPct > 0 ? `covers ${currentInsPct}%` : '';
  renderInvoiceTables();

  localStorage.setItem('invoiceData', JSON.stringify({
  invoiceItems,
  payments,
  totalPaid
}));
}

function recordPayment() {
  const amt = Number(document.getElementById('paymentAmount').value);
  const method = document.getElementById('paymentMethod').value;
  if (!amt || amt <= 0) { alert('Please enter a valid amount'); return; }
  if (!method) { alert('Please select a payment method'); return; }
  const now = new Date();
  const ds = now.toLocaleDateString('en-GB') + ' - ' + now.toTimeString().slice(0,8);
  payments.push({ date:ds, amount:amt, method });
  totalPaid += amt;

  const nr = document.getElementById('noCashRow');
  if (nr) nr.remove();
  const cb = document.getElementById('cashPaidBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${ds}</td><td>Rwf ${amt.toLocaleString()}</td><td>Jane Doe</td><td>${method}</td><td></td>`;
  cb.appendChild(tr);

  document.getElementById('auditEmptyMsg').style.display = 'none';
  document.getElementById('auditSectionLabel').style.display = 'block';
  const cnt = Number(document.getElementById('auditCount').textContent) + 1;
  document.getElementById('auditCount').textContent = cnt;
  const div = document.createElement('div');
  div.className = 'audit-item';
  div.innerHTML = `<div class="audit-item-top"><div><div class="audit-date">${ds}</div><div class="audit-meta">Received by: JANE DOE</div></div><div class="audit-amount">${amt.toLocaleString()}</div></div><button class="audit-del-btn" onclick="removePayment(this,${amt})"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>`;
  document.getElementById('auditItemsList').appendChild(div);

  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentMethod').value = '';
  document.getElementById('paymentRef').value = '';
  renderInvoiceTables();
}

function removePayment(btn, amt) {
  totalPaid = Math.max(0, totalPaid - amt);
  btn.closest('.audit-item').remove();
  const cnt = Number(document.getElementById('auditCount').textContent) - 1;
  document.getElementById('auditCount').textContent = cnt;
  if (cnt === 0) { document.getElementById('auditEmptyMsg').style.display = 'flex'; document.getElementById('auditSectionLabel').style.display = 'none'; }
  renderInvoiceTables();
}

function onProductChange() {
  const val = document.getElementById('productSelect').value;
  const box = document.getElementById('productInfoBox');
  if (!val) { box.style.display = 'none'; return; }
  const p = val.split('|');
  document.getElementById('pCategory').textContent = p[1];
  document.getElementById('pPrice').textContent = 'Rwf ' + Number(p[2]).toLocaleString();
  box.style.display = 'block';
}

function openInvoice(id) {
  currentPatientId = id;
  const p = patients[id];
  invoiceItems = {}; payments = []; totalPaid = 0; currentInsPct = 0;
  document.getElementById('cashPaidBody').innerHTML = '<tr id="noCashRow"><td colspan="5" style="text-align:center;color:#9ca3af;font-size:12px;padding:14px">No payments recorded</td></tr>';
  document.getElementById('auditItemsList').innerHTML = '';
  document.getElementById('auditCount').textContent = '0';
  document.getElementById('auditEmptyMsg').style.display = 'flex';
  document.getElementById('auditSectionLabel').style.display = 'none';

  document.getElementById('invNumber').textContent = p.invoice;
  document.getElementById('invPatientName').textContent = p.name;
  document.getElementById('invDate').textContent = p.date;
  document.getElementById('invDept').textContent = p.dept;
  document.getElementById('invInsurance').textContent = p.insurance;
  document.getElementById('invCopay').textContent = p.copay+'%';
  document.getElementById('invVisitNo').textContent = p.visitNo;
  document.getElementById('invFileNo').textContent = p.fileNo;
  document.getElementById('invVisitTag').textContent = p.visitNo;
  document.getElementById('invDeptTag').textContent = p.dept;
  document.getElementById('invInsTag').textContent = p.insurance;
  document.getElementById('invCopayTag').textContent = p.copay+'% Copay';

  // Set summary insurance selector to match patient's insurance
  const insCoverageMap = { RSSB:'RSSB|85', MMI:'MMI|80', Activa:'Activa|75', Radiant:'Radiant|70', CORAR:'CORAR|65' };
  const insVal = insCoverageMap[p.insurance] || 'none|0';
  const insSel = document.getElementById('summaryInsuranceSelect');
  insSel.value = insVal;
  currentInsPct = Number(insVal.split('|')[1]);
  document.getElementById('sumInsPctLabel').textContent = currentInsPct > 0 ? `covers ${currentInsPct}%` : '';

  const badge = document.getElementById('invStatusBadge');
  badge.textContent = p.status.toUpperCase();
  badge.className = 'status-badge '+(p.status==='paid'?'badge-paid':p.status==='partial'?'badge-partial':'badge-unpaid');

  document.getElementById('rssbSection').style.display = (p.insurance==='RSSB') ? 'block' : 'none';
  document.getElementById('rssbEntryDate').value = p.date.split(' ')[0]||'';
  document.getElementById('rssbDoctorName').value = p.doctor;

  const defs = defaultItems[id]||{};
  Object.entries(defs).forEach(([cat,items]) => { invoiceItems[cat] = items.map(i=>({...i})); });
  renderInvoiceTables();

  document.getElementById('invoiceOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeInvoice() {
  document.getElementById('invoiceOverlay').classList.remove('open');
  document.body.style.overflow = '';
  currentPatientId = null;
}
function handleInvoiceOverlayClick(e) { if (e.target===document.getElementById('invoiceOverlay')) closeInvoice(); }

// Download full invoice as PDF
function downloadInvoicePDF() {
  if (!currentPatientId) return;
  const p = patients[currentPatientId];
  const thS = 'padding:8px 10px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e5e5;';
  const tdS = 'padding:8px 10px;font-size:12px;color:#374151;border-bottom:1px solid #f3f4f6;';

  let categoriesHTML = '';
  let grandTotal = 0;
  Object.entries(invoiceItems).forEach(([cat, items]) => {
    let rows = '', catTotal = 0;
    items.forEach((item,idx) => {
      const lt = item.qty * item.unitCost;
      catTotal += lt;
      rows += `<tr><td style="${tdS}">${idx+1}</td><td style="${tdS}">${item.name}${item.note?`<br><small style="color:#9ca3af">ⓘ ${item.note}</small>`:''}</td><td style="${tdS}">${item.qty}</td><td style="${tdS}">${item.unitCost.toLocaleString()}</td><td style="${tdS}">${lt.toLocaleString()}</td></tr>`;
    });
    categoriesHTML += `<div style="margin-bottom:16px"><div style="background:#f0f4f2;padding:7px 12px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#374151;border:1px solid #cdddd6;border-bottom:none;border-radius:4px 4px 0 0">${cat}</div><table style="width:100%;border-collapse:collapse;border:1px solid #e5e5e5;border-top:none"><thead><tr style="background:#fafafa"><th style="${thS}">#</th><th style="${thS}">Description</th><th style="${thS}">Qty</th><th style="${thS}">Unit Cost</th><th style="${thS}">Total</th></tr></thead><tbody>${rows}</tbody><tfoot><tr style="background:#edf4f0"><td colspan="4" style="${tdS}font-weight:700;font-size:11px">Sub-total (${cat}):</td><td style="${tdS}font-weight:700">${catTotal.toLocaleString()}</td></tr></tfoot></table></div>`;
    grandTotal += catTotal;
  });

  const insAmt = Math.round(grandTotal * currentInsPct / 100);
  const patContrib = grandTotal - insAmt;
  const balance = patContrib - totalPaid;
  const insSel = document.getElementById('summaryInsuranceSelect');
  const insName = insSel.options[insSel.selectedIndex].text;

  const paymentsRows = payments.length ? payments.map(pay=>`<tr><td style="${tdS}">${pay.date}</td><td style="${tdS}">Rwf ${pay.amount.toLocaleString()}</td><td style="${tdS}">Jane Doe</td><td style="${tdS}">${pay.method}</td></tr>`).join('') : `<tr><td colspan="4" style="padding:12px;text-align:center;color:#9ca3af;font-size:12px">No payments recorded</td></tr>`;

  const rssbHTML = p.insurance==='RSSB' ? `<div style="border:1px solid #e5e5e5;border-radius:6px;overflow:hidden;margin-bottom:16px"><div style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #f3f4f6">RSSB Details</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr"><div style="padding:12px 14px;border-right:1px solid #f3f4f6"><div style="font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:8px;color:#6b7280">Beneficiary Details</div><p style="font-size:11px;margin-bottom:5px"><strong>Full Name:</strong> _______________</p><p style="font-size:11px;margin-bottom:5px"><strong>Phone:</strong> _______________</p><p style="font-size:11px;margin-bottom:5px"><strong>Beneficiary relationship:</strong> Spouse</p><p style="font-size:11px;margin-bottom:5px"><strong>Signature:</strong> _______________</p></div><div style="padding:12px 14px;border-right:1px solid #f3f4f6"><div style="font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:8px;color:#6b7280">Treatment Information</div><p style="font-size:11px;margin-bottom:5px"><strong>Disease Type:</strong> Natural disease</p><p style="font-size:11px;margin-bottom:5px"><strong>Status:</strong> _______________</p><p style="font-size:11px;margin-bottom:5px"><strong>Entry Date:</strong> ${p.date.split(' ')[0]}</p><p style="font-size:11px;margin-bottom:5px"><strong>Discharge Date:</strong> _______________</p></div><div style="padding:12px 14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:8px;color:#6b7280">Attending Doctor</div><p style="font-size:11px;margin-bottom:5px"><strong>Name:</strong> ${p.doctor}</p><p style="font-size:11px;margin-bottom:5px"><strong>License #:</strong> _______________</p><p style="font-size:11px;margin-bottom:5px"><strong>Signature:</strong> _______________</p><p style="font-size:11px;margin-bottom:5px"><strong>Stamp:</strong> _______________</p></div></div><div style="padding:9px 14px;border-top:1px solid #f3f4f6;font-size:11px"><strong>Facility stamp:</strong> _______________</div></div>` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Invoice ${p.invoice}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#fff;color:#374151;padding:28px;font-size:12px}h1{font-size:20px;font-weight:700;color:#111}.badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:10px;font-weight:700;text-transform:uppercase}.badge-unpaid{background:#fee2e2;color:#991b1b}.badge-paid{background:#d1fae5;color:#065f46}.badge-partial{background:#fef3c7;color:#92400e}@media print{body{padding:14px}@page{margin:10mm;size:A4}}</style></head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
  <div><div style="font-size:18px;font-weight:700;color:#059669">Shema Clinic</div><div style="font-size:11px;color:#6b7280;margin-top:2px">Kigali City, Rwanda · Tel: +250000000000 · info@shemaclinic.rw</div></div>
  <div style="text-align:right"><h1>Patient Invoice</h1><div style="font-family:monospace;font-size:12px;color:#6b7280;margin-top:3px">${p.invoice}</div><div style="margin-top:5px"><span class="badge badge-${p.status}">${p.status.toUpperCase()}</span></div></div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;padding:14px;background:#f9fafb;border:1px solid #e5e5e5;border-radius:6px;margin-bottom:18px">
  <div><p style="margin-bottom:4px;color:#6b7280">Patient: <strong style="color:#374151">${p.name}</strong></p><p style="margin-bottom:4px;color:#6b7280">File No: <strong style="color:#374151">${p.fileNo}</strong></p><p style="color:#6b7280">Phone: <strong style="color:#374151">+250 000 000 000</strong></p></div>
  <div><p style="margin-bottom:4px;color:#6b7280">Visit No: <strong style="color:#059669">${p.visitNo}</strong></p><p style="margin-bottom:4px;color:#6b7280">Department: <strong style="color:#374151">${p.dept}</strong></p><p style="color:#6b7280">Doctor: <strong style="color:#374151">${p.doctor}</strong></p></div>
  <div><p style="margin-bottom:4px;color:#6b7280">Insurance: <strong style="color:#374151">${p.insurance}</strong></p><p style="margin-bottom:4px;color:#6b7280">Copay: <strong style="color:#374151">${p.copay}%</strong></p><p style="color:#6b7280">Date: <strong style="color:#374151">${p.date}</strong></p></div>
</div>
<h2 style="font-size:13px;font-weight:700;margin-bottom:10px">Invoice Items</h2>
${categoriesHTML}
<div style="border:1px solid #e5e5e5;border-radius:6px;overflow:hidden;margin-bottom:16px"><div style="padding:11px 14px;font-weight:700;font-size:13px;border-bottom:1px solid #f3f4f6">Invoice Summary</div><table style="width:100%;border-collapse:collapse"><tr><td style="${tdS}">Sub-total (all items):</td><td style="${tdS}text-align:right">${grandTotal.toLocaleString()}</td></tr><tr><td style="${tdS}">Insurance (${insName}):</td><td style="${tdS}text-align:right;color:#059669">${insAmt.toLocaleString()}</td></tr><tr><td style="${tdS}">Patient contribution:</td><td style="${tdS}text-align:right">${patContrib.toLocaleString()}</td></tr><tr><td style="${tdS}">Amount Paid (by patient):</td><td style="${tdS}text-align:right">${totalPaid.toLocaleString()}</td></tr><tr style="background:${balance>0?'#fee2e2':'#f0fdf4'}"><td style="${tdS}font-weight:700;font-size:13px">Patient Balance Due:</td><td style="${tdS}text-align:right;font-weight:700;font-size:13px;color:${balance>0?'#991b1b':'#065f46'}">${balance>0?'-':''}${Math.abs(balance).toLocaleString()}</td></tr></table><div style="padding:9px 14px;font-size:11px;color:#6b7280;text-align:right;border-top:1px solid #f3f4f6">Visit initiated by: <strong>Mrs. Agathe Amina Uwera</strong></div></div>
${rssbHTML}
<div style="border:1px solid #e5e5e5;border-radius:6px;overflow:hidden;margin-bottom:16px"><div style="padding:11px 14px;font-weight:700;font-size:13px;border-bottom:1px solid #f3f4f6">Cash Paid</div><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#fafafa"><th style="${thS}">Date</th><th style="${thS}">Amount</th><th style="${thS}">Received by</th><th style="${thS}">Method</th></tr></thead><tbody>${paymentsRows}</tbody></table></div>
<script>window.onload=function(){window.print();}<\/script></body></html>`;
  const w = window.open('','_blank','width=900,height=700');
  w.document.write(html); w.document.close();
}

// Filter modal
function openFilterModal() {
  document.getElementById('filterModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeFilterModal() {
  document.getElementById('filterModal').classList.remove('open');
  document.body.style.overflow = '';
}
function handleFilterOverlayClick(e) {
  if (e.target === document.getElementById('filterModal')) closeFilterModal();
}
function applyFilters() {
  const from = document.getElementById('filterDateFrom').value;
  const to = document.getElementById('filterDateTo').value;
  const ins = document.getElementById('filterInsurance').value;
  const status = document.getElementById('filterStatus').value;

  // Validate 31-day range
  if (from && to) {
    const diff = (new Date(to) - new Date(from)) / (1000*60*60*24);
    if (diff < 0) { alert('End date must be after start date'); return; }
    if (diff > 31) { alert('Maximum date range is 31 days'); return; }
  }

  const bar = document.getElementById('appliedFiltersBar');
  const tagDate = document.getElementById('filterTagDate');
  const tagIns = document.getElementById('filterTagIns');
  const tagStatus = document.getElementById('filterTagStatus');
  let hasFilter = false;

  if (from && to) {
    tagDate.textContent = `${from} → ${to}`;
    tagDate.style.display = 'flex';
    hasFilter = true;
  } else tagDate.style.display = 'none';

  if (ins) {
    tagIns.textContent = ins;
    tagIns.style.display = 'flex';
    hasFilter = true;
  } else tagIns.style.display = 'none';

  if (status) {
    tagStatus.textContent = status.charAt(0).toUpperCase()+status.slice(1);
    tagStatus.style.display = 'flex';
    hasFilter = true;
  } else tagStatus.style.display = 'none';

  bar.style.display = hasFilter ? 'flex' : 'none';
  closeFilterModal();
}
function clearAllFilters() {
  document.getElementById('filterDateFrom').value = '';
  document.getElementById('filterDateTo').value = '';
  document.getElementById('filterInsurance').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('appliedFiltersBar').style.display = 'none';
  document.getElementById('filterTagDate').style.display = 'none';
  document.getElementById('filterTagIns').style.display = 'none';
  document.getElementById('filterTagStatus').style.display = 'none';
}

// Send
let sendMenuOpen = false;
function toggleSendMenu() {
  sendMenuOpen = !sendMenuOpen;
  document.getElementById('sendMenu').classList.toggle('open', sendMenuOpen);
  document.getElementById('sendBtnEl').classList.toggle('open', sendMenuOpen);
}
function sendViaWhatsApp() {
  if (!currentPatientId) return;
  const p = patients[currentPatientId];
  window.open('https://wa.me/?text='+encodeURIComponent(`Hello, please find your invoice ${p.invoice} from Shema Clinic. Total: Rwf ${p.total.toLocaleString()}. Thank you.`),'_blank');
  toggleSendMenu();
}
function sendViaEmail() {
  if (!currentPatientId) return;
  const p = patients[currentPatientId];
  window.open('mailto:?subject='+encodeURIComponent(`Invoice ${p.invoice} - Shema Clinic`)+'&body='+encodeURIComponent(`Dear ${p.name},\n\nPlease find your invoice ${p.invoice}.\n\nTotal: Rwf ${p.total.toLocaleString()}\n\nThank you.`));
  toggleSendMenu();
}

// EBM
let openEbmId = null;
function toggleEbm(id) {
  const menu = document.getElementById(id+'-menu'), btn = document.querySelector('#'+id+' .inv-ebm-btn');
  if (!menu) return;
  const was = menu.classList.contains('open'); closeAllEbmMenus();
  if (!was) { menu.classList.add('open'); if(btn)btn.classList.add('open'); openEbmId = id; }
}
function closeAllEbmMenus() {
  document.querySelectorAll('.ebm-menu').forEach(m=>m.classList.remove('open'));
  document.querySelectorAll('.inv-ebm-btn').forEach(b=>b.classList.remove('open'));
  openEbmId = null;
}
const receiptMeta = {
  sale:     {title:'Sale Receipt',badgeClass:'badge-sale',badgeText:'SALE',stamp:'<span class="rp-stamp stamp-official">OFFICIAL</span>',typeLabel:'Normal Receipt (NR)',section:'SALE',notOfficial:false,watermark:''},
  refund:   {title:'Refund Receipt',badgeClass:'badge-refund',badgeText:'CR',stamp:'<span class="rp-stamp stamp-copy">COPY</span>',typeLabel:'Copy Refund (CR)',section:'REFUND',notOfficial:true,watermark:''},
  proforma: {title:'Proforma Invoice',badgeClass:'badge-proforma',badgeText:'PROFORMA',stamp:'<span class="rp-stamp stamp-draft">PROFORMA</span>',typeLabel:'Proforma Invoice (PI)',section:'PROFORMA',notOfficial:true,watermark:'<div style="text-align:center;margin:7px 0"><span class="watermark-proforma">⚠ PROFORMA — NOT VALID FOR TAX</span></div>'},
  training: {title:'Training Receipt',badgeClass:'badge-training',badgeText:'TRAINING',stamp:'<span class="rp-stamp stamp-training">TRAINING</span>',typeLabel:'Training / Simulation',section:'TRAINING',notOfficial:true,watermark:'<div style="text-align:center;margin:7px 0"><span class="watermark-training">⚠ TRAINING MODE — NOT OFFICIAL</span></div>'},
};
function buildReceiptHTML(type,pName,inv,recNum,total) {
  const m=receiptMeta[type], re=type==='refund'?`<div class="rp-row"><span>REF. RECEIPT#:</span><span>${recNum}</span></div><div class="rp-warn">REFUND APPROVED ONLY FOR ORIGINAL RECEIPT</div>`:'';
  return `<div class="rp-header"><h1>EBM Receipt</h1><div class="sub">${m.typeLabel}</div></div><div class="rp-clinic"><p>Shema Clinic</p><p>Kigali, Rwanda</p><p>TIN: 0000000000</p>${m.stamp}</div><div class="rp-section"><div class="rp-title">${m.section}</div>${re}<div class="rp-row"><span>Patient:</span><span>${pName}</span></div><div class="rp-row"><span>Invoice:</span><span>${inv}</span></div></div><div class="rp-section"><div class="rp-row"><span>Medical Services</span></div><div class="rp-row sub"><span>1.00 × ${total}</span><span>${total} A-EX</span></div>${m.watermark}${m.notOfficial?'<div class="not-official">NOT AN OFFICIAL RECEIPT</div>':''}<div class="rp-row total"><span>TOTAL</span><span>${total}</span></div><div class="rp-row sub"><span>TOTAL TAX</span><span>0.00</span></div></div><div class="rp-section"><div class="rp-title">SDC INFORMATION</div><div class="rp-row"><span>Date: 25/12/2023</span><span>11:07:35</span></div><div class="rp-row"><span>SDC ID</span><span>SDC001000001</span></div><div class="rp-databox"><strong>Internal Data:</strong>TE68-SLA2-34J5-EAV3-N569-88LJ-Q7</div><div class="rp-databox"><strong>Signature:</strong>V249-J39C-FJ48-HE2W</div></div><div class="rp-section"><div class="rp-row"><span>RECEIPT#:</span><span>${recNum}</span></div><div class="rp-row"><span>DATE: 25/05/2023</span><span>11:09:32</span></div><div class="rp-row"><span>MRC:</span><span>AAACCI23456</span></div></div><div class="rp-thank">— THANK YOU —</div>`;
}
function openReceipt(type,pName,inv,recNum,total) {
  closeAllEbmMenus();
  const m=receiptMeta[type]; currentReceiptHTML=buildReceiptHTML(type,pName,inv,recNum,total);
  const badge=document.getElementById('receiptBadge'); badge.textContent=m.badgeText; badge.className='rtype-badge '+m.badgeClass;
  document.getElementById('receiptTitle').textContent=m.title;
  document.getElementById('receiptContent').innerHTML=currentReceiptHTML;
  document.getElementById('receiptModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function openReceiptFromInvoice(type) {
  if (!currentPatientId) return;
  const p=patients[currentPatientId];
  openReceipt(type,p.name,p.invoice,p.recNum,'Rwf '+p.total.toLocaleString());
}
function closeReceipt() { document.getElementById('receiptModal').classList.remove('open'); document.body.style.overflow=''; }
function handleReceiptOverlayClick(e) { if (e.target===document.getElementById('receiptModal')) closeReceipt(); }

document.addEventListener('click', e => {
  if (openEbmId && !e.target.closest('.inv-ebm-wrapper')) closeAllEbmMenus();
  if (sendMenuOpen && !e.target.closest('.send-wrapper')) {
    sendMenuOpen=false;
    document.getElementById('sendMenu').classList.remove('open');
    document.getElementById('sendBtnEl').classList.remove('open');
  }
});
document.addEventListener('keydown', e => {
  if (e.key==='Escape') { closeReceipt(); closeInvoice(); closeAllEbmMenus(); closeFilterModal(); }
});

function applyFilter() {
  const patient = document.getElementById("filterPatient").value.toLowerCase();
  const status = document.getElementById("filterStatus").value.toLowerCase();
  const rows = document.querySelectorAll("#invoiceTable tbody tr");

  rows.forEach(row => {
    const patientName = row.children[1].innerText.toLowerCase();
    const invoiceStatus = row.children[4].innerText.toLowerCase();

    let showRow = true;

    if (patient && !patientName.includes(patient)) {
      showRow = false;
    }

    if (status && !invoiceStatus.includes(status)) {
      showRow = false;
    }

    row.style.display = showRow ? "" : "none";
  });

  closeFilterModal();
}

function clearAllFilters() {
  document.getElementById("filterPatient").value = "";
  document.getElementById("filterStatus").value = "";

  const rows = document.querySelectorAll("#invoiceTable tbody tr");
  rows.forEach(row => row.style.display = "");
}
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('invoiceData');
  if (saved) {
    const data = JSON.parse(saved);
    invoiceItems = data.invoiceItems || {};
    payments = data.payments || [];
    totalPaid = data.totalPaid || 0;
  }
});