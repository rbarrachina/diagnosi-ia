import { Document, Page, StyleSheet, Text, View, Svg, Defs, LinearGradient, Stop, Rect, Polygon } from "@react-pdf/renderer";
import type { ParticipantResult } from "@/lib/participants/types";
import { getReportCopy } from "@/lib/pdf/report-copy";
import { getBlockStage, getParticipantCompetence, type BlockStage } from "@/lib/participants/block-stage";

const styles = StyleSheet.create({
  page: { padding: 34, fontFamily: "Helvetica", fontSize: 10, color: "#172033" },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  questionnaireTitle: { fontSize: 12, marginBottom: 5 },
  subtitle: { color: "#526075", marginBottom: 8, lineHeight: 1.4 },
  dimensionHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 8 },
  dimensionScale: { width: "44%" },
  chartCard: { width: "24%", border: "1 solid #d5dde8", borderRadius: 8, padding: 8, backgroundColor: "#ffffff" },
  chartTitle: { fontSize: 8, fontWeight: 700, minHeight: 26, marginBottom: 6 },
  stageLabels: { flexDirection: "row", marginBottom: 4 },
  stageLabel: { width: "33.33%", textAlign: "center", fontSize: 6, color: "#526075" },
  stageLabelActive: { fontWeight: 700, color: "#172033" },
  criterionGroup: { backgroundColor: "#e3f0ff", borderRadius: 8, padding: 8, marginBottom: 16 },
  criterionHeading: { fontSize: 12, fontFamily: "Helvetica-Bold", flexGrow: 1, flexBasis: 0 },
  criterionRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  competence: { alignSelf: "flex-start", backgroundColor: "#e3f0ff", borderRadius: 8, padding: 10, marginBottom: 12 },
  competenceLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#526075", marginBottom: 4 },
  competenceValue: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  blockHeading: { fontSize: 14, fontWeight: 700, marginBottom: 8 },
  question: { paddingTop: 3, paddingBottom: 6, marginTop: 3 },
  answerCriterionHeading: { fontSize: 11, fontWeight: 700, marginBottom: 3 },
  questionText: { fontSize: 9, fontWeight: 700, lineHeight: 1.12, marginBottom: 3 },
  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 2 },
  option: {
    width: "100%",
    flexGrow: 1,
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
  optionColumn: { width: "24%" },
  answerMarker: { alignSelf: "center", width: 8, height: 6 },
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
  const competence = getParticipantCompetence(result.blocks);
  const stageText = { basic: copy.basicStage, intermediate: copy.intermediateStage, advanced: copy.advancedStage };
  const stageColor = { basic: "#b91c1c", intermediate: "#b7791f", advanced: "#15803d" };
  return (
    <Document
      author="Diagnosi IA"
      language={result.languageCode ?? "ca"}
      subject={copy.participantSubject}
      title={`${result.questionnaireTitle} · ${copy.version} ${result.questionnaireVersion}`}
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>{copy.participantCompetence}</Text>
        <Text style={styles.questionnaireTitle}>{result.questionnaireTitle} · {copy.version} {result.questionnaireVersion}</Text>
        <Text style={styles.subtitle}>
          {result.centreName} ({formatDate(result.completedAt, copy.locale)})
        </Text>
        <View style={styles.competence}>
          <Text style={styles.competenceLabel}>{copy.progressionStage}</Text>
          <Text style={[styles.competenceValue, { color: competence ? stageColor[competence.stage] : "#526075" }]}>{competence ? stageText[competence.stage] : copy.noData}</Text>
        </View>
        {result.blocks.map((block) => (
          <View key={block.position} style={styles.criterionGroup} wrap={false}>
            <View style={styles.dimensionHeader}>
              <Text style={styles.criterionHeading}>{copy.dimension} {block.position}: {block.title}</Text>
              <View style={styles.dimensionScale}>
                <ReportStageScale {...getBlockStage(block)} copy={copy} large />
              </View>
            </View>
            <View style={styles.criterionRow}>
              {[...new Map(block.questions.map((question) => [question.criterionPosition, question])).values()].map((criterion) => (
                <View key={criterion.criterionPosition} style={styles.chartCard}>
                  <Text style={styles.chartTitle}>{block.position}.{criterion.criterionPosition} · {criterion.criterionTitle}</Text>
                  <ReportStageScale {...getBlockStage({ ...block, questions: block.questions.filter((question) => question.criterionPosition === criterion.criterionPosition) })} copy={copy} />
                </View>
              ))}
            </View>
          </View>
        ))}
      </Page>
        {result.blocks.map((block) => (
          <Page key={block.position} size="A4" style={styles.page} wrap>
            <Text style={styles.blockHeading}>{copy.dimension} {block.position}: {block.title}</Text>
            {[...new Map(block.questions.map((question) => [question.criterionPosition, question])).values()].map((criterion) => (
              <View key={criterion.criterionPosition}>
                <Text style={styles.answerCriterionHeading}>{block.position}.{criterion.criterionPosition} · {criterion.criterionTitle}</Text>
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
                      <View key={option.value} style={styles.optionColumn}>
                      <Text
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
                      <Svg viewBox="0 0 8 6" style={styles.answerMarker}>
                        {selected ? <Polygon points="4,0 0,6 8,6" fill="#172033" /> : null}
                      </Svg>
                      </View>
                    );
                  })}
                </View>
              </View>
                ))}
              </View>
            ))}
          </Page>
        ))}
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

function ReportStageScale({ position, stage, copy, large = false }: { position: number; stage: BlockStage; copy: ReturnType<typeof getReportCopy>; large?: boolean }) {
  const labels = [
    { id: "basic", text: copy.basicStage },
    { id: "intermediate", text: copy.intermediateStage },
    { id: "advanced", text: copy.advancedStage },
  ];
  const marker = 3 + Math.max(0, Math.min(100, position)) * 0.94;
  return (
    <View>
      <View style={styles.stageLabels}>
        {labels.map((label) => <Text key={label.id} style={[styles.stageLabel, large ? { fontSize: 9 } : {}, label.id === stage ? styles.stageLabelActive : {}]}>{label.text}</Text>)}
      </View>
      <Svg viewBox="0 0 100 13" style={{ width: "100%", height: large ? 25 : 14 }}>
        <Defs><LinearGradient id="stage" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#ff4545" /><Stop offset="50%" stopColor="#ffd119" /><Stop offset="100%" stopColor="#2fc653" />
        </LinearGradient></Defs>
        <Rect x={3} y={0} width={94} height={7} rx={3.5} fill="url(#stage)" />
        <Polygon points={`${marker},7 ${marker - 3.5},12 ${marker + 3.5},12`} fill="#172033" />
      </Svg>
    </View>
  );
}
