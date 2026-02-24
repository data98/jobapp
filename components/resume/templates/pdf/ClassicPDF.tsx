import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeVariant, ResumeSection, DesignSettings } from '@/types';

interface ClassicPDFProps {
  data: ResumeVariant;
  labels: Record<string, string>;
}

const SPACING_MAP = { compact: 6, normal: 10, relaxed: 16 };

// Map web fonts to PDF-safe fonts
function pdfFont(font?: string): string {
  if (!font) return 'Helvetica';
  const lower = font.toLowerCase();
  if (lower.includes('georgia') || lower.includes('serif')) return 'Times-Roman';
  if (lower.includes('courier') || lower.includes('mono')) return 'Courier';
  return 'Helvetica';
}

function pdfFontBold(font?: string): string {
  if (!font) return 'Helvetica-Bold';
  const lower = font.toLowerCase();
  if (lower.includes('georgia') || lower.includes('serif')) return 'Times-Bold';
  if (lower.includes('courier') || lower.includes('mono')) return 'Courier-Bold';
  return 'Helvetica-Bold';
}

export function ClassicPDF({ data, labels }: ClassicPDFProps) {
  const sections = data.included_sections ?? [];
  const show = (s: ResumeSection) => sections.includes(s);
  const ds: DesignSettings | undefined = data.design_settings;
  const order = data.section_order?.length
    ? data.section_order.filter((s) => show(s))
    : sections;

  const margins = ds?.margins ?? { top: 40, bottom: 40, left: 40, right: 40 };
  const fontSize = ds?.font_size ?? 10;
  const lineHeight = ds?.line_height ?? 1.4;
  const listLineHeight = ds?.list_line_height ?? 1.2;
  const accentColor = ds?.accent_color ?? '#000000';
  const textColor = ds?.text_color ?? '#000000';
  const sectionSpacing = SPACING_MAP[ds?.section_spacing ?? 'normal'];
  const fontFamily = pdfFont(ds?.font_family);
  const fontBold = pdfFontBold(ds?.font_family);

  const styles = StyleSheet.create({
    page: {
      paddingTop: margins.top,
      paddingBottom: margins.bottom,
      paddingLeft: margins.left,
      paddingRight: margins.right,
      fontSize,
      fontFamily,
      lineHeight,
      color: textColor,
    },
    header: { textAlign: 'center', borderBottomWidth: 1.5, borderBottomColor: accentColor, paddingBottom: 10, marginBottom: sectionSpacing },
    name: { fontSize: 20, fontFamily: fontBold, textTransform: 'uppercase', letterSpacing: 1 },
    contactRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 6, fontSize: 8, color: '#555' },
    summary: { fontSize: 8, color: '#444', marginTop: 8, textAlign: 'center', maxWidth: 400, alignSelf: 'center' },
    sectionTitle: { fontSize: 10, fontFamily: fontBold, textTransform: 'uppercase', letterSpacing: 2, borderBottomWidth: 0.5, borderBottomColor: `${accentColor}66`, paddingBottom: 2, marginBottom: 6, marginTop: sectionSpacing },
    entryTitle: { fontFamily: fontBold, fontSize: 10 },
    entryMeta: { fontSize: 8, color: '#555' },
    entryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    bullet: { fontSize: 9, marginLeft: 12, marginBottom: 1, lineHeight: listLineHeight },
    skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    skillChip: { fontSize: 8, backgroundColor: '#f0f0f0', padding: '2 6', borderRadius: 2 },
    langRow: { flexDirection: 'row', gap: 20, fontSize: 9 },
    certLine: { fontSize: 9, marginBottom: 2 },
  });

  const renderSection = (s: ResumeSection) => {
    switch (s) {
      case 'personal_info': return null;
      case 'experience': {
        const visibleExp = data.experience.filter(e => !e.hidden);
        if (!visibleExp.length) return null;
        return (
          <View key={s}>
            <Text style={styles.sectionTitle}>{labels.experience}</Text>
            {visibleExp.map((exp) => {
              const visibleBullets = exp.bullets.filter((b, i) => Boolean(b) && !exp.hiddenBullets?.includes(i));
              return (
                <View key={exp.id} style={{ marginBottom: 8 }}>
                  {(() => {
                    const hf = exp.hiddenFields ?? [];
                    const showTitle = !hf.includes('title');
                    const showDates = !hf.includes('startDate') || !hf.includes('endDate');
                    const showCompany = !hf.includes('company');
                    const showLocation = !hf.includes('location') && exp.location;
                    const showDesc = !hf.includes('description') && exp.description;
                    const companyLocation = [showCompany ? exp.company : '', showLocation ? exp.location : ''].filter(Boolean).join(' · ');
                    const dateStr = [!hf.includes('startDate') ? exp.startDate : '', !hf.includes('endDate') ? (exp.current ? 'Present' : exp.endDate) : ''].filter(Boolean).join(' - ');
                    return (
                      <>
                        {(showTitle || showDates) && (
                          <View style={styles.entryRow}>
                            {showTitle && <Text style={styles.entryTitle}>{exp.title}</Text>}
                            {dateStr && <Text style={styles.entryMeta}>{dateStr}</Text>}
                          </View>
                        )}
                        {companyLocation && <Text style={styles.entryMeta}>{companyLocation}</Text>}
                        {showDesc && (
                          <Text style={{ fontSize: 8, color: '#444', marginTop: 2 }}>{exp.description}</Text>
                        )}
                      </>
                    );
                  })()}
                  {visibleBullets.map((b, i) => (
                    <Text key={i} style={styles.bullet}>• {b}</Text>
                  ))}
                </View>
              );
            })}
          </View>
        );
      }
      case 'education': {
        const visibleEdu = data.education.filter(e => !e.hidden);
        if (!visibleEdu.length) return null;
        return (
          <View key={s}>
            <Text style={styles.sectionTitle}>{labels.education}</Text>
            {visibleEdu.map((edu) => (
              <View key={edu.id} style={{ marginBottom: 4 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{edu.degree} - {edu.field}</Text>
                  <Text style={styles.entryMeta}>{edu.startDate} - {edu.endDate}</Text>
                </View>
                <Text style={styles.entryMeta}>{edu.institution}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</Text>
              </View>
            ))}
          </View>
        );
      }
      case 'skills': {
        const visibleSkills = data.skills.filter(sk => !sk.hidden);
        if (!visibleSkills.length) return null;
        return (
          <View key={s}>
            <Text style={styles.sectionTitle}>{labels.skills}</Text>
            <View style={styles.skillsRow}>
              {visibleSkills.map((skill) => (
                <Text key={skill.id} style={styles.skillChip}>{skill.name}</Text>
              ))}
            </View>
          </View>
        );
      }
      case 'languages': {
        const visibleLangs = data.languages.filter(l => !l.hidden);
        if (!visibleLangs.length) return null;
        return (
          <View key={s}>
            <Text style={styles.sectionTitle}>{labels.languages}</Text>
            <View style={styles.langRow}>
              {visibleLangs.map((l) => (
                <Text key={l.id}>{l.language} - {l.proficiency}</Text>
              ))}
            </View>
          </View>
        );
      }
      case 'certifications': {
        const visibleCerts = data.certifications.filter(c => !c.hidden);
        if (!visibleCerts.length) return null;
        return (
          <View key={s}>
            <Text style={styles.sectionTitle}>{labels.certifications}</Text>
            {visibleCerts.map((cert) => (
              <Text key={cert.id} style={styles.certLine}>
                {cert.name}{cert.issuer ? ` - ${cert.issuer}` : ''}{cert.date ? ` (${cert.date})` : ''}
              </Text>
            ))}
          </View>
        );
      }
      case 'projects': {
        const visibleProjects = data.projects.filter(p => !p.hidden);
        if (!visibleProjects.length) return null;
        return (
          <View key={s}>
            <Text style={styles.sectionTitle}>{labels.projects}</Text>
            {visibleProjects.map((proj) => {
              const visibleBullets = proj.bullets.filter((b, i) => Boolean(b) && !proj.hiddenBullets?.includes(i));
              return (
                <View key={proj.id} style={{ marginBottom: 6 }}>
                  <Text style={styles.entryTitle}>{proj.name}</Text>
                  {proj.description && <Text style={styles.entryMeta}>{proj.description}</Text>}
                  {visibleBullets.map((b, i) => (
                    <Text key={i} style={styles.bullet}>• {b}</Text>
                  ))}
                </View>
              );
            })}
          </View>
        );
      }
      default: return null;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {show('personal_info') && (() => {
          const h = data.personal_info.hiddenFields ?? [];
          return (
            <View style={styles.header}>
              {!h.includes('fullName') && <Text style={styles.name}>{data.personal_info.fullName}</Text>}
              <View style={styles.contactRow}>
                {!h.includes('email') && data.personal_info.email && <Text>{data.personal_info.email}</Text>}
                {!h.includes('phone') && data.personal_info.phone && <Text>{data.personal_info.phone}</Text>}
                {!h.includes('location') && data.personal_info.location && <Text>{data.personal_info.location}</Text>}
              </View>
              {!h.includes('summary') && data.personal_info.summary && (
                <Text style={styles.summary}>{data.personal_info.summary}</Text>
              )}
            </View>
          );
        })()}

        {order.map(renderSection)}
      </Page>
    </Document>
  );
}
