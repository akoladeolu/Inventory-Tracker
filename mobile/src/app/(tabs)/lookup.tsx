import React, { useState } from 'react';
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
  FileText
} from 'lucide-react-native';

export default function ProductLookupScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [skuOrBarcode, setSkuOrBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any | null>(null);

  // Stock adjustment modal states
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);

  const { addItem: addToCart } = useCartStore();

  if (!permission) {
    return (
      <View className="flex-1 bg-[#0a0a0a] items-center justify-center p-6">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-[#0a0a0a] items-center justify-center p-6">
        <Text className="text-white text-lg text-center mb-6 font-semibold leading-relaxed">
          We need your permission to show the camera for barcode scanning
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-blue-600 px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-500/20"
        >
          <Text className="text-white font-bold text-base">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(100);
    await lookupProduct(data.trim(), 'barcode');
    setTimeout(() => setScanned(false), 2000);
  };

  const handleManualSearch = async () => {
    if (!skuOrBarcode.trim()) return;
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
        Alert.alert('Not Found', `No active product matches query: "${query}"`);
      } else {
        setProduct(data[0]);
        setShowScanner(false);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'An error occurred during lookup.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive number');
      return;
    }

    setUpdatingStock(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session not found');

      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
        
      if (dbUserError || !dbUser) {
        throw new Error('User profile not found in users table');
      }

      const previousQuantity = product.quantity || 0;
      const newQuantity = adjustType === 'in' ? previousQuantity + qty : previousQuantity - qty;
      
      if (newQuantity < 0) {
        Alert.alert('Error', 'Stock quantity cannot drop below 0.');
        setUpdatingStock(false);
        return;
      }

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

      Alert.alert('Success', `Stock successfully updated to ${newQuantity}!`);
      
      setProduct({ ...product, quantity: newQuantity });
      setShowAdjustModal(false);
      setAdjustQty('');
      setAdjustNotes('');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Adjustment Failed', err.message || 'Failed to apply stock update.');
    } finally {
      setUpdatingStock(false);
    }
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
    if (quantity <= threshold) return { label: 'Low Stock', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    return { label: 'In Stock', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={['top']}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View className="px-6 py-4 border-b border-white/5 bg-[#0a0a0a] flex-row justify-between items-center">
        <View>
          <Text className="text-white text-2xl font-extrabold tracking-tight">Product Lookup</Text>
          <Text className="text-neutral-400 text-xs mt-1 font-medium">Quickly query details & manage stock</Text>
        </View>
        {!showScanner && (
          <TouchableOpacity
            onPress={() => { setProduct(null); setShowScanner(true); }}
            className="flex-row items-center bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20"
          >
            <ScanLine size={16} color="#60a5fa" />
            <Text className="text-blue-400 font-bold text-xs ml-1.5">Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Container */}
      <View className="flex-1">
        {showScanner ? (
          <View className="flex-1">
            {/* Camera Scanner View */}
            <View className="h-72 relative bg-black border-b border-white/5">
              <CameraView
                style={StyleSheet.absoluteFill}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
                }}
              />
              <View className="absolute inset-0 items-center justify-center pointer-events-none">
                <View className="w-56 h-24 border-2 border-dashed border-blue-500/60 rounded-2xl bg-blue-500/10" />
                <Text className="text-white text-[10px] bg-black/60 border border-white/10 px-4 py-2 rounded-full mt-4 font-semibold tracking-wide backdrop-blur-md">
                  Align product barcode within frame
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowScanner(false)}
                className="absolute top-4 right-4 bg-black/60 p-3 rounded-full border border-white/10 backdrop-blur-md"
              >
                <Keyboard size={20} color="#60a5fa" />
              </TouchableOpacity>
            </View>

            {/* Manual Search Form */}
            <View className="p-6 flex-1 bg-[#0a0a0a] justify-center">
              <Text className="text-neutral-500 text-center text-xs font-semibold uppercase tracking-widest mb-4">Or Search Manually</Text>
              <View className="flex-row gap-3">
                <TextInput
                  value={skuOrBarcode}
                  onChangeText={setSkuOrBarcode}
                  placeholder="Type SKU, barcode or name..."
                  placeholderTextColor="#525252"
                  autoCorrect={false}
                  className="flex-1 bg-[#121212] border border-white/5 text-white rounded-2xl px-5 py-3.5 font-semibold text-base"
                />
                <TouchableOpacity
                  onPress={handleManualSearch}
                  disabled={loading}
                  className="bg-blue-600 px-6 rounded-2xl items-center justify-center shadow-xl shadow-blue-500/20"
                >
                  {loading ? <ActivityIndicator size="small" color="white" /> : <Search size={20} color="white" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
            {product && (
              <>
                {/* Product Card Details */}
                <View className="bg-[#121212] border border-white/5 rounded-[32px] p-6 shadow-2xl">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-1 pr-4">
                      <Text className="text-white text-2xl font-extrabold tracking-tight mb-1">{product.name}</Text>
                      <Text className="text-neutral-500 text-xs font-mono uppercase tracking-widest">SKU: {product.sku}</Text>
                    </View>
                    {/* Status Badge */}
                    <View className={`px-3 py-1.5 rounded-full border ${
                      getStockStatus(product.quantity || 0, product.low_stock_threshold || 10).bg
                    }`}>
                      <Text className={`font-extrabold text-[10px] uppercase tracking-wide ${
                        getStockStatus(product.quantity || 0, product.low_stock_threshold || 10).color
                      }`}>
                        {getStockStatus(product.quantity || 0, product.low_stock_threshold || 10).label}
                      </Text>
                    </View>
                  </View>

                  {/* Attributes Section */}
                  <View className="bg-black/50 border border-white/5 rounded-2xl p-4 gap-4 mb-6">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <Layers size={18} color="#737373" />
                        <Text className="text-neutral-400 text-xs font-semibold">Category</Text>
                      </View>
                      <Text className="text-white text-xs font-bold">{product.categories?.name || 'Uncategorized'}</Text>
                    </View>

                    {product.brands?.name && (
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <Tag size={18} color="#737373" />
                          <Text className="text-neutral-400 text-xs font-semibold">Brand</Text>
                        </View>
                        <Text className="text-white text-xs font-bold">{product.brands.name}</Text>
                      </View>
                    )}

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <DollarSign size={18} color="#737373" />
                        <Text className="text-neutral-400 text-xs font-semibold">Price</Text>
                      </View>
                      <Text className="text-blue-400 text-base font-extrabold">
                        ₦{parseFloat(product.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <Package size={18} color="#737373" />
                        <Text className="text-neutral-400 text-xs font-semibold">Current Stock</Text>
                      </View>
                      <Text className="text-white text-sm font-extrabold">{product.quantity ?? 0} units</Text>
                    </View>
                  </View>

                  {/* Product Description */}
                  {product.description ? (
                    <View className="mb-2 bg-black/50 border border-white/5 rounded-2xl p-4">
                      <Text className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-2">Description</Text>
                      <Text className="text-neutral-300 text-sm leading-relaxed">{product.description}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Operations Section */}
                <View className="gap-4">
                  <Text className="text-neutral-500 font-bold text-[10px] uppercase tracking-widest px-2">Quick Actions</Text>

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
                    className="bg-blue-600 rounded-2xl py-4 flex-row items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
                  >
                    <CheckCircle size={20} color="white" />
                    <Text className="text-white font-bold text-base tracking-wide">Add to POS Cart</Text>
                  </TouchableOpacity>

                  {/* Stock Adjustments (In / Out) */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => { setAdjustType('in'); setShowAdjustModal(true); }}
                      className="flex-1 bg-[#121212] border border-emerald-500/20 rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
                    >
                      <Plus size={18} color="#34d399" />
                      <Text className="text-emerald-400 font-bold text-sm">Stock In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => { setAdjustType('out'); setShowAdjustModal(true); }}
                      className="flex-1 bg-[#121212] border border-red-500/20 rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
                    >
                      <Minus size={18} color="#f87171" />
                      <Text className="text-red-400 font-bold text-sm">Stock Out</Text>
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
            <View className="w-full bg-[#121212] border border-white/10 rounded-[32px] p-6 shadow-2xl">
              <View className="flex-row items-center gap-3 mb-6">
                <View className={`w-10 h-10 rounded-full items-center justify-center border ${
                  adjustType === 'in' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <Plus size={20} color={adjustType === 'in' ? '#34d399' : '#f87171'} />
                </View>
                <View>
                  <Text className="text-white font-extrabold text-lg tracking-tight">
                    Stock Adjustment
                  </Text>
                  <Text className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${adjustType === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {adjustType === 'in' ? 'Stock In' : 'Stock Out'}
                  </Text>
                </View>
              </View>

              <View className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-6">
                <Text className="text-neutral-500 text-[10px] font-bold mb-3 uppercase tracking-widest">Quantity</Text>
                <TextInput
                  value={adjustQty}
                  onChangeText={setAdjustQty}
                  placeholder="Enter amount..."
                  placeholderTextColor="#525252"
                  keyboardType="number-pad"
                  className="bg-black border border-white/5 text-white font-bold text-base rounded-xl px-4 py-3.5"
                />

                <View className="flex-row items-center gap-2 mt-5 mb-3">
                  <FileText size={16} color="#737373" />
                  <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Reason / Notes</Text>
                </View>
                <TextInput
                  value={adjustNotes}
                  onChangeText={setAdjustNotes}
                  placeholder="e.g. Damage, Intake"
                  placeholderTextColor="#525252"
                  className="bg-black border border-white/5 text-white text-sm font-medium rounded-xl px-4 py-3.5"
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => { setShowAdjustModal(false); setAdjustQty(''); setAdjustNotes(''); }}
                  disabled={updatingStock}
                  className="flex-1 bg-black border border-white/5 rounded-2xl py-4 items-center justify-center"
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
                    <Text className="text-white font-bold text-sm tracking-wide">Apply Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}
