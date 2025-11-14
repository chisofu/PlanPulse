import { parseCsv } from "./csv";
import { diffByKey } from "./diff";
import { createPersistenceAdapter, PersistenceAdapter } from "./storage";
import { validateMerchantRows, type MerchantPriceRecord } from "./validation";
import {
  type AuditHook,
  type Snapshot,
  type StageResponse,
  type DiffResult,
} from "./ingestionTypes";

const PRICE_GUARD_THRESHOLD = 0.3; // 30%

interface MerchantIngestionOptions {
  stagingAdapter?: PersistenceAdapter<Snapshot<MerchantPriceRecord>>;
  productionAdapter?: PersistenceAdapter<Snapshot<MerchantPriceRecord>>;
  backupAdapter?: PersistenceAdapter<Snapshot<MerchantPriceRecord>>;
  auditHook?: AuditHook;
}

export interface PriceVariance {
  sku: string;
  previousPrice?: number;
  nextPrice: number;
  deltaPercent: number;
}

export interface MerchantStageResponse extends StageResponse<MerchantPriceRecord> {
  priceAlerts: PriceVariance[];
  requiresOverride: boolean;
}

export class MerchantPriceIngestionService {
  private readonly staging: PersistenceAdapter<Snapshot<MerchantPriceRecord>>;

  private readonly production: PersistenceAdapter<Snapshot<MerchantPriceRecord>>;

  private readonly backup: PersistenceAdapter<Snapshot<MerchantPriceRecord>>;

  private readonly auditHook?: AuditHook;

  constructor(options: MerchantIngestionOptions = {}) {
    this.staging =
      options.stagingAdapter ?? createPersistenceAdapter<Snapshot<MerchantPriceRecord>>("merchant-staging");
    this.production =
      options.productionAdapter ?? createPersistenceAdapter<Snapshot<MerchantPriceRecord>>("merchant-production");
    this.backup =
      options.backupAdapter ?? createPersistenceAdapter<Snapshot<MerchantPriceRecord>>("merchant-backup");
    this.auditHook = options.auditHook;
  }

  async stageCsv(content: string, actorId: string): Promise<MerchantStageResponse> {
    const rows = parseCsv(content);
    const validation = validateMerchantRows(rows);

    if (!validation.valid) {
      return { success: false, issues: validation.issues, priceAlerts: [], requiresOverride: false };
    }

    const snapshot: Snapshot<MerchantPriceRecord> = {
      data: validation.data,
      stagedAt: new Date().toISOString(),
      actorId,
    };

    await this.staging.write(snapshot);
    await this.audit({
      dataset: "merchant",
      action: "stage",
      actorId,
      timestamp: snapshot.stagedAt,
      details: { rows: snapshot.data.length },
    });

    const diff = await this.diffWithProduction(validation.data);
    const priceAlerts = await this.evaluatePriceGuards(validation.data);

    return {
      success: true,
      issues: [],
      snapshot,
      diff,
      priceAlerts,
      requiresOverride: priceAlerts.length > 0,
    };
  }

  async diffWithProduction(nextData?: MerchantPriceRecord[]): Promise<DiffResult<MerchantPriceRecord>> {
    const productionSnapshot = await this.production.read();
    const currentData = productionSnapshot?.data ?? [];
    const candidate = nextData ?? (await this.staging.read())?.data ?? [];
    return diffByKey(currentData, candidate, (record) => record.sku);
  }

  async promote(actorId: string): Promise<Snapshot<MerchantPriceRecord>> {
    const snapshot = await this.staging.read();
    if (!snapshot) {
      throw new Error("No staged merchant price list to promote");
    }

    const promotedAt = new Date().toISOString();
    const productionSnapshot: Snapshot<MerchantPriceRecord> = {
      data: snapshot.data,
      stagedAt: promotedAt,
      actorId,
    };

    const existing = await this.production.read();
    if (existing) {
      await this.backup.write(existing);
    }

    await this.production.write(productionSnapshot);
    await this.staging.clear();

    await this.audit({
      dataset: "merchant",
      action: "promote",
      actorId,
      timestamp: promotedAt,
      details: { rows: productionSnapshot.data.length },
    });

    return productionSnapshot;
  }

  async rollback(actorId: string): Promise<Snapshot<MerchantPriceRecord>> {
    const backupSnapshot = await this.backup.read();
    if (!backupSnapshot) {
      throw new Error("No backup available for rollback");
    }

    const rollbackAt = new Date().toISOString();
    await this.production.write(backupSnapshot);
    await this.audit({ dataset: "merchant", action: "rollback", actorId, timestamp: rollbackAt });
    return backupSnapshot;
  }

  async getProduction(): Promise<Snapshot<MerchantPriceRecord> | null> {
    return this.production.read();
  }

  async getStaging(): Promise<Snapshot<MerchantPriceRecord> | null> {
    return this.staging.read();
  }

  async getPriceAlerts(): Promise<PriceVariance[]> {
    const staged = await this.staging.read();
    if (!staged) {
      return [];
    }
    return this.evaluatePriceGuards(staged.data);
  }

  private async evaluatePriceGuards(nextRecords: MerchantPriceRecord[]): Promise<PriceVariance[]> {
    const productionSnapshot = await this.production.read();
    const currentRecords = productionSnapshot?.data ?? [];
    const currentMap = new Map(currentRecords.map((record) => [record.sku, record]));
    const breaches: PriceVariance[] = [];

    nextRecords.forEach((record) => {
      const existing = currentMap.get(record.sku);
      if (!existing) {
        return;
      }
      if (existing.price === 0) {
        breaches.push({
          sku: record.sku,
          previousPrice: existing.price,
          nextPrice: record.price,
          deltaPercent: Infinity,
        });
        return;
      }
      const delta = Math.abs(record.price - existing.price) / existing.price;
      if (delta > PRICE_GUARD_THRESHOLD) {
        breaches.push({
          sku: record.sku,
          previousPrice: existing.price,
          nextPrice: record.price,
          deltaPercent: delta,
        });
      }
    });

    return breaches;
  }

  private async audit(event: Parameters<NonNullable<AuditHook>>[0]) {
    await this.auditHook?.(event);
  }
}
