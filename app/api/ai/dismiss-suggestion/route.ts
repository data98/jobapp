import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { job_application_id, suggestion_id } = await req.json();
    if (!job_application_id || !suggestion_id) {
      return NextResponse.json(
        { error: 'Missing job_application_id or suggestion_id' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch analysis
    const { data: analysis, error: fetchError } = await supabase
      .from('ai_analysis')
      .select('id, dismissed_suggestions')
      .eq('job_application_id', job_application_id)
      .single();

    if (fetchError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Add suggestion_id to dismissed list
    const dismissed: string[] = analysis.dismissed_suggestions ?? [];
    if (!dismissed.includes(suggestion_id)) {
      dismissed.push(suggestion_id);
    }

    const { error: updateError } = await supabase
      .from('ai_analysis')
      .update({ dismissed_suggestions: dismissed })
      .eq('id', analysis.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dismiss suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss suggestion' },
      { status: 500 }
    );
  }
}
