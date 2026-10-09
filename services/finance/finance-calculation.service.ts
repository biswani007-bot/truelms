export class FinanceCalculationService {
  // Use safe cents integer arithmetic
  static add(a: number, b: number): number {
    return Math.round(a + b);
  }

  static subtract(a: number, b: number): number {
    return Math.round(a - b);
  }

  static multiply(a: number, factor: number): number {
    return Math.round(a * factor);
  }
}
