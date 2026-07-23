import { Metadata } from 'next';
import { getReceiptByToken } from '@/features/sales/actions/receipt.actions';
import { CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TEEKEH Receipt Verification',
  description: 'Verify your TEEKEH purchase receipt',
};

interface ReceiptPageProps {
  params: Promise<{ token: string }>;
}

export default async function ReceiptVerifyPage({ params }: ReceiptPageProps) {
  const { token } = await params;
  const result = await getReceiptByToken(token);

  if (!result.success || !result.sale) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[#111827] mb-2">Receipt Not Found</h1>
          <p className="text-sm text-[#6B7280]">This receipt link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const { sale, items } = result;
  const saleDate = new Date(sale.created_at);

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

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Verified Badge */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Verified Receipt</p>
            <p className="text-xs text-emerald-600">This is an authentic TEEKEH transaction</p>
          </div>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="text-center py-7 px-6 border-b-2 border-dashed border-gray-200">
            <h1 className="text-3xl font-extrabold text-[#C8A348] tracking-widest">TEEKEH</h1>
            <p className="text-xs text-[#6B7280] mt-1 font-medium">Premium Fashion Accessories</p>
          </div>

          {/* Sale Info */}
          <div className="px-6 py-5 border-b border-gray-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280] font-medium">Invoice</span>
              <span className="text-[#111827] font-semibold">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280] font-medium">Date</span>
              <span className="text-[#111827] font-semibold">
                {saleDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280] font-medium">Time</span>
              <span className="text-[#111827] font-semibold">
                {saleDate.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280] font-medium">Customer</span>
              <span className="text-[#111827] font-semibold">{sale.customer_name || 'Walk-in Customer'}</span>
            </div>
            {sale.customer_phone && (
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280] font-medium">Phone</span>
                <span className="text-[#111827] font-semibold">{sale.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between text-sm items-center">
              <span className="text-[#6B7280] font-medium">Payment</span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                {paymentLabels[sale.payment_method] || sale.payment_method}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 py-5">
            <p className="text-[10px] uppercase tracking-widest text-[#6B7280] font-semibold mb-4">Items Purchased</p>
            <div className="space-y-3">
              {(items || []).map((item: any) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-semibold text-[#111827] truncate">{item.product?.name}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{item.product?.sku}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#111827] flex-shrink-0">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="px-6 py-5 border-t-2 border-dashed border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#6B7280]">Subtotal</span>
              <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
            </div>
            {parseFloat(sale.discount) > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#6B7280]">Discount</span>
                <span className="font-medium text-red-600">-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-[#C8A348]">
              <span className="text-lg font-bold text-[#C8A348]">Total</span>
              <span className="text-lg font-bold text-[#C8A348]">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-5 px-6 bg-[#FAFAFA] border-t border-gray-100">
            <p className="text-xs text-[#6B7280]">
              Thank you for shopping at <span className="font-bold text-[#C8A348]">TEEKEH</span>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
