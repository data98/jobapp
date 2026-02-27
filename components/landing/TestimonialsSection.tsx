'use client';

import { useTranslations } from 'next-intl';

const TESTIMONIAL_PEOPLE = [
  {
    author: 'Salome Maisuradze',
    role: 'Software Engineer',
    company: 'TBC Bank',
    initials: 'SM',
    accentColor: 'bg-blue-500',
    quoteKey: 'testimonial1Quote' as const,
  },
  {
    author: 'Giorgi Tsiklauri',
    role: 'Product Manager',
    company: 'Sweeft Digital',
    initials: 'GT',
    accentColor: 'bg-purple-500',
    quoteKey: 'testimonial2Quote' as const,
  },
  {
    author: 'Nino Gvenetadze',
    role: 'Data Analyst',
    company: 'Bank of Georgia',
    initials: 'NG',
    accentColor: 'bg-amber-500',
    quoteKey: 'testimonial3Quote' as const,
  },
  {
    author: 'Luka Beridze',
    role: 'DevOps Engineer',
    company: 'Crocobet',
    initials: 'LB',
    accentColor: 'bg-emerald-500',
    quoteKey: 'testimonial4Quote' as const,
  },
] as const;

export function TestimonialsSection() {
  const t = useTranslations('landing');

  const testimonials = TESTIMONIAL_PEOPLE.map((person) => ({
    ...person,
    quote: t(person.quoteKey),
  }));

  return (
    <section id="testimonials" className="py-14 md:py-20 px-6 bg-muted/20">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {t('testimonialsHeading')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t('testimonialsSubtitle')}
          </p>
        </div>

        {/* 2x2 grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="testimonial-social-card rounded-2xl border bg-card p-6 sm:p-7 flex flex-col justify-between gap-6"
            >
              {/* Quote */}
              <p className="text-sm sm:text-[15px] leading-relaxed text-foreground">
                &ldquo;{item.quote}&rdquo;
              </p>

              {/* Footer: avatar + info on left, company on right */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar circle with initials */}
                  <div className={`h-10 w-10 shrink-0 rounded-full ${item.accentColor} flex items-center justify-center`}>
                    <span className="text-xs font-semibold text-white">{item.initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{item.author}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.role}</p>
                  </div>
                </div>
                {/* Company name styled as a logo-like element */}
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap shrink-0">
                  {item.company}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
