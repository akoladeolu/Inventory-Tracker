import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound: 'default';
}

export async function POST(request: NextRequest) {
  try {
    const { user_ids, title, body, data } = await request.json();

    if (!user_ids?.length || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: user_ids, title, body' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch active push tokens for the given users
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .in('user_id', user_ids)
      .eq('active', true);

    if (tokensError) {
      console.error('Failed to fetch push tokens:', tokensError);
      return NextResponse.json(
        { error: 'Failed to fetch push tokens' },
        { status: 500 }
      );
    }

    if (!tokens?.length) {
      return NextResponse.json({ sent: 0, message: 'No active push tokens found' });
    }

    // Build Expo push messages
    const messages: ExpoPushMessage[] = tokens.map((t: any) => ({
      to: t.expo_push_token,
      title,
      body,
      data: data || {},
      sound: 'default',
    }));

    // Send via Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    return NextResponse.json({
      sent: messages.length,
      result,
    });
  } catch (err: any) {
    console.error('Push notification error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
