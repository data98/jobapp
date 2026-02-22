'use client';

import type { ResumeVariant, ResumeSection, DesignSettings } from '@/types';

interface ClassicTemplateProps {
  data: ResumeVariant;
  labels: Record<string, string>;
}

const SPACING_MAP = { compact: '0.75rem', normal: '1rem', relaxed: '1.5rem' };

export function ClassicTemplate({ data, labels }: ClassicTemplateProps) {
  const sections = data.included_sections ?? [];
  const show = (s: ResumeSection) => sections.includes(s);
  const ds = data.design_settings;
  const order = data.section_order?.length
    ? data.section_order.filter((s) => show(s))
    : sections;

  const sectionSpacing = SPACING_MAP[ds?.section_spacing ?? 'normal'];
  const margins = ds?.margins ?? { top: 40, bottom: 40, left: 40, right: 40 };

  const containerStyle: React.CSSProperties = {
    fontFamily: ds?.font_family ?? 'Georgia',
    fontSize: `${ds?.font_size ?? 10}pt`,
    lineHeight: ds?.line_height ?? 1.4,
    color: ds?.text_color ?? '#000000',
    padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
  };

  const listStyle: React.CSSProperties = {
    lineHeight: ds?.list_line_height ?? 1.2,
  };

  const accentColor = ds?.accent_color ?? '#000000';

  const renderSection = (s: ResumeSection) => {
    switch (s) {
      case 'personal_info': return null; // rendered as header, outside order loop
      case 'experience':
        if (!data.experience.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.experience}
            </h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">{exp.title}</span>
                  <span style={{ fontSize: '0.75em', color: '#6b7280' }}>
                    {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="flex justify-between" style={{ fontSize: '0.75em', color: '#4b5563' }}>
                  <span>{exp.company}</span>
                  {exp.location && <span>{exp.location}</span>}
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5" style={{ ...listStyle, fontSize: '0.75em' }}>
                    {exp.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
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
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.education}
            </h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">{edu.degree} — {edu.field}</span>
                  <span style={{ fontSize: '0.75em', color: '#6b7280' }}>{edu.startDate} — {edu.endDate}</span>
                </div>
                <div style={{ fontSize: '0.75em', color: '#4b5563' }}>
                  {edu.institution}{edu.gpa && <span> | GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </section>
        );
      case 'skills':
        if (!data.skills.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.skills}
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span key={skill.id} className="rounded" style={{ fontSize: '0.75em', backgroundColor: '#f3f4f6', padding: '1px 8px' }}>
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        );
      case 'languages':
        if (!data.languages.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.languages}
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-1" style={{ fontSize: '0.75em' }}>
              {data.languages.map((l) => <span key={l.id}>{l.language} — {l.proficiency}</span>)}
            </div>
          </section>
        );
      case 'certifications':
        if (!data.certifications.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.certifications}
            </h2>
            {data.certifications.map((cert) => (
              <div key={cert.id} style={{ fontSize: '0.75em' }} className="mb-1">
                <span className="font-bold">{cert.name}</span>
                {cert.issuer && <span> — {cert.issuer}</span>}
                {cert.date && <span style={{ color: '#6b7280' }}> ({cert.date})</span>}
              </div>
            ))}
          </section>
        );
      case 'projects':
        if (!data.projects.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.projects}
            </h2>
            {data.projects.map((proj) => (
              <div key={proj.id} className="mb-2">
                <span className="font-bold" style={{ fontSize: '0.75em' }}>{proj.name}</span>
                {proj.url && <span style={{ fontSize: '0.75em', color: '#6b7280' }} className="ml-2">{proj.url}</span>}
                {proj.description && <p style={{ fontSize: '0.75em', color: '#374151' }} className="mt-0.5">{proj.description}</p>}
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5" style={{ ...listStyle, fontSize: '0.75em' }}>
                    {proj.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
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
      {/* Header — always first */}
      {show('personal_info') && (
        <div className="text-center pb-4 mb-4" style={{ borderBottom: `2px solid ${accentColor}` }}>
          <h1 className="text-2xl font-bold tracking-wide uppercase">
            {data.personal_info.fullName}
          </h1>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2" style={{ fontSize: '0.75em', color: '#4b5563' }}>
            {data.personal_info.email && <span>{data.personal_info.email}</span>}
            {data.personal_info.phone && <span>{data.personal_info.phone}</span>}
            {data.personal_info.location && <span>{data.personal_info.location}</span>}
            {data.personal_info.linkedIn && <span>{data.personal_info.linkedIn}</span>}
            {data.personal_info.portfolio && <span>{data.personal_info.portfolio}</span>}
          </div>
          {data.personal_info.summary && (
            <p className="mt-3 max-w-2xl mx-auto" style={{ fontSize: '0.75em', color: '#374151' }}>
              {data.personal_info.summary}
            </p>
          )}
        </div>
      )}

      {/* Ordered sections */}
      {order.map(renderSection)}
    </div>
  );
}
