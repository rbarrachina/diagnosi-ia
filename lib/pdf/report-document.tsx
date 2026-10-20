import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { ReportStageScale } from "@/lib/pdf/participant-report-document";
import { scaleColor } from "@/lib/questionnaire/scale";
import type { AggregatedResults, DistributionBucket } from "@/lib/results/types";
import { getReportCopy } from "@/lib/pdf/report-copy";
import type { ReportCopy } from "@/lib/pdf/report-copy";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f2933",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    color: "#475569",
    fontSize: 10,
    marginBottom: 18,
  },
  section: {
    marginTop: 12,
  },
  heading: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  metric: {
    border: "1 solid #d8dee6",
    borderRadius: 4,
    padding: 8,
    flexGrow: 1,
  },
  metricLabel: {
    color: "#475569",
    fontSize: 8,
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  note: {
    backgroundColor: "#fef3c7",
    border: "1 solid #f59e0b",
    borderRadius: 4,
    padding: 8,
    lineHeight: 1.4,
  },
  paragraph: {
    lineHeight: 1.3,
    marginBottom: 3,
  },
  listItem: {
    lineHeight: 1.25,
    marginBottom: 2,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5,
  },
  barTrack: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    marginTop: 3,
    marginBottom: 8,
    width: "100%",
  },
  barFill: {
    height: 8,
    backgroundColor: "#256f7c",
    borderRadius: 4,
  },
  dimensionCard: { backgroundColor: "#e3f0ff", borderRadius: 8, padding: 8, marginBottom: 8 },
  dimensionHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  dimensionTitle: { fontSize: 12, fontWeight: 700, width: "52%" },
  dimensionScale: { width: "45%" },
  criteria: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  criterion: { width: "24%", backgroundColor: "#ffffff", borderRadius: 5, padding: 6 },
  optionRow: { flexDirection: "row", borderBottom: "1 solid #e2e8f0", paddingVertical: 5, gap: 8 },
  optionLabel: { flexGrow: 1, flexBasis: 0, fontSize: 8, lineHeight: 1.3 },
  optionNumber: { width: 65, textAlign: "right", fontSize: 9 },
  question: {
    borderTop: "1 solid #d8dee6",
    paddingTop: 10,
    marginTop: 10,
  },
  questionText: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 3,
    lineHeight: 1.18,
  },
  stackedBar: {
    flexDirection: "row",
    height: 9,
    width: "100%",
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 5,
  },
  legend: {
    color: "#475569",
    fontSize: 8,
    lineHeight: 1.35,
  },
  footer: {
    marginTop: 24,
    paddingTop: 8,
    borderTop: "1 solid #d8dee6",
    color: "#475569",
    fontSize: 8,
    lineHeight: 1.35,
  },
});

function formatPercentage(value: number | null, copy: ReportCopy): string {
  return value === null ? copy.noData : `${value.toFixed(1)}%`;
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function barWidth(percentage: number | null): string {
  if (percentage === null) {
    return "0%";
  }

  return `${Math.max(0, Math.min(100, percentage))}%`;
}

function distributionColor(value: DistributionBucket["value"]): string {
  return scaleColor(value);
}

function DistributionBar({ distribution }: { distribution: DistributionBucket[] }) {
  return (
    <View style={styles.stackedBar}>
      {distribution.map((bucket) => (
        <View
          key={bucket.value}
          style={{
            backgroundColor: distributionColor(bucket.value),
            width: `${bucket.percentage}%`,
          }}
        />
      ))}
    </View>
  );
}

export function DiagnosticReportDocument({ results }: { results: AggregatedResults }) {
  const copy = getReportCopy(results.languageCode);
  const scopeLabel = results.publicCode === "GLOBAL"
    ? copy.allCentres
    : results.scopeLabel ?? results.publicCode;

  return (
    <Document
      author="Diagnosi IA"
      language={results.languageCode ?? "ca"}
      subject={copy.aggregateSubject}
      title={`Diagnosi IA ${scopeLabel}`}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Diagnosi IA</Text>
        <Text style={styles.subtitle}>
          {copy.aggregateSubtitle} {formatDate(results.generatedAt, copy.locale)}
        </Text>

        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>
              {results.centreName ? copy.centre : results.scopeLabel ? copy.scope : copy.spaceCode}
            </Text>
            <Text style={styles.metricValue}>{results.centreName ?? scopeLabel}</Text>
            {results.centreName && results.publicCode !== "GLOBAL" && !results.scopeLabel ? (
              <Text style={styles.legend}>{copy.spaceCode}: {results.publicCode}</Text>
            ) : null}
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{copy.version}</Text>
            <Text style={styles.metricValue}>{results.questionnaireVersion}</Text>
          </View>
          {results.diagnosticSpaceCount !== undefined ? (
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{copy.centres}</Text>
              <Text style={styles.metricValue}>{results.diagnosticSpaceCount}</Text>
            </View>
          ) : null}
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{copy.responses}</Text>
            <Text style={styles.metricValue}>{results.totalSubmissions}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>{copy.participantCompetence.replace("Competència Digital", "CD")}</Text>
            <Text style={[styles.metricValue, { color: results.globalAverage === null ? "#526075" : results.globalAverage <= 100 / 3 ? "#b91c1c" : results.globalAverage <= 200 / 3 ? "#b7791f" : "#15803d" }]}>{results.globalAverage === null ? copy.noData : results.globalAverage <= 100 / 3 ? copy.basicStage : results.globalAverage <= 200 / 3 ? copy.intermediateStage : copy.advancedStage}</Text>
          </View>
        </View>

        {results.lowResponseWarning ? (
          <View style={styles.note}>
            <Text>
              {
                copy.lowResponses
              }
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.heading}>{copy.blockOverview}</Text>
          {results.blocks.map((block) => (
            <View key={block.position} style={styles.dimensionCard} wrap={false}>
              <View style={styles.dimensionHeader}>
                <Text style={styles.dimensionTitle}>{copy.dimension} {block.position}: {block.title}</Text>
                <View style={styles.dimensionScale}><AggregateScale average={block.average} copy={copy} large /></View>
              </View>
              <View style={styles.criteria}>
                {block.criteria.map((criterion) => (
                  <View key={criterion.position} style={styles.criterion}>
                    <Text style={styles.legend}>{block.position}.{criterion.position} · {criterion.title}</Text>
                    <AggregateScale average={criterion.average} copy={copy} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

      </Page>

        {results.blocks.map((block) => (
          <Page key={block.position} size="A4" style={styles.page}>
            <Text style={styles.title}>{copy.blockResults}</Text>
            <Text style={styles.subtitle}>
              {block.position}. {block.title}
            </Text>

            <View style={styles.section}>
              <Text style={styles.heading}>{copy.blockPercentage}</Text>
              <Text style={styles.blockTitle}>
                {block.position}. {block.title} · {formatPercentage(block.average, copy)}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: barWidth(block.average) }]} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.heading}>{copy.questionResults}</Text>
              {block.questions.map((question) => (
                <View key={question.position} style={styles.question} wrap={false}>
                  <Text style={styles.questionText}>
                    {block.position}.{question.criterionPosition}.{question.criterionQuestionPosition}. {question.criterionTitle} — {question.text}
                  </Text>
                  <Text>{copy.percentage}: {formatPercentage(question.average, copy)}</Text>
                  <DistributionBar distribution={question.distribution} />
                  <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>{copy.scale}</Text>
                    <Text style={styles.optionNumber}>{copy.percentage}</Text>
                    <Text style={styles.optionNumber}>{copy.responses}</Text>
                  </View>
                  {question.distribution.map((bucket) => (
                    <View key={bucket.value} style={styles.optionRow}>
                      <View style={{ width: 5, backgroundColor: distributionColor(bucket.value) }} />
                      <Text style={styles.optionLabel}>{bucket.label}</Text>
                      <Text style={styles.optionNumber}>{formatPercentage(bucket.percentage, copy)}</Text>
                      <Text style={styles.optionNumber}>{bucket.count}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.footer}>
              <Text>
                {
                  copy.blockPrivacy
                }
              </Text>
            </View>
          </Page>
        ))}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.heading}>{copy.scale}</Text>
          <Text style={styles.paragraph}>{copy.scoreScale}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{copy.interpretation}</Text>
          <Text style={styles.paragraph}>{results.interpretation}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{copy.strengths}</Text>
          {results.strengths.map((strength) => (
            <Text key={strength} style={styles.listItem}>
              - {strength}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>{copy.improvements}</Text>
          {results.improvementAreas.map((area) => (
            <Text key={area} style={styles.listItem}>
              - {area}
            </Text>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>
            {
              copy.aggregatePrivacy
            }
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function AggregateScale({ average, copy, large = false }: { average: number | null; copy: ReportCopy; large?: boolean }) {
  if (average === null) return <Text style={styles.legend}>{copy.noData}</Text>;
  const stage = average <= 100 / 3 ? "basic" : average <= 200 / 3 ? "intermediate" : "advanced";
  return <ReportStageScale position={average} stage={stage} copy={copy} large={large} />;
}
