'use client';

import type { ResumeVariant, TemplateId } from '@/types';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';

interface ResumePreviewProps {
  data: ResumeVariant;
  labels: Record<string, string>;
}

export function ResumePreview({ data, labels }: ResumePreviewProps) {
  const Template = getTemplate(data.template_id);
  return <Template data={data} labels={labels} />;
}

function getTemplate(id: TemplateId) {
  switch (id) {
    case 'modern':
      return ModernTemplate;
    case 'minimal':
      return MinimalTemplate;
    default:
      return ClassicTemplate;
  }
}
