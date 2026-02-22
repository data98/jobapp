'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface ScoreGaugeProps {
  score: number;
  maxAchievable?: number | null;
  isEstimate?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getScoreColorClass(score: number): string {
  if (score >= 75) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function ScoreGauge({ score, maxAchievable, isEstimate }: ScoreGaugeProps) {
  const t = useTranslations('resumeView.matching');

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;
  const color = getScoreColor(score);

  // Max achievable tick
  const maxAngle = maxAchievable ? ((maxAchievable / 100) * 360 - 90) * (Math.PI / 180) : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 70 70)"
            className="transition-all duration-700 ease-out"
          />
          {/* Max achievable tick */}
          {maxAngle != null && maxAchievable != null && maxAchievable > score && (
            <circle
              cx={70 + (radius) * Math.cos(maxAngle)}
              cy={70 + (radius) * Math.sin(maxAngle)}
              r="4"
              fill="currentColor"
              className="text-muted-foreground"
            />
          )}
          {/* Score number */}
          <text
            x="70"
            y="66"
            textAnchor="middle"
            className={`text-3xl font-bold ${getScoreColorClass(score)}`}
            fill="currentColor"
          >
            {score}
          </text>
          <text
            x="70"
            y="84"
            textAnchor="middle"
            className="text-xs text-muted-foreground"
            fill="currentColor"
          >
            / 100
          </text>
        </svg>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium">{t('atsScore')}</span>
        {isEstimate && (
          <Badge variant="outline" className="text-xs">{t('estimatedScore')}</Badge>
        )}
        {maxAchievable != null && maxAchievable > 0 && (
          <span className="text-xs text-muted-foreground">
            {t('maxAchievable')}: {maxAchievable}
          </span>
        )}
      </div>
    </div>
  );
}
