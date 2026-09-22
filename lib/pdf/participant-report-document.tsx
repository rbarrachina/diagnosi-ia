import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ParticipantResult } from "@/lib/participants/types";
import { getReportCopy } from "@/lib/pdf/report-copy";

const styles = StyleSheet.create({
  page: { padding: 34, fontFamily: "Helvetica", fontSize: 10, color: "#172033" },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  subtitle: { color: "#526075", marginBottom: 18, lineHeight: 1.4 },
  metrics: { flexDirection: "row", gap: 8, marginBottom: 18 },
  metric: { flexGrow: 1, border: "1 solid #d5dde8", borderRadius: 5, padding: 9 },
  label: { color: "#526075", fontSize: 8, marginBottom: 3 },
  value: { fontSize: 13, fontWeight: 700 },
  block: { marginTop: 14 },
  blockHeading: { fontSize: 14, fontWeight: 700, marginBottom: 8 },
  question: { borderTop: "1 solid #d5dde8", paddingTop: 8, marginTop: 8 },
  questionText: { fontWeight: 700, lineHeight: 1.35, marginBottom: 3 },
  answer: { color: "#334155", lineHeight: 1.35 },
  footer: { marginTop: 20, borderTop: "1 solid #d5dde8", paddingTop: 8, color: "#526075", fontSize: 8, lineHeight: 1.4 },
});

export function ParticipantReportDocument({ result }: { result: ParticipantResult }) {
  const copy = getReportCopy(result.languageCode);
  return (
    <Document
      author="Diagnosi IA"
      language={result.languageCode ?? "ca"}
      subject={copy.participantSubject}
      title={`Diagnosi IA - ${copy.participantTitle}`}
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>{copy.participantTitle}</Text>
        <Text style={styles.subtitle}>
          {result.centreName} · {result.questionnaireTitle} · {copy.version} {result.questionnaireVersion}{"\n"}
          {copy.completedOn} {formatDate(result.completedAt, copy.locale)}
        </Text>
        <View style={styles.metrics}>
          <View style={styles.metric}><Text style={styles.label}>{copy.globalScore}</Text><Text style={styles.value}>{formatScore(result.globalScore)}</Text></View>
          {result.blocks.map((block) => (
            <View key={block.position} style={styles.metric}><Text style={styles.label}>{copy.block} {block.position}</Text><Text style={styles.value}>{formatScore(block.score)}</Text></View>
          ))}
        </View>
        {result.blocks.map((block) => (
          <View key={block.position} style={styles.block} wrap={false}>
            <Text style={styles.blockHeading}>{block.position}. {block.title} · {formatScore(block.score)}</Text>
            {block.questions.map((question) => (
              <View key={question.position} style={styles.question}>
                <Text style={styles.questionText}>{block.position}.{question.blockPosition}. {question.text}</Text>
                <Text style={styles.answer}>{copy.selectedAnswer}: {question.value} · {question.label}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={styles.footer} fixed>
          <Text>{copy.participantPrivacy}</Text>
        </View>
      </Page>
    </Document>
  );
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

function formatScore(value: number): string {
  return `${value.toFixed(1)}%`;
}
