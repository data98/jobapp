'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import { KeywordChips } from './KeywordChips';
import { ImprovementList } from './ImprovementList';
import { RewriteCard } from './RewriteCard';
import {
  acceptRewrite,
  acceptAllRewrites,
  rejectRewrite,
} from '@/lib/actions/analysis';
import type { AiAnalysis, JobApplication, MatchingStrength } from '@/types';

interface AnalysisContentProps {
  application: JobApplication;
  analysis: AiAnalysis | null;
  hasResume: boolean;
}

export function AnalysisContent({
  application,
  analysis: initialAnalysis,
  hasResume,
}: AnalysisContentProps) {
  const t = useTranslations('analysis');
  const router = useRouter();
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [analyzing, setAnalyzing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = !!application.job_description && hasResume;

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobApplicationId: application.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to analyze');
      }

      const result = await res.json();
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAccept = async (suggestionId: string) => {
    startTransition(async () => {
      await acceptRewrite(application.id, suggestionId);
      // Update local state
      if (analysis) {
        setAnalysis({
          ...analysis,
          rewrite_suggestions: analysis.rewrite_suggestions.map((s) =>
            s.id === suggestionId ? { ...s, accepted: true } : s
          ),
        });
      }
    });
  };

  const handleReject = async (suggestionId: string) => {
    startTransition(async () => {
      await rejectRewrite(application.id, suggestionId);
      if (analysis) {
        setAnalysis({
          ...analysis,
          rewrite_suggestions: analysis.rewrite_suggestions.filter(
            (s) => s.id !== suggestionId
          ),
        });
      }
    });
  };

  const handleAcceptAll = async () => {
    startTransition(async () => {
      await acceptAllRewrites(application.id);
      if (analysis) {
        setAnalysis({
          ...analysis,
          rewrite_suggestions: analysis.rewrite_suggestions.map((s) => ({
            ...s,
            accepted: true,
          })),
        });
      }
    });
  };

  // No analysis yet — show run button
  if (!analysis) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">{t('noAnalysis')}</p>
          {!application.job_description && (
            <p className="text-sm text-muted-foreground">
              {t('noJobDescription')}
            </p>
          )}
          {!hasResume && (
            <p className="text-sm text-muted-foreground">{t('noResume')}</p>
          )}
          <Button onClick={runAnalysis} disabled={!canAnalyze || analyzing}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('analyzing')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('runAnalysis')}
              </>
            )}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  const hasAcceptedRewrites = analysis.rewrite_suggestions.some(
    (s) => s.accepted
  );
  const hasPendingRewrites = analysis.rewrite_suggestions.some(
    (s) => !s.accepted
  );

  return (
    <div className="space-y-6">
      {/* Re-analyze button */}
      <div className="flex items-center justify-between">
        <div />
        <Button
          variant="outline"
          onClick={runAnalysis}
          disabled={analyzing}
          size="sm"
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('analyzing')}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('runAnalysis')}
            </>
          )}
        </Button>
      </div>

      {/* Score + Summary */}
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <ScoreGauge score={analysis.ats_score} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('summary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{analysis.summary}</p>
          </CardContent>
        </Card>
      </div>

      {hasAcceptedRewrites && (
        <p className="text-sm text-muted-foreground italic">
          {t('reanalyze')}
        </p>
      )}

      {/* Matching Strengths */}
      {analysis.matching_strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('strengths')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.matching_strengths.map(
                (s: MatchingStrength, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30"
                  >
                    <p className="text-sm font-medium">{s.area}</p>
                    <p className="text-sm text-muted-foreground">{s.detail}</p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Keywords */}
      <KeywordChips keywords={analysis.missing_keywords} />

      {/* Improvement Areas */}
      <ImprovementList improvements={analysis.improvement_areas} />

      {/* Rewrite Suggestions */}
      {analysis.rewrite_suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{t('rewrites')}</h3>
            {hasPendingRewrites && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAcceptAll}
                disabled={isPending}
              >
                {t('acceptAll')}
              </Button>
            )}
          </div>
          {analysis.rewrite_suggestions.map((suggestion) => (
            <RewriteCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
