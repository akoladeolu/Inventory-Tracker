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
import { triggerHaptic } from '@/lib/haptics';
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
  Tag,
  Zap,
  ZapOff,
  CheckCircle,
  CreditCard,
  Building2,
  Banknote,
  Globe,
  Ticket,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react-native';

import { useIsFocused } from 'expo-router';

import { FeedbackModal } from '@/components/ui/feedback-modal';

export default function SalesScannerScreen() {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [enableTorch, setEnableTorch] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'online'>('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userName, setUserName] = useState('');
  
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [scannerMode, setScannerMode] = useState<'product' | 'coupon'>('product');

  // Local state for checkout details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

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

  // Coupon report modal state
  const [couponReport, setCouponReport] = useState<any | null>(null);
  const [showCouponReportModal, setShowCouponReportModal] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setScanned(false);
    }
  }, [isFocused]);

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
      <View className="flex-1 bg-[#09090B] items-center justify-center p-6">
        <ActivityIndicator size="large" color="#C8A348" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-[#09090B] items-center justify-center p-6">
        <Text className="text-white text-lg text-center mb-6 font-semibold leading-relaxed">
          Camera permission is required for barcode scanning
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-[#C8A348] px-6 py-3.5 rounded-2xl"
        >
          <Text className="text-[#09090B] font-extrabold text-base">Grant Permission</Text>
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
    if (scanned || loading) return;
    setScanned(true);
    triggerHaptic('medium');

    try {
      if (scannerMode === 'product') {
        await handleProductScan(data);
      } else {
        await handleCouponScan(data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setTimeout(() => setScanned(false), 1200);
    }
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
        triggerHaptic('error');
        showBrandAlert('error', 'Product Not Found 🔍', `No active product matches barcode "${data}".`);
      } else {
        triggerHaptic('success');
        addToCart({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.selling_price || 0),
          stock: product.quantity,
          image: product.image_url
        });
        showBrandAlert('success', 'Item Added 🛒', `"${product.name}" (SKU: ${product.sku}) added to POS checkout.`);
      }
    } catch (err: any) {
      console.error(err);
      triggerHaptic('error');
      Alert.alert('Scan Failed ❌', formatAppError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCouponScan = async (data: string) => {
    const code = data.trim().toUpperCase();
    setCouponCode(code);
    setShowScanner(false);
    setShowPaymentModal(true);
    await verifyAndReportCoupon(code);
  };

  const verifyAndReportCoupon = async (codeToInspect: string) => {
    if (!codeToInspect.trim()) {
      Alert.alert('Input Required ⚠️', 'Please enter or scan a promo code.');
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', codeToInspect.trim().toUpperCase())
        .maybeSingle();

      if (error || !coupon) {
        setCouponReport({
          code: codeToInspect.trim().toUpperCase(),
          found: false,
          active: false,
          canApply: false,
          rejectionReason: `No promo code matching "${codeToInspect.trim().toUpperCase()}" exists in system database.`
        });
        setShowCouponReportModal(true);
        return;
      }

      const now = new Date();
      const isSystemActive = coupon.active === true;
      const isNotStarted = coupon.start_date ? new Date(coupon.start_date) > now : false;

      let endDateObj: Date | null = null;
      if (coupon.end_date) {
        endDateObj = new Date(coupon.end_date);
        // If end_date is specified as midnight (YYYY-MM-DD), expand to end of day 23:59:59
        if (endDateObj.getHours() === 0 && endDateObj.getMinutes() === 0) {
          endDateObj.setHours(23, 59, 59, 999);
        }
      }
      const isExpired = endDateObj ? now > endDateObj : false;
      const isLimitReached = coupon.usage_limit !== null && coupon.usage_limit !== undefined ? coupon.usage_count >= coupon.usage_limit : false;
      const minPurchase = Number(coupon.min_purchase_amount || 0);
      const minPurchaseMet = subtotal >= minPurchase;
      const productApplicable = cart.length > 0;

      let statusLabel = 'ACTIVE';
      let statusColor = 'text-emerald-400';
      let statusBg = 'bg-emerald-500/15 border-emerald-500/30';

      if (!isSystemActive) {
        statusLabel = 'INACTIVE';
        statusColor = 'text-red-400';
        statusBg = 'bg-red-500/15 border-red-500/30';
      } else if (isExpired) {
        statusLabel = 'EXPIRED';
        statusColor = 'text-red-400';
        statusBg = 'bg-red-500/15 border-red-500/30';
      } else if (isLimitReached) {
        statusLabel = 'LIMIT REACHED';
        statusColor = 'text-red-400';
        statusBg = 'bg-red-500/15 border-red-500/30';
      } else if (isNotStarted) {
        statusLabel = 'NOT STARTED';
        statusColor = 'text-amber-400';
        statusBg = 'bg-amber-500/15 border-amber-500/30';
      }

      let projectedDiscount = 0;
      if (coupon.discount_type === 'percentage') {
        projectedDiscount = subtotal * (Number(coupon.discount_value) / 100);
        if (coupon.max_discount_amount && projectedDiscount > Number(coupon.max_discount_amount)) {
          projectedDiscount = Number(coupon.max_discount_amount);
        }
      } else {
        projectedDiscount = Number(coupon.discount_value);
      }

      let rejectionReason = '';
      let canApply = false;

      if (!isSystemActive) {
        rejectionReason = 'This coupon code is currently set as INACTIVE by system administrator.';
      } else if (isNotStarted) {
        rejectionReason = `Coupon is not active yet (Starts on ${new Date(coupon.start_date).toLocaleDateString()}).`;
      } else if (isExpired) {
        rejectionReason = `Coupon has EXPIRED (Ended on ${endDateObj ? endDateObj.toLocaleDateString() : 'past date'}).`;
      } else if (isLimitReached) {
        rejectionReason = `Usage limit reached (${coupon.usage_count}/${coupon.usage_limit} uses claimed).`;
      } else if (!productApplicable) {
        rejectionReason = 'Sales cart is empty. Add products to check product applicability.';
      } else if (!minPurchaseMet) {
        rejectionReason = `Minimum order amount of ₦${minPurchase.toLocaleString()} required. Current cart: ₦${subtotal.toLocaleString()} (Short by ₦${(minPurchase - subtotal).toLocaleString()}).`;
      } else {
        canApply = true;
      }

      const discountLabel = coupon.discount_type === 'percentage'
        ? `${coupon.discount_value}% OFF`
        : `₦${Number(coupon.discount_value).toLocaleString()} OFF`;

      setCouponReport({
        code: coupon.code,
        found: true,
        active: isSystemActive,
        statusLabel,
        statusColor,
        statusBg,
        isNotStarted,
        isExpired,
        isLimitReached,
        minPurchaseMet,
        productApplicable,
        canApply,
        rejectionReason,
        discountLabel,
        projectedDiscount,
        minPurchaseAmount: minPurchase,
        usageCount: coupon.usage_count || 0,
        usageLimit: coupon.usage_limit,
        endDate: coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : 'No Expiration Date',
        rawCoupon: coupon
      });

      setShowCouponReportModal(true);
    } catch (err: any) {
      Alert.alert('Coupon Audit Error ❌', formatAppError(err));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const applyReportedCoupon = () => {
    if (couponReport && couponReport.canApply && couponReport.rawCoupon) {
      setAppliedCoupon(couponReport.rawCoupon);
      setCouponCode(couponReport.code);
      setShowCouponReportModal(false);
      triggerHaptic('success');
      showBrandAlert('success', 'Promo Code Applied 🎉', `Coupon "${couponReport.code}" applied to order successfully!`);
    }
  };

  const handleManualAdd = async () => {
    if (!manualSku.trim()) {
      triggerHaptic('warning');
      showBrandAlert('warning', 'Input Required ⚠️', 'Please enter a product SKU to search.');
      return;
    }
    setLoading(true);

    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', manualSku.trim().toUpperCase())
        .eq('status', 'active')
        .single();

      if (error || !product) {
        triggerHaptic('error');
        showBrandAlert('error', 'Product Not Found 🔍', `No active product matches SKU "${manualSku.trim().toUpperCase()}".`);
      } else {
        triggerHaptic('success');
        addToCart({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.selling_price || 0),
          stock: product.quantity,
          image: product.image_url
        });
        showBrandAlert('success', 'Item Added 🛒', `"${product.name}" (SKU: ${product.sku}) added to cart.`);
        setManualSku('');
      }
    } catch (err: any) {
      console.error(err);
      triggerHaptic('error');
      showBrandAlert('error', 'Search Error ❌', formatAppError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      triggerHaptic('warning');
      showBrandAlert('warning', 'Cart Empty 🛒', 'Please add at least one item before finalizing checkout.');
      return;
    }
    setCheckingOut(true);

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

      const total = Math.max(0, subtotal - discountAmount);
      
      const mappedItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }));

      const itemsJson = JSON.stringify(mappedItems);

      const { data: result, error: rpcError } = await supabase.rpc('create_sale_transaction', {
        p_customer_name: customerName || 'Walk-in Customer',
        p_customer_phone: customerPhone || '',
        p_subtotal: subtotal,
        p_discount: discountAmount,
        p_total: total,
        p_payment_method: paymentMethod,
        p_sale_items: itemsJson,
        p_user_id: dbUser.id,
        p_coupon_id: appliedCoupon?.id || null
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const paymentLabel = paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'transfer' ? 'Bank Transfer' : paymentMethod === 'card' ? 'POS / Card' : 'Online Payment';

      triggerHaptic('success');

      // Attempt to generate/fetch receipt token for WhatsApp sharing
      let receiptToken: string | null = null;
      try {
        const { fetchReceiptToken, shareViaWhatsApp } = await import('@/lib/receipt');
        receiptToken = await fetchReceiptToken(result, supabase);
        
        if (customerPhone && receiptToken) {
          Alert.alert(
            'Sale Completed! 🎉',
            `Invoice: ${result}\nTotal: ₦${total.toLocaleString()}\n\nWould you like to send a digital receipt via WhatsApp?`,
            [
              { text: 'Skip', style: 'cancel' },
              {
                text: '📱 Send WhatsApp Receipt',
                onPress: () => shareViaWhatsApp(customerPhone, receiptToken!),
              },
            ]
          );
        } else {
          showBrandAlert(
            'success',
            'Sale Completed Successfully! 🎉', 
            `Invoice: ${result}\nCustomer: ${customerName || 'Walk-in Customer'}\nPayment Method: ${paymentLabel}\nTotal Paid: ₦${total.toLocaleString()}`
          );
        }
      } catch {
        showBrandAlert(
          'success',
          'Sale Completed Successfully! 🎉', 
          `Invoice: ${result}\nCustomer: ${customerName || 'Walk-in Customer'}\nPayment Method: ${paymentLabel}\nTotal Paid: ₦${total.toLocaleString()}`
        );
      }

      clearCart();
      setCustomerName('');
      setCustomerPhone('');
      setCouponCode('');
      setAppliedCoupon(null);
      setScannerMode('product');
      setShowPaymentModal(false);
    } catch (err: any) {
      console.error(err);
      triggerHaptic('error');
      showBrandAlert('error', 'Checkout Failed ❌', formatAppError(err));
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top']}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-[#24242A] bg-[#09090B]">
        <View>
          <Text className="text-white text-2xl font-black tracking-tight">Checkout POS</Text>
          <Text className="text-[#C8A348] text-xs mt-0.5 font-semibold truncate max-w-[200px]">{userName}</Text>
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-2xl items-center justify-center"
        >
          <LogOut size={18} color="#f87171" />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        {/* Top Scanner / Manual Input Area */}
        {showScanner && isFocused ? (
          <View className="h-64 relative bg-black border-b border-[#24242A]">
            <CameraView
              key={isFocused ? 'focused-scanner-cam' : 'unfocused-scanner-cam'}
              style={StyleSheet.absoluteFill}
              enableTorch={enableTorch}
              onBarcodeScanned={scanned ? undefined : handleScan}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
              }}
            />
            {/* Target overlay */}
            <View className="absolute inset-0 items-center justify-center pointer-events-none">
              <View className="w-56 h-24 border-2 border-dashed border-[#C8A348] rounded-2xl bg-[#C8A348]/10" />
              <Text className="text-white text-xs bg-black/75 border border-white/10 px-4 py-2 rounded-full mt-4 font-semibold tracking-wide backdrop-blur-md">
                {scannerMode === 'product' ? 'Align product barcode within frame' : 'Align promo QR code'}
              </Text>
            </View>

            {/* Flashlight / Torch toggle button */}
            <TouchableOpacity
              onPress={() => setEnableTorch(!enableTorch)}
              className="absolute top-4 left-4 bg-black/75 p-3 rounded-full border border-white/10 backdrop-blur-md"
            >
              {enableTorch ? <Zap size={18} color="#C8A348" /> : <ZapOff size={18} color="#71717A" />}
            </TouchableOpacity>

            {/* Keyboard toggle button */}
            <TouchableOpacity
              onPress={() => setShowScanner(false)}
              className="absolute top-4 right-4 bg-black/75 p-3 rounded-full border border-white/10 backdrop-blur-md"
            >
              <Keyboard size={18} color="#C8A348" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="p-5 bg-[#121214] border-b border-[#24242A]">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-neutral-400 font-bold text-xs uppercase tracking-widest">Manual SKU Entry</Text>
              <TouchableOpacity
                onPress={() => setShowScanner(true)}
                className="flex-row items-center bg-[#C8A348]/15 px-3 py-1.5 rounded-full border border-[#C8A348]/30"
              >
                <ScanLine size={14} color="#C8A348" />
                <Text className="text-[#C8A348] font-bold text-xs ml-1.5">Scanner</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3">
              <TextInput
                value={manualSku}
                onChangeText={setManualSku}
                placeholder="Enter product SKU"
                placeholderTextColor="#52525B"
                autoCapitalize="characters"
                autoCorrect={false}
                className="flex-1 bg-[#09090B] border border-[#27272A] text-white rounded-2xl px-5 py-3.5 font-semibold text-base"
              />
              <TouchableOpacity
                onPress={handleManualAdd}
                disabled={loading}
                className="bg-[#C8A348] px-6 rounded-2xl items-center justify-center shadow-lg shadow-[#C8A348]/20"
              >
                {loading ? <ActivityIndicator size="small" color="#09090B" /> : <Text className="text-[#09090B] font-extrabold text-base">Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cart Item List */}
        <View className="flex-1 bg-[#09090B]">
          <View className="flex-row justify-between items-center px-6 py-3 bg-[#121214] border-b border-[#24242A]">
            <Text className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest">Cart Items</Text>
            <Text className="text-[#C8A348] font-bold text-xs">{cart.length} items</Text>
          </View>

          {cart.length === 0 ? (
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} className="px-6">
              <View className="w-20 h-20 bg-[#121214] rounded-full border border-[#24242A] items-center justify-center mb-4">
                <ShoppingBag size={32} color="#71717A" />
              </View>
              <Text className="text-neutral-400 text-sm text-center font-medium max-w-[240px] leading-relaxed">
                Scan barcodes or enter SKUs manually to add items to cart.
              </Text>
            </ScrollView>
          ) : (
            <ScrollView className="px-4 pt-4">
              {cart.map((item) => (
                <View key={item.id} className="flex-row items-center justify-between p-4 bg-[#121214] border border-[#24242A] rounded-3xl mb-3">
                  <View className="flex-1 pr-3">
                    <Text className="text-white font-bold text-sm" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-neutral-400 text-[10px] font-mono mt-1 uppercase tracking-wider">
                      {item.sku}
                    </Text>
                    <Text className="text-[#C8A348] font-black text-base mt-2">
                      ₦{item.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <View className="flex-row items-center bg-[#09090B] border border-[#24242A] rounded-2xl px-1.5 py-1.5 mr-3">
                      <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 bg-[#1E1E22] rounded-xl">
                        <Minus size={14} color="white" />
                      </TouchableOpacity>
                      <Text className="text-white font-black px-4 text-sm">{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 bg-[#1E1E22] rounded-xl">
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
          <View className="p-5 bg-[#121214] border-t border-[#24242A]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-neutral-400 font-bold text-xs uppercase tracking-widest">Subtotal</Text>
              <Text className="text-white font-black text-2xl tracking-tight">₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowPaymentModal(true)}
              className="w-full bg-[#C8A348] rounded-2xl py-4 items-center justify-center shadow-xl shadow-[#C8A348]/20"
            >
              <Text className="text-[#09090B] font-black text-base tracking-wide">Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Payment Selection Modal */}
      {showPaymentModal && (
        <View className="absolute inset-0 bg-black/90 items-center justify-center p-4 z-50 backdrop-blur-xl">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="w-full">
            <ScrollView className="w-full max-h-[85vh]" contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
              <View className="w-full bg-[#121214] border border-[#24242A] rounded-[32px] p-6 shadow-2xl">
                
                {/* Close Button / Panel Header */}
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-white font-bold text-xl tracking-tight">Checkout Payment</Text>
                  <TouchableOpacity onPress={() => setShowPaymentModal(false)} className="w-8 h-8 bg-white/5 rounded-full items-center justify-center border border-white/5">
                    <Text className="text-neutral-400 font-bold text-xs">✕</Text>
                  </TouchableOpacity>
                </View>

                <View className="gap-5">
                  {/* Customer Info Section */}
                  <View>
                    <Text className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mb-3">Customer Details</Text>
                    <View className="gap-3">
                      <View className="flex-row items-center bg-[#09090B] border border-[#27272A] rounded-2xl px-4">
                        <User size={16} color="#71717A" />
                        <TextInput
                          value={customerName}
                          onChangeText={setCustomerName}
                          placeholder="Name (Optional)"
                          placeholderTextColor="#52525B"
                          className="flex-1 text-white text-sm px-3 py-3.5 font-medium"
                        />
                      </View>
                      <View className="flex-row items-center bg-[#09090B] border border-[#27272A] rounded-2xl px-4">
                        <Phone size={16} color="#71717A" />
                        <TextInput
                          value={customerPhone}
                          onChangeText={setCustomerPhone}
                          placeholder="Phone (Optional)"
                          placeholderTextColor="#52525B"
                          keyboardType="phone-pad"
                          className="flex-1 text-white text-sm px-3 py-3.5 font-medium"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Coupon Code Section */}
                  <View>
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest">Discount Code</Text>
                      {!appliedCoupon && (
                        <TouchableOpacity onPress={() => { setShowPaymentModal(false); setScannerMode('coupon'); setShowScanner(true); }} className="flex-row items-center gap-1.5">
                          <Camera size={12} color="#C8A348" />
                          <Text className="text-[#C8A348] text-[10px] font-extrabold uppercase tracking-wide">Scan QR Code</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View className="flex-row gap-3">
                      <View className="flex-1 flex-row items-center bg-[#09090B] border border-[#27272A] rounded-2xl px-4">
                        <Tag size={16} color="#71717A" />
                        <TextInput
                          value={couponCode}
                          onChangeText={setCouponCode}
                          placeholder="Promo Code"
                          placeholderTextColor="#52525B"
                          autoCapitalize="characters"
                          editable={!appliedCoupon}
                          className="flex-1 text-white text-sm px-3 py-3.5 font-bold tracking-widest"
                        />
                      </View>
                      {appliedCoupon ? (
                        <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponCode(''); }} className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 justify-center">
                          <Text className="text-red-400 text-xs font-bold">Remove</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => verifyAndReportCoupon(couponCode)} disabled={!couponCode || isApplyingCoupon} className="bg-[#C8A348]/15 border border-[#C8A348]/30 rounded-2xl px-4 justify-center">
                          {isApplyingCoupon ? <ActivityIndicator size="small" color="#C8A348" /> : <Text className="text-[#C8A348] text-xs font-bold uppercase tracking-wider">Audit & Apply</Text>}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Payment Methods */}
                  <View>
                    <Text className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mb-3">Payment Method</Text>
                    <View className="flex-row flex-wrap gap-3">
                      {[
                        { id: 'cash', label: 'Cash', icon: Banknote },
                        { id: 'transfer', label: 'Bank Transfer', icon: Building2 },
                        { id: 'card', label: 'POS / Card', icon: CreditCard },
                        { id: 'online', label: 'Online Payment', icon: Globe }
                      ].map((method) => {
                        const isSelected = paymentMethod === method.id;
                        const Icon = method.icon;
                        return (
                          <TouchableOpacity
                            key={method.id}
                            onPress={() => setPaymentMethod(method.id as any)}
                            className={`flex-1 min-w-[45%] flex-row items-center justify-between p-4 rounded-2xl border ${
                              isSelected
                                ? 'bg-[#C8A348]/15 border-[#C8A348]'
                                : 'bg-[#09090B] border-[#27272A]'
                            }`}
                          >
                            <View className="flex-row items-center gap-2.5">
                              <Icon size={16} color={isSelected ? '#C8A348' : '#71717A'} />
                              <Text className={`font-bold text-xs tracking-wide ${isSelected ? 'text-[#C8A348]' : 'text-neutral-300'}`}>
                                {method.label}
                              </Text>
                            </View>
                            <View className={`w-4 h-4 rounded-full border-2 items-center justify-center ${
                              isSelected ? 'border-[#C8A348]' : 'border-neutral-700'
                            }`}>
                              {isSelected && <View className="w-2 h-2 bg-[#C8A348] rounded-full" />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Checkout Summary */}
                  <View className="bg-[#09090B] border border-[#24242A] rounded-2xl p-5 mt-2">
                    <View className="flex-row justify-between mb-3">
                      <Text className="text-neutral-400 text-xs font-medium">Subtotal</Text>
                      <Text className="text-neutral-200 text-xs font-bold">₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
                    </View>

                    {discountAmount > 0 && (
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-neutral-400 text-xs font-medium">Discount</Text>
                        <Text className="text-emerald-400 text-xs font-bold">-₦{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
                      </View>
                    )}

                    <View className="h-[1px] bg-[#24242A] my-3" />

                    <View className="flex-row justify-between items-center">
                      <Text className="text-neutral-300 text-sm font-bold uppercase tracking-wider">Total</Text>
                      <Text className="text-emerald-400 text-xl font-black tracking-tight">₦{Math.max(0, subtotal - discountAmount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
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
                      <Text className="text-white font-extrabold text-base tracking-wide">Finalize Sale</Text>
                    )}
                  </TouchableOpacity>
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Coupon Audit & Product Applicability Report Modal */}
      {showCouponReportModal && couponReport && (
        <View className="absolute inset-0 bg-black/80 items-center justify-center p-5 z-50">
          <View className="w-full max-w-md bg-[#121214] border border-[#24242A] rounded-[32px] p-6 shadow-2xl">
            
            {/* Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-[#24242A]">
              <View className="flex-row items-center gap-3">
                <View className="bg-[#C8A348]/15 border border-[#C8A348]/30 p-2.5 rounded-2xl">
                  <Ticket size={20} color="#C8A348" />
                </View>
                <View>
                  <Text className="text-white font-extrabold text-base tracking-tight">Coupon Audit Report</Text>
                  <Text className="text-[#C8A348] text-[10px] font-bold tracking-widest uppercase">Code: {couponReport.code}</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setShowCouponReportModal(false)}
                className="w-8 h-8 bg-white/5 border border-white/10 rounded-full items-center justify-center"
              >
                <Text className="text-neutral-400 font-bold text-xs">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[55vh] my-4" showsVerticalScrollIndicator={false}>
              {/* Status Badge Banner */}
              <View className={`flex-row items-center justify-between p-4 rounded-2xl border mb-4 ${
                couponReport.canApply 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <View className="flex-row items-center gap-2.5">
                  {couponReport.canApply ? (
                    <CheckCircle2 size={20} color="#34d399" />
                  ) : (
                    <XCircle size={20} color="#f87171" />
                  )}
                  <View>
                    <Text className={`font-extrabold text-xs uppercase tracking-wider ${
                      couponReport.canApply ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {couponReport.canApply ? 'Coupon Eligible & Applicable' : 'Coupon Ineligible / Rejected'}
                    </Text>
                    <Text className="text-neutral-400 text-[11px] font-medium mt-0.5">
                      {couponReport.discountLabel || 'Storewide Coupon'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Audit Report Breakdown */}
              <View className="bg-[#09090B] border border-[#24242A] rounded-2xl p-4 gap-3">
                <Text className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mb-1">Diagnostic Report</Text>

                {/* Active Status */}
                <View className="flex-row items-center justify-between border-b border-[#1E1E22] pb-2.5">
                  <Text className="text-neutral-300 text-xs font-semibold">Active Status</Text>
                  <View className={`flex-row items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${couponReport.statusBg}`}>
                    <Text className={`text-[10px] font-extrabold uppercase ${couponReport.statusColor}`}>
                      {couponReport.statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Expiration Check */}
                <View className="flex-row items-center justify-between border-b border-[#1E1E22] pb-2.5">
                  <Text className="text-neutral-300 text-xs font-semibold">Validity Window</Text>
                  <Text className={`text-xs font-bold ${couponReport.isExpired ? 'text-red-400' : 'text-neutral-200'}`}>
                    {couponReport.isExpired ? 'EXPIRED' : couponReport.endDate}
                  </Text>
                </View>

                {/* Usage Limit */}
                <View className="flex-row items-center justify-between border-b border-[#1E1E22] pb-2.5">
                  <Text className="text-neutral-300 text-xs font-semibold">Usage Limit</Text>
                  <Text className="text-neutral-200 text-xs font-bold">
                    {couponReport.usageLimit ? `${couponReport.usageCount} / ${couponReport.usageLimit} used` : 'Unlimited'}
                  </Text>
                </View>

                {/* Product Applicability */}
                <View className="flex-row items-center justify-between border-b border-[#1E1E22] pb-2.5">
                  <Text className="text-neutral-300 text-xs font-semibold">Product Applicability</Text>
                  <View className={`flex-row items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${
                    couponReport.productApplicable ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-amber-500/15 border-amber-500/30'
                  }`}>
                    <Text className={`text-[10px] font-extrabold uppercase ${couponReport.productApplicable ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {couponReport.productApplicable ? 'Cart Items Eligible' : 'Empty Cart'}
                    </Text>
                  </View>
                </View>

                {/* Order Minimum Check */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-neutral-300 text-xs font-semibold">Minimum Order Requirement</Text>
                  <Text className={`text-xs font-bold ${couponReport.minPurchaseMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {couponReport.minPurchaseAmount > 0 ? `₦${couponReport.minPurchaseAmount.toLocaleString()}` : 'None'}
                  </Text>
                </View>
              </View>

              {/* Rejection Alert Box */}
              {couponReport.rejectionReason && (
                <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 mt-3 flex-row items-start gap-2.5">
                  <AlertCircle size={16} color="#f87171" style={{ marginTop: 2 }} />
                  <Text className="flex-1 text-red-300 text-xs font-medium leading-relaxed">
                    {couponReport.rejectionReason}
                  </Text>
                </View>
              )}

              {/* Projected Savings */}
              {couponReport.canApply && (
                <View className="bg-[#C8A348]/10 border border-[#C8A348]/30 rounded-2xl p-4 mt-3 flex-row items-center justify-between">
                  <Text className="text-neutral-300 text-xs font-bold uppercase tracking-wider">Projected Savings</Text>
                  <Text className="text-[#C8A348] text-lg font-black">₦{couponReport.projectedDiscount.toLocaleString()}</Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View className="gap-3 pt-2">
              {couponReport.canApply ? (
                <TouchableOpacity
                  onPress={applyReportedCoupon}
                  className="w-full bg-emerald-600 rounded-2xl py-3.5 items-center justify-center shadow-xl shadow-emerald-500/20"
                >
                  <Text className="text-white font-extrabold text-sm tracking-wide">Apply Coupon to Order</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  disabled
                  className="w-full bg-neutral-800 rounded-2xl py-3.5 items-center justify-center opacity-60"
                >
                  <Text className="text-neutral-500 font-extrabold text-sm tracking-wide">Cannot Apply (Requirements Not Met)</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowCouponReportModal(false)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 items-center justify-center"
              >
                <Text className="text-neutral-300 font-extrabold text-sm">Close Audit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
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
