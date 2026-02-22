'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  MasterResume,
  SkillEntry,
  ExperienceEntry,
  CertificationEntry,
  ProjectEntry,
  LanguageEntry,
  KeywordMap,
  ResumeSection,
} from '@/types';

type ModalSection = 'skills' | 'experience' | 'certifications' | 'projects' | 'languages';

interface AddFromMasterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: ModalSection;
  masterResume: MasterResume;
  currentSkills: SkillEntry[];
  currentExperience: ExperienceEntry[];
  currentCertifications: CertificationEntry[];
  currentProjects: ProjectEntry[];
  currentLanguages: LanguageEntry[];
  keywordMap: KeywordMap | null;
  onAddSkills: (skills: SkillEntry[]) => void;
  onAddExperience: (entries: ExperienceEntry[]) => void;
  onAddCertifications: (entries: CertificationEntry[]) => void;
  onAddProjects: (entries: ProjectEntry[]) => void;
  onAddLanguages: (entries: LanguageEntry[]) => void;
}

export function AddFromMasterModal({
  open,
  onOpenChange,
  section,
  masterResume,
  currentSkills,
  currentExperience,
  currentCertifications,
  currentProjects,
  currentLanguages,
  keywordMap,
  onAddSkills,
  onAddExperience,
  onAddCertifications,
  onAddProjects,
  onAddLanguages,
}: AddFromMasterModalProps) {
  const t = useTranslations('resumeView.preview');
  const tr = useTranslations('resume');
  const tc = useTranslations('common');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Get items not already in variant
  const availableItems = useMemo(() => {
    switch (section) {
      case 'skills': {
        const currentIds = new Set(currentSkills.map((s) => s.id));
        return masterResume.skills.filter((s) => !currentIds.has(s.id));
      }
      case 'experience': {
        const currentIds = new Set(currentExperience.map((e) => e.id));
        return masterResume.experience.filter((e) => !currentIds.has(e.id));
      }
      case 'certifications': {
        const currentIds = new Set(currentCertifications.map((c) => c.id));
        return masterResume.certifications.filter((c) => !currentIds.has(c.id));
      }
      case 'projects': {
        const currentIds = new Set(currentProjects.map((p) => p.id));
        return masterResume.projects.filter((p) => !currentIds.has(p.id));
      }
      case 'languages': {
        const currentIds = new Set(currentLanguages.map((l) => l.id));
        return masterResume.languages.filter((l) => !currentIds.has(l.id));
      }
      default:
        return [];
    }
  }, [section, masterResume, currentSkills, currentExperience, currentCertifications, currentProjects, currentLanguages]);

  // All keyword strings for highlighting
  const allKeywords = useMemo(() => {
    if (!keywordMap) return new Set<string>();
    const all = [
      ...keywordMap.hard_skills,
      ...keywordMap.soft_skills,
      ...keywordMap.industry_terms,
      ...keywordMap.qualifications,
      ...keywordMap.action_verbs,
    ];
    return new Set(all.map((k) => k.keyword.toLowerCase()));
  }, [keywordMap]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const selectedItems = (availableItems as { id: string }[]).filter((item) =>
      selected.has(item.id)
    );

    switch (section) {
      case 'skills':
        onAddSkills(selectedItems as SkillEntry[]);
        break;
      case 'experience':
        onAddExperience(selectedItems as ExperienceEntry[]);
        break;
      case 'certifications':
        onAddCertifications(selectedItems as CertificationEntry[]);
        break;
      case 'projects':
        onAddProjects(selectedItems as ProjectEntry[]);
        break;
      case 'languages':
        onAddLanguages(selectedItems as LanguageEntry[]);
        break;
    }

    setSelected(new Set());
    onOpenChange(false);
  };

  const sectionTitle = tr(
    section === 'skills' ? 'skills' :
    section === 'experience' ? 'experience' :
    section === 'certifications' ? 'certifications' :
    section === 'projects' ? 'projects' :
    'languages'
  );

  const isKeywordMatch = (text: string) => {
    const lower = text.toLowerCase();
    for (const kw of allKeywords) {
      if (lower.includes(kw)) return true;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('addFromMaster')} — {sectionTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-2">
          {availableItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('noItemsToAdd')}
            </p>
          ) : (
            <div className="space-y-2">
              {availableItems.map((item) => {
                const id = (item as { id: string }).id;
                const isChecked = selected.has(id);

                return (
                  <label
                    key={id}
                    className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggle(id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      {section === 'skills' && (
                        <SkillItem item={item as SkillEntry} isMatch={isKeywordMatch((item as SkillEntry).name)} />
                      )}
                      {section === 'experience' && (
                        <ExperienceItem item={item as ExperienceEntry} isKeywordMatch={isKeywordMatch} />
                      )}
                      {section === 'certifications' && (
                        <CertItem item={item as CertificationEntry} isMatch={isKeywordMatch((item as CertificationEntry).name)} />
                      )}
                      {section === 'projects' && (
                        <ProjectItem item={item as ProjectEntry} isKeywordMatch={isKeywordMatch} />
                      )}
                      {section === 'languages' && (
                        <LangItem item={item as LanguageEntry} />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleAdd} disabled={selected.size === 0}>
            {t('addSelected')} ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SkillItem({ item, isMatch }: { item: SkillEntry; isMatch: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{item.name}</span>
      {isMatch && <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">keyword</Badge>}
    </div>
  );
}

function ExperienceItem({ item, isKeywordMatch }: { item: ExperienceEntry; isKeywordMatch: (t: string) => boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{item.title}</div>
      <div className="text-xs text-muted-foreground">
        {item.company} · {item.startDate} – {item.current ? 'Present' : item.endDate}
      </div>
      {item.bullets.length > 0 && (
        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
          {item.bullets.slice(0, 3).map((b, i) => (
            <li key={i} className="flex items-start gap-1">
              <span>•</span>
              <span className={isKeywordMatch(b) ? 'text-green-700' : ''}>{b}</span>
            </li>
          ))}
          {item.bullets.length > 3 && (
            <li className="text-muted-foreground">+{item.bullets.length - 3} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

function CertItem({ item, isMatch }: { item: CertificationEntry; isMatch: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div>
        <span className="text-sm">{item.name}</span>
        {item.issuer && <span className="text-xs text-muted-foreground ml-1">({item.issuer})</span>}
      </div>
      {isMatch && <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">keyword</Badge>}
    </div>
  );
}

function ProjectItem({ item, isKeywordMatch }: { item: ProjectEntry; isKeywordMatch: (t: string) => boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{item.name}</div>
      {item.description && (
        <div className="text-xs text-muted-foreground">{item.description}</div>
      )}
      {item.bullets.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {item.bullets.slice(0, 2).map((b, i) => (
            <li key={i} className="flex items-start gap-1">
              <span>•</span>
              <span className={isKeywordMatch(b) ? 'text-green-700' : ''}>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LangItem({ item }: { item: LanguageEntry }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{item.language}</span>
      {item.proficiency && (
        <span className="text-xs text-muted-foreground">({item.proficiency})</span>
      )}
    </div>
  );
}
