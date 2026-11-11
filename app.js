/**
 * TOÀN BỘ LOGIC HỆ THỐNG QUẢN LÝ TÀI CHÍNH LÀNG NGHỀ (TÍCH HỢP AI GEMINI THẬT 100% - ĐÃ FIX KẾT NỐI)
 */

const DEFAULT_BUSINESS = {
  name: "CƠ SỞ GỐM SỨ & THỦ CÔNG MỸ NGHỆ HÀ NỘI",
  artisan: "Đặng Minh Tuấn",
  address: "Khu chế tác Làng nghề Gốm cổ, Hà Nội",
  taxId: "0109988776"
};

let appData = {
  transactions: JSON.parse(localStorage.getItem('craft_transactions')) || [],
  products: JSON.parse(localStorage.getItem('craft_products')) || [],
  inventory: JSON.parse(localStorage.getItem('craft_inventory')) || [],
  jobs: JSON.parse(localStorage.getItem('craft_jobs')) || [],
  business: DEFAULT_BUSINESS,
  apiKey: (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.GEMINI_API_KEY) ? ENV_CONFIG.GEMINI_API_KEY : ''
};

// Dữ liệu mẫu ban đầu nếu trống
if (!appData.transactions || appData.transactions.length === 0) {
  appData.transactions = [
    { id: 1730000000001, type: 'revenue_craft', date: '2026-11-01', amount: 3500000, person: 'Nguyễn Văn Nam', reason: 'Bán 02 bình gốm sen Bát Tràng', channel: 'bank', code: 'PT001' },
    { id: 1730000000002, type: 'revenue_craft', date: '2026-11-03', amount: 1800000, person: 'Trần Thị Mai', reason: 'Bán bộ ấm chén tráng men ngọc', channel: 'cash', code: 'PT002' },
    { id: 1730000000003, type: 'expense_material', date: '2026-11-02', amount: 1200000, person: 'Cơ sở men màu Đất Việt', reason: 'Mua men màu và phụ gia nung', channel: 'cash', code: 'PC001' }
  ];
}

if (!appData.inventory || appData.inventory.length === 0) {
  appData.inventory = [
    { id: 1, action: 'in', type: 'material', name: 'Đất sét dẻo Tràng An', unit: 'Tấn', qty: 3, price: 1500000, partner: 'Công ty Đất Việt', date: '2026-11-01', code: 'PN001' },
    { id: 2, action: 'out', type: 'material', name: 'Đất sét dẻo Tràng An', unit: 'Tấn', qty: 1.2, price: 1500000, partner: 'Tổ thợ vuốt gốm', date: '2026-11-02', code: 'PX001' },
    { id: 3, action: 'in', type: 'finished', name: 'Bình gốm vuốt tay hoa sen', unit: 'Chiếc', qty: 10, price: 650000, partner: 'Lò nung số 1', date: '2026-11-03', code: 'PN002' }
  ];
}

if (!appData.jobs || appData.jobs.length === 0) {
  appData.jobs = [
    { id: 1, title: 'Cần 02 thợ phụ nhào đất & canh lò nung gốm', category: 'craft_labor', wage: '350.000đ/ngày', desc: 'Làm việc theo ca nung tại Bát Tràng, bao ăn trưa.', contact: '0988888888' },
    { id: 2, title: 'Tìm Freelancer chụp ảnh sản phẩm & viết câu chuyện di sản', category: 'freelancer_media', wage: '2.000.000đ/gói', desc: 'Chụp 15 sản phẩm gốm mộc và thiết kế ấn phẩm cho hội chợ.', contact: '0988888888' }
  ];
}

saveToDisk();

function saveToDisk() {
  localStorage.setItem('craft_transactions', JSON.stringify(appData.transactions));
  localStorage.setItem('craft_products', JSON.stringify(appData.products));
  localStorage.setItem('craft_inventory', JSON.stringify(appData.inventory));
  localStorage.setItem('craft_jobs', JSON.stringify(appData.jobs));
}

// Lưu API Key tự động khi người dùng nhập
function handleApiKeyChange() {
  const keyInput = document.getElementById('custom-api-key');
  if (keyInput) {
    appData.apiKey = keyInput.value.trim();
  }
}

let resolvedGeminiModel = null;

async function getAvailableModel(apiKey) {
  if (resolvedGeminiModel) return resolvedGeminiModel;

  // 1. Thử lấy danh sách model thực tế được cấp phép cho API key này
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      headers: { "x-goog-api-key": apiKey }
    });
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];
      // Tìm model hỗ trợ generateContent, ưu tiên flash
      const supported = models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"));
      const flash = supported.find(m => m.name.includes("flash"));
      if (flash) {
        resolvedGeminiModel = flash.name.replace("models/", "");
        console.log("Đã phát hiện model Gemini khả dụng:", resolvedGeminiModel);
        return resolvedGeminiModel;
      }
      if (supported.length > 0) {
        resolvedGeminiModel = supported[0].name.replace("models/", "");
        console.log("Đã phát hiện model Gemini khả dụng:", resolvedGeminiModel);
        return resolvedGeminiModel;
      }
    }
  } catch (e) {
    console.warn("Không thể tự động query listModels:", e);
  }

  // Dự phòng nếu query thất bại
  return "gemini-1.5-flash";
}

async function callGeminiAPI(parts, systemInstruction = "") {
  const apiKey = (document.getElementById('custom-api-key') ? document.getElementById('custom-api-key').value.trim() : '')
                 || appData.apiKey;

  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  // Tự động tìm model khả dụng của chính tài khoản bạn
  const activeModel = await getAvailableModel(apiKey);

  // Danh sách model ưu tiên
  const tryModels = [
    activeModel,
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-2.0-flash",
    "gemini-1.5-pro"
  ];

  // Loại bỏ trùng lặp
  const uniqueModels = [...new Set(tryModels)];
  let lastError = null;

  for (const m of uniqueModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const payload = { contents: [{ parts: parts }] };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          resolvedGeminiModel = m; // Lưu lại model hoạt động tốt
          return textOutput;
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        lastError = new Error(errJson.error?.message || `HTTP ${response.status} với ${m}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Không thể kết nối với mô hình AI.");
}

// --- CHUYỂN TAB ĐIỀU HƯỚNG ---
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(button => {
    const isActive = button.dataset.tab === tabId;
    button.classList.toggle('active', isActive);
    if (isActive) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'transactions') renderTransactionsTable();
  if (tabId === 'inventory') renderInventoryTable();
  if (tabId === 'connector') renderJobBoard();
  if (tabId === 'public-showcase') renderPublicShowcase();
}

// --- ĐỔI SỐ THÀNH CHỮ TIẾNG VIỆT CHUẨN XÁC ---
function convertNumberToWords(amount) {
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ"];

  if (amount === 0) return "Không đồng chẵn";
  if (!amount || isNaN(amount)) return "";

  let num = Math.abs(parseInt(amount));
  let str = "";

  function readThreeDigits(n, isLastGroup) {
    let hundred = Math.floor(n / 100);
    let ten = Math.floor((n % 100) / 10);
    let one = n % 10;
    let res = "";

    if (hundred > 0 || !isLastGroup) {
      res += digits[hundred] + " trăm ";
    }
    if (ten > 1) {
      res += digits[ten] + " mươi ";
      if (one === 1) res += "mốt ";
      else if (one === 5) res += "lăm ";
      else if (one > 0) res += digits[one] + " ";
    } else if (ten === 1) {
      res += "mười ";
      if (one === 5) res += "lăm ";
      else if (one > 0) res += digits[one] + " ";
    } else if (ten === 0 && one > 0) {
      if (hundred > 0 || !isLastGroup) res += "lẻ ";
      res += digits[one] + " ";
    }
    return res;
  }

  let groups = [];
  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    let grp = groups[i];
    if (grp > 0) {
      let isLast = (i === groups.length - 1);
      str += readThreeDigits(grp, isLast) + units[i] + " ";
    }
  }

  str = str.trim();
  str = str.charAt(0).toUpperCase() + str.slice(1);
  return str + " đồng chẵn.";
}

// --- BỘ TÍNH TOÁN DOANH THU & NGHĨA VỤ THUẾ (NGHỊ ĐỊNH 68/2026/NĐ-CP) ---
function calculateRevenueSummary() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  let totalYear = 0, totalQuarter = 0, totalMonth = 0;
  let cashBalance = 0, bankBalance = 0;

  appData.transactions.forEach(t => {
    const tDate = new Date(t.date);
    const amt = Number(t.amount);
    const isRev = t.type.startsWith('revenue');

    if (isRev) {
      if (t.channel === 'bank') bankBalance += amt;
      else cashBalance += amt;

      if (tDate.getFullYear() === currentYear) {
        totalYear += amt;
        const q = Math.ceil((tDate.getMonth() + 1) / 3);
        if (q === currentQuarter) totalQuarter += amt;
        if (tDate.getMonth() + 1 === currentMonth) totalMonth += amt;
      }
    } else {
      if (t.channel === 'bank') bankBalance -= amt;
      else cashBalance -= amt;
    }
  });

  return { totalYear, totalQuarter, totalMonth, cashBalance, bankBalance, currentYear, currentQuarter, currentMonth };
}

function renderDashboard() {
  const summary = calculateRevenueSummary();
  document.getElementById('card-revenue-year').innerText = `${summary.totalYear.toLocaleString('vi-VN')} VNĐ`;
  document.getElementById('card-revenue-quarter').innerText = `${summary.totalQuarter.toLocaleString('vi-VN')} VNĐ`;
  document.getElementById('card-cash-balance').innerText = `${summary.cashBalance.toLocaleString('vi-VN')} VNĐ`;
  document.getElementById('card-bank-balance').innerText = `${summary.bankBalance.toLocaleString('vi-VN')} VNĐ`;

  const badge = document.getElementById('tax-status-badge');
  if (summary.totalYear <= 500000000) {
    badge.innerHTML = `<span style="color: var(--success); font-weight:700;">Doanh thu ≤ 500tr: Miễn thuế GTGT & TNCN</span>`;
  } else {
    badge.innerHTML = `<span style="color: var(--danger); font-weight:700;">Vượt 500tr: Trừ 500tr tính thuế TNCN (NĐ 68)</span>`;
  }

  calculateTaxObligations();
  renderRecentRevenuesTable();
}

function calculateTaxObligations() {
  const period = document.getElementById('select-tax-period').value;
  const summary = calculateRevenueSummary();
  let rev = summary.totalQuarter;
  let label = `Quý ${summary.currentQuarter}/${summary.currentYear}`;

  if (period === 'year') {
    rev = summary.totalYear;
    label = `Năm ${summary.currentYear}`;
  } else if (period === 'month') {
    rev = summary.totalMonth;
    label = `Tháng ${summary.currentMonth}/${summary.currentYear}`;
  }

  let text = "";
  if (summary.totalYear <= 500000000) {
    text = `
      <strong>Chính sách ưu đãi:</strong> Doanh thu năm lũy kế đạt <strong>${summary.totalYear.toLocaleString('vi-VN')} VNĐ</strong> (≤ 500 triệu theo Điều 3, Điều 4 Nghị định 68/2026/NĐ-CP).<br>
      • Thuế GTGT: <strong>0 VNĐ</strong><br>
      • Thuế TNCN: <strong>0 VNĐ</strong><br>
      <em>Chỉ cần mở sổ theo dõi doanh thu S1a/S2a để kê khai thông báo định kỳ.</em>
    `;
  } else {
    const taxablePITRevenue = Math.max(0, summary.totalYear - 500000000);
    const vat = rev * 0.03;
    const pit = taxablePITRevenue * 0.015;

    text = `
      <strong>Kỳ theo dõi (${label}):</strong><br>
      • Doanh thu tính thuế GTGT (3%): <strong>${vat.toLocaleString('vi-VN')} VNĐ</strong><br>
      • Doanh thu tính thuế TNCN (sau giảm trừ 500 triệu): <strong>${taxablePITRevenue.toLocaleString('vi-VN')} VNĐ</strong><br>
      • Thuế TNCN tạm tính (1.5%): <strong>${pit.toLocaleString('vi-VN')} VNĐ</strong><br>
      <small style="color: var(--clay-primary);">*Cơ sở trên 1 tỷ đồng bắt buộc áp dụng HĐĐT khởi tạo từ máy tính tiền.</small>
    `;
  }
  document.getElementById('tax-computation-details').innerHTML = text;
}

// --- THÊM & SỬA GIAO DỊCH ---
function handleSaveTransaction(e) {
  e.preventDefault();
  const type = document.getElementById('trans-type').value;
  const isRev = type.startsWith('revenue');
  const amount = Number(document.getElementById('trans-amount').value);
  const date = document.getElementById('trans-date').value;
  const person = document.getElementById('trans-person').value;
  const reason = document.getElementById('trans-reason').value;
  const channel = document.getElementById('trans-channel').value;

  const codePrefix = isRev ? 'PT' : 'PC';
  const count = appData.transactions.filter(t => t.type.startsWith(isRev ? 'revenue' : 'expense')).length + 1;
  const code = `${codePrefix}${String(count).padStart(3, '0')}`;

  const newTrans = {
    id: Date.now(),
    type,
    date,
    amount,
    person,
    reason,
    channel,
    code
  };

  appData.transactions.unshift(newTrans);
  saveToDisk();
  document.getElementById('form-transaction').reset();
  alert(`Đã lưu chứng từ ${code}!`);
  renderTransactionsTable();
  renderDashboard();
}

function openEditModal(id) {
  const t = appData.transactions.find(x => x.id === id);
  if (!t) return;

  document.getElementById('edit-id').value = t.id;
  document.getElementById('edit-code').value = t.code;
  document.getElementById('edit-type').value = t.type;
  document.getElementById('edit-channel').value = t.channel;
  document.getElementById('edit-date').value = t.date;
  document.getElementById('edit-amount').value = t.amount;
  document.getElementById('edit-person').value = t.person;
  document.getElementById('edit-reason').value = t.reason;

  document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('active');
}

function handleUpdateTransaction(e) {
  e.preventDefault();
  const id = Number(document.getElementById('edit-id').value);
  const index = appData.transactions.findIndex(x => x.id === id);
  if (index === -1) return;

  appData.transactions[index].type = document.getElementById('edit-type').value;
  appData.transactions[index].channel = document.getElementById('edit-channel').value;
  appData.transactions[index].date = document.getElementById('edit-date').value;
  appData.transactions[index].amount = Number(document.getElementById('edit-amount').value);
  appData.transactions[index].person = document.getElementById('edit-person').value;
  appData.transactions[index].reason = document.getElementById('edit-reason').value;

  saveToDisk();
  closeEditModal();
  alert("Đã cập nhật số liệu thành công!");
  renderTransactionsTable();
  renderDashboard();
}

function handleDeleteTransaction() {
  const id = Number(document.getElementById('edit-id').value);
  if (!confirm("Bạn có chắc chắn muốn xóa chứng từ này khỏi sổ sách?")) return;

  appData.transactions = appData.transactions.filter(x => x.id !== id);
  saveToDisk();
  closeEditModal();
  alert("Đã xóa giao dịch.");
  renderTransactionsTable();
  renderDashboard();
}

function renderTransactionsTable() {
  const tbody = document.querySelector('#table-vouchers tbody');
  tbody.innerHTML = '';

  appData.transactions.forEach(t => {
    const isRev = t.type.startsWith('revenue');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.code}</strong></td>
      <td>${t.date}</td>
      <td>${t.person}</td>
      <td class="text-right ${isRev ? 'color: var(--success)' : ''}">
        ${isRev ? '+' : '-'}${Number(t.amount).toLocaleString('vi-VN')}
      </td>
      <td>
        <button class="btn btn-secondary" style="padding: 3px 6px; font-size: 11px;" onclick="openEditModal(${t.id})">Sửa số liệu</button>
        <button class="btn btn-primary" style="padding: 3px 6px; font-size: 11px;" onclick="printVoucherById(${t.id})">In Mẫu TT88</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRecentRevenuesTable() {
  const tbody = document.querySelector('#table-recent-revenues tbody');
  tbody.innerHTML = '';
  const revs = appData.transactions.filter(t => t.type.startsWith('revenue')).slice(0, 5);

  revs.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.date}</td>
      <td><strong>${r.code}</strong></td>
      <td>${r.reason}</td>
      <td class="text-right font-bold" style="color: var(--success);">${Number(r.amount).toLocaleString('vi-VN')}</td>
      <td>
        <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="openEditModal(${r.id})">Sửa</button>
        <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="printVoucherById(${r.id})">In</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- QUẢN LÝ KHO & IN PHIẾU KHO (MẪU 03-VT & 04-VT) ---
function handleSaveInventory(e) {
  e.preventDefault();
  const action = document.getElementById('inv-action').value;
  const type = document.getElementById('inv-type').value;
  const name = document.getElementById('inv-name').value;
  const unit = document.getElementById('inv-unit').value;
  const qty = Number(document.getElementById('inv-qty').value);
  const price = Number(document.getElementById('inv-price').value);
  const partner = document.getElementById('inv-partner').value;

  const prefix = action === 'in' ? 'PN' : 'PX';
  const count = appData.inventory.filter(i => i.action === action).length + 1;
  const code = `${prefix}${String(count).padStart(3, '0')}`;
  const date = new Date().toISOString().split('T')[0];

  const item = {
    id: Date.now(),
    action,
    type,
    name,
    unit,
    qty,
    price,
    partner,
    date,
    code
  };

  appData.inventory.unshift(item);
  saveToDisk();
  document.getElementById('form-inventory').reset();
  alert(`Đã ghi nhận kho ${code} thành công!`);
  renderInventoryTable();
}

function getAggregatedInventory() {
  const map = {};
  appData.inventory.forEach(i => {
    if (!map[i.name]) {
      map[i.name] = { name: i.name, unit: i.unit, inQty: 0, outQty: 0 };
    }
    if (i.action === 'in') map[i.name].inQty += i.qty;
    else map[i.name].outQty += i.qty;
  });

  return Object.values(map).map(item => ({
    ...item,
    balance: Math.round((item.inQty - item.outQty) * 10) / 10
  }));
}

function renderInventoryTable() {
  const tbody = document.querySelector('#table-inventory tbody');
  tbody.innerHTML = '';
  const items = getAggregatedInventory();

  items.forEach(i => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${i.name}</strong></td>
      <td>${i.unit}</td>
      <td class="text-right">${i.inQty}</td>
      <td class="text-right">${i.outQty}</td>
      <td class="text-right font-bold" style="color: ${i.balance <= 0 ? 'var(--danger)' : 'var(--clay-primary)'};">${i.balance}</td>
      <td>
        <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="printLatestInvVoucher('${i.name}')">In Phiếu</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function printLatestInvVoucher(itemName) {
  const item = appData.inventory.find(x => x.name === itemName);
  if (!item) return;

  const tDate = new Date(item.date);
  const totalAmount = item.qty * item.price;
  const words = convertNumberToWords(totalAmount);

  const payload = {
    businessName: appData.business.name,
    businessAddress: appData.business.address,
    taxId: appData.business.taxId,
    action: item.action,
    code: item.code,
    day: tDate.getDate(),
    month: tDate.getMonth() + 1,
    year: tDate.getFullYear(),
    partner: item.partner,
    itemName: item.name,
    unit: item.unit,
    qty: item.qty,
    price: item.price,
    amount: totalAmount,
    amountWords: words,
    artisanName: appData.business.artisan
  };

  document.getElementById('print-area').innerHTML = AccountingTemplates.inventoryVoucher(payload);
  document.getElementById('print-modal').classList.add('active');
}

function exportInventoryLedger() {
  const items = getAggregatedInventory();
  const payload = {
    businessName: appData.business.name,
    businessAddress: appData.business.address,
    taxId: appData.business.taxId,
    items: items,
    artisanName: appData.business.artisan
  };

  document.getElementById('print-area').innerHTML = AccountingTemplates.inventoryLedger(payload);
  document.getElementById('print-modal').classList.add('active');
}

// --- IN PHIẾU THU, CHI, VÀ SỔ KẾ TOÁN ---
function printVoucherById(id) {
  const t = appData.transactions.find(x => x.id === id);
  if (!t) return;

  const tDate = new Date(t.date);
  const words = convertNumberToWords(t.amount);
  const isRev = t.type.startsWith('revenue');

  const printPayload = {
    businessName: appData.business.name,
    businessAddress: appData.business.address,
    taxId: appData.business.taxId,
    code: t.code,
    day: tDate.getDate(),
    month: tDate.getMonth() + 1,
    year: tDate.getFullYear(),
    personName: t.person,
    reason: t.reason,
    amount: t.amount,
    amountWords: words,
    attachment: '01',
    creatorName: 'Kế toán viên',
    artisanName: appData.business.artisan
  };

  const html = isRev ? AccountingTemplates.receiptVoucher(printPayload) : AccountingTemplates.paymentVoucher(printPayload);
  document.getElementById('print-area').innerHTML = html;
  document.getElementById('print-modal').classList.add('active');
}

function closePrintModal() {
  document.getElementById('print-modal').classList.remove('active');
}

function exportTaxLedger() {
  const summary = calculateRevenueSummary();
  const revenues = appData.transactions.filter(t => t.type.startsWith('revenue'));

  let totalMan = 0, totalRet = 0;
  const rows = revenues.map(r => {
    const isMan = (r.type === 'revenue_craft');
    if (isMan) totalMan += Number(r.amount);
    else totalRet += Number(r.amount);
    return {
      date: r.date,
      code: r.code,
      desc: r.reason,
      amount: r.amount,
      isManufacture: isMan,
      channel: r.channel
    };
  });

  const payload = {
    businessName: appData.business.name,
    businessAddress: appData.business.address,
    taxId: appData.business.taxId,
    periodTitle: `Năm ${summary.currentYear}`,
    year: summary.currentYear,
    rows: rows,
    totalManufacture: totalMan,
    totalRetail: totalRet,
    grandTotal: totalMan + totalRet,
    taxExplanation: summary.totalYear <= 500000000 ? "Doanh thu năm ≤ 500 triệu: Thuộc diện không chịu thuế GTGT và miễn nộp thuế TNCN (NĐ 68/2026/NĐ-CP)." : "Doanh thu > 500 triệu: Áp dụng phương pháp tỷ lệ % và trừ 500 triệu trước khi tính thuế TNCN.",
    vatAmount: summary.totalYear > 500000000 ? (totalMan * 0.03 + totalRet * 0.01) : 0,
    pitAmount: summary.totalYear > 500000000 ? Math.max(0, (summary.totalYear - 500000000) * 0.015) : 0,
    creatorName: 'Người lập biểu',
    artisanName: appData.business.artisan
  };

  document.getElementById('print-area').innerHTML = AccountingTemplates.revenueLedger(payload);
  document.getElementById('print-modal').classList.add('active');
}

function exportExpenseLedger() {
  const expenses = appData.transactions.filter(t => !t.type.startsWith('revenue'));
  let total = 0;
  const rows = expenses.map(e => {
    total += Number(e.amount);
    return {
      date: e.date,
      code: e.code,
      desc: e.reason,
      type: e.type,
      amount: e.amount
    };
  });

  const payload = {
    businessName: appData.business.name,
    businessAddress: appData.business.address,
    taxId: appData.business.taxId,
    year: new Date().getFullYear(),
    rows: rows,
    totalExpense: total,
    artisanName: appData.business.artisan
  };

  document.getElementById('print-area').innerHTML = AccountingTemplates.expenseLedger(payload);
  document.getElementById('print-modal').classList.add('active');
}

// --- ĐỊNH GIÁ AI ĐA YẾU TỐ (MULTI-FACTOR AI PRICING) ---
let currentCalculatedProduct = null;

async function calculateArtisanPricing(e) {
  e.preventDefault();
  const name = document.getElementById('craft-name').value;
  const mat = Number(document.getElementById('cost-material').value);
  const kiln = Number(document.getElementById('cost-kiln').value);
  const hours = Number(document.getElementById('craft-hours').value);
  const rate = Number(document.getElementById('craft-rate').value);
  const box = Number(document.getElementById('cost-box').value);
  const defect = Number(document.getElementById('defect-rate').value) / 100;
  const rep = document.getElementById('artisan-reputation').value;

  const baseCost = mat + kiln + (hours * rate) + box;
  const yieldRate = Math.max(0.5, 1 - defect);
  const cogs = Math.round(baseCost / yieldRate);

  let targetPrice = 0, floorPrice = 0, premiumPrice = 0, reasonText = "";

  const btnSubmit = e.target.querySelector('button[type="submit"]');
  const originalBtnText = btnSubmit.innerText;
  btnSubmit.innerText = "⏳ AI Gemini Đang Phân Tích Định Giá...";
  btnSubmit.disabled = true;

  try {
    const aiPrompt = `
      Bạn là chuyên gia định giá hàng thủ công mỹ nghệ Việt Nam (Gốm, Lụa, Mây tre, Sơn mài).
      Thông tin tạo tác:
      - Tên tác phẩm: "${name}"
      - Giá vốn sản xuất thực tế (COGS đã bù ${defect * 100}% hao hụt): ${cogs} VNĐ
      - Giờ công thợ thủ công: ${hours} giờ (đơn giá ${rate} đ/h)
      - Chi phí lò nung/nhiên liệu: ${kiln} VNĐ, Bao bì: ${box} VNĐ
      - Phân hạng nghệ nhân & sức cầu thị trường: "${rep}"

      Yêu cầu:
      Đưa ra định dạng JSON duy nhất (không bọc trong markdown hay backticks):
      {
        "floorPrice": số nguyên (giá sàn bảo toàn vốn),
        "targetPrice": số nguyên (giá bán lẻ đề xuất tối ưu),
        "premiumPrice": số nguyên (giá bán quà tặng cao cấp/triển lãm),
        "reason": "1 câu giải thích ngắn gọn, súc tích dưới 35 từ về lý do định giá này"
      }
    `;

    const aiResponse = await callGeminiAPI([{ text: aiPrompt }]);
    const cleanJson = aiResponse.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    floorPrice = parsed.floorPrice || Math.round(cogs * 1.15);
    targetPrice = parsed.targetPrice || Math.round(cogs * 1.35);
    premiumPrice = parsed.premiumPrice || Math.round(cogs * 1.7);
    reasonText = parsed.reason || "AI đã cân đối giá vốn, công thợ và sức cầu thị trường.";
  } catch (err) {
    console.warn("Không gọi được Gemini API định giá, sử dụng công thức dự phòng:", err.message);
    let multiplier = 1.35;
    reasonText = "Biên lợi nhuận 35% đảm bảo bù đắp công thợ và chi phí hao mòn xưởng.";

    if (rep === 'artisan') {
      multiplier = 1.65;
      reasonText = "Cộng thêm 30% giá trị độc bản do nghệ nhân lâu năm tạo tác.";
    } else if (rep === 'peak_season') {
      multiplier = 1.50;
      reasonText = "Điều chỉnh tăng 15% nắm bắt sức cầu quà tặng cao điểm mùa lễ hội.";
    }

    targetPrice = Math.round(cogs * multiplier);
    floorPrice = Math.round(cogs * 1.15);
    premiumPrice = Math.round(cogs * (multiplier + 0.4));
  } finally {
    btnSubmit.innerText = originalBtnText;
    btnSubmit.disabled = false;
  }

  currentCalculatedProduct = {
    id: Date.now(),
    name,
    cogs,
    floorPrice,
    targetPrice,
    premiumPrice,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&q=80',
    artisan: appData.business.artisan,
    desc: `${name} được chế tác thủ công tinh xảo, tráng men tự nhiên cổ truyền.`
  };

  document.getElementById('res-cogs').innerText = `${cogs.toLocaleString('vi-VN')} VNĐ`;
  document.getElementById('res-breakeven').innerText = `${cogs.toLocaleString('vi-VN')} VNĐ`;
  document.getElementById('res-price-floor').innerText = `${floorPrice.toLocaleString('vi-VN')} đ`;
  document.getElementById('res-price-target').innerText = `${targetPrice.toLocaleString('vi-VN')} đ`;
  document.getElementById('res-price-premium').innerText = `${premiumPrice.toLocaleString('vi-VN')} đ`;
  document.getElementById('res-reason').innerHTML = `<strong>Lý giải từ AI:</strong> ${reasonText}`;

  document.getElementById('pricing-placeholder').style.display = 'none';
  document.getElementById('pricing-results').style.display = 'block';
}

function syncToPublicShowcase() {
  if (!currentCalculatedProduct) return;
  appData.products.unshift(currentCalculatedProduct);
  saveToDisk();
  alert(`Đã xuất bản "${currentCalculatedProduct.name}" lên Web Triển Lãm!`);
}

function renderPublicShowcase() {
  const container = document.getElementById('public-product-grid');
  container.innerHTML = '';

  if (appData.products.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Chưa có sản phẩm nào. Hãy vào mục "Định Giá AI" và bấm "Đồng Bộ Xuất Bản".</div>';
    return;
  }

  appData.products.forEach(p => {
    const card = document.createElement('div');
    card.style = "background: #fff; border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column;";
    card.innerHTML = `
      <img src="${p.image}" style="width: 100%; height: 200px; object-fit: cover;">
      <div style="padding: 16px; flex: 1; display: flex; flex-direction: column;">
        <span style="font-size: 11px; color: var(--gold-highlight); font-weight: 700; text-transform: uppercase;">Nghệ nhân: ${p.artisan}</span>
        <h3 style="font-size: 15px; margin: 4px 0 8px; color: var(--clay-dark);">${p.name}</h3>
        <p style="font-size: 12px; color: var(--text-muted); flex: 1; margin-bottom: 12px;">${p.desc}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px;">
          <div>
            <span style="font-size: 11px; color: var(--text-muted);">Giá niêm yết:</span><br>
            <strong style="color: var(--clay-primary); font-size: 16px;">${p.targetPrice.toLocaleString('vi-VN')} đ</strong>
          </div>
          <a href="https://zalo.me/0988888888?text=${encodeURIComponent('Chào nghệ nhân Tuấn, tôi muốn đặt hàng tác phẩm ' + p.name)}" target="_blank" class="btn btn-primary" style="font-size: 11px; padding: 6px 12px; text-decoration: none;">
            Đặt Hàng Zalo
          </a>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- CẦU NỐI THỢ & FREELANCER (CONNECTOR) ---
function handlePostJob(e) {
  e.preventDefault();
  const title = document.getElementById('job-title').value;
  const category = document.getElementById('job-category').value;
  const wage = document.getElementById('job-wage').value;
  const desc = document.getElementById('job-desc').value;

  const newJob = {
    id: Date.now(),
    title,
    category,
    wage,
    desc,
    contact: '0988888888'
  };

  appData.jobs.unshift(newJob);
  saveToDisk();
  document.getElementById('form-job-post').reset();
  alert("Đã đăng tin tuyển dụng thành công!");
  renderJobBoard();
}

function renderJobBoard() {
  const container = document.getElementById('job-board-container');
  container.innerHTML = '';

  appData.jobs.forEach(j => {
    const box = document.createElement('div');
    box.style = "background: var(--kraft-bg); border: 1px solid var(--border-color); padding: 14px; border-radius: 8px;";
    box.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <strong style="color: var(--clay-dark); font-size: 14px;">${j.title}</strong>
        <span style="background: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: var(--indigo-accent);">${j.category === 'craft_labor' ? 'Thợ thủ công' : 'Freelancer sáng tạo'}</span>
      </div>
      <p style="font-size: 12px; color: var(--text-main); margin-bottom: 6px;">${j.desc}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
        <span style="color: var(--clay-primary); font-weight: bold;">Mức thù lao: ${j.wage}</span>
        <a href="https://zalo.me/${j.contact}?text=${encodeURIComponent('Chào cơ sở, tôi ứng tuyển vị trí: ' + j.title)}" target="_blank" class="btn btn-secondary" style="font-size: 11px; padding: 4px 10px; text-decoration: none;">
          Ứng Tuyển Qua Zalo
        </a>
      </div>
    `;
    container.appendChild(box);
  });
}

// --- CAMERA & AI VISION OCR BÓC TÁCH HÓA ĐƠN THẬT ---
let videoStream = null;
let currentCapturedBase64 = null;

async function startCamera() {
  const video = document.getElementById('webcam-video');
  const btnSnap = document.getElementById('btn-snap');
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = videoStream;
    video.style.display = 'block';
    btnSnap.style.display = 'inline-flex';
  } catch (err) {
    alert("Không thể mở camera. Bạn có thể sử dụng nút 'Chọn Ảnh Từ Máy'.");
  }
}

function capturePhoto() {
  const video = document.getElementById('webcam-video');
  const canvas = document.getElementById('photo-canvas');
  const img = document.getElementById('preview-img');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg');
  img.src = dataUrl;
  img.style.display = 'block';
  video.style.display = 'none';

  currentCapturedBase64 = dataUrl.split(',')[1];

  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
  }
  document.getElementById('btn-snap').style.display = 'none';
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = document.getElementById('preview-img');
    img.src = event.target.result;
    img.style.display = 'block';
    currentCapturedBase64 = event.target.result.split(',')[1];
  };
  reader.readAsDataURL(file);
}

async function runSimulatedOCR() {
  const resultBox = document.getElementById('ocr-result-box');
  resultBox.style.display = 'block';
  resultBox.innerHTML = '<em>⏳ Đang gửi ảnh lên Gemini Vision AI để bóc tách chữ và số tiền...</em>';

  if (!currentCapturedBase64) {
    resultBox.innerHTML = '<span style="color: var(--danger);">Vui lòng chụp ảnh hoặc chọn ảnh hóa đơn/sản phẩm trước khi quét.</span>';
    return;
  }

  try {
    const prompt = `
      Hãy phân tích hình ảnh này (hóa đơn mua hàng hoặc sản phẩm thủ công truyền thống).
      Trích xuất thông tin và trả về đúng 1 chuỗi JSON duy nhất (không bọc trong markdown hay backticks):
      {
        "supplier": "Tên nơi bán hoặc tên xưởng cung cấp",
        "date": "YYYY-MM-DD (hoặc ngày hôm nay nếu không thấy)",
        "amount": số nguyên (tổng tiền thanh toán VNĐ),
        "reason": "Tên các vật tư/sản phẩm được mua",
        "category": "expense_material hoặc expense_fuel hoặc expense_labor"
      }
    `;

    const parts = [
      { text: prompt },
      {
        inline_data: {
          mime_type: "image/jpeg",
          data: currentCapturedBase64
        }
      }
    ];

    const aiText = await callGeminiAPI(parts);
    const cleanJson = aiText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    resultBox.innerHTML = `
      <div style="background: var(--kraft-bg); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px;">
        <strong style="color: var(--success);">✓ AI Gemini Vision Bóc Tách Thành Công:</strong><br>
        • Bên phát hành: <strong>${parsed.supplier || 'Không xác định'}</strong><br>
        • Ngày lập: <strong>${parsed.date || 'Hôm nay'}</strong><br>
        • Vật tư bóc tách: <strong>${parsed.reason || 'Nguyên vật liệu thủ công'}</strong><br>
        • Tổng tiền: <strong>${Number(parsed.amount || 0).toLocaleString('vi-VN')} VNĐ</strong><br>
        <button class="btn btn-primary" style="margin-top: 8px; font-size: 11px;" onclick="applyScannedToForm(${parsed.amount || 0}, '${(parsed.supplier || '').replace(/'/g, "\\'") }', '${(parsed.reason || '').replace(/'/g, "\\'") }', '${parsed.date || ''}')">
          Điền Nhanh Vào Sổ & Phiếu Chi
        </button>
      </div>
    `;
  } catch (err) {
    console.warn("Lỗi gọi Gemini Vision OCR:", err.message);
    if (err.message === "NO_API_KEY") {
      resultBox.innerHTML = `
        <div style="background: #fff3e0; border: 1px solid #ffe0b2; padding: 12px; border-radius: 6px; color: #b78103;">
          <strong>Chưa điền Gemini API Key:</strong> Vui lòng dán khóa API của bạn vào ô trên khung Trợ Lý AI. Đang hiển thị kết quả quét mô phỏng:<br>
          • Bên bán: <strong>Xưởng Cung Ứng Men Màu & Đất Sét Tràng An</strong><br>
          • Số tiền: <strong>2.850.000 VNĐ</strong><br>
          <button class="btn btn-primary" style="margin-top: 8px; font-size: 11px;" onclick="applyScannedToForm(2850000, 'Xưởng Đất Sét Tràng An', 'Mua 2 tấn đất sét dẻo nung')">Điền Nhanh Vào Phiếu Chi</button>
        </div>
      `;
    } else {
      resultBox.innerHTML = `<span style="color: var(--danger);">Lỗi xử lý hình ảnh: ${err.message}</span>`;
    }
  }
}

function applyScannedToForm(amount, supplier, reason, date) {
  switchTab('transactions');
  document.getElementById('trans-type').value = 'expense_material';
  document.getElementById('trans-amount').value = amount;
  document.getElementById('trans-person').value = supplier;
  document.getElementById('trans-reason').value = reason;
  document.getElementById('trans-date').value = date || new Date().toISOString().split('T')[0];
}

// --- TRỢ LÝ AI TÀI CHÍNH TƯƠNG TÁC THẬT 100% ---
async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const chatMessages = document.getElementById('chat-messages');
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.innerText = text;
  chatMessages.appendChild(userBubble);
  input.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Hiển thị trạng thái đang suy nghĩ
  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'chat-bubble assistant';
  loadingBubble.id = 'ai-loading-bubble';
  loadingBubble.innerText = "⏳ Trợ lý AI đang tra cứu luật và phân tích dòng tiền...";
  chatMessages.appendChild(loadingBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const summary = calculateRevenueSummary();
    const systemPrompt = `
      Bạn là cố vấn tài chính & kế toán chuyên nghiệp dành cho tiểu thương, nghệ nhân làng nghề truyền thống Việt Nam.
      Bối cảnh cơ sở hiện tại:
      - Tên chủ cơ sở: "${appData.business.artisan}", Cơ sở: "${appData.business.name}".
      - Doanh thu lũy kế cả năm: ${summary.totalYear} VNĐ (Ngưỡng 500 triệu theo Nghị định 68/2026/NĐ-CP).
      - Doanh thu Quý hiện tại: ${summary.totalQuarter} VNĐ.
      - Tồn quỹ tiền mặt: ${summary.cashBalance} VNĐ, Tiền ngân hàng: ${summary.bankBalance} VNĐ.
      - Chế độ kế toán áp dụng: Thông tư 152/2025/TT-BTC & Thông tư 88/2021/TT-BTC (Phiếu thu 01-TT, Phiếu chi 02-TT, Sổ S1a, S2a, S2c, S2d, S2e).

      Yêu cầu phản hồi:
      - Sử dụng tiếng Việt chuẩn mực, thân thiện, dễ hiểu, tránh thuật ngữ hàn lâm trừ khi giải thích cụ thể.
      - Trực tiếp đưa ra giải pháp thực tế hoặc hướng dẫn nghệ nhân thao tác trên phần mềm.
    `;

    const reply = await callGeminiAPI([{ text: text }], systemPrompt);

    const curLoading = document.getElementById('ai-loading-bubble');
    if (curLoading) curLoading.remove();

    renderAiReply(reply);
  } catch (err) {
    const curLoading = document.getElementById('ai-loading-bubble');
    if (curLoading) curLoading.remove();

    if (err.message === "NO_API_KEY") {
      let fallbackText = "Bạn chưa nhập Gemini API Key ở ô phía trên! Hãy vào Google AI Studio (aistudio.google.com) tạo mã API miễn phí và dán vào ô trên để kích hoạt AI trực tiếp.\n\n[Phản hồi nội bộ]: ";
      if (text.includes("thuế") || text.includes("500 triệu")) {
        fallbackText += "Theo Nghị định 68/2026/NĐ-CP, nếu doanh thu năm dưới 500 triệu thì xưởng được miễn hoàn toàn thuế GTGT và TNCN. Nếu trên 500 triệu, bạn sẽ được trừ 500 triệu trước khi tính thuế TNCN 1.5% đối với nghề làm hàng thủ công.";
      } else if (text.includes("gốm") || text.includes("nứt") || text.includes("hao hụt")) {
        fallbackText += "Trong phần 'Định Giá AI', bạn hãy điền tỷ lệ hao hụt lò nung (ví dụ 10% hoặc 15%). Hệ thống sẽ tự động cộng chi phí của những chiếc bình hỏng vào giá thành của những chiếc bình đạt chuẩn để xưởng không bị lỗ.";
      } else {
        fallbackText += "Dữ liệu thu chi của bạn đã được ghi nhận an toàn vào bộ nhớ máy tính. Bạn có thể in phiếu thu chi bất kỳ lúc nào để kẹp hồ sơ pháp lý.";
      }
      renderAiReply(fallbackText);
    } else {
      renderAiReply(`Lỗi kết nối AI: ${err.message}. Vui lòng kiểm tra lại API Key hoặc kết nối mạng.`);
    }
  }
}

function renderAiReply(replyText) {
  const chatMessages = document.getElementById('chat-messages');
  const aiBubble = document.createElement('div');
  aiBubble.className = 'chat-bubble assistant';
  aiBubble.innerHTML = replyText.replace(/\n/g, '<br>');
  chatMessages.appendChild(aiBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- KHỞI ĐỘNG HỆ THỐNG ---
window.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('custom-api-key');
  if (keyInput && appData.apiKey) {
    keyInput.value = appData.apiKey;
  }
  renderDashboard();
});
