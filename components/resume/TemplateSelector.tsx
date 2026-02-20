'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { TemplateId } from '@/types';

interface TemplateSelectorProps {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
}

const templates: TemplateId[] = ['classic', 'modern', 'minimal'];

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const t = useTranslations('resume');

  const labelMap: Record<TemplateId, string> = {
    classic: t('templateClassic'),
    modern: t('templateModern'),
    minimal: t('templateMinimal'),
  };

  return (
    <div className="flex gap-2">
      {templates.map((id) => (
        <Button
          key={id}
          variant={value === id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(id)}
        >
          {labelMap[id]}
        </Button>
      ))}
    </div>
  );
}
