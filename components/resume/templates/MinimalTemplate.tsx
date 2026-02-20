'use client';

import type { ResumeVariant, ResumeSection } from '@/types';

interface MinimalTemplateProps {
  data: ResumeVariant;
  labels: Record<string, string>;
}

export function MinimalTemplate({ data, labels }: MinimalTemplateProps) {
  const sections = data.included_sections ?? [];
  const show = (s: ResumeSection) => sections.includes(s);

  return (
    <div className="bg-white text-black p-10 font-sans text-sm max-w-[210mm] mx-auto shadow-lg leading-relaxed">
      {/* Header */}
      {show('personal_info') && (
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight">
            {data.personal_info.fullName}
          </h1>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
            {data.personal_info.email && <span>{data.personal_info.email}</span>}
            {data.personal_info.phone && <span>{data.personal_info.phone}</span>}
            {data.personal_info.location && <span>{data.personal_info.location}</span>}
            {data.personal_info.linkedIn && <span>{data.personal_info.linkedIn}</span>}
            {data.personal_info.portfolio && <span>{data.personal_info.portfolio}</span>}
          </div>
          {data.personal_info.summary && (
            <p className="mt-4 text-xs text-gray-600 leading-relaxed">
              {data.personal_info.summary}
            </p>
          )}
        </div>
      )}

      {/* Experience */}
      {show('experience') && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-4">
            {labels.experience}
          </h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between">
                <div>
                  <span className="font-medium">{exp.title}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-gray-500">{exp.company}</span>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              {exp.bullets.length > 0 && (
                <ul className="mt-1.5 space-y-1 text-xs text-gray-600">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="pl-4 relative before:content-['–'] before:absolute before:left-0 before:text-gray-300">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {show('education') && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-4">
            {labels.education}
          </h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-2 flex justify-between">
              <div>
                <span className="font-medium">{edu.degree}</span>
                {edu.field && <span className="text-gray-500"> in {edu.field}</span>}
                <span className="text-gray-400 mx-2">·</span>
                <span className="text-gray-500">{edu.institution}</span>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {edu.startDate} — {edu.endDate}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {show('skills') && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">
            {labels.skills}
          </h2>
          <p className="text-xs text-gray-600">
            {data.skills.map((s) => s.name).join(' · ')}
          </p>
        </section>
      )}

      {/* Languages */}
      {show('languages') && data.languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">
            {labels.languages}
          </h2>
          <p className="text-xs text-gray-600">
            {data.languages.map((l) => `${l.language} (${l.proficiency})`).join(' · ')}
          </p>
        </section>
      )}

      {/* Certifications */}
      {show('certifications') && data.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">
            {labels.certifications}
          </h2>
          <div className="text-xs text-gray-600 space-y-0.5">
            {data.certifications.map((cert) => (
              <p key={cert.id}>
                {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {show('projects') && data.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-4">
            {labels.projects}
          </h2>
          {data.projects.map((proj) => (
            <div key={proj.id} className="mb-3">
              <span className="font-medium text-xs">{proj.name}</span>
              {proj.description && (
                <p className="text-xs text-gray-500 mt-0.5">{proj.description}</p>
              )}
              {proj.bullets.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                  {proj.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="pl-4 relative before:content-['–'] before:absolute before:left-0 before:text-gray-300">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
