/**
 * BỘ KHUÔN MẪU KẾ TOÁN CHUẨN THÔNG TƯ 88/2021/TT-BTC & THÔNG TƯ 152/2025/TT-BTC
 */
const AccountingTemplates = {
  // 1. Phiếu Thu (Mẫu số 01-TT) - Khổ A5
  receiptVoucher: (data) => `
    <div class="print-voucher">
      <div class="voucher-header">
        <div>
          <strong>${data.businessName}</strong><br>
          Địa chỉ: ${data.businessAddress}<br>
          Mã số thuế: ${data.taxId}
        </div>
        <div style="text-align: right;">
          <strong>Mẫu số 01 - TT</strong><br>
          <span>(Ban hành kèm theo TT số 88/2021/TT-BTC)</span><br>
          <span>Số: <strong>${data.code}</strong></span><br>
          <span>Quyển số: 01</span>
        </div>
      </div>
      <h2 class="voucher-title">PHIẾU THU</h2>
      <div class="voucher-date">Ngày ${data.day} tháng ${data.month} năm ${data.year}</div>
      <div class="voucher-body">
        <p>Họ và tên người nộp tiền: <strong>${data.personName}</strong></p>
        <p>Địa chỉ: <strong>${data.address || 'Khách đặt mua sản phẩm thủ công'}</strong></p>
        <p>Lý do nộp: <strong>${data.reason}</strong></p>
        <p>Số tiền: <strong>${Number(data.amount).toLocaleString('vi-VN')} VNĐ</strong></p>
        <p>Bằng chữ: <em>${data.amountWords}</em></p>
        <p>Kèm theo: <strong>${data.attachment || '01'}</strong> chứng từ gốc</p>
      </div>
      <div class="voucher-signatures">
        <div class="sig-box">
          <strong>Người lập biểu</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>${data.creatorName || 'Người lập'}</p>
        </div>
        <div class="sig-box">
          <strong>Người nộp tiền</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>${data.personName}</p>
        </div>
        <div class="sig-box">
          <strong>Thủ quỹ</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>${data.treasurerName || 'Thủ quỹ'}</p>
        </div>
        <div class="sig-box">
          <strong>Đại diện Hộ KD</strong><br><span>(Ký, họ tên, đóng dấu)</span>
          <div class="sig-space"></div>
          <p>${data.artisanName || 'Chủ cơ sở'}</p>
        </div>
      </div>
      <div style="margin-top: 15px; font-size: 10pt; font-style: italic;">
        Đã nhận đủ số tiền (viết bằng chữ): ${data.amountWords}
      </div>
    </div>
  `,

  // 2. Phiếu Chi (Mẫu số 02-TT) - Khổ A5
  paymentVoucher: (data) => `
    <div class="print-voucher">
      <div class="voucher-header">
        <div>
          <strong>${data.businessName}</strong><br>
          Địa chỉ: ${data.businessAddress}<br>
          Mã số thuế: ${data.taxId}
        </div>
        <div style="text-align: right;">
          <strong>Mẫu số 02 - TT</strong><br>
          <span>(Ban hành kèm theo TT số 88/2021/TT-BTC)</span><br>
          <span>Số: <strong>${data.code}</strong></span><br>
          <span>Quyển số: 01</span>
        </div>
      </div>
      <h2 class="voucher-title">PHIẾU CHI</h2>
      <div class="voucher-date">Ngày ${data.day} tháng ${data.month} năm ${data.year}</div>
      <div class="voucher-body">
        <p>Họ và tên người nhận tiền: <strong>${data.personName}</strong></p>
        <p>Địa chỉ: <strong>${data.address || 'Đơn vị cung cấp nguyên vật liệu'}</strong></p>
        <p>Lý do chi: <strong>${data.reason}</strong></p>
        <p>Số tiền: <strong>${Number(data.amount).toLocaleString('vi-VN')} VNĐ</strong></p>
        <p>Bằng chữ: <em>${data.amountWords}</em></p>
        <p>Kèm theo: <strong>${data.attachment || '01'}</strong> chứng từ gốc</p>
      </div>
      <div class="voucher-signatures">
        <div class="sig-box">
          <strong>Người lập biểu</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>${data.creatorName || 'Người lập'}</p>
        </div>
        <div class="sig-box">
          <strong>Người nhận tiền</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>${data.personName}</p>
        </div>
        <div class="sig-box">
          <strong>Thủ quỹ</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>${data.treasurerName || 'Thủ quỹ'}</p>
        </div>
        <div class="sig-box">
          <strong>Đại diện Hộ KD</strong><br><span>(Ký, họ tên, đóng dấu)</span>
          <div class="sig-space"></div>
          <p>${data.artisanName || 'Chủ cơ sở'}</p>
        </div>
      </div>
      <div style="margin-top: 15px; font-size: 10pt; font-style: italic;">
        Đã nhận đủ số tiền (viết bằng chữ): ${data.amountWords}
      </div>
    </div>
  `,

  // 3. Phiếu Nhập Kho (03-VT) & Xuất Kho (04-VT)
  inventoryVoucher: (data) => `
    <div class="print-voucher">
      <div class="voucher-header">
        <div>
          <strong>${data.businessName}</strong><br>
          Địa chỉ: ${data.businessAddress}<br>
          Mã số thuế: ${data.taxId}
        </div>
        <div style="text-align: right;">
          <strong>Mẫu số ${data.action === 'in' ? '03-VT (Nhập)' : '04-VT (Xuất)'}</strong><br>
          <span>(TT 88/2021/TT-BTC)</span><br>
          <span>Số: <strong>${data.code}</strong></span>
        </div>
      </div>
      <h2 class="voucher-title">PHIẾU ${data.action === 'in' ? 'NHẬP KHO VẬT TƯ' : 'XUẤT KHO VẬT TƯ'}</h2>
      <div class="voucher-date">Ngày ${data.day} tháng ${data.month} năm ${data.year}</div>
      <div class="voucher-body">
        <p>Họ tên người ${data.action === 'in' ? 'giao hàng' : 'nhận hàng'}: <strong>${data.partner}</strong></p>
        <p>Địa điểm kho: <strong>Kho xưởng sản xuất trung tâm</strong></p>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>Tên vật tư / Hàng hóa</th>
            <th>ĐVT</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${data.itemName}</td>
            <td>${data.unit}</td>
            <td class="text-right">${data.qty}</td>
            <td class="text-right">${Number(data.price).toLocaleString('vi-VN')}</td>
            <td class="text-right font-bold">${Number(data.amount).toLocaleString('vi-VN')}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 10px;">Tổng tiền (viết bằng chữ): <em>${data.amountWords}</em></p>
      <div class="voucher-signatures">
        <div class="sig-box">
          <strong>Người lập</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>Người lập</p>
        </div>
        <div class="sig-box">
          <strong>Người ${data.action === 'in' ? 'giao' : 'nhận'}</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>${data.partner}</p>
        </div>
        <div class="sig-box">
          <strong>Thủ kho</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>Thủ kho</p>
        </div>
        <div class="sig-box">
          <strong>Đại diện Hộ KD</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>${data.artisanName}</p>
        </div>
      </div>
    </div>
  `,

  // 4. Sổ chi tiết Doanh thu bán hàng hóa, dịch vụ (Mẫu S1-HKD & S2a-HKD)
  revenueLedger: (data) => `
    <div class="print-ledger">
      <div class="ledger-header">
        <div>
          <strong>${data.businessName}</strong><br>
          Địa chỉ: ${data.businessAddress}<br>
          Mã số thuế: ${data.taxId}
        </div>
        <div style="text-align: right;">
          <strong>Mẫu số S1-HKD / S2a-HKD</strong><br>
          <span>(TT 88/2021/TT-BTC & TT 152/2025/TT-BTC)</span>
        </div>
      </div>
      <h2 class="ledger-title">SỔ CHI TIẾT DOANH THU BÁN HÀNG HÓA, DỊCH VỤ</h2>
      <div class="ledger-subtitle">Kỳ tính: <strong>${data.periodTitle}</strong> (Năm ${data.year})</div>
      <table class="report-table">
        <thead>
          <tr>
            <th rowspan="2">Ngày ghi</th>
            <th colspan="2">Chứng từ</th>
            <th rowspan="2">Nội dung nghiệp vụ</th>
            <th rowspan="2">Sản xuất chế tác (3%)</th>
            <th rowspan="2">Bán lẻ thành phẩm (1%)</th>
            <th rowspan="2">Tổng doanh thu (VNĐ)</th>
            <th rowspan="2">Kênh thanh toán</th>
          </tr>
          <tr>
            <th>Số hiệu</th>
            <th>Ngày</th>
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(r => `
            <tr>
              <td>${r.date}</td>
              <td>${r.code}</td>
              <td>${r.date}</td>
              <td class="text-left">${r.desc}</td>
              <td class="text-right">${r.isManufacture ? Number(r.amount).toLocaleString('vi-VN') : '-'}</td>
              <td class="text-right">${!r.isManufacture ? Number(r.amount).toLocaleString('vi-VN') : '-'}</td>
              <td class="text-right font-bold">${Number(r.amount).toLocaleString('vi-VN')}</td>
              <td>${r.channel === 'bank' ? 'Ngân hàng' : 'Tiền mặt'}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="font-bold">TỔNG CỘNG PHÁT SINH TRONG KỲ</td>
            <td class="text-right font-bold">${Number(data.totalManufacture).toLocaleString('vi-VN')}</td>
            <td class="text-right font-bold">${Number(data.totalRetail).toLocaleString('vi-VN')}</td>
            <td class="text-right font-bold">${Number(data.grandTotal).toLocaleString('vi-VN')}</td>
            <td>-</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin: 15px 0; font-size: 10pt; line-height: 1.6;">
        <p>• Doanh thu lũy kế: <strong>${Number(data.grandTotal).toLocaleString('vi-VN')} VNĐ</strong></p>
        <p>• Chính sách áp dụng: <em>${data.taxExplanation}</em></p>
        <p>• Thuế GTGT tạm tính: <strong>${Number(data.vatAmount).toLocaleString('vi-VN')} VNĐ</strong> | Thuế TNCN tạm tính: <strong>${Number(data.pitAmount).toLocaleString('vi-VN')} VNĐ</strong></p>
      </div>
      <div class="ledger-signatures">
        <div class="sig-box">
          <strong>Người lập biểu</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>${data.creatorName || 'Người lập'}</p>
        </div>
        <div class="sig-box" style="margin-left: auto;">
          <strong>Người đại diện Hộ kinh doanh</strong><br><span>(Ký, họ tên, đóng dấu)</span>
          <div class="sig-space"></div>
          <p>${data.artisanName || 'Chủ cơ sở'}</p>
        </div>
      </div>
    </div>
  `,

  // 5. Sổ chi phí sản xuất, kinh doanh (Mẫu S3-HKD & S2c-HKD)
  expenseLedger: (data) => `
    <div class="print-ledger">
      <div class="ledger-header">
        <div>
          <strong>${data.businessName}</strong><br>
          Địa chỉ: ${data.businessAddress}<br>
          Mã số thuế: ${data.taxId}
        </div>
        <div style="text-align: right;">
          <strong>Mẫu số S3-HKD / S2c-HKD</strong><br>
          <span>(TT 88/2021/TT-BTC & TT 152/2025/TT-BTC)</span>
        </div>
      </div>
      <h2 class="ledger-title">SỔ CHI PHÍ SẢN XUẤT, KINH DOANH</h2>
      <div class="ledger-subtitle">Năm: <strong>${data.year}</strong></div>
      <table class="report-table">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Số hiệu</th>
            <th>Diễn giải</th>
            <th>Nguyên vật liệu</th>
            <th>Nhân công</th>
            <th>Lò nung / Điện</th>
            <th>Bao bì / Khác</th>
            <th>Tổng số tiền</th>
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(r => `
            <tr>
              <td>${r.date}</td>
              <td>${r.code}</td>
              <td>${r.desc}</td>
              <td class="text-right">${r.type === 'expense_material' ? Number(r.amount).toLocaleString('vi-VN') : '-'}</td>
              <td class="text-right">${r.type === 'expense_labor' ? Number(r.amount).toLocaleString('vi-VN') : '-'}</td>
              <td class="text-right">${r.type === 'expense_fuel' ? Number(r.amount).toLocaleString('vi-VN') : '-'}</td>
              <td class="text-right">${r.type === 'expense_packaging' ? Number(r.amount).toLocaleString('vi-VN') : '-'}</td>
              <td class="text-right font-bold">${Number(r.amount).toLocaleString('vi-VN')}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="font-bold">TỔNG CHI PHÍ TRONG KỲ</td>
            <td colspan="4"></td>
            <td class="text-right font-bold">${Number(data.totalExpense).toLocaleString('vi-VN')}</td>
          </tr>
        </tfoot>
      </table>
      <div class="ledger-signatures">
        <div class="sig-box">
          <strong>Người lập biểu</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>Người lập</p>
        </div>
        <div class="sig-box" style="margin-left: auto;">
          <strong>Người đại diện Hộ kinh doanh</strong><br><span>(Ký, họ tên, đóng dấu)</span>
          <div class="sig-space"></div>
          <p>${data.artisanName}</p>
        </div>
      </div>
    </div>
  `,

  // 6. Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa (Mẫu S2-HKD & S2d-HKD)
  inventoryLedger: (data) => `
    <div class="print-ledger">
      <div class="ledger-header">
        <div>
          <strong>${data.businessName}</strong><br>
          Địa chỉ: ${data.businessAddress}<br>
          Mã số thuế: ${data.taxId}
        </div>
        <div style="text-align: right;">
          <strong>Mẫu số S2-HKD / S2d-HKD</strong><br>
          <span>(TT 88/2021/TT-BTC & TT 152/2025/TT-BTC)</span>
        </div>
      </div>
      <h2 class="ledger-title">SỔ CHI TIẾT VẬT LIỆU, DỤNG CỤ, SẢN PHẨM, HÀNG HÓA</h2>
      <table class="report-table">
        <thead>
          <tr>
            <th>Tên mặt hàng</th>
            <th>Đơn vị tính</th>
            <th class="text-right">Tổng Nhập</th>
            <th class="text-right">Tổng Xuất</th>
            <th class="text-right">Tồn Kho Cuối Kỳ</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(i => `
            <tr>
              <td><strong>${i.name}</strong></td>
              <td>${i.unit}</td>
              <td class="text-right">${i.inQty}</td>
              <td class="text-right">${i.outQty}</td>
              <td class="text-right font-bold" style="color: var(--clay-primary);">${i.balance}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="ledger-signatures">
        <div class="sig-box">
          <strong>Thủ kho</strong><br><span>(Ký, họ tên)</span>
          <div class="sig-space"></div>
          <p>Thủ kho</p>
        </div>
        <div class="sig-box" style="margin-left: auto;">
          <strong>Người đại diện Hộ kinh doanh</strong><br><span>(Ký, họ tên, đóng dấu)</span>
          <div class="sig-space"></div>
          <p>${data.artisanName}</p>
        </div>
      </div>
    </div>
  `
};
