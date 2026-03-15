import React from "react";
import "../assets/css/ReceiptPrint.css";
import { formatRupiah } from "../utils/formatter";

const ReceiptPrint = React.forwardRef(({ data }, ref) => {
  // --- NORMALISASI DATA (Agar sinkron antara Transaksi Baru & History) ---
  const outlet = data?.outlet || {};
  const customerName = data?.customer_name || "Pelanggan Umum";

  // Deteksi Kasir: Cek 'cashier' (Resource History) atau 'created_by' (Resource Baru)
  const cashier = data?.cashier || data?.created_by || "Staff";

  // Deteksi Metode Bayar: Cek string langsung atau nested object
  const paymentMethod =
    typeof data?.payment_method === "string"
      ? data.payment_method
      : data?.payment_method?.name ||
        data?.initial_payment_method?.name ||
        "TUNAI";

  // Format Tanggal: Gunakan order_date yang sudah jadi string dari BE, atau format created_at
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
          {/* HEADER SECTION */}
          <div className="receipt-header">
            <h1 className="shop-name">{outlet.name || "OUTLET KAMI"}</h1>
            <p className="shop-address">{outlet.address || ""}</p>
            <p className="shop-contact">
              {outlet.city} {outlet.phone ? `| ${outlet.phone}` : ""}
            </p>
          </div>

          <div className="dashed-line"></div>

          {/* TRANSACTION INFO */}
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

          {/* ITEMS TABLE */}
          <table className="receipt-table">
            <thead>
              <tr>
                <th align="left">Layanan</th>
                <th align="center">Qty</th>
                <th align="right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.details?.map((item, index) => (
                <tr key={index}>
                  <td className="item-name">
                    {item.package_name || item.name}
                    <div className="item-price">
                      @{formatRupiah(item.price_per_unit || item.price)}
                    </div>
                  </td>
                  <td align="center" className="item-qty">
                    {parseFloat(item.qty)} <small>{item.unit || ""}</small>
                  </td>
                  <td align="right" className="item-subtotal">
                    {formatRupiah(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="dashed-line"></div>

          {/* TOTALS SECTION */}
          <div className="receipt-footer">
            <div className="footer-row">
              <span className="label">GRAND TOTAL</span>
              <span className="value bold">
                {formatRupiah(data.grand_total)}
              </span>
            </div>

            {/* Field Khusus Pelunasan/History (Hanya muncul jika field total_paid tersedia) */}
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

          {/* STATUS BADGE */}
          <div className="status-section">
            <div className={`status-banner ${data.payment_status}`}>
              {data.payment_status === "PAID"
                ? "*** LUNAS ***"
                : "*** BELUM LUNAS ***"}
            </div>
          </div>

          {/* FOOTER MESSAGE */}
          <div className="thanks-section">
            <p className="thanks-title">Terima Kasih Atas Kunjungan Anda</p>
            <p className="thanks-subtitle">
              Barang yang sudah dibawa tidak dapat dikomplain/dikembalikan
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
