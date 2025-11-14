export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  data: T[];
  issues: ValidationIssue[];
}

export type Validator<T> = (rows: Record<string, string>[]) => ValidationResult<T>;
