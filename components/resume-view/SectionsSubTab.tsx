'use client';

import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { GripVertical, CheckCircle2 } from 'lucide-react';
import type { ResumeSection, AiAnalysis, IdealResume } from '@/types';

interface SectionsSubTabProps {
  includedSections: ResumeSection[];
  sectionOrder: ResumeSection[];
  analysisData: AiAnalysis | null;
  onIncludedSectionsChange: (v: ResumeSection[]) => void;
  onSectionOrderChange: (v: ResumeSection[]) => void;
}

const SECTION_LABEL_KEYS: Record<ResumeSection, string> = {
  personal_info: 'personalInfo',
  experience: 'experience',
  education: 'education',
  skills: 'skills',
  languages: 'languages',
  certifications: 'certifications',
  projects: 'projects',
};

function SortableSection({
  section,
  isVisible,
  onToggle,
  idealOrder,
}: {
  section: ResumeSection;
  isVisible: boolean;
  onToggle: () => void;
  idealOrder: string[] | null;
}) {
  const tr = useTranslations('resume');
  const td = useTranslations('resumeView.design');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border rounded-lg px-3 py-2 bg-background"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm">
        {tr(SECTION_LABEL_KEYS[section])}
      </span>
      <Switch
        checked={isVisible}
        onCheckedChange={onToggle}
        aria-label={isVisible ? td('hideSection') : td('showSection')}
      />
    </div>
  );
}

export function SectionsSubTab({
  includedSections,
  sectionOrder,
  analysisData,
  onIncludedSectionsChange,
  onSectionOrderChange,
}: SectionsSubTabProps) {
  const t = useTranslations('resumeView.design');
  const tr = useTranslations('resume');

  const idealResume = analysisData?.ideal_resume as IdealResume | null;
  const idealOrder = idealResume?.ideal_structure?.section_order ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as ResumeSection);
      const newIndex = sectionOrder.indexOf(over.id as ResumeSection);
      onSectionOrderChange(arrayMove(sectionOrder, oldIndex, newIndex));
    }
  };

  const toggleSection = (section: ResumeSection) => {
    if (includedSections.includes(section)) {
      onIncludedSectionsChange(includedSections.filter((s) => s !== section));
    } else {
      onIncludedSectionsChange([...includedSections, section]);
    }
  };

  // Check if current order matches ideal
  const currentVisibleOrder = sectionOrder.filter((s) => includedSections.includes(s));
  const isOptimalOrder = idealOrder
    ? JSON.stringify(currentVisibleOrder) === JSON.stringify(idealOrder)
    : false;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t('dragToReorder')}</CardTitle>
            {isOptimalOrder && idealOrder && (
              <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t('optimalOrder')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sectionOrder}
              strategy={verticalListSortingStrategy}
            >
              {sectionOrder.map((section) => (
                <SortableSection
                  key={section}
                  section={section}
                  isVisible={includedSections.includes(section)}
                  onToggle={() => toggleSection(section)}
                  idealOrder={idealOrder}
                />
              ))}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Recommended order reference */}
      {idealOrder && idealOrder.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">{t('recommendedOrder')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {idealOrder.map((section, idx) => (
                <Badge key={section} variant="secondary" className="text-xs">
                  {idx + 1}. {tr(SECTION_LABEL_KEYS[section as ResumeSection] ?? section)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
