import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type {
  ATSAnalysis,
  ResumeVariant,
  V1RecommendationsResult,
  ExperienceEntry,
  SkillEntry,
  PersonalInfo,
} from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { jobApplicationId } = await req.json();
    if (!jobApplicationId) {
      return NextResponse.json(
        { error: 'Missing jobApplicationId' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const [analysisResult, variantResult] = await Promise.all([
      supabase
        .from('ats_analysis')
        .select('*')
        .eq('job_application_id', jobApplicationId)
        .single(),
      supabase
        .from('resume_variant')
        .select('*')
        .eq('job_application_id', jobApplicationId)
        .eq('user_id', userId)
        .single(),
    ]);

    if (analysisResult.error || !analysisResult.data) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }
    if (variantResult.error || !variantResult.data) {
      return NextResponse.json(
        { error: 'Resume variant not found' },
        { status: 404 }
      );
    }

    const analysis = analysisResult.data as ATSAnalysis;
    const variant = variantResult.data as ResumeVariant;
    const recommendations = analysis.recommendations as V1RecommendationsResult;

    const pending = recommendations.rewrite_suggestions.filter(
      (s) => !s.accepted
    );

    if (pending.length === 0) {
      return NextResponse.json(variant);
    }

    // Apply all pending suggestions
    let experience = [...(variant.experience as ExperienceEntry[])];
    let personalInfo = { ...(variant.personal_info as PersonalInfo) };
    let skills = [...(variant.skills as SkillEntry[])];

    for (const suggestion of pending) {
      if (suggestion.type === 'bullet_rewrite') {
        if (
          suggestion.experience_index != null &&
          suggestion.bullet_index != null &&
          experience[suggestion.experience_index]
        ) {
          experience[suggestion.experience_index] = {
            ...experience[suggestion.experience_index],
            bullets: experience[suggestion.experience_index].bullets.map(
              (b, i) =>
                i === suggestion.bullet_index
                  ? suggestion.suggested_text
                  : b
            ),
          };
        }
      } else if (suggestion.type === 'summary_rewrite') {
        personalInfo = {
          ...personalInfo,
          summary: suggestion.suggested_text,
        };
      } else if (suggestion.type === 'skill_addition') {
        if (
          !skills.some(
            (s) =>
              s.name.toLowerCase() ===
              suggestion.suggested_text.toLowerCase()
          )
        ) {
          skills.push({
            id: crypto.randomUUID(),
            name: suggestion.suggested_text,
          });
        }
      }
    }

    // Save variant
    await supabase
      .from('resume_variant')
      .update({
        experience,
        personal_info: personalInfo,
        skills,
        updated_at: new Date().toISOString(),
      })
      .eq('job_application_id', jobApplicationId)
      .eq('user_id', userId);

    // Mark all suggestions as accepted
    const allAccepted = recommendations.rewrite_suggestions.map((s) => ({
      ...s,
      accepted: true,
    }));
    await supabase
      .from('ats_analysis')
      .update({
        recommendations: {
          ...recommendations,
          rewrite_suggestions: allAccepted,
        },
      })
      .eq('job_application_id', jobApplicationId);

    // Return updated variant
    const { data: updatedVariant } = await supabase
      .from('resume_variant')
      .select('*')
      .eq('job_application_id', jobApplicationId)
      .eq('user_id', userId)
      .single();

    return NextResponse.json(updatedVariant as ResumeVariant);
  } catch (error) {
    console.error('Accept all V1 rewrites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
