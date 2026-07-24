import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: string;
  total: string;
  product: {
    name: string;
    sku: string;
  };
}

interface SaleData {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  subtotal: string;
  discount: string;
  total: string;
  payment_method: string;
  created_at: string;
  items: SaleItem[];
}

export async function generateReceiptHTML(saleId: string): Promise<{
  html: string;
  token: string;
  saleData: SaleData;
}> {
  const supabase = await createClient();

  // Fetch sale data
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('*')
    .eq('id', saleId)
    .single();

  if (saleError || !sale) {
    throw new Error(`Sale not found: ${saleError?.message || 'Unknown error'}`);
  }

  // Fetch sale items with product info
  const { data: items, error: itemsError } = await supabase
    .from('sale_items')
    .select('id, quantity, unit_price, total, product_id')
    .eq('sale_id', saleId);

  if (itemsError) {
    throw new Error(`Failed to fetch sale items: ${itemsError.message}`);
  }

  // Fetch product details for each item
  const productIds = items?.map((i: any) => i.product_id) || [];
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku')
    .in('id', productIds);

  const productMap = new Map((products || []).map((p: any) => [p.id, p]));

  const saleItems: SaleItem[] = (items || []).map((item: any) => ({
    id: item.id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
    product: productMap.get(item.product_id) || { name: 'Unknown Product', sku: 'N/A' },
  }));

  // Generate receipt token
  const token = crypto.randomUUID().replace(/-/g, '').substring(0, 12);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inventory-tracker.vercel.app';
  const verifyUrl = `${baseUrl}/receipt/verify/${token}`;

  const saleDate = new Date(sale.created_at);
  const formattedDate = saleDate.toLocaleDateString('en-NG', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = saleDate.toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit',
  });

  const paymentLabels: Record<string, string> = {
    cash: 'Cash',
    card: 'POS / Card',
    transfer: 'Bank Transfer',
    mobile: 'Online Payment',
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `\u20A6${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEEKEH Receipt - ${sale.invoice_number}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #F8F9FA; color: #111827; }
    .receipt { max-width: 420px; margin: 24px auto; background: #fff; border-radius: 16px; box-shadow: 0 6px 24px rgba(0,0,0,.08); overflow: hidden; }
    .header { text-align: center; padding: 28px 24px 20px; border-bottom: 2px dashed #E5E7EB; }
    .brand { font-size: 28px; font-weight: 800; color: #C8A348; letter-spacing: 2px; }
    .tagline { font-size: 12px; color: #6B7280; margin-top: 4px; font-weight: 500; }
    .info { padding: 20px 24px; border-bottom: 1px solid #E5E7EB; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .info-label { color: #6B7280; font-weight: 500; }
    .info-value { color: #111827; font-weight: 600; }
    .items { padding: 20px 24px; }
    .items-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; font-weight: 600; margin-bottom: 12px; }
    .item { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
    .item:last-child { border-bottom: none; }
    .item-name { font-size: 14px; font-weight: 600; color: #111827; }
    .item-sku { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
    .item-qty { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .item-price { font-size: 14px; font-weight: 600; color: #111827; text-align: right; }
    .totals { padding: 20px 24px; border-top: 2px dashed #E5E7EB; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .total-row.grand { font-size: 18px; font-weight: 700; color: #C8A348; margin-top: 8px; padding-top: 12px; border-top: 2px solid #C8A348; }
    .payment-badge { display: inline-block; padding: 4px 12px; background: #F0FDF4; color: #16A34A; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .footer { text-align: center; padding: 20px 24px; background: #FAFAFA; border-top: 1px solid #E5E7EB; }
    .footer p { font-size: 12px; color: #6B7280; margin-bottom: 8px; }
    .verify-link { font-size: 11px; color: #C8A348; word-break: break-all; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="brand">TEEKEH</div>
      <div class="tagline">Premium Fashion Accessories</div>
    </div>
    <div class="info">
      <div class="info-row">
        <span class="info-label">Invoice</span>
        <span class="info-value">${sale.invoice_number}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time</span>
        <span class="info-value">${formattedTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Customer</span>
        <span class="info-value">${sale.customer_name || 'Walk-in Customer'}</span>
      </div>
      ${sale.customer_phone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value">${sale.customer_phone}</span></div>` : ''}
      <div class="info-row">
        <span class="info-label">Payment</span>
        <span class="payment-badge">${paymentLabels[sale.payment_method] || sale.payment_method}</span>
      </div>
    </div>
    <div class="items">
      <div class="items-title">Items Purchased</div>
      ${saleItems.map(item => `
        <div class="item">
          <div>
            <div class="item-name">${item.product.name}</div>
            <div class="item-sku">${item.product.sku}</div>
            <div class="item-qty">${item.quantity} × ${formatCurrency(item.unit_price)}</div>
          </div>
          <div class="item-price">${formatCurrency(item.total)}</div>
        </div>
      `).join('')}
    </div>
    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatCurrency(sale.subtotal)}</span>
      </div>
      ${parseFloat(sale.discount) > 0 ? `<div class="total-row"><span>Discount</span><span style="color:#DC2626">-${formatCurrency(sale.discount)}</span></div>` : ''}
      <div class="total-row grand">
        <span>Total</span>
        <span>${formatCurrency(sale.total)}</span>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for shopping at <strong style="color:#C8A348">TEEKEH</strong>!</p>
      <p class="verify-link">Verify: ${verifyUrl}</p>
    </div>
  </div>
</body>
</html>`;

  const saleData: SaleData = {
    id: sale.id,
    invoice_number: sale.invoice_number,
    customer_name: sale.customer_name || 'Walk-in Customer',
    customer_phone: sale.customer_phone || '',
    subtotal: sale.subtotal,
    discount: sale.discount,
    total: sale.total,
    payment_method: sale.payment_method,
    created_at: sale.created_at,
    items: saleItems,
  };

  return { html, token, saleData };
}

export async function generateAndStoreReceipt(saleId: string): Promise<{
  receiptUrl: string;
  token: string;
}> {
  const supabase = await createClient();
  const { html, token, saleData } = await generateReceiptHTML(saleId);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inventory-tracker.vercel.app';
  const receiptUrl = `${baseUrl}/receipt/verify/${token}`;

  // Update sale with receipt token and URL
  const { error } = await supabase
    .from('sales')
    .update({
      receipt_token: token,
      receipt_url: receiptUrl,
    })
    .eq('id', saleId);

  if (error) {
    throw new Error(`Failed to store receipt: ${error.message}`);
  }

  return { receiptUrl, token };
}
