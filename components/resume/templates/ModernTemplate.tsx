'use client';

import type { ResumeVariant, ResumeSection } from '@/types';

interface ModernTemplateProps {
  data: ResumeVariant;
  labels: Record<string, string>;
}

export function ModernTemplate({ data, labels }: ModernTemplateProps) {
  const sections = data.included_sections ?? [];
  const show = (s: ResumeSection) => sections.includes(s);

  return (
    <div className="bg-white text-black max-w-[210mm] mx-auto shadow-lg flex text-sm">
      {/* Sidebar */}
      <div className="w-1/3 bg-slate-800 text-white p-6 space-y-5">
        {show('personal_info') && (
          <div>
            <h1 className="text-xl font-bold leading-tight">
              {data.personal_info.fullName}
            </h1>
            <div className="mt-3 space-y-1 text-xs text-slate-300">
              {data.personal_info.email && <p>{data.personal_info.email}</p>}
              {data.personal_info.phone && <p>{data.personal_info.phone}</p>}
              {data.personal_info.location && <p>{data.personal_info.location}</p>}
              {data.personal_info.linkedIn && <p>{data.personal_info.linkedIn}</p>}
              {data.personal_info.portfolio && <p>{data.personal_info.portfolio}</p>}
            </div>
          </div>
        )}

        {show('skills') && data.skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {labels.skills}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="text-xs bg-slate-700 px-2 py-0.5 rounded"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {show('languages') && data.languages.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {labels.languages}
            </h2>
            <div className="space-y-1 text-xs">
              {data.languages.map((l) => (
                <p key={l.id}>
                  {l.language} <span className="text-slate-400">— {l.proficiency}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {show('certifications') && data.certifications.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {labels.certifications}
            </h2>
            <div className="space-y-1.5 text-xs">
              {data.certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="font-semibold">{cert.name}</p>
                  {cert.issuer && <p className="text-slate-400">{cert.issuer}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 space-y-5">
        {show('personal_info') && data.personal_info.summary && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {labels.summary}
            </h2>
            <p className="text-xs text-gray-700 leading-relaxed">
              {data.personal_info.summary}
            </p>
          </div>
        )}

        {show('experience') && data.experience.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {labels.experience}
            </h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-sm">{exp.title}</span>
                  <span className="text-xs text-gray-400">
                    {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                {exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs text-gray-700">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {show('education') && data.education.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {labels.education}
            </h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">{edu.degree} — {edu.field}</span>
                  <span className="text-xs text-gray-400">
                    {edu.startDate} — {edu.endDate}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{edu.institution}</p>
              </div>
            ))}
          </div>
        )}

        {show('projects') && data.projects.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {labels.projects}
            </h2>
            {data.projects.map((proj) => (
              <div key={proj.id} className="mb-2">
                <span className="font-bold text-xs">{proj.name}</span>
                {proj.description && <p className="text-xs text-gray-600 mt-0.5">{proj.description}</p>}
                {proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs text-gray-700">
                    {proj.bullets.filter(Boolean).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
