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
      case 'experience': {
        const visibleExp = data.experience.filter(e => !e.hidden);
        if (!visibleExp.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
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
                    return (
                      <>
                        {(showTitle || showDates) && (
                          <div className="flex justify-between items-baseline">
                            {showTitle && <span className="font-bold">{exp.title}</span>}
                            {showDates && (
                              <span style={{ fontSize: '0.75em', color: '#6b7280' }}>
                                {!hf.includes('startDate') ? exp.startDate : ''}{!hf.includes('startDate') && !hf.includes('endDate') ? ' - ' : ''}{!hf.includes('endDate') ? (exp.current ? 'Present' : exp.endDate) : ''}
                              </span>
                            )}
                          </div>
                        )}
                        {(showCompany || showLocation) && (
                          <div className="flex justify-between" style={{ fontSize: '0.75em', color: '#4b5563' }}>
                            {showCompany && <span>{exp.company}</span>}
                            {showLocation && <span>{exp.location}</span>}
                          </div>
                        )}
                        {showDesc && (
                          <p className="mt-1" style={{ fontSize: '0.75em', color: '#374151' }}>{exp.description}</p>
                        )}
                      </>
                    );
                  })()}
                  {visibleBullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5" style={{ ...listStyle, fontSize: '0.75em' }}>
                      {visibleBullets.map((b, i) => <li key={i}>{b}</li>)}
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
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.education}
            </h2>
            {visibleEdu.map((edu, idx) => (
              <div key={`${edu.id}-${idx}`} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">{edu.degree} - {edu.field}</span>
                  <span style={{ fontSize: '0.75em', color: '#6b7280' }}>{edu.startDate} - {edu.endDate}</span>
                </div>
                <div style={{ fontSize: '0.75em', color: '#4b5563' }}>
                  {edu.institution}{edu.gpa && <span> | GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </section>
        );
      }
      case 'skills': {
        const visibleSkills = data.skills.filter(s => !s.hidden);
        if (!visibleSkills.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.skills}
            </h2>
            <div className="flex flex-wrap gap-2">
              {visibleSkills.map((skill, idx) => (
                <span key={`${skill.id}-${idx}`} className="rounded" style={{ fontSize: '0.75em', backgroundColor: '#f3f4f6', padding: '1px 8px' }}>
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        );
      }
      case 'languages': {
        const visibleLangs = data.languages.filter(l => !l.hidden);
        if (!visibleLangs.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.languages}
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-1" style={{ fontSize: '0.75em' }}>
              {visibleLangs.map((l, idx) => <span key={`${l.id}-${idx}`}>{l.language} - {l.proficiency}</span>)}
            </div>
          </section>
        );
      }
      case 'certifications': {
        const visibleCerts = data.certifications.filter(c => !c.hidden);
        if (!visibleCerts.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.certifications}
            </h2>
            {visibleCerts.map((cert, idx) => (
              <div key={`${cert.id}-${idx}`} style={{ fontSize: '0.75em' }} className="mb-1">
                <span className="font-bold">{cert.name}</span>
                {cert.issuer && <span> - {cert.issuer}</span>}
                {cert.date && <span style={{ color: '#6b7280' }}> ({cert.date})</span>}
              </div>
            ))}
          </section>
        );
      }
      case 'projects': {
        const visibleProjects = data.projects.filter(p => !p.hidden);
        if (!visibleProjects.length) return null;
        return (
          <section key={s} style={{ marginBottom: sectionSpacing }}>
            <h2 className="font-bold uppercase tracking-widest pb-1 mb-3" style={{ fontSize: '0.875em', borderBottom: `1px solid ${accentColor}40` }}>
              {labels.projects}
            </h2>
            {visibleProjects.map((proj, idx) => {
              const visibleBullets = proj.bullets.filter((b, i) => Boolean(b) && !proj.hiddenBullets?.includes(i));
              return (
                <div key={`${proj.id}-${idx}`} className="mb-2">
                  <span className="font-bold" style={{ fontSize: '0.75em' }}>{proj.name}</span>
                  {proj.url && <span style={{ fontSize: '0.75em', color: '#6b7280' }} className="ml-2">{proj.url}</span>}
                  {proj.description && <p style={{ fontSize: '0.75em', color: '#374151' }} className="mt-0.5">{proj.description}</p>}
                  {visibleBullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5" style={{ ...listStyle, fontSize: '0.75em' }}>
                      {visibleBullets.map((b, i) => <li key={i}>{b}</li>)}
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
      {/* Header — always first */}
      {show('personal_info') && (() => {
        const h = data.personal_info.hiddenFields ?? [];
        return (
          <div className="text-center pb-4 mb-4" style={{ borderBottom: `2px solid ${accentColor}` }}>
            {!h.includes('fullName') && (
              <h1 className="text-2xl font-bold tracking-wide uppercase">
                {data.personal_info.fullName}
              </h1>
            )}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2" style={{ fontSize: '0.75em', color: '#4b5563' }}>
              {!h.includes('email') && data.personal_info.email && <span>{data.personal_info.email}</span>}
              {!h.includes('phone') && data.personal_info.phone && <span>{data.personal_info.phone}</span>}
              {!h.includes('location') && data.personal_info.location && <span>{data.personal_info.location}</span>}
              {!h.includes('linkedIn') && data.personal_info.linkedIn && <span>{data.personal_info.linkedIn}</span>}
              {!h.includes('portfolio') && data.personal_info.portfolio && <span>{data.personal_info.portfolio}</span>}
            </div>
            {!h.includes('summary') && data.personal_info.summary && (
              <p className="mt-3 max-w-2xl mx-auto" style={{ fontSize: '0.75em', color: '#374151' }}>
                {data.personal_info.summary}
              </p>
            )}
          </div>
        );
      })()}

      {/* Ordered sections */}
      {order.map(renderSection)}
    </div>
  );
}
