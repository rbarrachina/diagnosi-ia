export const SCALE_OPTIONS = [
  {
    value: 0,
    label: "Gens / No ho faig",
    shortLabel: "Gens",
    color: "#fca5a5",
    formClasses: "border-red-200 bg-red-50 hover:border-red-300",
    accentClass: "accent-red-400",
    headerClass: "text-red-700",
  },
  {
    value: 1,
    label: "Una mica / Ocasionalment",
    shortLabel: "Una mica",
    color: "#fde68a",
    formClasses: "border-yellow-200 bg-yellow-50 hover:border-yellow-300",
    accentClass: "accent-yellow-500",
    headerClass: "text-yellow-700",
  },
  {
    value: 2,
    label: "Bastant / Habitualment",
    shortLabel: "Bastant",
    color: "#86efac",
    formClasses: "border-green-200 bg-green-50 hover:border-green-300",
    accentClass: "accent-green-500",
    headerClass: "text-green-700",
  },
  {
    value: 3,
    label: "Molt / Soc un referent al centre",
    shortLabel: "Molt",
    color: "#67e8f9",
    formClasses: "border-cyan-200 bg-cyan-50 hover:border-cyan-300",
    accentClass: "accent-cyan-500",
    headerClass: "text-cyan-700",
  },
] as const;

export type ScaleOption = (typeof SCALE_OPTIONS)[number];
export type ScaleValue = ScaleOption["value"];

export function scaleColor(value: ScaleValue): string {
  return SCALE_OPTIONS.find((option) => option.value === value)?.color ?? "#e2e8f0";
}
