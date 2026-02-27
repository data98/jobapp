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

    const { jobApplicationId, suggestionId } = await req.json();
    if (!jobApplicationId || !suggestionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const suggestion = recommendations.rewrite_suggestions.find(
      (s) => s.id === suggestionId
    );
    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    if (!suggestion.accepted) {
      return NextResponse.json(
        { error: 'Suggestion is not accepted' },
        { status: 400 }
      );
    }

    // Revert the change based on type
    const updates: Partial<ResumeVariant> = {};

    if (suggestion.type === 'bullet_rewrite') {
      if (
        suggestion.experience_index != null &&
        suggestion.bullet_index != null &&
        suggestion.original_text
      ) {
        const experience = [...(variant.experience as ExperienceEntry[])];
        if (
          experience[suggestion.experience_index] &&
          experience[suggestion.experience_index].bullets[
            suggestion.bullet_index
          ] !== undefined
        ) {
          experience[suggestion.experience_index] = {
            ...experience[suggestion.experience_index],
            bullets: experience[suggestion.experience_index].bullets.map(
              (b, i) =>
                i === suggestion.bullet_index
                  ? suggestion.original_text
                  : b
            ),
          };
          updates.experience = experience;
        }
      }
    } else if (suggestion.type === 'summary_rewrite') {
      if (suggestion.original_text) {
        updates.personal_info = {
          ...(variant.personal_info as PersonalInfo),
          summary: suggestion.original_text,
        };
      }
    } else if (suggestion.type === 'skill_addition') {
      const skills = [...(variant.skills as SkillEntry[])];
      const filtered = skills.filter(
        (s) => s.name.toLowerCase() !== suggestion.suggested_text.toLowerCase()
      );
      if (filtered.length !== skills.length) {
        updates.skills = filtered;
      }
    }

    // Save variant updates
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('resume_variant')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('job_application_id', jobApplicationId)
        .eq('user_id', userId);
    }

    // Mark suggestion as not accepted
    const updatedSuggestions = recommendations.rewrite_suggestions.map((s) =>
      s.id === suggestionId ? { ...s, accepted: false } : s
    );
    await supabase
      .from('ats_analysis')
      .update({
        recommendations: {
          ...recommendations,
          rewrite_suggestions: updatedSuggestions,
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
    console.error('Undo V1 rewrite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
