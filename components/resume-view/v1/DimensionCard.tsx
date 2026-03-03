'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface DimensionCardProps {
  name: string;
  label: string;
  score: number;
  weight: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 65) return 'text-yellow-600';
  if (score >= 45) return 'text-orange-600';
  return 'text-red-600';
}

function getProgressColor(score: number): string {
  if (score >= 80) return '[&>div]:bg-green-500';
  if (score >= 65) return '[&>div]:bg-yellow-500';
  if (score >= 45) return '[&>div]:bg-orange-500';
  return '[&>div]:bg-red-500';
}

export function DimensionCard({
  name,
  label,
  score,
  weight,
  children,
  defaultOpen = false,
}: DimensionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{label}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {weight}%
                </Badge>
                <span
                  className={`text-sm font-bold tabular-nums ${getScoreColor(score)}`}
                >
                  {score}
                </span>
              </div>
            </div>
            <Progress
              value={score}
              className={`h-1.5 ${getProgressColor(score)}`}
            />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-4 sm:pl-10 pr-3 pb-3 pt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
