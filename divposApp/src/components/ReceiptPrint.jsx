import React from "react";
import "../assets/css/ReceiptPrint.css";
import { formatRupiah } from "../utils/formatter";

const ReceiptPrint = React.forwardRef(({ data }, ref) => {
  // --- NORMALISASI DATA ---
  const outlet = data?.outlet || {};
  const customerName = data?.customer_name || "Pelanggan Umum";
  const queueNumber = data?.queue_number || "00";
  const cashier = data?.cashier || "Staff";
  const paymentMethod =
    data?.payment_method_name || data?.payment_method || "TUNAI";
  const displayDate = data?.order_date || "-";

  // --- LOGIC PEMBAYARAN (SINKRON DENGAN BACKEND) ---
  // 1. Nominal yang sedang dibayar saat ini (menggunakan latest_payment dari backend)
  const currentPayment = parseFloat(
    data?.latest_payment || data?.payment_amount || 0
  );

  // 2. Nominal DP/Pembayaran sebelumnya (Total Paid di DB dikurangi yang baru masuk)
  const previousPaid = parseFloat(data?.total_paid || 0) - currentPayment;

  // 3. Kembalian terbaru
  const currentChange = parseFloat(
    data?.latest_change || data?.change_amount || 0
  );

  // Label Dinamis
  const isPelunasan = data?.payment_status === "PAID" && previousPaid > 0;
  const paymentLabel = isPelunasan
    ? "PELUNASAN"
    : data?.payment_status === "PARTIAL"
    ? "DP / UANG MUKA"
    : `BAYAR (${paymentMethod})`;

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
                  {" "}
                  Layanan{" "}
                </th>
                <th align="center" style={{ width: "20%" }}>
                  {" "}
                  Qty{" "}
                </th>
                <th align="right" style={{ width: "30%" }}>
                  {" "}
                  Total{" "}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.details?.map((item, index) => (
                <tr key={index}>
                  <td className="item-name-cell">
                    <span className="item-name">{item.package_name}</span>
                    <div className="item-price">
                      {" "}
                      @{formatRupiah(item.price_per_unit)}{" "}
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

            {/* Jika ada pembayaran DP sebelumnya, tampilkan sebagai pengurang */}
            {previousPaid > 0 && (
              <div className="footer-row" style={{ opacity: 0.8 }}>
                <span className="label text-xs tracking-tight uppercase">
                  Telah Dibayar (DP)
                </span>
                <span className="value">{formatRupiah(previousPaid)}</span>
              </div>
            )}

            {/* Nominal yang dibayar SEKARANG */}
            <div className="footer-row">
              <span className="label font-bold uppercase">{paymentLabel}</span>
              <span className="value font-bold">
                {formatRupiah(currentPayment)}
              </span>
            </div>

            {/* SISA TAGIHAN: Muncul jika masih ada sisa (Hutang/DP) */}
            {parseFloat(data.remaining_bill) > 0 && (
              <div className="footer-row sisa-tagihan">
                <span className="label font-bold">SISA TAGIHAN</span>
                <span className="value font-bold">
                  {formatRupiah(data.remaining_bill)}
                </span>
              </div>
            )}

            {/* KEMBALIAN: Muncul jika ada uang kembali dari pelunasan ini */}
            {currentChange > 0 && (
              <div className="footer-row">
                <span className="label">KEMBALI</span>
                <span className="value">{formatRupiah(currentChange)}</span>
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
                SIMPAN NOTA INI SEBAGAI BUKTI
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="loading-state">Memuat data nota...</div>
      )}
    </div>
  );
});

export default ReceiptPrint;
