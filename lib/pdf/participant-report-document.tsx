import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ParticipantResult } from "@/lib/participants/types";
import { getReportCopy } from "@/lib/pdf/report-copy";
import { getBlockStage, type BlockStage } from "@/lib/participants/block-stage";

const styles = StyleSheet.create({
  page: { padding: 34, fontFamily: "Helvetica", fontSize: 10, color: "#172033" },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  subtitle: { color: "#526075", marginBottom: 18, lineHeight: 1.4 },
  overviewTitle: { fontSize: 14, fontWeight: 700, marginBottom: 10 },
  overviewRow: { marginBottom: 10 },
  overviewHeading: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4, gap: 10 },
  overviewLabel: { fontSize: 10, fontWeight: 700, flexGrow: 1 },
  overviewValue: { fontSize: 9, color: "#334155" },
  stageLabels: { flexDirection: "row", marginBottom: 3 },
  stageLabel: { width: "33.33%", textAlign: "center", fontSize: 7, color: "#526075" },
  stageLabelActive: { fontWeight: 700, color: "#172033" },
  bar: { flexDirection: "row", height: 9, borderRadius: 4, position: "relative" },
  barSegment: { width: "33.33%", height: 9 },
  barMarker: { position: "absolute", top: -3, width: 2, height: 15, backgroundColor: "#172033" },
  detailsTitle: { fontSize: 14, fontWeight: 700, marginTop: 12 },
  block: { marginTop: 14 },
  blockHeading: { fontSize: 14, fontWeight: 700, marginBottom: 8 },
  question: { borderTop: "1 solid #d5dde8", paddingTop: 8, paddingBottom: 14, marginTop: 8 },
  questionText: { fontWeight: 700, lineHeight: 1.12, marginBottom: 3 },
  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 2 },
  option: {
    width: "24%",
    minHeight: 30,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 5,
    marginBottom: 4,
    fontSize: 8,
    lineHeight: 1.25,
    color: "#172033",
  },
  footer: { marginTop: 20, borderTop: "1 solid #d5dde8", paddingTop: 8, color: "#526075", fontSize: 8, lineHeight: 1.4 },
});

const scaleOptionStyles = [
  { borderColor: "#e99a9a", backgroundColor: "#fff2f2", selectedBorder: "#ef7777", selectedBackground: "#f6c5c5" },
  { borderColor: "#e6bd7d", backgroundColor: "#fff8ec", selectedBorder: "#e7a64b", selectedBackground: "#f4dfb9" },
  { borderColor: "#c7d895", backgroundColor: "#f5f8ec", selectedBorder: "#9fba55", selectedBackground: "#e3edc6" },
  { borderColor: "#9ad5b5", backgroundColor: "#eef9f2", selectedBorder: "#42b873", selectedBackground: "#cdeedb" },
] as const;
const neutralOptionStyle = {
  borderColor: "#9dbde2",
  backgroundColor: "#f1f6fd",
  selectedBorder: "#2467aa",
  selectedBackground: "#c8def7",
} as const;

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
        <Text style={styles.overviewTitle}>{copy.participantBlockProfile}</Text>
        <View>
          {result.blocks.map((block) => {
            const { position, stage } = getBlockStage(block);
            const labels: { id: BlockStage; text: string }[] = [
              { id: "basic", text: copy.basicStage },
              { id: "intermediate", text: copy.intermediateStage },
              { id: "advanced", text: copy.advancedStage },
            ];
            return (
              <View key={block.position} style={styles.overviewRow} wrap={false}>
                <View style={styles.overviewHeading}>
                  <Text style={styles.overviewLabel}>{block.position}. {block.title}</Text>
                  <Text style={styles.overviewValue}>{labels.find((label) => label.id === stage)?.text} · {Math.round(position)}/100</Text>
                </View>
                <View style={styles.stageLabels}>
                  {labels.map((label) => <Text key={label.id} style={[styles.stageLabel, label.id === stage ? styles.stageLabelActive : {}]}>{label.text}</Text>)}
                </View>
                <View style={styles.bar}>
                  <View style={[styles.barSegment, { backgroundColor: "#dc5555" }]} />
                  <View style={[styles.barSegment, { backgroundColor: "#e9ad3f" }]} />
                  <View style={[styles.barSegment, { backgroundColor: "#4baa70" }]} />
                  <View style={[styles.barMarker, { left: `${position}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
        <Text style={styles.detailsTitle}>{copy.participantBlockDetails}</Text>
        {result.blocks.map((block) => (
          <View key={block.position} style={styles.block}>
            <Text style={styles.blockHeading}>{block.position}. {block.title}</Text>
            {[...new Map(block.questions.map((question) => [question.criterionPosition, question])).values()].map((criterion) => (
              <View key={criterion.criterionPosition}>
                <Text style={styles.questionText}>{block.position}.{criterion.criterionPosition} · {criterion.criterionTitle}</Text>
                {block.questions.filter((question) => question.criterionPosition === criterion.criterionPosition).map((question) => (
              <View key={question.position} style={styles.question} wrap={false}>
                <Text style={styles.questionText}>{block.position}.{question.criterionPosition}.{question.questionPosition}. {question.text}</Text>
                <View style={styles.options}>
                  {question.options.map((option) => {
                    const selected = option.value === question.value;
                    const colors = question.randomizeOptions
                      ? neutralOptionStyle
                      : scaleOptionStyles[option.value];
                    return (
                      <Text
                        key={option.value}
                        style={[
                          styles.option,
                          { borderColor: colors.borderColor, backgroundColor: colors.backgroundColor },
                          selected
                            ? { borderWidth: 2, borderColor: colors.selectedBorder, backgroundColor: colors.selectedBackground, fontWeight: 700 }
                            : {},
                        ]}
                      >
                        {option.label}
                      </Text>
                    );
                  })}
                </View>
              </View>
                ))}
              </View>
            ))}
          </View>
        ))}
        <View style={styles.footer}>
          <Text>{copy.participantPrivacy}</Text>
        </View>
      </Page>
    </Document>
  );
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}
