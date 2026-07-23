import { createClient } from '@/lib/supabase/server';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound: 'default';
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ sent: number }> {
  if (!userIds.length) return { sent: 0 };

  const supabase = await createClient();

  const { data: tokens, error } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .in('user_id', userIds)
    .eq('active', true);

  if (error || !tokens?.length) {
    console.error('No push tokens found:', error?.message);
    return { sent: 0 };
  }

  const messages: ExpoPushMessage[] = tokens.map((t: any) => ({
    to: t.expo_push_token,
    title,
    body,
    data: data || {},
    sound: 'default' as const,
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error('Expo push API error:', response.statusText);
    }

    return { sent: messages.length };
  } catch (err) {
    console.error('Push send error:', err);
    return { sent: 0 };
  }
}

async function getManagerAndOwnerIds(): Promise<string[]> {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .in('role', ['owner', 'manager']);

  if (error || !users) {
    console.error('Failed to fetch managers/owners:', error?.message);
    return [];
  }

  return users.map((u: any) => u.id);
}

export async function sendLowStockAlert(
  productId: string,
  productName: string,
  sku: string,
  currentQty: number,
  threshold: number
): Promise<void> {
  const userIds = await getManagerAndOwnerIds();
  if (!userIds.length) return;

  await sendPushToUsers(
    userIds,
    '\u26A0\uFE0F Low Stock Alert',
    `"${productName}" (${sku}) is low \u2014 ${currentQty} remaining (threshold: ${threshold})`,
    { type: 'low_stock', product_id: productId }
  );
}

export async function sendHighValueSaleAlert(
  invoiceNumber: string,
  total: number,
  customerName: string
): Promise<void> {
  const userIds = await getManagerAndOwnerIds();
  if (!userIds.length) return;

  await sendPushToUsers(
    userIds,
    '\uD83D\uDCB0 High-Value Sale',
    `Sale ${invoiceNumber} \u2014 \u20A6${total.toLocaleString()} from ${customerName}`,
    { type: 'high_value_sale', invoice_number: invoiceNumber }
  );
}
