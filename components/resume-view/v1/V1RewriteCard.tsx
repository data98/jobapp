'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Pencil, ArrowRight, Undo2 } from 'lucide-react';
import type { V1RewriteSuggestion } from '@/types';

interface V1RewriteCardProps {
  suggestion: V1RewriteSuggestion;
  onAccept: (id: string, editedText?: string) => void;
  onDismiss: (id: string) => void;
  onUndo?: (id: string) => void;
  disabled?: boolean;
}

const IMPACT_COLORS = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
};

export function V1RewriteCard({
  suggestion,
  onAccept,
  onDismiss,
  onUndo,
  disabled,
}: V1RewriteCardProps) {
  const t = useTranslations('resumeView.matching');
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestion.suggested_text);

  if (suggestion.accepted) {
    return (
      <Card className="border-green-400">
        <CardContent className="py-3 px-4 space-y-2">
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-green-500">
                <Check className="h-4 w-4" />
                <span className="font-medium">{t('accepted')}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {suggestion.type.replace('_', ' ')}
              </Badge>
              <Badge className={`text-[10px] ${IMPACT_COLORS[suggestion.estimated_score_impact]}`}>
                {t(`impact${suggestion.estimated_score_impact.charAt(0).toUpperCase() + suggestion.estimated_score_impact.slice(1)}` as 'impactHigh' | 'impactMedium' | 'impactLow')}
              </Badge>
            </div>
            {/* Undo action */}
            {onUndo && (
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUndo(suggestion.id)}
                  disabled={disabled}
                  className="h-7 text-xs text-muted-foreground"
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  {t('undoRewrite')}
                </Button>
              </div>
            )}
          </div>

          {/* Original → Applied text */}
          {suggestion.original_text && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              {suggestion.original_text}
            </div>
          )}
          <div className="text-sm rounded p-2 border border-green-400">
            {suggestion.original_text && (
              <ArrowRight className="h-3 w-3 text-green-600 inline mr-1" />
            )}
            {suggestion.suggested_text}
          </div>

          {/* Keywords addressed */}
          {suggestion.keywords_addressed.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestion.keywords_addressed.map((kw) => (
                <Badge key={kw} variant="default" className="text-[10px] bg-green-600">
                  {kw}
                </Badge>
              ))}
            </div>
          )}

          {/* Explanation */}
          <p className="text-xs text-muted-foreground">
            {suggestion.impact_explanation}
          </p>


        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-3 px-4 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-[10px] ${IMPACT_COLORS[suggestion.estimated_score_impact]}`}>
            {t(`impact${suggestion.estimated_score_impact.charAt(0).toUpperCase() + suggestion.estimated_score_impact.slice(1)}` as 'impactHigh' | 'impactMedium' | 'impactLow')}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {suggestion.type.replace('_', ' ')}
          </Badge>
          {suggestion.improvement_types.map((type) => (
            <Badge key={type} variant="secondary" className="text-[10px]">
              {t(`improvement${type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}` as 'improvementMissingKeyword')}
            </Badge>
          ))}
        </div>

        {/* Original → Suggested */}
        {suggestion.original_text && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            {suggestion.original_text}
          </div>
        )}

        {editing ? (
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={3}
            className="text-sm"
          />
        ) : (
          <div className="text-sm rounded p-2 border border-green-400">
            {suggestion.original_text && (
              <ArrowRight className="h-3 w-3 text-green-600 inline mr-1" />
            )}
            {suggestion.suggested_text}
          </div>
        )}

        {/* Keywords addressed */}
        {suggestion.keywords_addressed.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestion.keywords_addressed.map((kw) => (
              <Badge key={kw} variant="default" className="text-[10px] bg-green-600">
                {kw}
              </Badge>
            ))}
          </div>
        )}

        {/* Explanation */}
        <p className="text-xs text-muted-foreground">
          {suggestion.impact_explanation}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {editing ? (
            <>
              <Button
                size="sm"
                onClick={() => {
                  onAccept(suggestion.id, editedText);
                  setEditing(false);
                }}
                disabled={disabled}
                className="h-7 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                {t('acceptRewrite')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditedText(suggestion.suggested_text);
                  setEditing(false);
                }}
                className="h-7 text-xs"
              >
                {t('dismissRewrite')}
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => onAccept(suggestion.id)}
                disabled={disabled}
                className="h-7 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                {t('acceptRewrite')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                disabled={disabled}
                className="h-7 text-xs"
              >
                <Pencil className="h-3 w-3 mr-1" />
                {t('editAndAccept')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss(suggestion.id)}
                disabled={disabled}
                className="h-7 text-xs text-muted-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                {t('dismissRewrite')}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
