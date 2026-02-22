'use client';

import type { ResumeVariant, ResumeSection } from '@/types';

interface ModernTemplateProps {
  data: ResumeVariant;
  labels: Record<string, string>;
}

const SIDEBAR_SECTIONS: ResumeSection[] = ['skills', 'languages', 'certifications'];
const MAIN_SECTIONS: ResumeSection[] = ['experience', 'education', 'projects'];

export function ModernTemplate({ data, labels }: ModernTemplateProps) {
  const sections = data.included_sections ?? [];
  const show = (s: ResumeSection) => sections.includes(s);
  const ds = data.design_settings;
  const order = data.section_order?.length
    ? data.section_order.filter((s) => show(s))
    : sections;

  const sidebarOrder = order.filter((s) => SIDEBAR_SECTIONS.includes(s));
  const mainOrder = order.filter((s) => MAIN_SECTIONS.includes(s));

  const accentColor = ds?.accent_color ?? '#1e293b';
  const margins = ds?.margins ?? { top: 0, bottom: 0, left: 0, right: 0 };

  const containerStyle: React.CSSProperties = {
    fontFamily: ds?.font_family ?? 'system-ui, sans-serif',
    fontSize: `${ds?.font_size ?? 10}pt`,
    lineHeight: ds?.line_height ?? 1.4,
    color: ds?.text_color ?? '#000000',
  };

  const listStyle: React.CSSProperties = {
    lineHeight: ds?.list_line_height ?? 1.2,
  };

  const renderSidebarSection = (s: ResumeSection) => {
    switch (s) {
      case 'skills':
        if (!data.skills.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-2" style={{ fontSize: '0.75em', color: `${accentColor}99` }}>
              {labels.skills}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill) => (
                <span key={skill.id} className="rounded" style={{ fontSize: '0.75em', backgroundColor: `${accentColor}20`, padding: '1px 8px' }}>
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        );
      case 'languages':
        if (!data.languages.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-2" style={{ fontSize: '0.75em', color: `${accentColor}99` }}>
              {labels.languages}
            </h2>
            <div className="space-y-1" style={{ fontSize: '0.75em' }}>
              {data.languages.map((l) => (
                <p key={l.id}>{l.language} <span style={{ opacity: 0.7 }}>— {l.proficiency}</span></p>
              ))}
            </div>
          </div>
        );
      case 'certifications':
        if (!data.certifications.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-2" style={{ fontSize: '0.75em', color: `${accentColor}99` }}>
              {labels.certifications}
            </h2>
            <div className="space-y-1.5" style={{ fontSize: '0.75em' }}>
              {data.certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="font-semibold">{cert.name}</p>
                  {cert.issuer && <p style={{ opacity: 0.7 }}>{cert.issuer}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderMainSection = (s: ResumeSection) => {
    switch (s) {
      case 'experience':
        if (!data.experience.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-3" style={{ fontSize: '0.75em', color: '#64748b' }}>
              {labels.experience}
            </h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold" style={{ fontSize: '1em' }}>{exp.title}</span>
                  <span style={{ fontSize: '0.75em', color: '#9ca3af' }}>
                    {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <p style={{ fontSize: '0.75em', color: '#6b7280' }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5" style={{ ...listStyle, fontSize: '0.75em', color: '#374151' }}>
                    {exp.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );
      case 'education':
        if (!data.education.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-3" style={{ fontSize: '0.75em', color: '#64748b' }}>
              {labels.education}
            </h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">{edu.degree} — {edu.field}</span>
                  <span style={{ fontSize: '0.75em', color: '#9ca3af' }}>{edu.startDate} — {edu.endDate}</span>
                </div>
                <p style={{ fontSize: '0.75em', color: '#6b7280' }}>{edu.institution}</p>
              </div>
            ))}
          </div>
        );
      case 'projects':
        if (!data.projects.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-3" style={{ fontSize: '0.75em', color: '#64748b' }}>
              {labels.projects}
            </h2>
            {data.projects.map((proj) => (
              <div key={proj.id} className="mb-2">
                <span className="font-bold" style={{ fontSize: '0.75em' }}>{proj.name}</span>
                {proj.description && <p style={{ fontSize: '0.75em', color: '#4b5563' }} className="mt-0.5">{proj.description}</p>}
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5" style={{ ...listStyle, fontSize: '0.75em', color: '#374151' }}>
                    {proj.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="bg-white max-w-[210mm] mx-auto shadow-lg flex" style={containerStyle}>
      {/* Sidebar */}
      <div className="w-1/3 text-white p-6 space-y-5" style={{ backgroundColor: accentColor }}>
        {show('personal_info') && (
          <div>
            <h1 className="text-xl font-bold leading-tight">
              {data.personal_info.fullName}
            </h1>
            <div className="mt-3 space-y-1" style={{ fontSize: '0.75em', opacity: 0.8 }}>
              {data.personal_info.email && <p>{data.personal_info.email}</p>}
              {data.personal_info.phone && <p>{data.personal_info.phone}</p>}
              {data.personal_info.location && <p>{data.personal_info.location}</p>}
              {data.personal_info.linkedIn && <p>{data.personal_info.linkedIn}</p>}
              {data.personal_info.portfolio && <p>{data.personal_info.portfolio}</p>}
            </div>
          </div>
        )}

        {sidebarOrder.map(renderSidebarSection)}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 space-y-5">
        {show('personal_info') && data.personal_info.summary && (
          <div>
            <h2 className="font-bold uppercase tracking-wider mb-2" style={{ fontSize: '0.75em', color: '#64748b' }}>
              {labels.summary}
            </h2>
            <p style={{ fontSize: '0.75em', color: '#374151', lineHeight: '1.6' }}>
              {data.personal_info.summary}
            </p>
          </div>
        )}

        {mainOrder.map(renderMainSection)}
      </div>
    </div>
  );
}
