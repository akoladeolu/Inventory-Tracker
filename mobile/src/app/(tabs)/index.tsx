import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ScanLine, 
  Search, 
  ChevronRight, 
  ShoppingBag,
  History,
  Activity
} from 'lucide-react-native';

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
}

interface RecentSale {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  created_at: string;
}

interface RecentMovement {
  id: string;
  type: string;
  quantity: number;
  created_at: string;
  products: {
    name: string;
    sku: string;
  } | null;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [salesTotal, setSalesTotal] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [activeProductsCount, setActiveProductsCount] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isoToday = today.toISOString();

      const [
        salesRes,
        productsRes,
        lowStockRes,
        recentSalesRes,
        recentMovementsRes
      ] = await Promise.all([
        supabase.from('sales').select('total_amount, total').gte('created_at', isoToday),
        supabase.from('products').select('id, quantity, cost_price').eq('status', 'active'),
        supabase.from('products').select('id, name, sku, quantity, low_stock_threshold').eq('status', 'active').lte('quantity', 5).order('quantity', { ascending: true }).limit(5),
        supabase.from('sales').select('id, invoice_number, customer_name, total, total_amount, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('stock_movements').select('id, type, quantity, created_at, products(name, sku)').order('created_at', { ascending: false }).limit(5)
      ]);

      if (!salesRes.error && salesRes.data) {
        setSalesCount(salesRes.data.length);
        setSalesTotal(salesRes.data.reduce((sum, sale: any) => sum + Number(sale.total || sale.total_amount || 0), 0));
      }

      if (!productsRes.error && productsRes.data) {
        setActiveProductsCount(productsRes.data.length);
        setTotalInventoryValue(productsRes.data.reduce((sum, p) => sum + ((p.quantity || 0) * Number(p.cost_price || 0)), 0));
      }

      if (!lowStockRes.error && lowStockRes.data) {
        setLowStockItems(lowStockRes.data as LowStockItem[]);
        setLowStockCount(lowStockRes.data.filter(item => item.quantity <= item.low_stock_threshold).length);
      }

      if (!recentSalesRes.error && recentSalesRes.data) {
        setRecentSales(recentSalesRes.data.map((s: any) => ({
          id: s.id,
          invoice_number: s.invoice_number,
          customer_name: s.customer_name || 'Walk-in Customer',
          total: Number(s.total || s.total_amount || 0),
          created_at: s.created_at
        })));
      }

      if (!recentMovementsRes.error && recentMovementsRes.data) {
        setRecentMovements(recentMovementsRes.data as any[]);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#0a0a0a] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View className="pt-16 pb-6 px-6 bg-[#0a0a0a] border-b border-white/5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-3xl font-extrabold tracking-tight">Overview</Text>
            <Text className="text-neutral-400 text-sm mt-1 font-medium">Store performance today</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 items-center justify-center">
            <Activity size={20} color="#60a5fa" />
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />}
      >
        {/* Actions Grid */}
        <View className="flex-row gap-4">
          <TouchableOpacity 
            onPress={() => router.replace('/scanner')}
            className="flex-1 bg-[#121212] border border-white/5 p-4 rounded-3xl"
          >
            <View className="w-12 h-12 bg-blue-500/10 rounded-2xl items-center justify-center mb-4 border border-blue-500/20">
              <ScanLine size={24} color="#60a5fa" />
            </View>
            <Text className="text-white font-semibold text-lg tracking-tight">Scan & Sell</Text>
            <Text className="text-neutral-500 text-xs mt-1">POS Checkout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.replace('/lookup')}
            className="flex-1 bg-[#121212] border border-white/5 p-4 rounded-3xl"
          >
            <View className="w-12 h-12 bg-emerald-500/10 rounded-2xl items-center justify-center mb-4 border border-emerald-500/20">
              <Search size={24} color="#34d399" />
            </View>
            <Text className="text-white font-semibold text-lg tracking-tight">Check Price</Text>
            <Text className="text-neutral-500 text-xs mt-1">Product Lookup</Text>
          </TouchableOpacity>
        </View>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <TouchableOpacity 
            onPress={() => router.replace('/lookup')}
            className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 bg-amber-500/20 rounded-full items-center justify-center">
                <AlertTriangle size={20} color="#fbbf24" />
              </View>
              <View>
                <Text className="text-amber-50 font-bold text-base tracking-tight">{lowStockCount} Low Stock Items</Text>
                <Text className="text-amber-500/80 text-xs mt-0.5">Needs immediate attention</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#fbbf24" opacity={0.6} />
          </TouchableOpacity>
        )}

        {/* Stats Summary */}
        <View className="bg-[#121212] border border-white/5 rounded-3xl p-5">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-2">
              <TrendingUp size={20} color="#a3a3a3" />
              <Text className="text-white font-bold text-base tracking-tight">Today's Performance</Text>
            </View>
          </View>
          
          <View className="flex-row items-end justify-between mb-2">
            <Text className="text-neutral-400 font-medium text-sm">Total Revenue</Text>
            <Text className="text-emerald-400 font-semibold text-sm">+{salesCount} orders</Text>
          </View>
          <Text className="text-white text-4xl font-extrabold tracking-tighter">₦{salesTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
          
          <View className="h-[1px] bg-white/5 my-6" />
          
          <View className="flex-row items-end justify-between mb-2">
            <Text className="text-neutral-400 font-medium text-sm">Inventory Value</Text>
            <Text className="text-blue-400 font-semibold text-sm">{activeProductsCount} items</Text>
          </View>
          <Text className="text-white text-3xl font-extrabold tracking-tighter">₦{totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
        </View>

        {/* Recent Sales List */}
        <View className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden">
          <View className="p-5 border-b border-white/5 flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-blue-500/10 items-center justify-center border border-blue-500/20">
              <ShoppingBag size={16} color="#60a5fa" />
            </View>
            <Text className="text-white font-bold text-base tracking-tight">Recent Sales</Text>
          </View>
          
          {recentSales.length === 0 ? (
            <View className="p-8 items-center justify-center">
              <Text className="text-neutral-500 font-medium text-sm">No sales recorded today.</Text>
            </View>
          ) : (
            <View>
              {recentSales.map((sale, index) => (
                <View 
                  key={sale.id} 
                  className={`p-4 flex-row items-center justify-between ${index !== recentSales.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <View>
                    <Text className="text-white font-semibold text-sm">{sale.invoice_number}</Text>
                    <Text className="text-neutral-500 text-xs mt-1">{sale.customer_name}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white font-bold text-sm tracking-tight">₦{sale.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
                    <Text className="text-neutral-500 text-[10px] mt-1 font-medium">
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden mb-6">
          <View className="p-5 border-b border-white/5 flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-emerald-500/10 items-center justify-center border border-emerald-500/20">
              <History size={16} color="#34d399" />
            </View>
            <Text className="text-white font-bold text-base tracking-tight">Stock Activity</Text>
          </View>
          
          {recentMovements.length === 0 ? (
            <View className="p-8 items-center justify-center">
              <Text className="text-neutral-500 font-medium text-sm">No recent stock activity.</Text>
            </View>
          ) : (
            <View>
              {recentMovements.map((movement, index) => {
                const isPositive = movement.type === 'stock_in' || movement.type === 'return';
                return (
                  <View 
                    key={movement.id} 
                    className={`p-4 flex-row items-center justify-between ${index !== recentMovements.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <View className="flex-1 pr-4">
                      <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                        {movement.products?.name || 'Unknown Product'}
                      </Text>
                      <Text className="text-neutral-500 text-xs mt-1">
                        {movement.products?.sku || ''} • {movement.type.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                    <View className="items-end gap-2">
                      <View className={`px-2.5 py-1 rounded-full border ${
                        isPositive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                      }`}>
                        <Text className={`font-bold text-[10px] uppercase tracking-wider ${
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {isPositive ? '+' : '-'}{movement.quantity} QTY
                        </Text>
                      </View>
                      <Text className="text-neutral-500 text-[10px] font-medium">
                        {new Date(movement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
