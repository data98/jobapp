'use client';

import type { ResumeVariant, ResumeSection } from '@/types';

interface ClassicTemplateProps {
  data: ResumeVariant;
  labels: Record<string, string>;
}

export function ClassicTemplate({ data, labels }: ClassicTemplateProps) {
  const sections = data.included_sections ?? [];
  const show = (s: ResumeSection) => sections.includes(s);

  return (
    <div className="bg-white text-black p-8 font-serif text-sm leading-relaxed max-w-[210mm] mx-auto shadow-lg">
      {/* Header */}
      {show('personal_info') && (
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold tracking-wide uppercase">
            {data.personal_info.fullName}
          </h1>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
            {data.personal_info.email && <span>{data.personal_info.email}</span>}
            {data.personal_info.phone && <span>{data.personal_info.phone}</span>}
            {data.personal_info.location && <span>{data.personal_info.location}</span>}
            {data.personal_info.linkedIn && <span>{data.personal_info.linkedIn}</span>}
            {data.personal_info.portfolio && <span>{data.personal_info.portfolio}</span>}
          </div>
          {data.personal_info.summary && (
            <p className="mt-3 text-xs text-gray-700 max-w-2xl mx-auto">
              {data.personal_info.summary}
            </p>
          )}
        </div>
      )}

      {/* Experience */}
      {show('experience') && data.experience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            {labels.experience}
          </h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">{exp.title}</span>
                <span className="text-xs text-gray-500">
                  {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{exp.company}</span>
                {exp.location && <span>{exp.location}</span>}
              </div>
              {exp.bullets.length > 0 && (
                <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {show('education') && data.education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            {labels.education}
          </h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">{edu.degree} — {edu.field}</span>
                <span className="text-xs text-gray-500">
                  {edu.startDate} — {edu.endDate}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                {edu.institution}
                {edu.gpa && <span> | GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {show('skills') && data.skills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            {labels.skills}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span key={skill.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {show('languages') && data.languages.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            {labels.languages}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
            {data.languages.map((l) => (
              <span key={l.id}>{l.language} — {l.proficiency}</span>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {show('certifications') && data.certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            {labels.certifications}
          </h2>
          {data.certifications.map((cert) => (
            <div key={cert.id} className="text-xs mb-1">
              <span className="font-bold">{cert.name}</span>
              {cert.issuer && <span> — {cert.issuer}</span>}
              {cert.date && <span className="text-gray-500"> ({cert.date})</span>}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {show('projects') && data.projects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
            {labels.projects}
          </h2>
          {data.projects.map((proj) => (
            <div key={proj.id} className="mb-2">
              <span className="font-bold text-xs">{proj.name}</span>
              {proj.url && <span className="text-xs text-gray-500 ml-2">{proj.url}</span>}
              {proj.description && <p className="text-xs text-gray-700 mt-0.5">{proj.description}</p>}
              {proj.bullets.length > 0 && (
                <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs">
                  {proj.bullets.filter(Boolean).map((b, i) => (
                    <li key={i}>{b}</li>
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
