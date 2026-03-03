'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, FileText, Linkedin, Sparkles, Import } from 'lucide-react';
import type { ParsedResumeData } from './ResumeUploader';

interface ResumeImportDialogProps {
  onParsed: (data: ParsedResumeData) => void;
}

export function ResumeImportDialog({ onParsed }: ResumeImportDialogProps) {
  const t = useTranslations('resume');
  const [open, setOpen] = useState(false);
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
      setOpen(false);
    } catch {
      toast.error(t('parseError'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="sm:size-auto sm:px-4 sm:py-2 gap-2">
          <Import className="h-4 w-4" />
          <span className="hidden sm:inline">{t('importResume')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('importResume')}
          </DialogTitle>
          <DialogDescription>{t('importResumeDesc')}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* PDF Upload Option */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : fileName ? (
                <FileText className="h-6 w-6 text-primary" />
              ) : (
                <Upload className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">
                {uploading ? t('parsing') : t('importFromPdf')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {uploading && fileName ? fileName : t('importFromPdfDesc')}
              </p>
            </div>
          </button>

          {/* LinkedIn Option — Coming Soon */}
          <div className="relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/15 p-6 text-center opacity-50 cursor-not-allowed select-none">
            <Badge
              variant="secondary"
              className="absolute -top-2.5 right-3 text-[10px] uppercase tracking-wider"
            >
              {t('comingSoon')}
            </Badge>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2]/10">
              <Linkedin className="h-6 w-6 text-[#0A66C2]" />
            </div>
            <div>
              <p className="font-medium text-sm">{t('importFromLinkedin')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('importFromLinkedinDesc')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
