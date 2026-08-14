// Level 1 renamed from "Sammlerstück" to an age-based description
// (decision 2026-08-01, final). Numeric values (1-5) are unchanged.
export const CONDITION_LABELS: Record<number, string> = {
  5: "Neuwertig",
  4: "Sehr gut",
  3: "Gut erhalten",
  2: "Gebraucht",
  1: "Man sieht sein Alter",
};

export const CONDITION_OPTIONS: { id: string; label: string }[] = [
  { id: "5", label: CONDITION_LABELS[5] },
  { id: "4", label: CONDITION_LABELS[4] },
  { id: "3", label: CONDITION_LABELS[3] },
  { id: "2", label: CONDITION_LABELS[2] },
  { id: "1", label: CONDITION_LABELS[1] },
];
