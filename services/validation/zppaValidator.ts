import { parseDate, parseDecimal, requireString } from "./utils";
import type { ValidationResult, Validator } from "./types";

export interface ZppaRecord {
  itemName: string;
  category: string;
  averagePrice: number;
  sourceLabel: string;
  lastUpdated: Date;
}

export const REQUIRED_ZPPA_FIELDS = [
  "Item Name",
  "Category",
  "Average Price",
  "Source Label",
  "Last Updated",
];

export const validateZppaRows: Validator<ZppaRecord> = (rows) => {
  const issues: { path: string; message: string }[] = [];
  const data: ZppaRecord[] = [];

  rows.forEach((row, index) => {
    REQUIRED_ZPPA_FIELDS.forEach((field) => {
      if (!(field in row)) {
        issues.push({ path: `${index}.${field}`, message: "Missing column" });
      }
    });

    const itemName = requireString(row["Item Name"], `${index}.Item Name`, issues);
    const category = requireString(row["Category"], `${index}.Category`, issues);
    const averagePrice = parseDecimal(row["Average Price"], `${index}.Average Price`, issues, { min: 0 });
    const sourceLabel = requireString(row["Source Label"], `${index}.Source Label`, issues);
    const lastUpdated = parseDate(row["Last Updated"], `${index}.Last Updated`, issues);

    if (itemName && category && averagePrice !== null && sourceLabel && lastUpdated) {
      data.push({
        itemName,
        category,
        averagePrice,
        sourceLabel,
        lastUpdated,
      });
    }
  });

  return {
    valid: issues.length === 0,
    data,
    issues,
  } satisfies ValidationResult<ZppaRecord>;
};
