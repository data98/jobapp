import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type { JDProfile } from '@/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;

    const updates = await req.json();
    const supabase = createServerClient();

    // Fetch profile and verify ownership through the job application
    const { data: profile, error: fetchError } = await supabase
      .from('jd_profiles')
      .select('*, job_application:job_application!inner(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: 'JD profile not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this application
    const appUserId = (profile.job_application as { user_id: string })?.user_id;
    if (appUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Remove fields that shouldn't be updated directly
    const {
      id: _id,
      job_application_id: _jaid,
      created_at: _ca,
      job_application: _ja,
      ...allowedUpdates
    } = updates;

    const { data: updated, error: updateError } = await supabase
      .from('jd_profiles')
      .update({
        ...allowedUpdates,
        user_edited: true,
        user_edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update JD profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated as JDProfile);
  } catch (error) {
    console.error('JD Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
