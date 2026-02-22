import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { IDEAL_RESUME_PROMPT } from '@/constants/prompts';
import type { IdealResume } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { job_application_id } = await req.json();
    if (!job_application_id) {
      return NextResponse.json(
        { error: 'Missing job_application_id' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch job application
    const { data: application, error: appError } = await supabase
      .from('job_application')
      .select('*')
      .eq('id', job_application_id)
      .eq('user_id', userId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (!application.job_description) {
      return NextResponse.json(
        { error: 'No job description provided' },
        { status: 400 }
      );
    }

    // Build prompt
    const prompt = IDEAL_RESUME_PROMPT.replace(
      '{{job_description}}',
      application.job_description
    );

    // Call OpenAI with retry
    let idealResume: IdealResume | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });

        const rawContent = completion.choices[0]?.message?.content;
        if (!rawContent) throw new Error('No response from AI');

        idealResume = JSON.parse(rawContent) as IdealResume;
        break;
      } catch (parseError) {
        if (attempt === 1) throw parseError;
      }
    }

    if (!idealResume) {
      return NextResponse.json(
        { error: 'Failed to generate ideal resume' },
        { status: 500 }
      );
    }

    // Upsert into ai_analysis
    const { data: existing } = await supabase
      .from('ai_analysis')
      .select('id')
      .eq('job_application_id', job_application_id)
      .single();

    if (existing) {
      await supabase
        .from('ai_analysis')
        .update({ ideal_resume: idealResume })
        .eq('id', existing.id);
    } else {
      await supabase.from('ai_analysis').insert({
        job_application_id,
        ideal_resume: idealResume,
      });
    }

    return NextResponse.json(idealResume);
  } catch (error) {
    console.error('Generate ideal resume error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ideal resume' },
      { status: 500 }
    );
  }
}
