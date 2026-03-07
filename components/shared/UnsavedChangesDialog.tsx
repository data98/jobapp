'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  const t = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('unsavedChangesTitle')}</DialogTitle>
          <DialogDescription>{t('unsavedChangesDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('stayOnPage')}
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            {t('discardChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
