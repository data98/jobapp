'use client';

import { useState, useTransition, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Sparkles, Plus, ArrowRight, Check } from 'lucide-react';
import { ScoreGauge } from '../ScoreGauge';
import { DimensionCard } from './DimensionCard';
import { KeywordDimensionDetails } from './KeywordDimensionDetails';
import { ExperienceDimensionDetails } from './ExperienceDimensionDetails';
import { HardRequirementsDimensionDetails } from './HardRequirementsDimensionDetails';
import { QualityDimensionDetails } from './QualityDimensionDetails';
import { SkillsDepthDimensionDetails } from './SkillsDepthDimensionDetails';
import { V1RewriteCard } from './V1RewriteCard';
import {
  runV1Analysis,
  acceptV1Rewrite,
  acceptAllV1Rewrites,
  undoV1Rewrite,
} from '@/lib/actions/analysis';
import { SCORE_WEIGHTS } from '@/lib/ats-scoring/v1/score-computation';
import type {
  JobApplication,
  ResumeVariant,
  ATSAnalysis,
  V1RewriteSuggestion,
} from '@/types';

interface V1JobMatchingTabProps {
  application: JobApplication;
  currentVariant: ResumeVariant;
  v1Analysis: ATSAnalysis | null;
  onV1AnalysisUpdate: (analysis: ATSAnalysis) => void;
  onVariantUpdate: (variant: ResumeVariant) => void;
}

const TIER_LABELS = {
  excellent: 'scoreTierExcellent',
  good: 'scoreTierGood',
  needs_work: 'scoreTierNeedsWork',
  poor: 'scoreTierPoor',
} as const;

const TIER_COLORS = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  needs_work: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800',
} as const;

const DIMENSION_LABELS = {
  keyword_match: 'keywordMatch',
  experience_relevance: 'experienceRelevance',
  hard_requirements: 'hardRequirements',
  resume_quality: 'resumeQuality',
  skills_depth: 'skillsDepth',
} as const;

export function V1JobMatchingTab({
  application,
  currentVariant,
  v1Analysis,
  onV1AnalysisUpdate,
  onVariantUpdate,
}: V1JobMatchingTabProps) {
  const t = useTranslations('resumeView.matching');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [acceptingAll, setAcceptingAll] = useState(false);

  const canAnalyze = !!application.job_description;

  // ─── Analyze handler ──────────────────────────────────────────────
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await runV1Analysis(application.id);
      onV1AnalysisUpdate(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Accept single rewrite ───────────────────────────────────────
  const handleAcceptRewrite = useCallback(
    (suggestionId: string, editedText?: string) => {
      startTransition(async () => {
        try {
          const updatedVariant = await acceptV1Rewrite(
            application.id,
            suggestionId,
            editedText
          );
          onVariantUpdate(updatedVariant);

          // Mark suggestion as accepted in local state
          if (v1Analysis) {
            const updatedSuggestions =
              v1Analysis.recommendations.rewrite_suggestions.map((s) =>
                s.id === suggestionId ? { ...s, accepted: true } : s
              );
            onV1AnalysisUpdate({
              ...v1Analysis,
              recommendations: {
                ...v1Analysis.recommendations,
                rewrite_suggestions: updatedSuggestions,
              },
            });
          }
        } catch {
          setError('Failed to accept rewrite');
        }
      });
    },
    [application.id, v1Analysis, onV1AnalysisUpdate, onVariantUpdate]
  );

  // ─── Dismiss rewrite (mark accepted locally to hide it) ──────────
  const handleDismissRewrite = useCallback(
    (suggestionId: string) => {
      if (!v1Analysis) return;
      const updatedSuggestions =
        v1Analysis.recommendations.rewrite_suggestions.filter(
          (s) => s.id !== suggestionId
        );
      onV1AnalysisUpdate({
        ...v1Analysis,
        recommendations: {
          ...v1Analysis.recommendations,
          rewrite_suggestions: updatedSuggestions,
        },
      });
    },
    [v1Analysis, onV1AnalysisUpdate]
  );

  // ─── Undo accepted rewrite ─────────────────────────────────────
  const handleUndoRewrite = useCallback(
    (suggestionId: string) => {
      startTransition(async () => {
        try {
          const updatedVariant = await undoV1Rewrite(
            application.id,
            suggestionId
          );
          onVariantUpdate(updatedVariant);

          if (v1Analysis) {
            const updatedSuggestions =
              v1Analysis.recommendations.rewrite_suggestions.map((s) =>
                s.id === suggestionId ? { ...s, accepted: false } : s
              );
            onV1AnalysisUpdate({
              ...v1Analysis,
              recommendations: {
                ...v1Analysis.recommendations,
                rewrite_suggestions: updatedSuggestions,
              },
            });
          }
        } catch {
          setError('Failed to undo rewrite');
        }
      });
    },
    [application.id, v1Analysis, onV1AnalysisUpdate, onVariantUpdate]
  );

  // ─── Accept all rewrites ─────────────────────────────────────────
  const handleAcceptAll = async () => {
    setAcceptingAll(true);
    try {
      const updatedVariant = await acceptAllV1Rewrites(application.id);
      onVariantUpdate(updatedVariant);

      if (v1Analysis) {
        const allAccepted =
          v1Analysis.recommendations.rewrite_suggestions.map((s) => ({
            ...s,
            accepted: true,
          }));
        onV1AnalysisUpdate({
          ...v1Analysis,
          recommendations: {
            ...v1Analysis.recommendations,
            rewrite_suggestions: allAccepted,
          },
        });
      }
    } catch {
      setError('Failed to accept all rewrites');
    } finally {
      setAcceptingAll(false);
    }
  };

  // ─── No analysis state ───────────────────────────────────────────
  if (!v1Analysis) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">{t('v1NoAnalysis')}</p>
        {!canAnalyze && (
          <p className="text-sm text-muted-foreground">
            {t('noJobDescription')}
          </p>
        )}
        <Button onClick={handleAnalyze} disabled={!canAnalyze || analyzing}>
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('v1Analyzing')}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('runV1Analysis')}
            </>
          )}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // ─── Analysis available ──────────────────────────────────────────
  const { recommendations, dimension_scores } = v1Analysis;

  const pendingRewrites = recommendations.rewrite_suggestions.filter(
    (s) => !s.accepted
  );
  const acceptedRewrites = recommendations.rewrite_suggestions.filter(
    (s) => s.accepted
  );

  // Sort pending by impact: high → medium → low
  const impactOrder = { high: 0, medium: 1, low: 2 };
  const sortedPending = [...pendingRewrites].sort(
    (a, b) =>
      impactOrder[a.estimated_score_impact] -
      impactOrder[b.estimated_score_impact]
  );

  // Find dimension data for the detail components
  const findDimension = (name: string) =>
    dimension_scores.find((d) => d.name === name);

  return (
    <div className="space-y-6">
      {/* Score gauge + tier + re-analyze */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <ScoreGauge score={v1Analysis.ats_score} />
          <div className="space-y-1">
            <Badge
              className={
                TIER_COLORS[v1Analysis.score_tier] ?? TIER_COLORS.poor
              }
            >
              {t(
                TIER_LABELS[v1Analysis.score_tier] ?? 'scoreTierPoor'
              )}
            </Badge>
            <Badge variant="outline" className="text-xs block w-fit">
              {t('analysisVersion')}
            </Badge>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              {t('v1Analyzing')}
            </>
          ) : (
            <>
              <Sparkles className="mr-1.5 h-3 w-3" />
              {t('reanalyze')}
            </>
          )}
        </Button>
      </div>

      {/* 5 Dimension Cards */}
      <div className="space-y-1">
        {dimension_scores.map((dim) => (
          <DimensionCard
            key={dim.name}
            name={dim.name}
            label={t(DIMENSION_LABELS[dim.name as keyof typeof DIMENSION_LABELS] ?? dim.name)}
            score={dim.score}
            weight={Math.round(dim.weight * 100)}
            defaultOpen={dim.name === v1Analysis.weakest_areas[0]?.name}
          >
            {dim.name === 'keyword_match' && (
              <KeywordDimensionDetails data={v1Analysis.keyword_match} />
            )}
            {dim.name === 'experience_relevance' && (
              <ExperienceDimensionDetails
                data={v1Analysis.experience_relevance}
              />
            )}
            {dim.name === 'hard_requirements' && (
              <HardRequirementsDimensionDetails
                data={v1Analysis.hard_requirements}
              />
            )}
            {dim.name === 'resume_quality' && (
              <QualityDimensionDetails data={v1Analysis.resume_quality} />
            )}
            {dim.name === 'skills_depth' && (
              <SkillsDepthDimensionDetails data={v1Analysis.skills_depth} />
            )}
          </DimensionCard>
        ))}
      </div>

      <Separator />

      {/* Overall Strategy */}
      {recommendations.overall_strategy && (
        <Card>
          <CardContent className="py-3 px-4">
            <h3 className="text-sm font-semibold mb-1">
              {t('overallStrategy')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {recommendations.overall_strategy}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Suggestion */}
      {recommendations.summary_suggestion?.needed && (
        <Card>
          <CardContent className="py-3 px-4 space-y-2">
            <h3 className="text-sm font-semibold">{t('summaryNeeded')}</h3>
            {recommendations.summary_suggestion.current && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                {recommendations.summary_suggestion.current}
              </div>
            )}
            <div className="text-sm rounded p-2 border border-green-400">
              <ArrowRight className="h-3 w-3 text-green-600 inline mr-1" />
              {recommendations.summary_suggestion.suggested}
            </div>
            {recommendations.summary_suggestion.keywords_addressed.length >
              0 && (
              <div className="flex flex-wrap gap-1">
                {recommendations.summary_suggestion.keywords_addressed.map(
                  (kw) => (
                    <Badge
                      key={kw}
                      variant="default"
                      className="text-[10px] bg-green-600"
                    >
                      {kw}
                    </Badge>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Skills to Add */}
      {recommendations.skills_to_add.length > 0 && (
        <Card>
          <CardContent className="py-3 px-4 space-y-2">
            <h3 className="text-sm font-semibold">{t('skillsToAdd')}</h3>
            <div className="space-y-1.5">
              {recommendations.skills_to_add.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-start gap-2 text-sm"
                >
                  <Plus className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                  <div>
                    <span className="font-medium">{skill.name}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] ml-1.5 align-middle"
                    >
                      {skill.importance}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {skill.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewrite Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t('suggestions')}</h3>
          {pendingRewrites.length > 1 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAcceptAll}
              disabled={acceptingAll || isPending}
            >
              {acceptingAll ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3 w-3" />
              )}
              {t('acceptAllRewrites')}
            </Button>
          )}
        </div>

        {sortedPending.length > 0 ? (
          sortedPending.map((suggestion) => (
            <V1RewriteCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={handleAcceptRewrite}
              onDismiss={handleDismissRewrite}
              disabled={isPending}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('noRecommendations')}
          </p>
        )}

        {/* Accepted rewrites */}
        {acceptedRewrites.length > 0 && (
          <div className="space-y-2">
            {acceptedRewrites.map((suggestion) => (
              <V1RewriteCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={handleAcceptRewrite}
                onDismiss={handleDismissRewrite}
                onUndo={handleUndoRewrite}
                disabled={isPending}
              />
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
