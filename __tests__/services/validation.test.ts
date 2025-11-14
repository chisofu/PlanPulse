import { describe, expect, it } from "vitest";
import { validateMerchantRows, validateZppaRows } from "../../services/validation";

describe("validateZppaRows", () => {
  it("accepts a valid row", () => {
    const result = validateZppaRows([
      {
        "Item Name": "Cement 50kg",
        Category: "Building Materials",
        "Average Price": "180.00",
        "Source Label": "ZPPA 2025 Q1",
        "Last Updated": "2025-03-31",
      },
    ]);

    expect(result.valid).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.issues).toHaveLength(0);
  });

  it("collects issues for missing data", () => {
    const result = validateZppaRows([
      {
        "Item Name": "",
        Category: "",
        "Average Price": "-1",
        "Source Label": "",
        "Last Updated": "invalid",
      },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.path.endsWith("Item Name"))).toBe(true);
    expect(result.issues.some((issue) => issue.path.endsWith("Average Price"))).toBe(true);
  });
});

describe("validateMerchantRows", () => {
  it("rejects duplicate SKUs", () => {
    const result = validateMerchantRows([
      {
        SKU: "1001",
        "Item Name": "Cement 50kg",
        Unit: "Bag",
        Category: "Building Materials",
        Price: "180",
      },
      {
        SKU: "1001",
        "Item Name": "Cement 50kg",
        Unit: "Bag",
        Category: "Building Materials",
        Price: "200",
      },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("Duplicate"))).toBe(true);
  });

  it("parses optional values when valid", () => {
    const result = validateMerchantRows([
      {
        SKU: "1002",
        "Item Name": "Steel Rod",
        Unit: "Each",
        Category: "Hardware",
        Price: "250.50",
        "Pack Size": "12mm",
        "Last Updated": "2025-03-31",
      },
    ]);

    expect(result.valid).toBe(true);
    expect(result.data[0].packSize).toBe("12mm");
    expect(result.data[0].lastUpdated?.toISOString()).toContain("2025-03-31");
  });
});
