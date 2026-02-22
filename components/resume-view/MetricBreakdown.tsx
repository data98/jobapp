'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DetailedScores } from '@/types';

interface MetricBreakdownProps {
  detailedScores: DetailedScores | null;
  keywordScore: number | null;
  measurableResultsScore: number | null;
  structureScore: number | null;
}

function ScoreBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono">{score}/100</span>
          <span className="text-muted-foreground">{weight}%</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function MetricBreakdown({
  detailedScores,
  keywordScore,
  measurableResultsScore,
  structureScore,
}: MetricBreakdownProps) {
  const t = useTranslations('resumeView.matching');
  const [openMetric, setOpenMetric] = useState<string | null>(null);

  const kScore = keywordScore ?? detailedScores?.keyword_usage?.score ?? 0;
  const mScore = measurableResultsScore ?? detailedScores?.measurable_results?.score ?? 0;
  const sScore = structureScore ?? detailedScores?.structure?.score ?? 0;

  return (
    <div className="space-y-3">
      {/* Keyword Usage */}
      <Collapsible open={openMetric === 'keyword'} onOpenChange={(open) => setOpenMetric(open ? 'keyword' : null)}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ScoreBar label={t('keywordUsage')} score={kScore} weight={40} />
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openMetric === 'keyword' ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {detailedScores?.keyword_usage && (
            <>
              {/* Matched */}
              {detailedScores.keyword_usage.matched_keywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1.5">{t('matchedKeywords')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailedScores.keyword_usage.matched_keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                        {kw.keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Missing */}
              {detailedScores.keyword_usage.missing_keywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1.5">{t('missingKeywords')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailedScores.keyword_usage.missing_keywords.map((kw, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className={`text-xs ${
                          kw.importance === 'critical'
                            ? 'text-red-700 border-red-300 bg-red-50'
                            : kw.importance === 'important'
                            ? 'text-orange-700 border-orange-300 bg-orange-50'
                            : 'text-gray-600 border-gray-300'
                        }`}
                      >
                        {kw.keyword}
                        {kw.in_master_resume && (
                          <span className="ml-1 text-blue-500">*</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-blue-500">*</span> {t('inMasterResume')}
                  </p>
                </div>
              )}
              {/* Synonyms */}
              {detailedScores.keyword_usage.synonym_matches.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1.5">{t('synonymMatch')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailedScores.keyword_usage.synonym_matches.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-yellow-700 border-yellow-300 bg-yellow-50">
                        {s.expected} &rarr; {s.found}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Measurable Results */}
      <Collapsible open={openMetric === 'results'} onOpenChange={(open) => setOpenMetric(open ? 'results' : null)}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ScoreBar label={t('measurableResults')} score={mScore} weight={40} />
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openMetric === 'results' ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-2">
          {detailedScores?.measurable_results && (
            <>
              <p className="text-xs text-muted-foreground">
                {t('bulletsWithMetrics', {
                  count: detailedScores.measurable_results.bullets_with_metrics,
                  total: detailedScores.measurable_results.total_bullets,
                })}
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {detailedScores.measurable_results.bullet_assessments.map((ba, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    {ba.has_metric ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                    )}
                    <span className="text-muted-foreground line-clamp-2">{ba.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Structure */}
      <Collapsible open={openMetric === 'structure'} onOpenChange={(open) => setOpenMetric(open ? 'structure' : null)}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ScoreBar label={t('resumeStructure')} score={sScore} weight={20} />
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openMetric === 'structure' ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-2">
          {detailedScores?.structure && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded p-2">
                  <p className="text-muted-foreground">{t('sectionOrder')}</p>
                  <p className="font-mono">{detailedScores.structure.section_order_score}/100</p>
                </div>
                <div className="border rounded p-2">
                  <p className="text-muted-foreground">{t('completeness')}</p>
                  <p className="font-mono">{detailedScores.structure.completeness_score}/100</p>
                </div>
                <div className="border rounded p-2">
                  <p className="text-muted-foreground">{t('summaryLength')}</p>
                  <p className="font-mono">{detailedScores.structure.summary_score}/100</p>
                  <p className="text-muted-foreground mt-0.5">
                    {t('words', { count: detailedScores.structure.summary_word_count })}
                  </p>
                </div>
                <div className="border rounded p-2">
                  <p className="text-muted-foreground">{t('pageLength')}</p>
                  <p className="font-mono">{detailedScores.structure.page_length_score}/100</p>
                  <p className="text-muted-foreground mt-0.5">
                    {detailedScores.structure.estimated_pages} / {detailedScores.structure.ideal_pages}
                  </p>
                </div>
              </div>
              {detailedScores.structure.bullet_count_details.length > 0 && (
                <div>
                  <p className="font-medium mb-1">{t('bulletCount')}</p>
                  {detailedScores.structure.bullet_count_details.map((d, i) => (
                    <p key={i} className="text-muted-foreground">
                      {d.company}: {t('bullets', { current: d.current, ideal: d.ideal })}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
