import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { triggerHaptic } from '@/lib/haptics';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ScanLine, 
  Search, 
  ChevronRight, 
  ShoppingBag,
  History,
  Activity,
  ClipboardCheck
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
  const [activeAudits, setActiveAudits] = useState<any[]>([]);
  
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
        recentMovementsRes,
        auditsRes
      ] = await Promise.all([
        supabase.from('sales').select('total').gte('created_at', isoToday),
        supabase.from('products').select('id, quantity, cost_price').eq('status', 'active'),
        supabase.from('products').select('id, name, sku, quantity, low_stock_threshold').eq('status', 'active').lte('quantity', 5).order('quantity', { ascending: true }).limit(5),
        supabase.from('sales').select('id, invoice_number, customer_name, total, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('stock_movements').select('id, type, quantity, created_at, products(name, sku)').order('created_at', { ascending: false }).limit(5),
        supabase.from('stock_audits').select('id, audit_number, scope, status').in('status', ['in_progress', 'pending_review']).order('created_at', { ascending: false }).limit(3)
      ]);

      if (salesRes.error) console.error('Sales fetch error:', salesRes.error);
      if (productsRes.error) console.error('Products fetch error:', productsRes.error);
      if (recentSalesRes.error) console.error('Recent sales fetch error:', recentSalesRes.error);

      if (!salesRes.error && salesRes.data) {
        setSalesCount(salesRes.data.length);
        setSalesTotal(salesRes.data.reduce((sum, sale: any) => sum + Number(sale.total || 0), 0));
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
          total: Number(s.total || 0),
          created_at: s.created_at
        })));
      }

      if (!recentMovementsRes.error && recentMovementsRes.data) {
        setRecentMovements(recentMovementsRes.data as any[]);
      }

      if (auditsRes?.data) {
        setActiveAudits(auditsRes.data);
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
    triggerHaptic('light');
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#09090B] items-center justify-center">
        <ActivityIndicator size="large" color="#C8A348" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View className="pb-4 pt-2 px-6 bg-[#09090B] border-b border-[#24242A]">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-3xl font-black tracking-tight">Overview</Text>
            <Text className="text-[#C8A348] text-xs mt-0.5 font-semibold uppercase tracking-wider">TEEKEH Store Performance</Text>
          </View>
          <View className="w-11 h-11 rounded-2xl bg-[#C8A348]/15 border border-[#C8A348]/30 items-center justify-center">
            <Activity size={22} color="#C8A348" />
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C8A348" />}
      >
        {/* Quick Actions Grid (One-Handed 3-Tap Rule) */}
        <View className="flex-row gap-3">
          <TouchableOpacity 
            onPress={() => router.replace('/scanner')}
            className="flex-1 bg-[#121214] border border-[#24242A] p-4 rounded-3xl"
          >
            <View className="w-12 h-12 bg-[#C8A348]/15 rounded-2xl items-center justify-center mb-3 border border-[#C8A348]/30">
              <ScanLine size={24} color="#C8A348" />
            </View>
            <Text className="text-white font-bold text-base tracking-tight">Scan & Sell</Text>
            <Text className="text-neutral-400 text-[11px] mt-0.5">POS Checkout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.replace('/lookup')}
            className="flex-1 bg-[#121214] border border-[#24242A] p-4 rounded-3xl"
          >
            <View className="w-12 h-12 bg-emerald-500/15 rounded-2xl items-center justify-center mb-3 border border-emerald-500/30">
              <Search size={24} color="#34d399" />
            </View>
            <Text className="text-white font-bold text-base tracking-tight">Product Lookup</Text>
            <Text className="text-neutral-400 text-[11px] mt-0.5">Stock & Price</Text>
          </TouchableOpacity>
        </View>

        {/* Low Stock Alert Banner */}
        {lowStockCount > 0 && (
          <TouchableOpacity 
            onPress={() => router.replace('/lookup')}
            className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-amber-500/20 rounded-full items-center justify-center">
                <AlertTriangle size={20} color="#fbbf24" />
              </View>
              <View>
                <Text className="text-amber-100 font-bold text-sm tracking-tight">{lowStockCount} Items Low in Stock</Text>
                <Text className="text-amber-400/80 text-[11px] mt-0.5">Tap to review & replenish</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#fbbf24" opacity={0.7} />
          </TouchableOpacity>
        )}

        {/* Stats Summary Card */}
        <View className="bg-[#121214] border border-[#24242A] rounded-3xl p-5">
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center gap-2">
              <TrendingUp size={18} color="#C8A348" />
              <Text className="text-white font-bold text-sm tracking-tight">Today's Revenue & Stock</Text>
            </View>
          </View>
          
          <View className="flex-row items-end justify-between mb-1">
            <Text className="text-neutral-400 font-medium text-xs">Total Sales Today</Text>
            <Text className="text-emerald-400 font-bold text-xs">+{salesCount} orders</Text>
          </View>
          <Text className="text-white text-4xl font-black tracking-tight">₦{salesTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
          
          <View className="h-[1px] bg-[#24242A] my-5" />
          
          <View className="flex-row items-end justify-between mb-1">
            <Text className="text-neutral-400 font-medium text-xs">Total Inventory Value</Text>
            <Text className="text-[#C8A348] font-bold text-xs">{activeProductsCount} active SKUs</Text>
          </View>
          <Text className="text-white text-3xl font-black tracking-tight">₦{totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
        </View>

        {/* Recent Sales Section */}
        <View className="bg-[#121214] border border-[#24242A] rounded-3xl overflow-hidden">
          <View className="p-4 border-b border-[#24242A] flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-xl bg-[#C8A348]/15 items-center justify-center border border-[#C8A348]/30">
                <ShoppingBag size={16} color="#C8A348" />
              </View>
              <Text className="text-white font-bold text-sm tracking-tight">Recent Transactions</Text>
            </View>
          </View>
          
          {recentSales.length === 0 ? (
            <View className="p-6 items-center justify-center">
              <Text className="text-neutral-500 font-medium text-xs">No sales recorded today.</Text>
            </View>
          ) : (
            <View>
              {recentSales.map((sale, index) => (
                <View 
                  key={sale.id} 
                  className={`p-4 flex-row items-center justify-between ${index !== recentSales.length - 1 ? 'border-b border-[#24242A]' : ''}`}
                >
                  <View>
                    <Text className="text-white font-semibold text-sm">{sale.invoice_number}</Text>
                    <Text className="text-neutral-400 text-xs mt-0.5">{sale.customer_name}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[#C8A348] font-bold text-sm tracking-tight">₦{sale.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
                    <Text className="text-neutral-500 text-[10px] mt-0.5 font-medium">
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Active Audits Section */}
        {activeAudits.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('impactLight');
              router.push('/audit');
            }}
            className="bg-[#121214] border border-[#C8A348]/40 rounded-3xl p-5"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-xl bg-[#C8A348]/20 items-center justify-center border border-[#C8A348]/40">
                  <ClipboardCheck size={16} color="#C8A348" />
                </View>
                <Text className="text-white font-bold text-sm tracking-tight">Active Stock Audit</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-[#C8A348] text-xs font-semibold">Tap to Scan</Text>
                <ChevronRight size={16} color="#C8A348" />
              </View>
            </View>
            {activeAudits.map((audit) => (
              <View key={audit.id} className="flex-row justify-between items-center bg-[#1A1A1E] p-3 rounded-2xl border border-[#2B2B32] mt-2">
                <View>
                  <Text className="text-white font-bold text-xs">{audit.audit_number}</Text>
                  <Text className="text-neutral-400 text-[10px] uppercase font-semibold mt-0.5">Scope: {audit.scope}</Text>
                </View>
                <View className="bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-full">
                  <Text className="text-amber-400 text-[10px] font-bold uppercase">{audit.status.replace('_', ' ')}</Text>
                </View>
              </View>
            ))}
          </TouchableOpacity>
        )}

        {/* Recent Stock Activity Section */}
        <View className="bg-[#121214] border border-[#24242A] rounded-3xl overflow-hidden mb-4">
          <View className="p-4 border-b border-[#24242A] flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-xl bg-emerald-500/15 items-center justify-center border border-emerald-500/30">
              <History size={16} color="#34d399" />
            </View>
            <Text className="text-white font-bold text-sm tracking-tight">Stock Movement Activity</Text>
          </View>
          
          {recentMovements.length === 0 ? (
            <View className="p-6 items-center justify-center">
              <Text className="text-neutral-500 font-medium text-xs">No recent stock movements.</Text>
            </View>
          ) : (
            <View>
              {recentMovements.map((movement, index) => {
                const isPositive = movement.type === 'stock_in' || movement.type === 'return';
                return (
                  <View 
                    key={movement.id} 
                    className={`p-4 flex-row items-center justify-between ${index !== recentMovements.length - 1 ? 'border-b border-[#24242A]' : ''}`}
                  >
                    <View className="flex-1 pr-4">
                      <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                        {movement.products?.name || 'Unknown Product'}
                      </Text>
                      <Text className="text-neutral-400 text-xs mt-0.5">
                        {movement.products?.sku || ''} • {movement.type.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                    <View className="items-end gap-1.5">
                      <View className={`px-2.5 py-1 rounded-full border ${
                        isPositive ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-red-500/15 border-red-500/30'
                      }`}>
                        <Text className={`font-extrabold text-[10px] uppercase tracking-wider ${
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
    </SafeAreaView>
  );
}
