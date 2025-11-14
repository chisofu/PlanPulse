const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseDecimal(value: string, path: string, issues: { path: string; message: string }[], opts?: { min?: number }) {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed === "") {
    issues.push({ path, message: "Value is required" });
    return null;
  }
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) {
    issues.push({ path, message: "Value must be a number" });
    return null;
  }
  if (opts?.min !== undefined && parsed < opts.min) {
    issues.push({ path, message: `Value must be \u2265 ${opts.min}` });
  }
  return parsed;
}

export function parseDate(value: string | undefined, path: string, issues: { path: string; message: string }[]) {
  const trimmed = value?.trim();
  if (!trimmed) {
    issues.push({ path, message: "Value is required" });
    return null;
  }
  if (!DATE_REGEX.test(trimmed)) {
    issues.push({ path, message: "Date must be in YYYY-MM-DD format" });
    return null;
  }
  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    issues.push({ path, message: "Invalid date" });
    return null;
  }
  return new Date(timestamp);
}

export function requireString(value: string | undefined, path: string, issues: { path: string; message: string }[], opts?: { allowEmpty?: boolean }) {
  const trimmed = value?.trim();
  if (!opts?.allowEmpty && (!trimmed || trimmed.length === 0)) {
    issues.push({ path, message: "Value is required" });
    return null;
  }
  return trimmed ?? "";
}

export function optionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}
