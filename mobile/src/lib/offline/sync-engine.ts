import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import {
  cacheProducts,
  getPendingOperations,
  markOperationStatus,
} from './offline-db';

export async function syncProductsFromServer() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name), brands(name)')
      .eq('status', 'active');

    if (!error && products) {
      await cacheProducts(products);
      console.log(`Cached ${products.length} products locally.`);
    }
  } catch (err) {
    console.error('Product cache sync error:', err);
  }
}

export async function processSyncQueue() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { synced: 0, failed: 0 };

  const pending = await getPendingOperations();
  let synced = 0;
  let failed = 0;

  for (const op of pending) {
    try {
      if (op.operation_type === 'sale') {
        const { error } = await supabase.rpc('create_sale_transaction', op.payload);
        if (error) throw error;
        await markOperationStatus(op.id, 'synced');
        synced++;
      } else if (op.operation_type === 'stock_count') {
        const { error } = await supabase
          .from('stock_audit_items')
          .update(op.payload.updateData)
          .eq('id', op.payload.itemId);
        if (error) throw error;
        await markOperationStatus(op.id, 'synced');
        synced++;
      }
    } catch (err: any) {
      console.error(`Sync failed for operation ${op.id}:`, err);
      await markOperationStatus(op.id, 'failed', err.message);
      failed++;
    }
  }

  if (synced > 0) {
    await syncProductsFromServer();
  }

  return { synced, failed };
}
