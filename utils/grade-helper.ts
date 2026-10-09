export class GradeHelper {
  static calculatePercentage(obtained: number, max: number): number {
    if (!max || max <= 0) return 0;
    return Math.round((obtained / max) * 100);
  }

  static getLetterGrade(percentage: number, passThreshold: number = 60): string {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  }

  static getStatus(percentage: number, passThreshold: number = 40): "pass" | "fail" {
    return percentage >= passThreshold ? "pass" : "fail";
  }
}
