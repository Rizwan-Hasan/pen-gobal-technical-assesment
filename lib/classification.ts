export type Classification = "FAIL" | "PASS" | "MERIT" | "DISTINCTION";

export function classifyGrade(grade: number): Classification {
  if (grade >= 70) return "DISTINCTION";
  if (grade >= 60) return "MERIT";
  if (grade >= 40) return "PASS";
  return "FAIL";
}

/** Thresholds the marksheet is graded against, in ascending order. */
export const CLASSIFICATION_THRESHOLDS = [40, 60, 70];

export function classificationLabel(c: Classification) {
  switch (c) {
    case "DISTINCTION":
      return "Distinction";
    case "MERIT":
      return "Merit";
    case "PASS":
      return "Pass";
    default:
      return "Fail";
  }
}
