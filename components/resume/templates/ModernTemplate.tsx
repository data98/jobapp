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
      case 'skills': {
        const visibleSkills = data.skills.filter(sk => !sk.hidden);
        if (!visibleSkills.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-2" style={{ fontSize: '0.75em', color: `${accentColor}99` }}>
              {labels.skills}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {visibleSkills.map((skill, idx) => (
                <span key={`${skill.id}-${idx}`} className="rounded" style={{ fontSize: '0.75em', backgroundColor: `${accentColor}20`, padding: '1px 8px' }}>
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        );
      }
      case 'languages': {
        const visibleLangs = data.languages.filter(l => !l.hidden);
        if (!visibleLangs.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-2" style={{ fontSize: '0.75em', color: `${accentColor}99` }}>
              {labels.languages}
            </h2>
            <div className="space-y-1" style={{ fontSize: '0.75em' }}>
              {visibleLangs.map((l, idx) => (
                <p key={`${l.id}-${idx}`}>{l.language} <span style={{ opacity: 0.7 }}>- {l.proficiency}</span></p>
              ))}
            </div>
          </div>
        );
      }
      case 'certifications': {
        const visibleCerts = data.certifications.filter(c => !c.hidden);
        if (!visibleCerts.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-2" style={{ fontSize: '0.75em', color: `${accentColor}99` }}>
              {labels.certifications}
            </h2>
            <div className="space-y-1.5" style={{ fontSize: '0.75em' }}>
              {visibleCerts.map((cert, idx) => (
                <div key={`${cert.id}-${idx}`}>
                  <p className="font-semibold">{cert.name}</p>
                  {cert.issuer && <p style={{ opacity: 0.7 }}>{cert.issuer}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      }
      default: return null;
    }
  };

  const renderMainSection = (s: ResumeSection) => {
    switch (s) {
      case 'experience': {
        const visibleExp = data.experience.filter(e => !e.hidden);
        if (!visibleExp.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-3" style={{ fontSize: '0.75em', color: '#64748b' }}>
              {labels.experience}
            </h2>
            {visibleExp.map((exp, idx) => {
              const visibleBullets = exp.bullets.filter((b, i) => Boolean(b) && !exp.hiddenBullets?.includes(i));
              return (
                <div key={`${exp.id}-${idx}`} className="mb-3">
                  {(() => {
                    const hf = exp.hiddenFields ?? [];
                    const showTitle = !hf.includes('title');
                    const showDates = !hf.includes('startDate') || !hf.includes('endDate');
                    const showCompany = !hf.includes('company');
                    const showLocation = !hf.includes('location') && exp.location;
                    const showDesc = !hf.includes('description') && exp.description;
                    const companyLocation = [showCompany ? exp.company : '', showLocation ? exp.location : ''].filter(Boolean).join(' · ');
                    return (
                      <>
                        {(showTitle || showDates) && (
                          <div className="flex justify-between items-baseline">
                            {showTitle && <span className="font-bold" style={{ fontSize: '1em' }}>{exp.title}</span>}
                            {showDates && (
                              <span style={{ fontSize: '0.75em', color: '#9ca3af' }}>
                                {!hf.includes('startDate') ? exp.startDate : ''}{!hf.includes('startDate') && !hf.includes('endDate') ? ' - ' : ''}{!hf.includes('endDate') ? (exp.current ? 'Present' : exp.endDate) : ''}
                              </span>
                            )}
                          </div>
                        )}
                        {companyLocation && <p style={{ fontSize: '0.75em', color: '#6b7280' }}>{companyLocation}</p>}
                        {showDesc && (
                          <p className="mt-1" style={{ fontSize: '0.75em', color: '#374151' }}>{exp.description}</p>
                        )}
                      </>
                    );
                  })()}
                  {visibleBullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5" style={{ ...listStyle, fontSize: '0.75em', color: '#374151' }}>
                      {visibleBullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
      case 'education': {
        const visibleEdu = data.education.filter(e => !e.hidden);
        if (!visibleEdu.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-3" style={{ fontSize: '0.75em', color: '#64748b' }}>
              {labels.education}
            </h2>
            {visibleEdu.map((edu, idx) => (
              <div key={`${edu.id}-${idx}`} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">{edu.degree} - {edu.field}</span>
                  <span style={{ fontSize: '0.75em', color: '#9ca3af' }}>{edu.startDate} - {edu.endDate}</span>
                </div>
                <p style={{ fontSize: '0.75em', color: '#6b7280' }}>{edu.institution}</p>
              </div>
            ))}
          </div>
        );
      }
      case 'projects': {
        const visibleProjects = data.projects.filter(p => !p.hidden);
        if (!visibleProjects.length) return null;
        return (
          <div key={s}>
            <h2 className="font-bold uppercase tracking-wider mb-3" style={{ fontSize: '0.75em', color: '#64748b' }}>
              {labels.projects}
            </h2>
            {visibleProjects.map((proj, idx) => {
              const visibleBullets = proj.bullets.filter((b, i) => Boolean(b) && !proj.hiddenBullets?.includes(i));
              return (
                <div key={`${proj.id}-${idx}`} className="mb-2">
                  <span className="font-bold" style={{ fontSize: '0.75em' }}>{proj.name}</span>
                  {proj.description && <p style={{ fontSize: '0.75em', color: '#4b5563' }} className="mt-0.5">{proj.description}</p>}
                  {visibleBullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5" style={{ ...listStyle, fontSize: '0.75em', color: '#374151' }}>
                      {visibleBullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div className="bg-white max-w-[210mm] mx-auto shadow-lg flex" style={containerStyle}>
      {/* Sidebar */}
      <div className="w-1/3 text-white p-6 space-y-5" style={{ backgroundColor: accentColor }}>
        {show('personal_info') && (() => {
          const h = data.personal_info.hiddenFields ?? [];
          return (
            <div>
              {!h.includes('fullName') && (
                <h1 className="text-xl font-bold leading-tight">
                  {data.personal_info.fullName}
                </h1>
              )}
              <div className="mt-3 space-y-1" style={{ fontSize: '0.75em', opacity: 0.8 }}>
                {!h.includes('email') && data.personal_info.email && <p>{data.personal_info.email}</p>}
                {!h.includes('phone') && data.personal_info.phone && <p>{data.personal_info.phone}</p>}
                {!h.includes('location') && data.personal_info.location && <p>{data.personal_info.location}</p>}
                {!h.includes('linkedIn') && data.personal_info.linkedIn && <p>{data.personal_info.linkedIn}</p>}
                {!h.includes('portfolio') && data.personal_info.portfolio && <p>{data.personal_info.portfolio}</p>}
              </div>
            </div>
          );
        })()}

        {sidebarOrder.map(renderSidebarSection)}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 space-y-5">
        {show('personal_info') && !(data.personal_info.hiddenFields ?? []).includes('summary') && data.personal_info.summary && (
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
