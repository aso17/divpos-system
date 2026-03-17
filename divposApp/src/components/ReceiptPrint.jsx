import React from "react";
import "../assets/css/ReceiptPrint.css";
import { formatRupiah } from "../utils/formatter";

const ReceiptPrint = React.forwardRef(({ data }, ref) => {
  // --- NORMALISASI DATA ---
  const outlet = data?.outlet || {};
  const customerName = data?.customer_name || "Pelanggan Umum";

  // Format Nomor Antrean (Selalu 2 digit: 01, 02, dst)
  const queueNumber = data?.queue_number
    ? String(data.queue_number).padStart(2, "0")
    : "00";

  const cashier = data?.cashier || data?.created_by || "Staff";

  const paymentMethod =
    typeof data?.payment_method === "string"
      ? data.payment_method
      : data?.payment_method?.name ||
        data?.initial_payment_method?.name ||
        "TUNAI";

  const displayDate =
    data?.order_date ||
    (data?.created_at
      ? new Date(data.created_at).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "-");

  return (
    <div ref={ref} className="receipt-container">
      {data ? (
        <div className="receipt-content">
          {/* 1. NOMOR ANTRIAN (Sangat Menonjol untuk Laundry) */}
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
                    <span className="item-name">
                      {item.package_name || item.name}
                    </span>
                    <div className="item-price">
                      @{formatRupiah(item.price_per_unit || item.price)}
                    </div>
                  </td>
                  <td
                    align="center"
                    className="item-qty"
                    style={{ verticalAlign: "top" }}
                  >
                    {parseFloat(item.qty)} <small>{item.unit || ""}</small>
                  </td>
                  <td
                    align="right"
                    className="item-subtotal"
                    style={{ verticalAlign: "top" }}
                  >
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
              <span className="label">GRAND TOTAL</span>
              <span className="value bold">
                {formatRupiah(data.grand_total)}
              </span>
            </div>

            {data.total_paid !== undefined && (
              <div className="footer-row">
                <span className="label">TOTAL TERBAYAR</span>
                <span className="value">{formatRupiah(data.total_paid)}</span>
              </div>
            )}

            <div className="footer-row">
              <span className="label">BAYAR ({paymentMethod})</span>
              <span className="value">{formatRupiah(data.payment_amount)}</span>
            </div>

            <div className="footer-row total-bold">
              <span className="label">KEMBALI</span>
              <span className="value">{formatRupiah(data.change_amount)}</span>
            </div>
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

          {/* 7. FOOTER MESSAGE (Disesuaikan untuk Laundry/Service) */}
          <div className="thanks-section">
            <p className="thanks-title">Terima Kasih Atas Kepercayaan Anda</p>
            <p className="thanks-subtitle">
              {data.payment_status !== "PAID"
                ? "Simpan nota ini untuk bukti pengambilan"
                : "Kepuasan Anda adalah Prioritas Kami"}
            </p>
            <p className="thanks-notice">Sampai Jumpa Kembali</p>
          </div>
        </div>
      ) : (
        <div className="loading-state">Memuat data nota...</div>
      )}
    </div>
  );
});

export default ReceiptPrint;
