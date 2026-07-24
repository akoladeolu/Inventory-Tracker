import { Linking } from 'react-native';

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://inventory-tracker.vercel.app';

export function getReceiptVerifyUrl(receiptToken: string): string {
  return `${WEB_APP_URL}/receipt/verify/${receiptToken}`;
}

export async function shareViaWhatsApp(phone: string, receiptToken: string): Promise<boolean> {
  const receiptUrl = getReceiptVerifyUrl(receiptToken);
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const message = encodeURIComponent(
    `Thank you for shopping at TEEKEH! 🛍️\n\nView your receipt: ${receiptUrl}`
  );
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${message}`
    : `https://wa.me/?text=${message}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return true;
    }
    // Fallback: open in browser
    await Linking.openURL(receiptUrl);
    return true;
  } catch {
    return false;
  }
}

export async function openReceiptInBrowser(receiptToken: string): Promise<void> {
  const url = getReceiptVerifyUrl(receiptToken);
  await Linking.openURL(url);
}

export async function fetchReceiptToken(invoiceNumber: string, supabase: any): Promise<string | null> {
  const { data, error } = await supabase
    .from('sales')
    .select('receipt_token')
    .eq('invoice_number', invoiceNumber)
    .single();

  if (error || !data?.receipt_token) return null;
  return data.receipt_token;
}
