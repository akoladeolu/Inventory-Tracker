import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, expo_push_token, device_name, platform } = await request.json();

    if (!user_id || !expo_push_token) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, expo_push_token' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id,
          expo_push_token,
          device_name: device_name || null,
          platform: platform || null,
          active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,expo_push_token' }
      );

    if (error) {
      console.error('Push token registration error:', error);
      return NextResponse.json(
        { error: 'Failed to register push token' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Push registration error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user_id, expo_push_token } = await request.json();

    if (!user_id || !expo_push_token) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, expo_push_token' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('push_tokens')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('expo_push_token', expo_push_token);

    if (error) {
      console.error('Push token deactivation error:', error);
      return NextResponse.json(
        { error: 'Failed to deactivate push token' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Push deactivation error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
