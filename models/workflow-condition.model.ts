import { Schema } from "mongoose";

export interface IConditionRule {
  field: string; // Payload nested key path, e.g. "student.email" or "invoice.amount"
  operator: "equals" | "not-equals" | "greater-than" | "less-than" | "contains" | "starts-with" | "ends-with" | "date-before" | "date-after" | "boolean";
  value: string;
}

export interface IWorkflowCondition {
  operator: "and" | "or";
  rules: IConditionRule[];
  groups?: IWorkflowCondition[];
}

export const WorkflowConditionSchema = new Schema(
  {
    operator: { type: String, enum: ["and", "or"], required: true, default: "and" },
    rules: [
      {
        field: { type: String, required: true },
        operator: {
          type: String,
          enum: ["equals", "not-equals", "greater-than", "less-than", "contains", "starts-with", "ends-with", "date-before", "date-after", "boolean"],
          required: true,
        },
        value: { type: String, required: true },
        _id: false,
      },
    ],
    groups: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);
