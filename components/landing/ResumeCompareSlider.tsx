'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';
import Image from 'next/image';

export function ResumeCompareSlider() {
  const t = useTranslations('landing');
  const [inset, setInset] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setInset(pct);
  }, []);

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      updatePosition(e.touches[0].clientX);
    },
    [updatePosition]
  );

  return (
    <section className="py-14 md:py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium">
            {t('compareBadge')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {t('compareHeading')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('compareSubtitle')}
          </p>
        </div>

        <div
          ref={containerRef}
          className="landing-fade-in relative w-full rounded-2xl overflow-hidden select-none cursor-col-resize border shadow-lg"
          style={{ aspectRatio: '3024 / 1888' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          {/* Base layer — optimized resume (After) */}
          <Image
            src="/images/compare-slider/after-light.png"
            alt="AI-Optimized Resume"
            fill
            priority
            className="object-contain dark:hidden"
          />
          <Image
            src="/images/compare-slider/after-dark.png"
            alt="AI-Optimized Resume"
            fill
            priority
            className="object-contain hidden dark:block"
          />

          {/* Top layer — un-optimized resume (Before, clipped) */}
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 0 0 ${inset}%)` }}
          >
            <Image
              src="/images/compare-slider/before-light.png"
              alt="Un-optimized Resume"
              fill
              className="object-contain dark:hidden"
            />
            <Image
              src="/images/compare-slider/before-dark.png"
              alt="Un-optimized Resume"
              fill
              className="object-contain hidden dark:block"
            />
          </div>

          {/* Divider */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white dark:bg-white/80 z-10 -translate-x-1/2 shadow-[0_0_8px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            style={{ left: `${inset}%` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white dark:bg-neutral-800 border-2 border-white/80 dark:border-white/30 shadow-lg flex items-center justify-center">
              <GripVertical className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
