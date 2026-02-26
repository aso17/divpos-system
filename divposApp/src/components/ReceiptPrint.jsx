import React from "react";
import "../assets/css/ReceiptPrint.css";

const ReceiptPrint = React.forwardRef(({ data }, ref) => {
  // Fungsi pembantu untuk mengambil nama kasir dari string "ID-Nama"
  const getCashierName = (createdBy) => {
    if (!createdBy) return "Admin";
    return createdBy.includes("-") ? createdBy.split("-")[1] : createdBy;
  };

  return (
    <div ref={ref} className="receipt-container">
      {data ? (
        <>
          {/* HEADER OUTLET */}
          <div className="receipt-header">
            <h2 className="shop-name">{data.outlet?.name || "LAUNDRY KITA"}</h2>

            <div className="outlet-info-row">
              <span className="label">Kode Outlet: </span>
              <span className="value" style={{ fontWeight: "bold" }}>
                {data.outlet?.code || "-"}
              </span>
            </div>

            <p>{data.outlet?.address || "Alamat tidak tersedia"}</p>
            <p>
              {data.outlet?.city || ""} | Telp: {data.outlet?.phone || "-"}
            </p>
          </div>

          <div className="divider">--------------------------------</div>

          {/* INFO TRANSAKSI */}
          <div className="receipt-info">
            <p>No : {data.invoice_no}</p>
            <p>
              Tgl :{" "}
              {data.created_at
                ? new Date(data.created_at).toLocaleString("id-ID", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "-"}
            </p>
            {/* AMBIL DARI TRANSAKSI, BUKAN OUTLET */}
            <p>Kasir: {getCashierName(data.created_by)}</p>
            <p>
              Cust : {data.customer_name} ({data.customer_phone || "-"})
            </p>
          </div>

          <div className="divider">--------------------------------</div>

          {/* DETAIL ITEM */}
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
                  <td style={{ fontSize: "10px" }}>{item.package_name}</td>
                  <td align="center">
                    {parseFloat(item.qty || 0)}{" "}
                    <span style={{ fontSize: "8px" }}>{item.unit || ""}</span>
                  </td>
                  <td align="right">
                    {parseInt(item.subtotal || 0).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divider">--------------------------------</div>

          {/* RINGKASAN BAYAR */}
          <div className="receipt-footer">
            <div className="flex-row">
              <span>GRAND TOTAL:</span>
              <span>
                Rp {parseInt(data.grand_total || 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex-row">
              <span>BAYAR:</span>
              <span>
                Rp {parseInt(data.payment_amount || 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex-row" style={{ fontWeight: "bold" }}>
              <span>KEMBALI:</span>
              <span>
                Rp {parseInt(data.change_amount || 0).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="status-container">
              <h3 className={`status-badge ${data.payment_status}`}>
                {data.payment_status === "PAID"
                  ? "*** LUNAS ***"
                  : "*** TAGIHAN ***"}
              </h3>
            </div>
          </div>

          <div className="divider">--------------------------------</div>
          <div className="thanks">
            <p>Terima Kasih Atas Kepercayaan Anda</p>
            <p>Simpan nota ini untuk pengambilan barang</p>
          </div>
        </>
      ) : (
        <div style={{ padding: "20px", textAlign: "center", fontSize: "10px" }}>
          Menyiapkan data nota...
        </div>
      )}
    </div>
  );
});

export default ReceiptPrint;
