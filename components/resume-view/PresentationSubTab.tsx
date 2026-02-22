'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { TemplateId, DesignSettings } from '@/types';

const FONT_OPTIONS = [
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial / Helvetica' },
  { value: 'Garamond, serif', label: 'Garamond' },
  { value: 'Calibri, sans-serif', label: 'Calibri' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
];

const ACCENT_PRESETS = [
  '#0D9488', '#1E3A5F', '#800020', '#228B22',
  '#36454F', '#6A5ACD', '#E8634A', '#B8860B',
];

const TEXT_COLOR_PRESETS = [
  { value: '#000000', label: 'Black' },
  { value: '#333333', label: 'Dark Gray' },
  { value: '#444444', label: 'Charcoal' },
];

interface PresentationSubTabProps {
  templateId: TemplateId;
  designSettings: DesignSettings;
  onTemplateChange: (v: TemplateId) => void;
  onDesignSettingsChange: (v: DesignSettings) => void;
}

export function PresentationSubTab({
  templateId,
  designSettings,
  onTemplateChange,
  onDesignSettingsChange,
}: PresentationSubTabProps) {
  const t = useTranslations('resumeView.design');
  const tr = useTranslations('resume');

  const update = (partial: Partial<DesignSettings>) => {
    onDesignSettingsChange({ ...designSettings, ...partial });
  };

  return (
    <div className="space-y-4">
      {/* Template Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('template')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(['classic', 'modern', 'minimal'] as TemplateId[]).map((tid) => (
              <button
                key={tid}
                onClick={() => onTemplateChange(tid)}
                className={`border-2 rounded-lg p-3 text-center text-sm transition-colors ${
                  templateId === tid
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                {tid === 'classic' ? tr('templateClassic') : tid === 'modern' ? tr('templateModern') : tr('templateMinimal')}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('font')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">{t('font')}</Label>
            <Select value={designSettings.font_family} onValueChange={(v) => update({ font_family: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">{t('fontSize')}</Label>
              <span className="text-xs text-muted-foreground">{designSettings.font_size}pt</span>
            </div>
            <Slider
              min={9}
              max={12}
              step={0.5}
              value={[designSettings.font_size]}
              onValueChange={([v]) => update({ font_size: v })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">{t('lineHeight')}</Label>
              <span className="text-xs text-muted-foreground">{designSettings.line_height}</span>
            </div>
            <Slider
              min={1.0}
              max={2.0}
              step={0.1}
              value={[designSettings.line_height]}
              onValueChange={([v]) => update({ line_height: Math.round(v * 10) / 10 })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">{t('listLineHeight')}</Label>
              <span className="text-xs text-muted-foreground">{designSettings.list_line_height}</span>
            </div>
            <Slider
              min={1.0}
              max={2.0}
              step={0.1}
              value={[designSettings.list_line_height]}
              onValueChange={([v]) => update({ list_line_height: Math.round(v * 10) / 10 })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('accentColor')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">{t('accentColor')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={designSettings.accent_color}
                onChange={(e) => update({ accent_color: e.target.value })}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => update({ accent_color: color })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      designSettings.accent_color === color ? 'border-primary scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{t('textColor')}</Label>
            <div className="flex gap-2">
              {TEXT_COLOR_PRESETS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ text_color: opt.value })}
                  className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs ${
                    designSettings.text_color === opt.value ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.value }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spacing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('sectionSpacing')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">{t('sectionSpacing')}</Label>
            <div className="flex gap-2">
              {(['compact', 'normal', 'relaxed'] as const).map((opt) => (
                <Button
                  key={opt}
                  variant={designSettings.section_spacing === opt ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => update({ section_spacing: opt })}
                >
                  {t(opt)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{t('margins')}</Label>
            <div className="flex gap-2">
              {[
                { label: t('narrow'), margins: { top: 24, bottom: 24, left: 24, right: 24 } },
                { label: t('normal'), margins: { top: 40, bottom: 40, left: 40, right: 40 } },
                { label: t('wide'), margins: { top: 56, bottom: 56, left: 56, right: 56 } },
              ].map((opt) => {
                const isActive =
                  designSettings.margins.top === opt.margins.top &&
                  designSettings.margins.left === opt.margins.left;
                return (
                  <Button
                    key={opt.label}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => update({ margins: opt.margins })}
                  >
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
