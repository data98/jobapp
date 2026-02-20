'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import type { RewriteSuggestion } from '@/types';

interface RewriteCardProps {
  suggestion: RewriteSuggestion;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export function RewriteCard({ suggestion, onAccept, onReject }: RewriteCardProps) {
  const t = useTranslations('analysis');
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(suggestion.id);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(suggestion.id);
    } finally {
      setLoading(false);
    }
  };

  if (suggestion.accepted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {t('accepted')}
            </span>
          </div>
          <p className="text-sm">{suggestion.suggested_text}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('original')}
          </p>
          <p className="text-sm bg-muted/50 rounded p-2">
            {suggestion.original_text}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('suggested')}
          </p>
          <p className="text-sm bg-primary/5 rounded p-2 border border-primary/10">
            {suggestion.suggested_text}
          </p>
        </div>
        {suggestion.keywords_addressed.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {t('keywordsAddressed')}
            </p>
            <div className="flex flex-wrap gap-1">
              {suggestion.keywords_addressed.map((kw) => (
                <Badge key={kw} variant="secondary" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={loading}
          >
            <Check className="mr-1 h-3 w-3" />
            {t('accept')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={loading}
          >
            <X className="mr-1 h-3 w-3" />
            {t('reject')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
