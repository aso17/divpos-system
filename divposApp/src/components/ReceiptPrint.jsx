import React from "react";
import "../assets/css/ReceiptPrint.css";
import { formatRupiah } from "../utils/formatter";

const ReceiptPrint = React.forwardRef(({ data }, ref) => {
  // --- NORMALISASI DATA (Ambil dari Resource yang sudah kita buat) ---
  const outlet = data?.outlet || {};
  const customerName = data?.customer_name || "Pelanggan Umum";
  const queueNumber = data?.queue_number || "00"; // Sudah di-pad di backend
  const cashier = data?.cashier || "Staff";
  const paymentMethod = data?.payment_method || "TUNAI";
  const displayDate = data?.order_date || "-";

  // Logic Label Pembayaran
  const paymentLabel =
    data?.dp_amount > 0 ? "DP / UANG MUKA" : `BAYAR (${paymentMethod})`;

  return (
    <div ref={ref} className="receipt-container">
      {data ? (
        <div className="receipt-content">
          {/* 1. NOMOR ANTREAN */}
          <div className="queue-section">
            <div className="queue-label">Nomor Urut</div>
            <div className="queue-number">{queueNumber}</div>
          </div>

          {/* 2. HEADER SECTION */}
          <div className="receipt-header">
            <h1 className="shop-name">{outlet.name || "OUTLET KAMI"}</h1>
            <p className="shop-address">{outlet.address || ""}</p>
            <p className="shop-contact">
              {outlet.city} {outlet.phone ? `| ${outlet.phone}` : ""}
            </p>
          </div>

          <div className="dashed-line"></div>

          {/* 3. TRANSACTION INFO */}
          <div className="receipt-info">
            <div className="info-row">
              <span className="label">No. Invoice</span>
              <span className="value">{data.invoice_no}</span>
            </div>
            <div className="info-row">
              <span className="label">Tanggal</span>
              <span className="value">{displayDate}</span>
            </div>
            <div className="info-row">
              <span className="label">Kasir</span>
              <span className="value">{cashier}</span>
            </div>
            <div className="info-row">
              <span className="label">Pelanggan</span>
              <span className="value">{customerName}</span>
            </div>
          </div>

          <div className="dashed-line"></div>

          {/* 4. ITEMS TABLE */}
          <table className="receipt-table">
            <thead>
              <tr>
                <th align="left" style={{ width: "50%" }}>
                  Layanan
                </th>
                <th align="center" style={{ width: "20%" }}>
                  Qty
                </th>
                <th align="right" style={{ width: "30%" }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data.details?.map((item, index) => (
                <tr key={index}>
                  <td className="item-name-cell">
                    <span className="item-name">{item.package_name}</span>
                    <div className="item-price">
                      @{formatRupiah(item.price_per_unit)}
                    </div>
                  </td>
                  <td align="center" className="item-qty">
                    {parseFloat(item.qty)} <small>{item.unit}</small>
                  </td>
                  <td align="right" className="item-subtotal">
                    {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="dashed-line"></div>

          {/* 5. TOTALS SECTION */}
          <div className="receipt-footer">
            <div className="footer-row">
              <span className="label font-bold">GRAND TOTAL</span>
              <span className="value font-bold">
                {formatRupiah(data.grand_total)}
              </span>
            </div>

            {/* Menampilkan apa yang dibayar saat ini (DP atau Full) */}
            <div className="footer-row">
              <span className="label uppercase">{paymentLabel}</span>
              <span className="value">{formatRupiah(data.payment_amount)}</span>
            </div>

            {/* SISA TAGIHAN: Hanya muncul jika belum lunas */}
            {data.remaining_bill > 0 && (
              <div className="footer-row sisa-tagihan">
                <span className="label font-bold">SISA TAGIHAN</span>
                <span className="value font-bold">
                  {formatRupiah(data.remaining_bill)}
                </span>
              </div>
            )}

            {/* KEMBALIAN: Hanya muncul jika ada uang kembali */}
            {data.change_amount > 0 && (
              <div className="footer-row">
                <span className="label">KEMBALI</span>
                <span className="value">
                  {formatRupiah(data.change_amount)}
                </span>
              </div>
            )}
          </div>

          <div className="dashed-line"></div>

          {/* 6. STATUS BANNER */}
          <div className="status-section">
            <div className={`status-banner ${data.payment_status}`}>
              {data.payment_status === "PAID"
                ? "*** LUNAS ***"
                : "*** BELUM LUNAS ***"}
            </div>
          </div>

          {/* 7. FOOTER MESSAGE */}
          <div className="thanks-section">
            <p className="thanks-title">Terima Kasih Atas Kepercayaan Anda</p>
            {data.payment_status !== "PAID" && (
              <p className="thanks-subtitle bold">
                SIMPAN NOTA INI SEBAGAI BUKTI PENGAMBILAN
              </p>
            )}
            <p className="thanks-notice">
              Barang yang sudah diambil tidak dapat dikomplain.
            </p>
          </div>
        </div>
      ) : (
        <div className="loading-state">Memuat data nota...</div>
      )}
    </div>
  );
});

export default ReceiptPrint;
