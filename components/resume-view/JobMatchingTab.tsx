'use client';

import { useState, useTransition, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import { MetricBreakdown } from './MetricBreakdown';
import { SuggestionCard } from './SuggestionCard';
import {
  runAnalysis,
  acceptSuggestion,
  dismissSuggestion,
  recalculateScore,
} from '@/lib/actions/analysis';
import type {
  JobApplication,
  ResumeVariant,
  MasterResume,
  AiAnalysis,
  ClientScoreResult,
  ATSSuggestion,
  DetailedScores,
} from '@/types';

interface JobMatchingTabProps {
  application: JobApplication;
  currentVariant: ResumeVariant;
  masterResume: MasterResume | null;
  analysisData: AiAnalysis | null;
  clientScores: ClientScoreResult | null;
  scoresStale: boolean;
  onAnalysisUpdate: (analysis: AiAnalysis) => void;
  onVariantUpdate: (variant: ResumeVariant) => void;
  onScoresStaleChange: (stale: boolean) => void;
}

type SuggestionFilter = 'all' | 'keyword' | 'measurable_result' | 'structure';

export function JobMatchingTab({
  application,
  currentVariant,
  masterResume,
  analysisData,
  clientScores,
  scoresStale,
  onAnalysisUpdate,
  onVariantUpdate,
  onScoresStaleChange,
}: JobMatchingTabProps) {
  const t = useTranslations('resumeView.matching');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<SuggestionFilter>('all');
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [recalculating, setRecalculating] = useState(false);

  const canAnalyze = !!application.job_description;
  const hasDetailedScores = !!analysisData?.detailed_scores;

  // Get scores (prefer server, fallback to client estimates)
  const displayScore = analysisData?.ats_score ?? clientScores?.composite ?? 0;
  const isEstimate = !analysisData?.detailed_scores && !!clientScores;
  const maxAchievable = analysisData?.max_achievable_score ?? clientScores?.max_achievable;

  // Get suggestions from raw_response
  const allSuggestions: ATSSuggestion[] =
    (analysisData?.raw_response as { suggestions?: ATSSuggestion[] })?.suggestions ?? [];
  const dismissedIds = new Set(analysisData?.dismissed_suggestions ?? []);

  const visibleSuggestions = allSuggestions
    .filter((s) => !dismissedIds.has(s.id) && !acceptedIds.has(s.id))
    .filter((s) => filter === 'all' || s.category === filter)
    .sort((a, b) => b.estimated_score_impact - a.estimated_score_impact);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await runAnalysis(application.id);
      onAnalysisUpdate(result);
      onScoresStaleChange(false);
      setAcceptedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAccept = useCallback(async (suggestionId: string, editedText?: string) => {
    startTransition(async () => {
      try {
        const updated = await acceptSuggestion(application.id, suggestionId, editedText);
        onVariantUpdate(updated);
        setAcceptedIds((prev) => new Set([...prev, suggestionId]));

        // Background recalculate
        setRecalculating(true);
        try {
          const scores = await recalculateScore(application.id);
          if (analysisData) {
            onAnalysisUpdate({
              ...analysisData,
              ats_score: scores.composite,
              keyword_score: scores.keyword_score,
              measurable_results_score: scores.measurable_results_score,
              structure_score: scores.structure_score,
              max_achievable_score: scores.max_achievable,
            });
          }
        } catch { /* score will recalculate client-side */ }
        setRecalculating(false);
      } catch {
        setError('Failed to accept suggestion');
      }
    });
  }, [application.id, analysisData, onAnalysisUpdate, onVariantUpdate]);

  const handleDismiss = useCallback(async (suggestionId: string) => {
    startTransition(async () => {
      try {
        await dismissSuggestion(application.id, suggestionId);
        if (analysisData) {
          onAnalysisUpdate({
            ...analysisData,
            dismissed_suggestions: [...(analysisData.dismissed_suggestions ?? []), suggestionId],
          });
        }
      } catch {
        setError('Failed to dismiss suggestion');
      }
    });
  }, [application.id, analysisData, onAnalysisUpdate]);

  const handleAcceptAll = async () => {
    for (const s of visibleSuggestions) {
      await handleAccept(s.id);
    }
  };

  // ─── No analysis state ─────────────────────────────────────────────
  if (!analysisData || !hasDetailedScores) {
    return (
      <div className="space-y-6">
        {/* Show old score if available */}
        {analysisData && !hasDetailedScores && (
          <div className="space-y-4">
            <ScoreGauge score={analysisData.ats_score} />
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-sm text-muted-foreground">{t('reanalyzeFull')}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-center py-8 space-y-4">
          {!analysisData && (
            <p className="text-muted-foreground">{t('noAnalysis')}</p>
          )}
          {!canAnalyze && (
            <p className="text-sm text-muted-foreground">{t('noJobDescription')}</p>
          )}
          <Button onClick={handleAnalyze} disabled={!canAnalyze || analyzing}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('analyzing')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {analysisData ? t('reanalyze') : t('runAnalysis')}
              </>
            )}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  const detailedScores = analysisData.detailed_scores as DetailedScores | null;

  // Qualitative indicator
  let qualitativeMessage: string | null = null;
  if (maxAchievable != null) {
    if (maxAchievable < 60) qualitativeMessage = t('underqualified');
    else if (maxAchievable > 80) qualitativeMessage = t('wellQualified');
  }

  return (
    <div className="space-y-6">
      {/* Stale scores banner */}
      {scoresStale && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800 flex-1">{t('staleScores')}</span>
          <Button size="sm" variant="outline" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : t('reanalyze')}
          </Button>
        </div>
      )}

      {/* Score gauge + re-analyze */}
      <div className="flex items-start justify-between gap-4">
        <ScoreGauge
          score={displayScore}
          maxAchievable={maxAchievable}
          isEstimate={isEstimate || recalculating}
        />
        <div className="space-y-2">
          <Button size="sm" variant="outline" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                {t('analyzing')}
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3 w-3" />
                {t('reanalyze')}
              </>
            )}
          </Button>
          {qualitativeMessage && (
            <p className="text-xs text-muted-foreground">{qualitativeMessage}</p>
          )}
        </div>
      </div>

      {/* Metric breakdown */}
      <MetricBreakdown
        detailedScores={detailedScores}
        keywordScore={analysisData.keyword_score}
        measurableResultsScore={analysisData.measurable_results_score}
        structureScore={analysisData.structure_score}
      />

      <Separator />

      {/* Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t('suggestions')}</h3>
          {visibleSuggestions.length > 0 && (
            <Button size="sm" variant="secondary" onClick={handleAcceptAll} disabled={isPending}>
              {t('acceptAll')}
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1.5">
          {([
            ['all', t('filterAll')],
            ['keyword', t('filterKeywords')],
            ['measurable_result', t('filterResults')],
            ['structure', t('filterStructure')],
          ] as [SuggestionFilter, string][]).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? 'default' : 'outline'}
              onClick={() => setFilter(key)}
              className="h-7 text-xs"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Suggestion cards */}
        {visibleSuggestions.length > 0 ? (
          visibleSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('noMoreSuggestions')}
          </p>
        )}

        {/* Show accepted suggestions */}
        {acceptedIds.size > 0 && (
          <div className="space-y-2 opacity-75">
            {allSuggestions
              .filter((s) => acceptedIds.has(s.id))
              .map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  onAccept={handleAccept}
                  onDismiss={handleDismiss}
                  isAccepted
                />
              ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
