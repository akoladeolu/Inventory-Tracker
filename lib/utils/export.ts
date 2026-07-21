import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface CSVHeader {
  label: string;
  key: string;
}

export function exportToPDF(data: any[], filename: string, headers: CSVHeader[], title: string) {
  try {
    const doc = new jsPDF();
    
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(24, 24, 27); // Dark neutral charcoal
    doc.text(title, 14, 20);
    
    // Subtitle / Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122); // zinc-500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
    
    // Replace Naira symbol U+20A6 or ₦ with NGN in headers
    const tableHeaders = headers.map((h) => {
      return h.label.replace(/₦/g, "NGN").replace(/\u20A6/g, "NGN");
    });
    
    const currencyKeys = ["subtotal", "discount", "total", "cost_price", "selling_price"];
    const numericKeys = [...currencyKeys, "quantity", "low_stock_threshold"];
    
    const tableData = data.map((row) =>
      headers.map((h) => {
        const keys = h.key.split(".");
        let val: any = row;
        for (const k of keys) {
          val = val ? val[k] : "";
        }
        
        if (val === null || val === undefined) {
          return "";
        }
        
        // Format currency keys
        if (currencyKeys.includes(h.key) && !isNaN(Number(val)) && val !== "") {
          return Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        // Format Date Created
        if (h.key === "created_at" && val) {
          try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              return d.toLocaleDateString("en-US");
            }
          } catch (e) {
            // fallback
          }
        }
        
        const strVal = String(val);
        return strVal.replace(/₦/g, "NGN").replace(/\u20A6/g, "NGN");
      })
    );
    
    // Alignments
    const columnStyles: Record<number, { halign: "left" | "right" | "center" }> = {};
    headers.forEach((h, index) => {
      if (numericKeys.includes(h.key)) {
        columnStyles[index] = { halign: "right" };
      } else {
        columnStyles[index] = { halign: "left" };
      }
    });
    
    autoTable(doc, {
      startY: 32,
      head: [tableHeaders],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [24, 24, 27], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 3, font: "helvetica" },
      columnStyles,
      didDrawPage: (data) => {
        const str = `Page ${data.pageNumber}`;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(161, 161, 170); // zinc-400
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });
    
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Failed to export PDF:", error);
  }
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
