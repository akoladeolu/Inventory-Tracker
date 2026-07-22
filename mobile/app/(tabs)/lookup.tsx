import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Vibration,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '@/lib/supabase';
import { formatAppError } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { 
  ScanLine, 
  Keyboard, 
  Search, 
  Layers, 
  Tag, 
  DollarSign, 
  Package, 
  Plus, 
  Minus,
  CheckCircle,
  FileText,
  Zap,
  ZapOff
} from 'lucide-react-native';

import { useIsFocused } from 'expo-router';
import { triggerHaptic } from '@/lib/haptics';
import { FeedbackModal } from '@/components/ui/feedback-modal';

export default function ProductLookupScreen() {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [enableTorch, setEnableTorch] = useState(false);
  const [skuOrBarcode, setSkuOrBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any | null>(null);

  // Brand Feedback Modal state
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    actionText?: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showBrandAlert = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    actionText = 'Got It'
  ) => {
    setFeedback({ visible: true, type, title, message, actionText });
  };

  // Stock adjustment modal states
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);

  const { addItem: addToCart } = useCartStore();

  useEffect(() => {
    if (isFocused) {
      setScanned(false);
    }
  }, [isFocused]);

  if (!permission) {
    return (
      <View className="flex-1 bg-[#09090B] items-center justify-center p-6">
        <ActivityIndicator size="large" color="#C8A348" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-[#09090B] items-center justify-center p-6">
        <Text className="text-white text-lg text-center mb-6 font-semibold leading-relaxed">
          We need camera permission for product barcode scanning
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-[#C8A348] px-6 py-3.5 rounded-2xl shadow-xl shadow-[#C8A348]/20"
        >
          <Text className="text-[#09090B] font-extrabold text-base">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    triggerHaptic('medium');

    try {
      await lookupProduct(data.trim(), 'barcode');
    } catch (err: any) {
      console.error(err);
    } finally {
      setTimeout(() => setScanned(false), 1500);
    }
  };

  const handleManualSearch = async () => {
    if (!skuOrBarcode.trim()) {
      triggerHaptic('warning');
      showBrandAlert('warning', 'Input Required ⚠️', 'Please enter a product SKU, barcode or name to search.');
      return;
    }
    triggerHaptic('light');
    await lookupProduct(skuOrBarcode.trim(), 'search');
  };

  const lookupProduct = async (query: string, type: 'barcode' | 'search') => {
    setLoading(true);
    setProduct(null);

    try {
      let queryBuilder = supabase
        .from('products')
        .select(`
          *,
          categories (name),
          brands (name)
        `);

      if (type === 'barcode') {
        queryBuilder = queryBuilder.eq('barcode', query);
      } else {
        queryBuilder = queryBuilder.or(`sku.eq.${query.toUpperCase()},barcode.eq.${query},name.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      if (!data || data.length === 0) {
        triggerHaptic('error');
        showBrandAlert('error', 'Product Not Found 🔍', `No active product matches: "${query}". Please verify the SKU or barcode and try again.`);
      } else {
        triggerHaptic('success');
        setProduct(data[0]);
        setShowScanner(false);
      }
    } catch (err: any) {
      console.error(err);
      triggerHaptic('error');
      showBrandAlert('error', 'Lookup Failed ❌', formatAppError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      triggerHaptic('warning');
      showBrandAlert('warning', 'Invalid Quantity ⚠️', 'Please enter a valid positive number for stock quantity.');
      return;
    }

    const previousQuantity = product.quantity || 0;

    if (adjustType === 'out' && qty > previousQuantity) {
      triggerHaptic('warning');
      showBrandAlert(
        'warning',
        'Stock Reduction Exceeded ⚠️', 
        `Cannot remove ${qty} units. Current available stock is only ${previousQuantity} unit(s).`
      );
      return;
    }

    setUpdatingStock(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth session not found');

      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
        
      if (dbUserError || !dbUser) {
        throw new Error('User profile not found in database');
      }

      const newQuantity = adjustType === 'in' ? previousQuantity + qty : previousQuantity - qty;

      const { error: prodError } = await supabase
        .from('products')
        .update({ quantity: newQuantity, updated_at: new Date() })
        .eq('id', product.id);

      if (prodError) throw prodError;

      const { error: invError } = await supabase.from('inventory').upsert(
        { product_id: product.id, quantity: newQuantity, updated_at: new Date() },
        { onConflict: 'product_id' }
      );
      if (invError) throw invError;

      const { error: smError } = await supabase.from('stock_movements').insert({
        product_id: product.id,
        type: adjustType === 'in' ? 'stock_in' : 'stock_out',
        quantity: qty,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        user_id: dbUser.id,
        notes: adjustNotes.trim() || (adjustType === 'in' ? 'Stock In intake' : 'Stock Out adjustment')
      });

      if (smError) throw smError;

      const actionTitle = adjustType === 'in' ? 'Stock In Successful ✅' : 'Stock Out Successful ✅';
      const actionDetails = adjustType === 'in' 
        ? `Successfully added ${qty} unit(s) of "${product.name}".\n\nPrevious Stock: ${previousQuantity} units\nNew Stock Level: ${newQuantity} units`
        : `Successfully removed ${qty} unit(s) of "${product.name}".\n\nPrevious Stock: ${previousQuantity} units\nNew Stock Level: ${newQuantity} units`;

      triggerHaptic('success');
      showBrandAlert('success', actionTitle, actionDetails);
      
      setProduct({ ...product, quantity: newQuantity });
      setShowAdjustModal(false);
      setAdjustQty('');
      setAdjustNotes('');
    } catch (err: any) {
      console.error(err);
      triggerHaptic('error');
      showBrandAlert('error', 'Stock Movement Failed ❌', formatAppError(err));
    } finally {
      setUpdatingStock(false);
    }
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' };
    if (quantity <= threshold) return { label: 'Low Stock', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
    return { label: 'In Stock', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' };
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top']}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View className="px-6 py-4 border-b border-[#24242A] bg-[#09090B] flex-row justify-between items-center">
        <View>
          <Text className="text-white text-2xl font-black tracking-tight">Product Lookup</Text>
          <Text className="text-[#C8A348] text-xs mt-0.5 font-semibold">Query stock & record movements</Text>
        </View>
        {!showScanner && (
          <TouchableOpacity
            onPress={() => { setProduct(null); setShowScanner(true); }}
            className="flex-row items-center bg-[#C8A348]/15 px-4 py-2 rounded-2xl border border-[#C8A348]/30"
          >
            <ScanLine size={16} color="#C8A348" />
            <Text className="text-[#C8A348] font-bold text-xs ml-1.5">Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Container */}
      <View className="flex-1">
        {showScanner && isFocused ? (
          <View className="flex-1">
            {/* Camera Scanner View */}
            <View className="h-72 relative bg-black border-b border-[#24242A]">
              <CameraView
                key={isFocused ? 'focused-lookup-cam' : 'unfocused-lookup-cam'}
                style={StyleSheet.absoluteFill}
                enableTorch={enableTorch}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
                }}
              />
              <View className="absolute inset-0 items-center justify-center pointer-events-none">
                <View className="w-56 h-24 border-2 border-dashed border-[#C8A348] rounded-2xl bg-[#C8A348]/10" />
                <Text className="text-white text-[10px] bg-black/75 border border-white/10 px-4 py-2 rounded-full mt-4 font-semibold tracking-wide backdrop-blur-md">
                  Align product barcode within frame
                </Text>
              </View>

              {/* Torch toggle */}
              <TouchableOpacity
                onPress={() => setEnableTorch(!enableTorch)}
                className="absolute top-4 left-4 bg-black/75 p-3 rounded-full border border-white/10 backdrop-blur-md"
              >
                {enableTorch ? <Zap size={18} color="#C8A348" /> : <ZapOff size={18} color="#71717A" />}
              </TouchableOpacity>

              {/* Manual keyboard toggle */}
              <TouchableOpacity
                onPress={() => setShowScanner(false)}
                className="absolute top-4 right-4 bg-black/75 p-3 rounded-full border border-white/10 backdrop-blur-md"
              >
                <Keyboard size={18} color="#C8A348" />
              </TouchableOpacity>
            </View>

            {/* Manual Search Form */}
            <View className="p-6 flex-1 bg-[#09090B] justify-center">
              <Text className="text-neutral-400 text-center text-xs font-bold uppercase tracking-widest mb-4">Or Search Manually</Text>
              <View className="flex-row gap-3">
                <TextInput
                  value={skuOrBarcode}
                  onChangeText={setSkuOrBarcode}
                  placeholder="SKU, barcode, or product name..."
                  placeholderTextColor="#52525B"
                  autoCorrect={false}
                  className="flex-1 bg-[#121214] border border-[#27272A] text-white rounded-2xl px-5 py-3.5 font-semibold text-base"
                />
                <TouchableOpacity
                  onPress={handleManualSearch}
                  disabled={loading}
                  className="bg-[#C8A348] px-6 rounded-2xl items-center justify-center shadow-xl shadow-[#C8A348]/20"
                >
                  {loading ? <ActivityIndicator size="small" color="#09090B" /> : <Search size={20} color="#09090B" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
            {product && (
              <>
                {/* Product Card Details */}
                <View className="bg-[#121214] border border-[#24242A] rounded-[32px] p-6 shadow-2xl">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-1 pr-4">
                      <Text className="text-white text-2xl font-black tracking-tight mb-1">{product.name}</Text>
                      <Text className="text-[#C8A348] text-xs font-mono uppercase tracking-widest font-bold">SKU: {product.sku}</Text>
                    </View>
                    {/* Status Badge */}
                    <View className={`px-3 py-1.5 rounded-full border ${
                      getStockStatus(product.quantity || 0, product.low_stock_threshold || 10).bg
                    }`}>
                      <Text className={`font-black text-[10px] uppercase tracking-wide ${
                        getStockStatus(product.quantity || 0, product.low_stock_threshold || 10).color
                      }`}>
                        {getStockStatus(product.quantity || 0, product.low_stock_threshold || 10).label}
                      </Text>
                    </View>
                  </View>

                  {/* Attributes Section */}
                  <View className="bg-[#09090B] border border-[#24242A] rounded-2xl p-4 gap-4 mb-6">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <Layers size={18} color="#71717A" />
                        <Text className="text-neutral-400 text-xs font-semibold">Category</Text>
                      </View>
                      <Text className="text-white text-xs font-bold">{product.categories?.name || 'Uncategorized'}</Text>
                    </View>

                    {product.brands?.name && (
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <Tag size={18} color="#71717A" />
                          <Text className="text-neutral-400 text-xs font-semibold">Brand</Text>
                        </View>
                        <Text className="text-white text-xs font-bold">{product.brands.name}</Text>
                      </View>
                    )}

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <DollarSign size={18} color="#71717A" />
                        <Text className="text-neutral-400 text-xs font-semibold">Selling Price</Text>
                      </View>
                      <Text className="text-[#C8A348] text-base font-black">
                        ₦{parseFloat(product.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <Package size={18} color="#71717A" />
                        <Text className="text-neutral-400 text-xs font-semibold">Current Stock</Text>
                      </View>
                      <Text className="text-white text-sm font-black">{product.quantity ?? 0} units</Text>
                    </View>
                  </View>

                  {/* Product Description */}
                  {product.description ? (
                    <View className="mb-2 bg-[#09090B] border border-[#24242A] rounded-2xl p-4">
                      <Text className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest mb-2">Description</Text>
                      <Text className="text-neutral-300 text-sm leading-relaxed">{product.description}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Operations Section */}
                <View className="gap-3">
                  <Text className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest px-2">Actions</Text>

                  {/* Add to POS Cart */}
                  <TouchableOpacity
                    onPress={() => {
                      addToCart({
                        id: product.id,
                        name: product.name,
                        sku: product.sku,
                        price: Number(product.selling_price || 0),
                        stock: product.quantity,
                        image: product.image_url
                      });
                      Alert.alert('Cart Updated', `"${product.name}" added to sales checkout cart!`);
                    }}
                    className="bg-[#C8A348] rounded-2xl py-4 flex-row items-center justify-center gap-2.5 shadow-xl shadow-[#C8A348]/20"
                  >
                    <CheckCircle size={20} color="#09090B" />
                    <Text className="text-[#09090B] font-extrabold text-base tracking-wide">Add to POS Cart</Text>
                  </TouchableOpacity>

                  {/* Stock Adjustments (In / Out) */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => { setAdjustType('in'); setShowAdjustModal(true); }}
                      className="flex-1 bg-[#121214] border border-emerald-500/30 rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
                    >
                      <Plus size={18} color="#34d399" />
                      <Text className="text-emerald-400 font-extrabold text-sm">Stock In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => { setAdjustType('out'); setShowAdjustModal(true); }}
                      className="flex-1 bg-[#121214] border border-red-500/30 rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
                    >
                      <Minus size={18} color="#f87171" />
                      <Text className="text-red-400 font-extrabold text-sm">Stock Out</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        )}
      </View>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <View className="absolute inset-0 bg-black/90 items-center justify-center p-4 z-50 backdrop-blur-xl">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="w-full">
            <View className="w-full bg-[#121214] border border-[#24242A] rounded-[32px] p-6 shadow-2xl">
              <View className="flex-row items-center gap-3 mb-6">
                <View className={`w-10 h-10 rounded-2xl items-center justify-center border ${
                  adjustType === 'in' ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-red-500/15 border-red-500/30'
                }`}>
                  <Plus size={20} color={adjustType === 'in' ? '#34d399' : '#f87171'} />
                </View>
                <View>
                  <Text className="text-white font-black text-lg tracking-tight">
                    Record Stock Movement
                  </Text>
                  <Text className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${adjustType === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {adjustType === 'in' ? 'Stock In (Intake)' : 'Stock Out (Reduction)'}
                  </Text>
                </View>
              </View>

              <View className="bg-[#09090B] border border-[#24242A] rounded-2xl p-4 mb-6">
                <Text className="text-neutral-400 text-[10px] font-bold mb-3 uppercase tracking-widest">Quantity</Text>
                <TextInput
                  value={adjustQty}
                  onChangeText={setAdjustQty}
                  placeholder="Enter unit quantity..."
                  placeholderTextColor="#52525B"
                  keyboardType="number-pad"
                  className="bg-[#121214] border border-[#27272A] text-white font-bold text-base rounded-xl px-4 py-3.5"
                />

                <View className="flex-row items-center gap-2 mt-5 mb-3">
                  <FileText size={16} color="#71717A" />
                  <Text className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Audit Reason / Notes</Text>
                </View>
                <TextInput
                  value={adjustNotes}
                  onChangeText={setAdjustNotes}
                  placeholder="e.g. New stock arrival, Damaged unit"
                  placeholderTextColor="#52525B"
                  className="bg-[#121214] border border-[#27272A] text-white text-sm font-medium rounded-xl px-4 py-3.5"
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => { setShowAdjustModal(false); setAdjustQty(''); setAdjustNotes(''); }}
                  disabled={updatingStock}
                  className="flex-1 bg-[#09090B] border border-[#27272A] rounded-2xl py-4 items-center justify-center"
                >
                  <Text className="text-neutral-400 font-bold text-sm">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStockAdjustment}
                  disabled={updatingStock}
                  className={`flex-1 rounded-2xl py-4 items-center justify-center shadow-xl ${
                    adjustType === 'in' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-red-600 shadow-red-500/20'
                  }`}
                >
                  {updatingStock ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-extrabold text-sm tracking-wide">Save Movement</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Brand Feedback Dialog */}
      <FeedbackModal
        visible={feedback.visible}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        actionText={feedback.actionText}
        onClose={() => setFeedback({ ...feedback, visible: false })}
      />
    </SafeAreaView>
  );
}
