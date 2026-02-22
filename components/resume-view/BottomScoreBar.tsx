'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import type { AiAnalysis, ClientScoreResult } from '@/types';

interface BottomScoreBarProps {
  analysisData: AiAnalysis | null;
  clientScores: ClientScoreResult | null;
  scoresStale: boolean;
}

export function BottomScoreBar({
  analysisData,
  clientScores,
  scoresStale,
}: BottomScoreBarProps) {
  const t = useTranslations('resumeView.matching');

  // No scores at all
  if (!analysisData && !clientScores) return null;

  const score = analysisData?.ats_score ?? clientScores?.composite ?? 0;
  const keywordScore = analysisData?.keyword_score ?? clientScores?.keyword_score ?? 0;
  const measurableScore = analysisData?.measurable_results_score ?? clientScores?.measurable_results_score ?? 0;
  const structureScore = analysisData?.structure_score ?? clientScores?.structure_score ?? 0;
  const isEstimate = !analysisData?.detailed_scores && !!clientScores;

  const scoreColor =
    score >= 75 ? 'text-green-600' :
    score >= 60 ? 'text-yellow-600' :
    score >= 40 ? 'text-orange-600' :
    'text-red-600';

  const progressColor =
    score >= 75 ? '[&>div]:bg-green-500' :
    score >= 60 ? '[&>div]:bg-yellow-500' :
    score >= 40 ? '[&>div]:bg-orange-500' :
    '[&>div]:bg-red-500';

  return (
    <div className="shrink-0 border-t bg-background px-4 py-2 mt-2">
      <div className="flex items-center gap-4">
        {/* Composite score */}
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${scoreColor}`}>{Math.round(score)}</span>
          <span className="text-xs text-muted-foreground">{t('atsScore')}</span>
          {isEstimate && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {t('estimated')}
            </Badge>
          )}
          {scoresStale && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 text-yellow-600 border-yellow-300">
              {t('staleScores')}
            </Badge>
          )}
        </div>

        {/* Mini breakdowns */}
        <div className="flex-1 flex items-center gap-3">
          <MiniMetric label={t('keywords')} score={keywordScore} />
          <MiniMetric label={t('measurableResults')} score={measurableScore} />
          <MiniMetric label={t('structure')} score={structureScore} />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, score }: { label: string; score: number }) {
  const barColor =
    score >= 75 ? '[&>div]:bg-green-500' :
    score >= 60 ? '[&>div]:bg-yellow-500' :
    score >= 40 ? '[&>div]:bg-orange-500' :
    '[&>div]:bg-red-500';

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline">{label}</span>
      <Progress value={score} className={`h-1.5 w-16 ${barColor}`} />
      <span className="text-[10px] font-medium w-6 text-right">{Math.round(score)}</span>
    </div>
  );
}
