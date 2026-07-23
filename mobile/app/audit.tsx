import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '@/lib/supabase';
import { triggerHaptic } from '@/lib/haptics';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Save,
  RotateCcw
} from 'lucide-react-native';

export default function MobileAuditScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [activeAudits, setActiveAudits] = useState<any[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanned, setScanned] = useState(false);
  
  // Scanned item state
  const [scannedItem, setScannedItem] = useState<any | null>(null);
  const [countedQty, setCountedQty] = useState('');
  const [varianceReason, setVarianceReason] = useState('damaged');
  const [varianceNotes, setVarianceNotes] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  const fetchActiveAudits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stock_audits')
      .select('*')
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch audits error:', error);
    }
    setActiveAudits(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveAudits();
  }, []);

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || !selectedAudit || savingItem) return;
    setScanned(true);
    triggerHaptic('medium');

    try {
      // 1. Fetch product by barcode
      const { data: product, error: prodError } = await supabase
        .from('products')
        .select('id, name, sku, barcode, quantity')
        .eq('barcode', data.trim())
        .single();

      if (prodError || !product) {
        Alert.alert('Item Not Found', `No product matches barcode: ${data}`);
        setScanned(false);
        return;
      }

      // 2. Fetch corresponding audit item
      const { data: auditItem, error: itemError } = await supabase
        .from('stock_audit_items')
        .select('*')
        .eq('audit_id', selectedAudit.id)
        .eq('product_id', product.id)
        .single();

      if (itemError || !auditItem) {
        Alert.alert('Not In Audit Scope', `Product "${product.name}" is not included in this audit.`);
        setScanned(false);
        return;
      }

      setScannedItem({
        ...auditItem,
        product,
      });
      setCountedQty(auditItem.counted_quantity !== null ? String(auditItem.counted_quantity) : String(product.quantity));
    } catch (err: any) {
      console.error(err);
      Alert.alert('Scan Error', err.message || 'Failed to scan item');
    }
  };

  const handleSaveCount = async () => {
    if (!scannedItem) return;
    const count = parseInt(countedQty, 10);
    if (isNaN(count) || count < 0) {
      Alert.alert('Invalid Count', 'Please enter a valid non-negative number.');
      return;
    }

    setSavingItem(true);
    try {
      const variance = count - scannedItem.expected_quantity;
      const { error } = await supabase
        .from('stock_audit_items')
        .update({
          counted_quantity: count,
          variance,
          variance_reason: variance !== 0 ? varianceReason : null,
          variance_notes: variance !== 0 ? varianceNotes : null,
          scanned_at: new Date().toISOString(),
        })
        .eq('id', scannedItem.id);

      if (error) throw error;

      triggerHaptic('success');
      Alert.alert('Success 🎉', `Recorded physical count of ${count} for ${scannedItem.product.name}`);
      setScannedItem(null);
      setScanned(false);
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert('Error', err.message || 'Failed to save count');
    } finally {
      setSavingItem(false);
    }
  };

  const handleSubmitAudit = async () => {
    if (!selectedAudit) return;
    Alert.alert(
      'Submit Audit',
      'Submit this audit for manager review & approval?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            const { error } = await supabase
              .from('stock_audits')
              .update({ status: 'pending_review' })
              .eq('id', selectedAudit.id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Audit Submitted! 🎉', 'The audit is now pending review by a manager.');
              setSelectedAudit(null);
              fetchActiveAudits();
            }
          },
        },
      ]
    );
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView className="flex-1 bg-[#09090B] items-center justify-center p-6">
        <Text className="text-white text-base text-center mb-4">Camera permission is required for audit scanning.</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-[#C8A348] px-6 py-3 rounded-xl">
          <Text className="text-black font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]">
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-[#24242A]">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <ArrowLeft size={20} color="#C8A348" />
          <Text className="text-[#C8A348] font-semibold ml-2">Back</Text>
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Stock Audit</Text>
        <View style={{ width: 40 }} />
      </View>

      {!selectedAudit ? (
        <ScrollView className="flex-1 p-6">
          <Text className="text-white text-xl font-black mb-2">Select Active Audit</Text>
          <Text className="text-neutral-400 text-sm mb-6">Choose an in-progress audit session to begin scanning shelves.</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#C8A348" />
          ) : activeAudits.length === 0 ? (
            <View className="items-center justify-center py-16 border border-[#24242A] rounded-2xl p-6">
              <ClipboardCheck size={48} color="#52525B" />
              <Text className="text-white font-semibold text-base mt-4">No Active Audits</Text>
              <Text className="text-neutral-500 text-xs text-center mt-2">Start a new stock audit session from the web dashboard first.</Text>
            </View>
          ) : (
            activeAudits.map((audit) => (
              <TouchableOpacity
                key={audit.id}
                onPress={() => setSelectedAudit(audit)}
                className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 mb-4"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white font-bold text-base">{audit.audit_number}</Text>
                  <View className="bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full">
                    <Text className="text-blue-400 text-xs font-semibold uppercase">{audit.scope}</Text>
                  </View>
                </View>
                <Text className="text-neutral-400 text-xs">Started {new Date(audit.started_at).toLocaleDateString()}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <View className="flex-1">
          {/* Active Audit Banner */}
          <View className="bg-[#18181B] border-b border-[#27272A] px-6 py-3 flex-row justify-between items-center">
            <View>
              <Text className="text-white font-bold text-sm">{selectedAudit.audit_number}</Text>
              <Text className="text-[#C8A348] text-xs font-medium">Scanning Mode Active</Text>
            </View>
            <TouchableOpacity onPress={handleSubmitAudit} className="bg-emerald-600 px-3 py-1.5 rounded-lg">
              <Text className="text-white text-xs font-bold">Submit Review</Text>
            </TouchableOpacity>
          </View>

          {/* Scanner or Item Entry View */}
          {scannedItem ? (
            <ScrollView className="flex-1 p-6 space-y-4">
              <View className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl">
                <Text className="text-[#C8A348] text-xs font-bold uppercase tracking-wider mb-1">Scanned Product</Text>
                <Text className="text-white font-bold text-lg mb-1">{scannedItem.product.name}</Text>
                <Text className="text-neutral-400 text-xs mb-4">SKU: {scannedItem.product.sku}</Text>

                <View className="bg-[#27272A] p-4 rounded-xl flex-row justify-between items-center mb-4">
                  <Text className="text-neutral-300 text-sm font-semibold">Expected System Stock:</Text>
                  <Text className="text-white font-black text-xl">{scannedItem.expected_quantity}</Text>
                </View>

                <Text className="text-white text-sm font-semibold mb-2">Physical Counted Quantity:</Text>
                <TextInput
                  value={countedQty}
                  onChangeText={setCountedQty}
                  keyboardType="numeric"
                  placeholder="Enter physical count"
                  placeholderTextColor="#71717A"
                  className="bg-[#09090B] border border-[#3F3F46] text-white p-4 rounded-xl font-bold text-xl mb-4"
                />

                {parseInt(countedQty, 10) !== scannedItem.expected_quantity && (
                  <View className="mb-4">
                    <Text className="text-amber-400 text-xs font-semibold mb-2">Variance Reason:</Text>
                    <View className="flex-row flex-wrap gap-2 mb-3">
                      {['damaged', 'stolen', 'misplaced', 'display_sample', 'counting_error'].map((r) => (
                        <TouchableOpacity
                          key={r}
                          onPress={() => setVarianceReason(r)}
                          className={`px-3 py-1.5 rounded-lg border ${
                            varianceReason === r ? 'bg-[#C8A348] border-[#C8A348]' : 'bg-[#09090B] border-[#3F3F46]'
                          }`}
                        >
                          <Text className={`text-xs font-semibold ${varianceReason === r ? 'text-black' : 'text-neutral-300'}`}>
                            {r.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleSaveCount}
                  disabled={savingItem}
                  className="bg-[#C8A348] p-4 rounded-xl items-center flex-row justify-center"
                >
                  {savingItem ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Save size={18} color="#000" />
                      <Text className="text-black font-extrabold ml-2">Save Physical Count</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setScannedItem(null); setScanned(false); }}
                  className="mt-3 p-3 items-center"
                >
                  <Text className="text-neutral-400 text-xs font-semibold">Cancel / Scan Next</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View className="flex-1">
              <CameraView
                style={{ flex: 1 }}
                barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'code128', 'upc_a'] }}
                onBarcodeScanned={scanned ? undefined : handleScan}
              >
                <View className="flex-1 bg-black/40 items-center justify-center">
                  <View className="w-64 h-64 border-2 border-[#C8A348] rounded-3xl items-center justify-center bg-transparent">
                    <ScanLine size={48} color="#C8A348" />
                  </View>
                  <Text className="text-white text-sm font-semibold mt-6 bg-black/60 px-4 py-2 rounded-full">
                    Point camera at barcode to count item
                  </Text>
                </View>
              </CameraView>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
