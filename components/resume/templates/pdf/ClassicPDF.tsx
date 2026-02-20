import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeVariant, ResumeSection } from '@/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', lineHeight: 1.4 },
  header: { textAlign: 'center', borderBottomWidth: 1.5, borderBottomColor: '#000', paddingBottom: 10, marginBottom: 10 },
  name: { fontSize: 20, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  contactRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 6, fontSize: 8, color: '#555' },
  summary: { fontSize: 8, color: '#444', marginTop: 8, textAlign: 'center', maxWidth: 400, alignSelf: 'center' },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 2, borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingBottom: 2, marginBottom: 6, marginTop: 10 },
  entryTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  entryMeta: { fontSize: 8, color: '#555' },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  bullet: { fontSize: 9, marginLeft: 12, marginBottom: 1 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { fontSize: 8, backgroundColor: '#f0f0f0', padding: '2 6', borderRadius: 2 },
  langRow: { flexDirection: 'row', gap: 20, fontSize: 9 },
  certLine: { fontSize: 9, marginBottom: 2 },
});

interface ClassicPDFProps {
  data: ResumeVariant;
  labels: Record<string, string>;
}

export function ClassicPDF({ data, labels }: ClassicPDFProps) {
  const sections = data.included_sections ?? [];
  const show = (s: ResumeSection) => sections.includes(s);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {show('personal_info') && (
          <View style={styles.header}>
            <Text style={styles.name}>{data.personal_info.fullName}</Text>
            <View style={styles.contactRow}>
              {data.personal_info.email && <Text>{data.personal_info.email}</Text>}
              {data.personal_info.phone && <Text>{data.personal_info.phone}</Text>}
              {data.personal_info.location && <Text>{data.personal_info.location}</Text>}
            </View>
            {data.personal_info.summary && (
              <Text style={styles.summary}>{data.personal_info.summary}</Text>
            )}
          </View>
        )}

        {show('experience') && data.experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{labels.experience}</Text>
            {data.experience.map((exp) => (
              <View key={exp.id} style={{ marginBottom: 8 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{exp.title}</Text>
                  <Text style={styles.entryMeta}>
                    {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                  </Text>
                </View>
                <Text style={styles.entryMeta}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</Text>
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <Text key={i} style={styles.bullet}>• {b}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {show('education') && data.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{labels.education}</Text>
            {data.education.map((edu) => (
              <View key={edu.id} style={{ marginBottom: 4 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{edu.degree} — {edu.field}</Text>
                  <Text style={styles.entryMeta}>{edu.startDate} — {edu.endDate}</Text>
                </View>
                <Text style={styles.entryMeta}>{edu.institution}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {show('skills') && data.skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{labels.skills}</Text>
            <View style={styles.skillsRow}>
              {data.skills.map((skill) => (
                <Text key={skill.id} style={styles.skillChip}>{skill.name}</Text>
              ))}
            </View>
          </View>
        )}

        {show('languages') && data.languages.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{labels.languages}</Text>
            <View style={styles.langRow}>
              {data.languages.map((l) => (
                <Text key={l.id}>{l.language} — {l.proficiency}</Text>
              ))}
            </View>
          </View>
        )}

        {show('certifications') && data.certifications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{labels.certifications}</Text>
            {data.certifications.map((cert) => (
              <Text key={cert.id} style={styles.certLine}>
                {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}{cert.date ? ` (${cert.date})` : ''}
              </Text>
            ))}
          </View>
        )}

        {show('projects') && data.projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{labels.projects}</Text>
            {data.projects.map((proj) => (
              <View key={proj.id} style={{ marginBottom: 6 }}>
                <Text style={styles.entryTitle}>{proj.name}</Text>
                {proj.description && <Text style={styles.entryMeta}>{proj.description}</Text>}
                {proj.bullets.filter(Boolean).map((b, i) => (
                  <Text key={i} style={styles.bullet}>• {b}</Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
