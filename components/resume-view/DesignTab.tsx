'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PresentationSubTab } from './PresentationSubTab';
import { SectionsSubTab } from './SectionsSubTab';
import type {
  TemplateId,
  DesignSettings,
  ResumeSection,
  AiAnalysis,
} from '@/types';

interface DesignTabProps {
  templateId: TemplateId;
  designSettings: DesignSettings;
  includedSections: ResumeSection[];
  sectionOrder: ResumeSection[];
  analysisData: AiAnalysis | null;
  onTemplateChange: (v: TemplateId) => void;
  onDesignSettingsChange: (v: DesignSettings) => void;
  onIncludedSectionsChange: (v: ResumeSection[]) => void;
  onSectionOrderChange: (v: ResumeSection[]) => void;
}

export function DesignTab({
  templateId,
  designSettings,
  includedSections,
  sectionOrder,
  analysisData,
  onTemplateChange,
  onDesignSettingsChange,
  onIncludedSectionsChange,
  onSectionOrderChange,
}: DesignTabProps) {
  const t = useTranslations('resumeView.design');

  return (
    <Tabs defaultValue="presentation" className="space-y-4">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="presentation">{t('presentation')}</TabsTrigger>
        <TabsTrigger value="sections">{t('sections')}</TabsTrigger>
      </TabsList>

      <TabsContent value="presentation">
        <PresentationSubTab
          templateId={templateId}
          designSettings={designSettings}
          onTemplateChange={onTemplateChange}
          onDesignSettingsChange={onDesignSettingsChange}
        />
      </TabsContent>

      <TabsContent value="sections">
        <SectionsSubTab
          includedSections={includedSections}
          sectionOrder={sectionOrder}
          analysisData={analysisData}
          onIncludedSectionsChange={onIncludedSectionsChange}
          onSectionOrderChange={onSectionOrderChange}
        />
      </TabsContent>
    </Tabs>
  );
}
