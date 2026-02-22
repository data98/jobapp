import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import type {
  ATSSuggestion,
  ResumeVariant,
  SkillEntry,
  ResumeSection,
} from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { job_application_id, suggestion_id, edited_text } = await req.json();
    if (!job_application_id || !suggestion_id) {
      return NextResponse.json(
        { error: 'Missing job_application_id or suggestion_id' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch ai_analysis and resume_variant
    const [analysisResult, variantResult] = await Promise.all([
      supabase
        .from('ai_analysis')
        .select('*')
        .eq('job_application_id', job_application_id)
        .single(),
      supabase
        .from('resume_variant')
        .select('*')
        .eq('job_application_id', job_application_id)
        .eq('user_id', userId)
        .single(),
    ]);

    const analysis = analysisResult.data;
    const variant = variantResult.data as ResumeVariant | null;

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }
    if (!variant) {
      return NextResponse.json(
        { error: 'Resume variant not found' },
        { status: 404 }
      );
    }

    // Find suggestion in raw_response.suggestions
    const suggestions: ATSSuggestion[] =
      analysis.raw_response?.suggestions ?? [];
    const suggestion = suggestions.find(
      (s: ATSSuggestion) => s.id === suggestion_id
    );

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    const textToApply = edited_text ?? suggestion.suggested_text;

    // Apply change based on type
    const updates: Partial<ResumeVariant> = {};

    switch (suggestion.type) {
      case 'bullet_rewrite': {
        const experience = [...variant.experience];
        const expIndex = suggestion.target_index;
        const bulletIdx = suggestion.bullet_index;
        if (
          expIndex != null &&
          bulletIdx != null &&
          experience[expIndex]?.bullets?.[bulletIdx] != null
        ) {
          experience[expIndex] = {
            ...experience[expIndex],
            bullets: experience[expIndex].bullets.map((b, i) =>
              i === bulletIdx ? (textToApply ?? b) : b
            ),
          };
          updates.experience = experience;
        }
        break;
      }

      case 'summary_rewrite': {
        if (textToApply) {
          updates.personal_info = {
            ...variant.personal_info,
            summary: textToApply,
          };
        }
        break;
      }

      case 'keyword_addition': {
        if (textToApply) {
          const skills = [...variant.skills];
          const exists = skills.some(
            (s) => s.name.toLowerCase() === textToApply.toLowerCase()
          );
          if (!exists) {
            const newSkill: SkillEntry = {
              id: crypto.randomUUID(),
              name: textToApply,
            };
            skills.push(newSkill);
            updates.skills = skills;
          }
        }
        break;
      }

      case 'section_reorder': {
        if (suggestion.suggested_text) {
          try {
            const newOrder = JSON.parse(suggestion.suggested_text) as ResumeSection[];
            updates.section_order = newOrder;
          } catch {
            // If suggested_text isn't JSON, try using ideal order from analysis
          }
        }
        break;
      }

      case 'section_addition': {
        const sectionName = suggestion.target_section as ResumeSection;
        if (
          sectionName &&
          !variant.included_sections.includes(sectionName)
        ) {
          updates.included_sections = [
            ...variant.included_sections,
            sectionName,
          ];
        }
        break;
      }

      case 'master_resume_content': {
        // For master_resume_content, the suggested_text contains what to add
        // The target_section tells us where
        if (suggestion.target_section === 'skills' && textToApply) {
          const skills = [...variant.skills];
          const exists = skills.some(
            (s) => s.name.toLowerCase() === textToApply.toLowerCase()
          );
          if (!exists) {
            skills.push({ id: crypto.randomUUID(), name: textToApply });
            updates.skills = skills;
          }
        }
        break;
      }
    }

    // Save updated variant
    if (Object.keys(updates).length > 0) {
      const { data: updatedVariant, error: updateError } = await supabase
        .from('resume_variant')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', variant.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Mark suggestion as accepted in rewrite_suggestions (backward compat)
      const rewriteSuggestions = analysis.rewrite_suggestions ?? [];
      const updatedRewrites = rewriteSuggestions.map(
        (s: { id: string; accepted: boolean }) =>
          s.id === suggestion_id ? { ...s, accepted: true } : s
      );

      await supabase
        .from('ai_analysis')
        .update({ rewrite_suggestions: updatedRewrites })
        .eq('id', analysis.id);

      return NextResponse.json(updatedVariant as ResumeVariant);
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error('Accept suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to accept suggestion' },
      { status: 500 }
    );
  }
}
