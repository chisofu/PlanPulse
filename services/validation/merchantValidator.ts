import { parseDecimal, parseDate, requireString, optionalString } from "./utils";
import type { ValidationResult, Validator } from "./types";

export interface MerchantPriceRecord {
  sku: string;
  itemName: string;
  unit: string;
  packSize?: string;
  category: string;
  price: number;
  lastUpdated?: Date;
}

export const REQUIRED_MERCHANT_FIELDS = [
  "SKU",
  "Item Name",
  "Unit",
  "Category",
  "Price",
];

export const validateMerchantRows: Validator<MerchantPriceRecord> = (rows) => {
  const issues: { path: string; message: string }[] = [];
  const data: MerchantPriceRecord[] = [];
  const seenSku = new Set<string>();

  rows.forEach((row, index) => {
    REQUIRED_MERCHANT_FIELDS.forEach((field) => {
      if (!(field in row)) {
        issues.push({ path: `${index}.${field}`, message: "Missing column" });
      }
    });

    const sku = requireString(row["SKU"], `${index}.SKU`, issues);
    if (sku && seenSku.has(sku)) {
      issues.push({ path: `${index}.SKU`, message: "Duplicate SKU in file" });
    }
    if (sku) {
      seenSku.add(sku);
    }

    const itemName = requireString(row["Item Name"], `${index}.Item Name`, issues);
    const unit = requireString(row["Unit"], `${index}.Unit`, issues);
    const category = requireString(row["Category"], `${index}.Category`, issues);
    const price = parseDecimal(row["Price"], `${index}.Price`, issues, { min: 0 });
    const packSize = optionalString(row["Pack Size"]);
    const lastUpdatedRaw = row["Last Updated"];
    const lastUpdated = lastUpdatedRaw ? parseDate(lastUpdatedRaw, `${index}.Last Updated`, issues) ?? undefined : undefined;

    if (sku && itemName && unit && category && price !== null) {
      data.push({
        sku,
        itemName,
        unit,
        category,
        price,
        packSize,
        lastUpdated,
      });
    }
  });

  return {
    valid: issues.length === 0,
    data,
    issues,
  } satisfies ValidationResult<MerchantPriceRecord>;
};
