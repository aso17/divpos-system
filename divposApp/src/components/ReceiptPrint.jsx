import React from "react";
import "../assets/css/ReceiptPrint.css";
import { formatRupiah } from "../utils/formatter";

const ReceiptPrint = React.forwardRef(({ data }, ref) => {
  return (
    <div ref={ref} className="receipt-container">
      {data ? (
        <div className="receipt-content">
          {/* HEADER SECTION */}
          <div className="receipt-header">
            <h1 className="shop-name">{data.outlet?.name || ""}</h1>
            <p className="shop-address">{data.outlet?.address}</p>
            <p className="shop-contact">
              {data.outlet?.city} | {data.outlet?.phone}
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
              <span className="label">Tanggal : </span>
              <span className="value">
                {new Date(data.created_at).toLocaleString("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Kasir : </span>
              <span className="value">{data.created_by}</span>
            </div>
            <div className="info-row">
              <span className="label">Pelanggan : </span>
              <span className="value">{data.customer_name || "Gneral"}</span>
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
                    {item.package_name}
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

          {/* TOTALS SECTION */}
          <div className="receipt-footer">
            <div className="footer-row">
              <span className="label">TOTAL </span>
              <span className="value bold">
                {formatRupiah(data.grand_total)}
              </span>
            </div>
            <div className="footer-row">
              <span className="label">
                BAYAR ({data.initial_payment_method?.name || "TUNAI"})
              </span>
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
            <p className="thanks-title">Terima Kasih</p>
          </div>
        </div>
      ) : (
        <div className="loading-state">Memuat data nota...</div>
      )}
    </div>
  );
});

export default ReceiptPrint;
