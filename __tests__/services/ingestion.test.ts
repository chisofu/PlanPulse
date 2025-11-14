import { describe, expect, it } from "vitest";
import { ZppaIngestionService, type ZppaIngestionOptions } from "../../services/zppaIngestion";
import { MerchantPriceIngestionService } from "../../services/merchantPriceIngestion";
import { createMemoryAdapter } from "../../services/storage";
import type { Snapshot } from "../../services/ingestionTypes";
import type { MerchantPriceRecord, ZppaRecord } from "../../services/validation";

function buildZppaService(keyPrefix: string, events: unknown[]): ZppaIngestionService {
  const adapters = buildAdapters<ZppaRecord>(keyPrefix);
  return new ZppaIngestionService({ ...adapters, auditHook: (event) => events.push(event) } satisfies ZppaIngestionOptions);
}

function buildMerchantService(keyPrefix: string, events: unknown[]): MerchantPriceIngestionService {
  const adapters = buildAdapters<MerchantPriceRecord>(keyPrefix);
  return new MerchantPriceIngestionService({ ...adapters, auditHook: (event) => events.push(event) });
}

function buildAdapters<T>(keyPrefix: string) {
  return {
    stagingAdapter: createMemoryAdapter<Snapshot<T>>(`${keyPrefix}-staging`),
    productionAdapter: createMemoryAdapter<Snapshot<T>>(`${keyPrefix}-production`),
    backupAdapter: createMemoryAdapter<Snapshot<T>>(`${keyPrefix}-backup`),
  } as const;
}

describe("ZPPA ingestion", () => {
  it("stages data and promotes with backup", async () => {
    const events: unknown[] = [];
    const service = buildZppaService("zppa-test", events);

    const csv = [
      "Item Name,Category,Average Price,Source Label,Last Updated",
      "Cement 50kg,Building Materials,180.00,ZPPA 2025 Q1,2025-03-31",
    ].join("\n");

    const stageResult = await service.stageCsv(csv, "admin-1");
    expect(stageResult.success).toBe(true);
    expect(stageResult.diff?.added).toHaveLength(1);

    const production = await service.promote("admin-2");
    expect(production.data).toHaveLength(1);

    const csvUpdated = [
      "Item Name,Category,Average Price,Source Label,Last Updated",
      "Cement 50kg,Building Materials,185.00,ZPPA 2025 Q2,2025-06-30",
    ].join("\n");
    await service.stageCsv(csvUpdated, "admin-3");
    await service.promote("admin-4");

    const rolledBack = await service.rollback("admin-5");
    expect(rolledBack.data[0].averagePrice).toBe(180);
    expect(events.length).toBeGreaterThan(0);
  });
});

describe("Merchant ingestion", () => {
  it("flags price changes that exceed the threshold", async () => {
    const events: unknown[] = [];
    const service = buildMerchantService("merchant-test", events);

    const initialCsv = [
      "SKU,Item Name,Unit,Category,Price,Last Updated",
      "1001,Cement 50kg,Bag,Building Materials,180,2025-03-31",
    ].join("\n");

    await service.stageCsv(initialCsv, "merchant-1");
    await service.promote("admin");

    const updateCsv = [
      "SKU,Item Name,Unit,Category,Price,Last Updated",
      "1001,Cement 50kg,Bag,Building Materials,250,2025-06-30",
    ].join("\n");

    const stageResult = await service.stageCsv(updateCsv, "merchant-2");
    expect(stageResult.requiresOverride).toBe(true);
    expect(stageResult.priceAlerts[0]).toMatchObject({ sku: "1001" });

    await service.promote("admin-2");
    await service.rollback("admin-3");

    const production = await service.getProduction();
    expect(production?.data[0].price).toBe(180);
    expect(events.length).toBeGreaterThan(0);
  });
});
