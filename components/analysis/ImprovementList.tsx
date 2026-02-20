'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ImprovementArea } from '@/types';

interface ImprovementListProps {
  improvements: ImprovementArea[];
}

export function ImprovementList({ improvements }: ImprovementListProps) {
  const t = useTranslations('analysis');

  if (improvements.length === 0) return null;

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...improvements].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return t('priorityHigh');
      case 'medium':
        return t('priorityMedium');
      default:
        return t('priorityLow');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('improvements')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sorted.map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={getPriorityVariant(item.priority)}>
                  {getPriorityLabel(item.priority)}
                </Badge>
                <span className="text-sm font-medium capitalize">
                  {item.section}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{item.issue}</p>
              <p className="text-sm">{item.suggestion}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
