'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Pencil, Key, FileText, Layout, Plus, ClipboardList } from 'lucide-react';
import type { ATSSuggestion } from '@/types';

interface SuggestionCardProps {
  suggestion: ATSSuggestion;
  onAccept: (id: string, editedText?: string) => void;
  onDismiss: (id: string) => void;
  isAccepted?: boolean;
}

function SuggestionIcon({ type }: { type: string }) {
  switch (type) {
    case 'keyword_addition': return <Key className="h-4 w-4" />;
    case 'bullet_rewrite':
    case 'summary_rewrite': return <Pencil className="h-4 w-4" />;
    case 'section_reorder': return <Layout className="h-4 w-4" />;
    case 'section_addition': return <Plus className="h-4 w-4" />;
    case 'master_resume_content': return <ClipboardList className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
}

export function SuggestionCard({ suggestion, onAccept, onDismiss, isAccepted }: SuggestionCardProps) {
  const t = useTranslations('resumeView.matching');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(suggestion.suggested_text ?? '');

  if (isAccepted) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="py-3 flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">{t('accepted')}</span>
          <span className="text-xs text-muted-foreground truncate flex-1 ml-2">{suggestion.explanation}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-3 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2">
          <div className="mt-0.5 text-muted-foreground">
            <SuggestionIcon type={suggestion.type} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{suggestion.explanation}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                {t('scoreImpact', { points: suggestion.estimated_score_impact })}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {suggestion.target_section}
              </Badge>
            </div>
          </div>
        </div>

        {/* Original vs Suggested text */}
        {suggestion.original_text && suggestion.suggested_text && (
          <div className="space-y-2">
            <div className="bg-muted/50 rounded p-2">
              <p className="text-xs text-muted-foreground mb-0.5">{t('accept').includes('Accept') ? 'Original' : ''}</p>
              <p className="text-xs line-through text-muted-foreground">{suggestion.original_text}</p>
            </div>
            {!editing ? (
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <p className="text-xs">{suggestion.suggested_text}</p>
              </div>
            ) : (
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="text-xs"
              />
            )}
          </div>
        )}

        {/* Keywords addressed */}
        {suggestion.keywords_addressed.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestion.keywords_addressed.map((kw, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={() => { onAccept(suggestion.id, editText); setEditing(false); }}>
                <Check className="mr-1 h-3 w-3" />
                {t('accept')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                {t('dismiss').includes('Dismiss') ? 'Cancel' : t('dismiss')}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={() => onAccept(suggestion.id)}>
                <Check className="mr-1 h-3 w-3" />
                {t('accept')}
              </Button>
              {(suggestion.type === 'bullet_rewrite' || suggestion.type === 'summary_rewrite') && (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="mr-1 h-3 w-3" />
                  {t('editAndAccept')}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => onDismiss(suggestion.id)}>
                <X className="mr-1 h-3 w-3" />
                {t('dismiss')}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
