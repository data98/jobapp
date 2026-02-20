import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { ClassicPDF } from '@/components/resume/templates/pdf/ClassicPDF';
import type { ResumeVariant } from '@/types';
import { createElement } from 'react';

// Section labels per locale
const sectionLabels: Record<string, Record<string, string>> = {
  en: {
    summary: 'Professional Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    languages: 'Languages',
    certifications: 'Certifications',
    projects: 'Projects',
  },
  ru: {
    summary: 'Профессиональное резюме',
    experience: 'Опыт работы',
    education: 'Образование',
    skills: 'Навыки',
    languages: 'Языки',
    certifications: 'Сертификаты',
    projects: 'Проекты',
  },
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobApplicationId = searchParams.get('id');
    const locale = searchParams.get('locale') || 'en';

    if (!jobApplicationId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: variant, error } = await supabase
      .from('resume_variant')
      .select('*')
      .eq('job_application_id', jobApplicationId)
      .eq('user_id', session.user.id)
      .single();

    if (error || !variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const labels = sectionLabels[locale] || sectionLabels.en;
    const variantData = variant as ResumeVariant;

    // All templates use the same ClassicPDF for now — can be expanded per template_id
    const element = createElement(ClassicPDF, { data: variantData, labels });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${jobApplicationId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
