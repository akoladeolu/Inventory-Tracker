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
import { useCartStore } from '@/store/useCartStore';
import { 
  LogOut, 
  Trash2, 
  Plus, 
  Minus, 
  ScanLine, 
  Keyboard, 
  ShoppingBag, 
  Camera, 
  User, 
  Phone, 
  Tag 
} from 'lucide-react-native';

export default function SalesScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [manualSku, setManualSku] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'mobile'>('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userName, setUserName] = useState('');
  
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [scannerMode, setScannerMode] = useState<'product' | 'coupon'>('product');

  // Local state for checkout details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const {
    items: cart,
    addItem: addToCart,
    updateQuantity,
    removeItem: removeFromCart,
    clearCart,
    getCartTotal
  } = useCartStore();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email || 'User');
      }
    };
    fetchUser();
  }, []);

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
          Camera permission is required for barcode scanning
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-blue-600 px-6 py-3.5 rounded-2xl"
        >
          <Text className="text-white font-bold text-base">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => supabase.auth.signOut() }
      ]
    );
  };

  const subtotal = getCartTotal();

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = subtotal * (parseFloat(appliedCoupon.discount_value) / 100);
      if (appliedCoupon.max_discount_amount && discountAmount > parseFloat(appliedCoupon.max_discount_amount)) {
        discountAmount = parseFloat(appliedCoupon.max_discount_amount);
      }
    } else {
      discountAmount = parseFloat(appliedCoupon.discount_value);
    }
  }

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(100);

    if (scannerMode === 'product') {
      await handleProductScan(data);
    } else {
      await handleCouponScan(data);
    }
    
    setTimeout(() => setScanned(false), 1500);
  };

  const handleProductScan = async (data: string) => {
    setLoading(true);
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', data.trim())
        .eq('status', 'active')
        .single();

      if (error || !product) {
        Alert.alert('Not Found', `Product with barcode "${data}" was not found or is archived.`);
      } else {
        addToCart({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.selling_price || 0),
          stock: product.quantity,
          image: product.image_url
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred while fetching the product.');
    } finally {
      setLoading(false);
    }
  };

  const handleCouponScan = async (data: string) => {
    const code = data.trim().toUpperCase();
    setCouponCode(code);
    setShowScanner(false);
    setShowPaymentModal(true);
    await applyCouponCode(code);
  };

  const applyCouponCode = async (codeToApply: string) => {
    if (!codeToApply) return;
    setIsApplyingCoupon(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', codeToApply.toUpperCase())
        .eq('active', true)
        .single();

      if (error || !coupon) {
        Alert.alert('Invalid', 'Invalid or inactive coupon code');
        setAppliedCoupon(null);
        return;
      }

      if (coupon.min_purchase_amount && subtotal < parseFloat(coupon.min_purchase_amount)) {
        Alert.alert('Invalid', `Minimum purchase of ₦${coupon.min_purchase_amount} required`);
        setAppliedCoupon(null);
        return;
      }

      if (coupon.end_date && new Date(coupon.end_date) < new Date()) {
        Alert.alert('Expired', 'This coupon has expired');
        setAppliedCoupon(null);
        return;
      }

      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        Alert.alert('Limit Reached', 'This coupon has reached its usage limit');
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(coupon);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to validate coupon');
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualSku.trim()) return;
    setLoading(true);

    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', manualSku.trim().toUpperCase())
        .eq('status', 'active')
        .single();

      if (error || !product) {
        Alert.alert('Not Found', `Product with SKU "${manualSku.trim().toUpperCase()}" was not found or is archived.`);
      } else {
        addToCart({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.selling_price || 0),
          stock: product.quantity,
          image: product.image_url
        });
        setManualSku('');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred while fetching the product.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth user session not found');

      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (dbUserError || !dbUser) {
        throw new Error('Associated profile not found in users table');
      }

      const total = Math.max(0, subtotal - discountAmount);
      
      const mappedItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }));

      // Convert items to JSON for the RPC
      const itemsJson = JSON.stringify(mappedItems);

      const { data: result, error: rpcError } = await supabase.rpc('create_sale_transaction', {
        p_customer_name: customerName || 'Walk-in Customer',
        p_customer_phone: customerPhone || '',
        p_subtotal: subtotal,
        p_discount: discountAmount,
        p_total: total,
        p_payment_method: paymentMethod,
        p_sale_items: itemsJson
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      Alert.alert('Success', `Sale completed! Transaction ID: ${result}`);
      clearCart();
      setCustomerName('');
      setCustomerPhone('');
      setCouponCode('');
      setAppliedCoupon(null);
      setScannerMode('product');
      setShowPaymentModal(false);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Checkout Failed', err.message || 'An error occurred during checkout.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={['top']}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-white/5 bg-[#0a0a0a]">
        <View>
          <Text className="text-white text-2xl font-extrabold tracking-tight">Checkout POS</Text>
          <Text className="text-neutral-400 text-xs mt-1 font-medium truncate max-w-[200px]">{userName}</Text>
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full items-center justify-center"
        >
          <LogOut size={18} color="#f87171" />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        {/* Top Scanner / Manual Input Area */}
        {showScanner ? (
          <View className="h-64 relative bg-black border-b border-white/5">
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={scanned ? undefined : handleScan}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
              }}
            />
            {/* Target overlay */}
            <View className="absolute inset-0 items-center justify-center pointer-events-none">
              <View className="w-56 h-24 border-2 border-dashed border-blue-500/70 rounded-2xl bg-blue-500/10" />
              <Text className="text-white text-xs bg-black/60 border border-white/10 px-4 py-2 rounded-full mt-4 font-semibold tracking-wide backdrop-blur-md">
                {scannerMode === 'product' ? 'Align barcode within frame' : 'Align QR code'}
              </Text>
            </View>
            {/* Toggle button */}
            <TouchableOpacity
              onPress={() => setShowScanner(false)}
              className="absolute top-4 right-4 bg-black/60 p-3 rounded-full border border-white/10 backdrop-blur-md"
            >
              <Keyboard size={20} color="#60a5fa" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="p-5 bg-[#121212] border-b border-white/5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-neutral-400 font-medium text-xs uppercase tracking-widest">Manual Entry</Text>
              <TouchableOpacity
                onPress={() => setShowScanner(true)}
                className="flex-row items-center bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20"
              >
                <ScanLine size={14} color="#60a5fa" />
                <Text className="text-blue-400 font-bold text-xs ml-1.5">Scanner</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3">
              <TextInput
                value={manualSku}
                onChangeText={setManualSku}
                placeholder="Enter product SKU"
                placeholderTextColor="#525252"
                autoCapitalize="characters"
                autoCorrect={false}
                className="flex-1 bg-black border border-white/10 text-white rounded-2xl px-5 py-3.5 font-semibold text-base"
              />
              <TouchableOpacity
                onPress={handleManualAdd}
                disabled={loading}
                className="bg-blue-600 px-6 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20"
              >
                {loading ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-bold text-base">Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cart Item List */}
        <View className="flex-1 bg-[#0a0a0a]">
          <View className="flex-row justify-between items-center px-6 py-3 bg-[#121212] border-b border-white/5">
            <Text className="text-neutral-500 font-medium text-[10px] uppercase tracking-widest">Cart Items</Text>
            <Text className="text-blue-400 font-semibold text-xs">{cart.length} items</Text>
          </View>

          {cart.length === 0 ? (
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} className="px-6">
              <View className="w-20 h-20 bg-neutral-900 rounded-full border border-white/5 items-center justify-center mb-4">
                <ShoppingBag size={32} color="#404040" />
              </View>
              <Text className="text-neutral-400 text-sm text-center font-medium max-w-[240px] leading-relaxed">
                Scan barcodes or enter SKUs manually to add items.
              </Text>
            </ScrollView>
          ) : (
            <ScrollView className="px-4 pt-4">
              {cart.map((item) => (
                <View key={item.id} className="flex-row items-center justify-between p-4 bg-[#121212] border border-white/5 rounded-3xl mb-3">
                  <View className="flex-1 pr-3">
                    <Text className="text-white font-bold text-sm" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-neutral-500 text-[10px] font-mono mt-1 uppercase tracking-wider">
                      {item.sku}
                    </Text>
                    <Text className="text-blue-400 font-bold text-base mt-2">
                      ₦{item.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <View className="flex-row items-center bg-black border border-white/5 rounded-2xl px-1.5 py-1.5 mr-3">
                      <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 bg-[#1a1a1a] rounded-xl">
                        <Minus size={14} color="white" />
                      </TouchableOpacity>
                      <Text className="text-white font-extrabold px-4 text-sm">{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 bg-[#1a1a1a] rounded-xl">
                        <Plus size={14} color="white" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      onPress={() => removeFromCart(item.id)} 
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl"
                    >
                      <Trash2 size={16} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Cart Total Summary / Checkout Footer */}
        {cart.length > 0 && (
          <View className="p-5 bg-[#121212] border-t border-white/5">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-neutral-400 font-medium text-xs uppercase tracking-widest">Subtotal</Text>
              <Text className="text-white font-extrabold text-2xl tracking-tight">₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowPaymentModal(true)}
              className="w-full bg-blue-600 rounded-2xl py-4 items-center justify-center shadow-xl shadow-blue-500/20"
            >
              <Text className="text-white font-bold text-base">Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Payment Selection Modal */}
      {showPaymentModal && (
        <View className="absolute inset-0 bg-black/90 items-center justify-center p-4 z-50 backdrop-blur-xl">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="w-full">
            <ScrollView className="w-full max-h-[85vh]" contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
              <View className="w-full bg-[#121212] border border-white/10 rounded-[32px] p-6 shadow-2xl">
                
                {/* Close Button / Panel Header */}
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-white font-bold text-xl tracking-tight">Checkout</Text>
                  <TouchableOpacity onPress={() => setShowPaymentModal(false)}           className="w-8 h-8 bg-white/5 rounded-full items-center justify-center border border-white/5">
                    <Text className="text-neutral-400 font-bold text-xs">✕</Text>
                  </TouchableOpacity>
                </View>

                <View className="gap-5">
                  {/* Customer Info Section */}
                  <View>
                    <Text className="text-neutral-500 font-medium text-[10px] uppercase tracking-widest mb-3">Customer Details</Text>
                    <View className="gap-3">
                      <View className="flex-row items-center bg-black border border-white/5 rounded-2xl px-4">
                        <User size={16} color="#737373" />
                        <TextInput
                          value={customerName}
                          onChangeText={setCustomerName}
                          placeholder="Name (Optional)"
                          placeholderTextColor="#525252"
                          className="flex-1 text-white text-sm px-3 py-3.5 font-medium"
                        />
                      </View>
                      <View className="flex-row items-center bg-black border border-white/5 rounded-2xl px-4">
                        <Phone size={16} color="#737373" />
                        <TextInput
                          value={customerPhone}
                          onChangeText={setCustomerPhone}
                          placeholder="Phone (Optional)"
                          placeholderTextColor="#525252"
                          keyboardType="phone-pad"
                          className="flex-1 text-white text-sm px-3 py-3.5 font-medium"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Coupon Code Section */}
                  <View>
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-neutral-500 font-medium text-[10px] uppercase tracking-widest">Discount</Text>
                      {!appliedCoupon && (
                        <TouchableOpacity onPress={() => { setShowPaymentModal(false); setScannerMode('coupon'); setShowScanner(true); }} className="flex-row items-center gap-1.5">
                          <Camera size={12} color="#fbbf24" />
                          <Text className="text-amber-400 text-[10px] font-bold uppercase tracking-wide">Scan QR</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View className="flex-row gap-3">
                      <View className="flex-1 flex-row items-center bg-black border border-white/5 rounded-2xl px-4">
                        <Tag size={16} color="#737373" />
                        <TextInput
                          value={couponCode}
                          onChangeText={setCouponCode}
                          placeholder="Promo Code"
                          placeholderTextColor="#525252"
                          autoCapitalize="characters"
                          editable={!appliedCoupon}
                          className="flex-1 text-white text-sm px-3 py-3.5 font-bold tracking-widest"
                        />
                      </View>
                      {appliedCoupon ? (
                        <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponCode(''); }}                         className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 justify-center">
                          <Text className="text-red-400 text-xs font-bold">Remove</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => applyCouponCode(couponCode)} disabled={!couponCode || isApplyingCoupon}                         className="bg-white/5 border border-white/5 rounded-2xl px-5 justify-center">
                          {isApplyingCoupon ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-xs font-bold">Apply</Text>}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Payment Methods */}
                  <View>
                    <Text className="text-neutral-500 font-medium text-[10px] uppercase tracking-widest mb-3">Payment Method</Text>
                    <View className="flex-row flex-wrap gap-3">
                      {(['cash', 'card', 'transfer', 'mobile'] as const).map((method) => {
                        const isSelected = paymentMethod === method;
                        return (
                          <TouchableOpacity
                            key={method}
                            onPress={() => setPaymentMethod(method)}
                            className={`flex-1 min-w-[45%] flex-row items-center justify-between p-4 rounded-2xl border ${
                              isSelected
                                ? 'bg-blue-500/10 border-blue-500/50'
                                : 'bg-black border-white/5'
                            }`}
                          >
                            <Text className={`capitalize font-bold text-sm tracking-wide ${isSelected ? 'text-blue-400' : 'text-neutral-300'}`}>
                              {method}
                            </Text>
                            <View className={`w-4 h-4 rounded-full border-2 items-center justify-center ${
                              isSelected ? 'border-blue-500' : 'border-neutral-700'
                            }`}>
                              {isSelected && <View className="w-2 h-2 bg-blue-500 rounded-full" />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Checkout Summary */}
                  <View className="bg-black border border-white/5 rounded-2xl p-5 mt-2">
                    <View className="flex-row justify-between mb-3">
                      <Text className="text-neutral-400 text-xs font-medium">Subtotal</Text>
                      <Text className="text-neutral-300 text-xs font-bold">₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
                    </View>

                    {discountAmount > 0 && (
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-neutral-400 text-xs font-medium">Discount</Text>
                        <Text className="text-emerald-400 text-xs font-bold">-₦{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
                      </View>
                    )}

                    <View className="h-[1px] bg-white/5 my-3" />

                    <View className="flex-row justify-between items-center">
                      <Text className="text-neutral-300 text-sm font-bold uppercase tracking-wider">Total</Text>
                      <Text className="text-emerald-400 text-xl font-extrabold tracking-tight">₦{Math.max(0, subtotal - discountAmount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleCheckout}
                    disabled={checkingOut}
                    className="w-full bg-emerald-600 rounded-2xl py-4 items-center justify-center shadow-xl shadow-emerald-500/20 mt-2"
                  >
                    {checkingOut ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-base tracking-wide">Finalize Sale</Text>
                    )}
                  </TouchableOpacity>
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}
