import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { scaleColor } from "@/lib/questionnaire/scale";
import type { AggregatedResults, DistributionBucket } from "@/lib/results/types";

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
  question: {
    borderTop: "1 solid #d8dee6",
    paddingTop: 10,
    marginTop: 10,
  },
  questionText: {
    fontWeight: 700,
    marginBottom: 5,
    lineHeight: 1.35,
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

function formatAverage(value: number | null): string {
  return value === null ? "Sense dades" : value.toFixed(2);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ca-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function barWidth(average: number | null): string {
  if (average === null) {
    return "0%";
  }

  return `${Math.max(0, Math.min(100, (average / 2) * 100))}%`;
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
  return (
    <Document
      author="Diagnosi IA"
      language="ca"
      subject="Informe de conjunt de diagnosi anònima"
      title={`Diagnosi IA ${results.publicCode}`}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Diagnosi IA</Text>
        <Text style={styles.subtitle}>
          Informe de conjunt de diagnosi anònima generat el {formatDate(results.generatedAt)}
        </Text>

        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Codi anònim</Text>
            <Text style={styles.metricValue}>{results.publicCode}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Versió</Text>
            <Text style={styles.metricValue}>{results.questionnaireVersion}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Respostes</Text>
            <Text style={styles.metricValue}>{results.totalSubmissions}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Mitjana global</Text>
            <Text style={styles.metricValue}>{formatAverage(results.globalAverage)}</Text>
          </View>
        </View>

        {results.lowResponseWarning ? (
          <View style={styles.note}>
            <Text>
              {
                "Poques respostes: interpreta els resultats amb prudència."
              }
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.heading}>Escala</Text>
          <Text style={styles.paragraph}>
            0: Encara no · 1: Parcialment · 2: Sí, de manera habitual
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Resultat general per blocs</Text>
          {results.blocks.map((block) => (
            <View key={block.position}>
              <Text style={styles.blockTitle}>
                {block.position}. {block.title} · {formatAverage(block.average)}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: barWidth(block.average) }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Interpretació</Text>
          <Text style={styles.paragraph}>{results.interpretation}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Fortaleses</Text>
          {results.strengths.map((strength) => (
            <Text key={strength} style={styles.listItem}>
              - {strength}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Àmbits amb marge de millora</Text>
          {results.improvementAreas.map((area) => (
            <Text key={area} style={styles.listItem}>
              - {area}
            </Text>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>
            {
              "Nota metodològica: aquest informe presenta resultats de conjunt d'un qüestionari anònim i tancat. No és una avaluació individual del professorat, no inclou dades personals, no mostra respostes individuals i no permet reconstruir el conjunt complet de respostes d'una mateixa persona."
            }
          </Text>
        </View>
      </Page>

        {results.blocks.map((block) => (
          <Page key={block.position} size="A4" style={styles.page}>
            <Text style={styles.title}>Resultats del bloc</Text>
            <Text style={styles.subtitle}>
              {block.position}. {block.title}
            </Text>

            <View style={styles.section}>
              <Text style={styles.heading}>Mitjana del bloc</Text>
              <Text style={styles.blockTitle}>
                {block.position}. {block.title} · {formatAverage(block.average)}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: barWidth(block.average) }]} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.heading}>Resultats per pregunta</Text>
              {block.questions.map((question) => (
                <View key={question.position} style={styles.question}>
                  <Text style={styles.questionText}>
                    {question.position}. {question.text}
                  </Text>
                  <Text>Mitjana: {formatAverage(question.average)} sobre 2</Text>
                  <DistributionBar distribution={question.distribution} />
                  <Text style={styles.legend}>
                    {question.distribution
                      .map(
                        (bucket) =>
                          `${bucket.label}: ${bucket.count} (${bucket.percentage.toFixed(1)}%)`,
                      )
                      .join(" · ")}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.footer}>
              <Text>
                {
                  "Les dades d'aquest bloc es presenten en conjunt. L'informe no inclou respostes individuals ni permet avaluar cap docent."
                }
              </Text>
            </View>
          </Page>
        ))}
    </Document>
  );
}
