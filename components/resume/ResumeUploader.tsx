'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, FileText, Sparkles } from 'lucide-react';
import type {
  PersonalInfo,
  ExperienceEntry,
  EducationEntry,
  SkillEntry,
  LanguageEntry,
  CertificationEntry,
  ProjectEntry,
} from '@/types';

export interface ParsedResumeData {
  personal_info: PersonalInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
}

interface ResumeUploaderProps {
  onParsed: (data: ParsedResumeData) => void;
}

export function ResumeUploader({ onParsed }: ResumeUploaderProps) {
  const t = useTranslations('resume');
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error(t('uploadPdfOnly'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('uploadTooLarge'));
      return;
    }

    setFileName(file.name);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Parse failed');
      }

      const parsed: ParsedResumeData = await res.json();
      toast.success(t('parseSuccess'));
      onParsed(parsed);
    } catch {
      toast.error(t('parseError'));
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-uploaded
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('uploadSection')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50 cursor-pointer"
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />

          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">{t('parsing')}</p>
                {fileName && (
                  <p className="text-sm text-muted-foreground">{fileName}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                {fileName ? (
                  <FileText className="h-7 w-7 text-primary" />
                ) : (
                  <Upload className="h-7 w-7 text-primary" />
                )}
              </div>
              <div className="text-center">
                <p className="font-medium">{t('uploadPrompt')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('uploadHint')}
                </p>
              </div>
              <Button variant="outline" disabled={uploading}>
                {t('selectFile')}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
