'use client';

import type { ResumeVariant, ResumeSection } from '@/types';

interface MinimalTemplateProps {
  data: ResumeVariant;
  labels: Record<string, string>;
}

const SPACING_MAP = { compact: '1rem', normal: '1.5rem', relaxed: '2rem' };

export function MinimalTemplate({ data, labels }: MinimalTemplateProps) {
  const sections = data.included_sections ?? [];
  const show = (s: ResumeSection) => sections.includes(s);
  const ds = data.design_settings;
  const order = data.section_order?.length
    ? data.section_order.filter((s) => show(s))
    : sections;

  const sectionSpacing = SPACING_MAP[ds?.section_spacing ?? 'normal'];
  const margins = ds?.margins ?? { top: 40, bottom: 40, left: 40, right: 40 };
  const accentColor = ds?.accent_color ?? '#9ca3af';

  const containerStyle: React.CSSProperties = {
    fontFamily: ds?.font_family ?? 'system-ui, sans-serif',
    fontSize: `${ds?.font_size ?? 10}pt`,
    lineHeight: ds?.line_height ?? 1.5,
    color: ds?.text_color ?? '#000000',
    padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
  };

  const listStyle: React.CSSProperties = {
    lineHeight: ds?.list_line_height ?? 1.2,
  };

  const renderSection = (s: ResumeSection) => {
    switch (s) {
      case 'personal_info': return null;
      case 'experience':
        if (!data.experience.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-4" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.experience}
            </h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium">{exp.title}</span>
                    <span style={{ color: accentColor }} className="mx-2">·</span>
                    <span style={{ color: '#6b7280' }}>{exp.company}</span>
                  </div>
                  <span className="shrink-0" style={{ fontSize: '0.75em', color: accentColor }}>
                    {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-1.5 space-y-1" style={{ ...listStyle, fontSize: '0.75em', color: '#4b5563' }}>
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="pl-4 relative">
                        <span className="absolute left-0" style={{ color: '#d1d5db' }}>–</span>{b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        );
      case 'education':
        if (!data.education.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-4" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.education}
            </h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2 flex justify-between">
                <div>
                  <span className="font-medium">{edu.degree}</span>
                  {edu.field && <span style={{ color: '#6b7280' }}> in {edu.field}</span>}
                  <span style={{ color: accentColor }} className="mx-2">·</span>
                  <span style={{ color: '#6b7280' }}>{edu.institution}</span>
                </div>
                <span className="shrink-0" style={{ fontSize: '0.75em', color: accentColor }}>
                  {edu.startDate} — {edu.endDate}
                </span>
              </div>
            ))}
          </section>
        );
      case 'skills':
        if (!data.skills.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.skills}
            </h2>
            <p style={{ fontSize: '0.75em', color: '#4b5563' }}>
              {data.skills.map((sk) => sk.name).join(' · ')}
            </p>
          </section>
        );
      case 'languages':
        if (!data.languages.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.languages}
            </h2>
            <p style={{ fontSize: '0.75em', color: '#4b5563' }}>
              {data.languages.map((l) => `${l.language} (${l.proficiency})`).join(' · ')}
            </p>
          </section>
        );
      case 'certifications':
        if (!data.certifications.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.certifications}
            </h2>
            <div style={{ fontSize: '0.75em', color: '#4b5563' }} className="space-y-0.5">
              {data.certifications.map((cert) => (
                <p key={cert.id}>{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}</p>
              ))}
            </div>
          </section>
        );
      case 'projects':
        if (!data.projects.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-4" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.projects}
            </h2>
            {data.projects.map((proj) => (
              <div key={proj.id} className="mb-3">
                <span className="font-medium" style={{ fontSize: '0.75em' }}>{proj.name}</span>
                {proj.description && <p style={{ fontSize: '0.75em', color: '#6b7280' }} className="mt-0.5">{proj.description}</p>}
                {proj.bullets.length > 0 && (
                  <ul className="mt-1 space-y-0.5" style={{ ...listStyle, fontSize: '0.75em', color: '#4b5563' }}>
                    {proj.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="pl-4 relative">
                        <span className="absolute left-0" style={{ color: '#d1d5db' }}>–</span>{b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        );
      default: return null;
    }
  };

  return (
    <div className="bg-white max-w-[210mm] mx-auto shadow-lg" style={containerStyle}>
      {/* Header */}
      {show('personal_info') && (
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="font-light tracking-tight" style={{ fontSize: '2em' }}>
            {data.personal_info.fullName}
          </h1>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2" style={{ fontSize: '0.75em', color: '#6b7280' }}>
            {data.personal_info.email && <span>{data.personal_info.email}</span>}
            {data.personal_info.phone && <span>{data.personal_info.phone}</span>}
            {data.personal_info.location && <span>{data.personal_info.location}</span>}
            {data.personal_info.linkedIn && <span>{data.personal_info.linkedIn}</span>}
            {data.personal_info.portfolio && <span>{data.personal_info.portfolio}</span>}
          </div>
          {data.personal_info.summary && (
            <p className="mt-4" style={{ fontSize: '0.75em', color: '#4b5563', lineHeight: '1.6' }}>
              {data.personal_info.summary}
            </p>
          )}
        </div>
      )}

      {order.map(renderSection)}
    </div>
  );
}
