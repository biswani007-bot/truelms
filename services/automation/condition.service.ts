/* eslint-disable @typescript-eslint/no-explicit-any */
import { IWorkflowCondition, IConditionRule } from "../../models/workflow-condition.model";

export class ConditionService {
  /**
   * Evaluate a condition configuration block against a payload object
   */
  static evaluate(condition: IWorkflowCondition, payload: Record<string, unknown>): boolean {
    const { operator = "and", rules = [], groups = [] } = condition;

    const ruleResults = rules.map(rule => ConditionService.evaluateRule(rule, payload));
    const groupResults = groups.map(group => ConditionService.evaluate(group, payload));

    const allResults = [...ruleResults, ...groupResults];
    if (allResults.length === 0) return true; // Empty conditions block evaluates to true

    if (operator === "or") {
      return allResults.some(result => result === true);
    } else {
      return allResults.every(result => result === true);
    }
  }

  private static evaluateRule(rule: IConditionRule, payload: Record<string, unknown>): boolean {
    const { field, operator, value } = rule;
    const extractedVal = ConditionService.resolveNestedValue(payload, field);

    if (extractedVal === undefined || extractedVal === null) {
      return operator === "not-equals";
    }

    const valueStr = String(extractedVal).toLowerCase();
    const targetStr = String(value).toLowerCase();

    switch (operator) {
      case "equals":
        return valueStr === targetStr;
      case "not-equals":
        return valueStr !== targetStr;
      case "contains":
        return valueStr.includes(targetStr);
      case "starts-with":
        return valueStr.startsWith(targetStr);
      case "ends-with":
        return valueStr.endsWith(targetStr);
      case "greater-than":
        return Number(extractedVal) > Number(value);
      case "less-than":
        return Number(extractedVal) < Number(value);
      case "boolean":
        return String(extractedVal === true || extractedVal === "true") === targetStr;
      case "date-before":
        return new Date(String(extractedVal)).getTime() < new Date(String(value)).getTime();
      case "date-after":
        return new Date(String(extractedVal)).getTime() > new Date(String(value)).getTime();
      default:
        return false;
    }
  }

  private static resolveNestedValue(obj: Record<string, unknown>, path: string): any {
    return path.split(".").reduce((current: any, part: string) => {
      return current ? current[part] : undefined;
    }, obj);
  }
}
