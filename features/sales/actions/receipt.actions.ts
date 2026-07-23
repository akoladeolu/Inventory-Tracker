'use server';

import { generateAndStoreReceipt, generateReceiptHTML } from '@/lib/receipts/generate-receipt';
import { createClient } from '@/lib/supabase/server';

export async function generateReceipt(saleId: string): Promise<{
  success: boolean;
  receiptUrl?: string;
  token?: string;
  error?: string;
}> {
  try {
    const { receiptUrl, token } = await generateAndStoreReceipt(saleId);
    return { success: true, receiptUrl, token };
  } catch (err: any) {
    console.error('Receipt generation error:', err);
    return { success: false, error: err.message || 'Failed to generate receipt' };
  }
}

export async function getReceiptByToken(token: string): Promise<{
  success: boolean;
  sale?: any;
  items?: any[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('receipt_token', token)
      .single();

    if (saleError || !sale) {
      return { success: false, error: 'Receipt not found' };
    }

    const { data: saleItems, error: itemsError } = await supabase
      .from('sale_items')
      .select('id, quantity, unit_price, total, product_id')
      .eq('sale_id', sale.id);

    if (itemsError) {
      return { success: false, error: 'Failed to fetch receipt items' };
    }

    const productIds = saleItems?.map((i: any) => i.product_id) || [];
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku')
      .in('id', productIds);

    const productMap = new Map((products || []).map((p: any) => [p.id, p]));

    const items = (saleItems || []).map((item: any) => ({
      ...item,
      product: productMap.get(item.product_id) || { name: 'Unknown', sku: 'N/A' },
    }));

    return { success: true, sale, items };
  } catch (err: any) {
    console.error('Receipt lookup error:', err);
    return { success: false, error: err.message || 'Failed to fetch receipt' };
  }
}
