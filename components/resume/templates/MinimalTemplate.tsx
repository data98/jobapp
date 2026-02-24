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
      case 'experience': {
        const visibleExp = data.experience.filter(e => !e.hidden);
        if (!visibleExp.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-4" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.experience}
            </h2>
            {visibleExp.map((exp) => {
              const visibleBullets = exp.bullets.filter((b, i) => Boolean(b) && !exp.hiddenBullets?.includes(i));
              return (
                <div key={exp.id} className="mb-4">
                  {(() => {
                    const hf = exp.hiddenFields ?? [];
                    const showTitle = !hf.includes('title');
                    const showCompany = !hf.includes('company');
                    const showDates = !hf.includes('startDate') || !hf.includes('endDate');
                    const showDesc = !hf.includes('description') && exp.description;
                    const titleCompanyParts = [
                      showTitle ? exp.title : '',
                      showCompany ? exp.company : '',
                    ].filter(Boolean);
                    return (
                      <>
                        <div className="flex justify-between">
                          {titleCompanyParts.length > 0 && (
                            <div>
                              {showTitle && <span className="font-medium">{exp.title}</span>}
                              {showTitle && showCompany && <span style={{ color: accentColor }} className="mx-2">·</span>}
                              {showCompany && <span style={{ color: '#6b7280' }}>{exp.company}</span>}
                            </div>
                          )}
                          {showDates && (
                            <span className="shrink-0" style={{ fontSize: '0.75em', color: accentColor }}>
                              {!hf.includes('startDate') ? exp.startDate : ''}{!hf.includes('startDate') && !hf.includes('endDate') ? ' - ' : ''}{!hf.includes('endDate') ? (exp.current ? 'Present' : exp.endDate) : ''}
                            </span>
                          )}
                        </div>
                        {showDesc && (
                          <p className="mt-1" style={{ fontSize: '0.75em', color: '#4b5563' }}>{exp.description}</p>
                        )}
                      </>
                    );
                  })()}
                  {visibleBullets.length > 0 && (
                    <ul className="mt-1.5 space-y-1" style={{ ...listStyle, fontSize: '0.75em', color: '#4b5563' }}>
                      {visibleBullets.map((b, i) => (
                        <li key={i} className="pl-4 relative">
                          <span className="absolute left-0" style={{ color: '#d1d5db' }}>–</span>{b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        );
      }
      case 'education': {
        const visibleEdu = data.education.filter(e => !e.hidden);
        if (!visibleEdu.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-4" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.education}
            </h2>
            {visibleEdu.map((edu) => (
              <div key={edu.id} className="mb-2 flex justify-between">
                <div>
                  <span className="font-medium">{edu.degree}</span>
                  {edu.field && <span style={{ color: '#6b7280' }}> in {edu.field}</span>}
                  <span style={{ color: accentColor }} className="mx-2">·</span>
                  <span style={{ color: '#6b7280' }}>{edu.institution}</span>
                </div>
                <span className="shrink-0" style={{ fontSize: '0.75em', color: accentColor }}>
                  {edu.startDate} - {edu.endDate}
                </span>
              </div>
            ))}
          </section>
        );
      }
      case 'skills': {
        const visibleSkills = data.skills.filter(sk => !sk.hidden);
        if (!visibleSkills.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.skills}
            </h2>
            <p style={{ fontSize: '0.75em', color: '#4b5563' }}>
              {visibleSkills.map((sk) => sk.name).join(' · ')}
            </p>
          </section>
        );
      }
      case 'languages': {
        const visibleLangs = data.languages.filter(l => !l.hidden);
        if (!visibleLangs.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.languages}
            </h2>
            <p style={{ fontSize: '0.75em', color: '#4b5563' }}>
              {visibleLangs.map((l) => `${l.language} (${l.proficiency})`).join(' · ')}
            </p>
          </section>
        );
      }
      case 'certifications': {
        const visibleCerts = data.certifications.filter(c => !c.hidden);
        if (!visibleCerts.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-3" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.certifications}
            </h2>
            <div style={{ fontSize: '0.75em', color: '#4b5563' }} className="space-y-0.5">
              {visibleCerts.map((cert) => (
                <p key={cert.id}>{cert.name}{cert.issuer ? ` - ${cert.issuer}` : ''}</p>
              ))}
            </div>
          </section>
        );
      }
      case 'projects': {
        const visibleProjects = data.projects.filter(p => !p.hidden);
        if (!visibleProjects.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="uppercase mb-4" style={{ fontSize: '0.75em', letterSpacing: '0.2em', color: accentColor }}>
              {labels.projects}
            </h2>
            {visibleProjects.map((proj) => {
              const visibleBullets = proj.bullets.filter((b, i) => Boolean(b) && !proj.hiddenBullets?.includes(i));
              return (
                <div key={proj.id} className="mb-3">
                  <span className="font-medium" style={{ fontSize: '0.75em' }}>{proj.name}</span>
                  {proj.description && <p style={{ fontSize: '0.75em', color: '#6b7280' }} className="mt-0.5">{proj.description}</p>}
                  {visibleBullets.length > 0 && (
                    <ul className="mt-1 space-y-0.5" style={{ ...listStyle, fontSize: '0.75em', color: '#4b5563' }}>
                      {visibleBullets.map((b, i) => (
                        <li key={i} className="pl-4 relative">
                          <span className="absolute left-0" style={{ color: '#d1d5db' }}>–</span>{b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        );
      }
      default: return null;
    }
  };

  return (
    <div className="bg-white max-w-[210mm] mx-auto shadow-lg" style={containerStyle}>
      {/* Header */}
      {show('personal_info') && (() => {
        const h = data.personal_info.hiddenFields ?? [];
        return (
          <div style={{ marginBottom: '2rem' }}>
            {!h.includes('fullName') && (
              <h1 className="font-light tracking-tight" style={{ fontSize: '2em' }}>
                {data.personal_info.fullName}
              </h1>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2" style={{ fontSize: '0.75em', color: '#6b7280' }}>
              {!h.includes('email') && data.personal_info.email && <span>{data.personal_info.email}</span>}
              {!h.includes('phone') && data.personal_info.phone && <span>{data.personal_info.phone}</span>}
              {!h.includes('location') && data.personal_info.location && <span>{data.personal_info.location}</span>}
              {!h.includes('linkedIn') && data.personal_info.linkedIn && <span>{data.personal_info.linkedIn}</span>}
              {!h.includes('portfolio') && data.personal_info.portfolio && <span>{data.personal_info.portfolio}</span>}
            </div>
            {!h.includes('summary') && data.personal_info.summary && (
              <p className="mt-4" style={{ fontSize: '0.75em', color: '#4b5563', lineHeight: '1.6' }}>
                {data.personal_info.summary}
              </p>
            )}
          </div>
        );
      })()}

      {order.map(renderSection)}
    </div>
  );
}
