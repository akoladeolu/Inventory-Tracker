export interface CSVHeader {
  label: string;
  key: string;
}

export function exportToCSV(data: any[], filename: string, headers: CSVHeader[]) {
  try {
    const csvContent = [
      headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const keys = h.key.split(".");
            let val: any = row;
            for (const k of keys) {
              val = val ? val[k] : "";
            }
            const strVal = val === null || val === undefined ? "" : String(val);
            return `"${strVal.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export CSV:", error);
  }
}

export function printReceipt(sale: any) {
  const printWindow = window.open("", "_blank", "width=600,height=800");
  if (!printWindow) {
    alert("Please allow popups to print the receipt");
    return;
  }

  const itemsHTML = (sale.items || [])
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 6px 0; font-size: 13px;">
        ${item.product?.name || item.product_name || "Unknown Product"}<br/>
        <span style="font-size: 11px; color: #666;">${item.quantity} x ₦${Number(item.unit_price).toLocaleString()}</span>
      </td>
      <td style="text-align: right; padding: 6px 0; font-size: 13px; vertical-align: bottom;">
        ₦${Number(item.total).toLocaleString()}
      </td>
    </tr>
  `
    )
    .join("");

  const discountRow = Number(sale.discount) > 0
    ? `
    <tr style="border-top: 1px dashed #ddd;">
      <td style="padding: 6px 0; font-size: 13px; color: #666;">Discount ${sale.coupons?.code || sale.coupon?.code ? `(${sale.coupons?.code || sale.coupon?.code})` : ''}</td>
      <td style="text-align: right; padding: 6px 0; font-size: 13px; color: #666;">-₦${Number(sale.discount).toLocaleString()}</td>
    </tr>
    `
    : "";

  const html = `
    <html>
      <head>
        <title>Receipt ${sale.invoice_number}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 74mm;
            margin: 0 auto;
            padding: 10px 3mm;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .header { margin-bottom: 15px; }
          .title { font-size: 18px; font-weight: bold; margin: 0 0 5px 0; text-transform: uppercase; }
          .subtitle { font-size: 12px; margin: 0 0 10px 0; }
          .meta { font-size: 11px; line-height: 1.4; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 10px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .totals { font-size: 13px; margin-bottom: 20px; }
          .footer { font-size: 11px; margin-top: 20px; border-top: 1px dashed #000; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <h1 class="title">INVENTORY TRACKER</h1>
          <p class="subtitle">Fashion Accessories Store</p>
        </div>
        <div class="meta">
          <strong>Invoice:</strong> ${sale.invoice_number}<br/>
          <strong>Date:</strong> ${new Date(sale.created_at).toLocaleString()}<br/>
          <strong>Cashier:</strong> ${sale.users?.name || "Staff"}<br/>
          ${sale.customer_name ? `<strong>Customer:</strong> ${sale.customer_name}<br/>` : ""}
          ${sale.customer_phone ? `<strong>Phone:</strong> ${sale.customer_phone}<br/>` : ""}
        </div>
        <table class="table">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; font-size: 12px; padding-bottom: 5px;">Item</th>
              <th style="text-align: right; font-size: 12px; padding-bottom: 5px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        <table class="table totals">
          <tbody>
            <tr style="border-top: 1px solid #000;">
              <td style="padding: 6px 0; font-size: 13px;">Subtotal</td>
              <td style="text-align: right; padding: 6px 0; font-size: 13px;">₦${Number(sale.subtotal).toLocaleString()}</td>
            </tr>
            ${discountRow}
            <tr style="border-top: 1px solid #000; font-weight: bold;">
              <td style="padding: 6px 0; font-size: 14px;">Total</td>
              <td style="text-align: right; padding: 6px 0; font-size: 14px;">₦${Number(sale.total).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #666;">Payment Method</td>
              <td style="text-align: right; padding: 6px 0; font-size: 12px; color: #666; text-transform: uppercase;">${sale.payment_method}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer text-center">
          <p style="margin: 0 0 5px 0; font-weight: bold;">THANK YOU FOR YOUR PATRONAGE!</p>
          <p style="margin: 0;">No Refund After Payment.</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
