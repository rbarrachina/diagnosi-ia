export const SCALE_OPTIONS = [
  {
    value: 0,
    label: "Gens / No ho faig",
    shortLabel: "Gens",
    color: "#ef7777",
    formClasses: "questionnaire-scale-option questionnaire-scale-option-0",
    accentClass: "accent-red-400",
    headerClass: "questionnaire-scale-text questionnaire-scale-text-0",
  },
  {
    value: 1,
    label: "Una mica / Ocasionalment",
    shortLabel: "Una mica",
    color: "#e7a64b",
    formClasses: "questionnaire-scale-option questionnaire-scale-option-1",
    accentClass: "accent-yellow-500",
    headerClass: "questionnaire-scale-text questionnaire-scale-text-1",
  },
  {
    value: 2,
    label: "Bastant / Habitualment",
    shortLabel: "Bastant",
    color: "#9fba55",
    formClasses: "questionnaire-scale-option questionnaire-scale-option-2",
    accentClass: "accent-green-500",
    headerClass: "questionnaire-scale-text questionnaire-scale-text-2",
  },
  {
    value: 3,
    label: "Molt / Soc un referent al centre",
    shortLabel: "Molt",
    color: "#42b873",
    formClasses: "questionnaire-scale-option questionnaire-scale-option-3",
    accentClass: "accent-cyan-500",
    headerClass: "questionnaire-scale-text questionnaire-scale-text-3",
  },
] as const;

export type ScaleOption = (typeof SCALE_OPTIONS)[number];
export type ScaleValue = ScaleOption["value"];

export function scaleColor(value: ScaleValue): string {
  return SCALE_OPTIONS.find((option) => option.value === value)?.color ?? "#e2e8f0";
}
