import { parseCsv } from "./csv";
import { createPersistenceAdapter, PersistenceAdapter } from "./storage";
import { validateZppaRows, type ZppaRecord } from "./validation";
import {
  type AuditEvent,
  type AuditHook,
  type Snapshot,
  type StageResponse,
  type DiffResult,
} from "./ingestionTypes";
import { diffByKey } from "./diff";

export interface ZppaIngestionOptions {
  stagingAdapter?: PersistenceAdapter<Snapshot<ZppaRecord>>;
  productionAdapter?: PersistenceAdapter<Snapshot<ZppaRecord>>;
  backupAdapter?: PersistenceAdapter<Snapshot<ZppaRecord>>;
  auditHook?: AuditHook;
}

export class ZppaIngestionService {
  private readonly staging: PersistenceAdapter<Snapshot<ZppaRecord>>;

  private readonly production: PersistenceAdapter<Snapshot<ZppaRecord>>;

  private readonly backup: PersistenceAdapter<Snapshot<ZppaRecord>>;

  private readonly auditHook?: AuditHook;

  constructor(options: ZppaIngestionOptions = {}) {
    this.staging =
      options.stagingAdapter ?? createPersistenceAdapter<Snapshot<ZppaRecord>>("zppa-staging");
    this.production =
      options.productionAdapter ?? createPersistenceAdapter<Snapshot<ZppaRecord>>("zppa-production");
    this.backup =
      options.backupAdapter ?? createPersistenceAdapter<Snapshot<ZppaRecord>>("zppa-backup");
    this.auditHook = options.auditHook;
  }

  async stageCsv(content: string, actorId: string): Promise<StageResponse<ZppaRecord>> {
    const rows = parseCsv(content);
    const validation = validateZppaRows(rows);

    if (!validation.valid) {
      return { success: false, issues: validation.issues };
    }

    const snapshot: Snapshot<ZppaRecord> = {
      data: validation.data,
      stagedAt: new Date().toISOString(),
      actorId,
    };

    await this.staging.write(snapshot);
    await this.audit({ dataset: "zppa", action: "stage", actorId, timestamp: snapshot.stagedAt, details: { rows: validation.data.length } });

    const diff = await this.diffWithProduction(validation.data);

    return { success: true, issues: [], snapshot, diff };
  }

  async diffWithProduction(nextData?: ZppaRecord[]): Promise<DiffResult<ZppaRecord>> {
    const productionSnapshot = await this.production.read();
    const currentData = productionSnapshot?.data ?? [];
    const candidate = nextData ?? (await this.staging.read())?.data ?? [];
    return diffByKey(currentData, candidate, (record) => `${record.itemName}::${record.category}`);
  }

  async promote(actorId: string): Promise<Snapshot<ZppaRecord>> {
    const snapshot = await this.staging.read();
    if (!snapshot) {
      throw new Error("No staged ZPPA dataset to promote");
    }

    const promotedAt = new Date().toISOString();
    const productionSnapshot: Snapshot<ZppaRecord> = {
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
      dataset: "zppa",
      action: "promote",
      actorId,
      timestamp: promotedAt,
      details: { rows: productionSnapshot.data.length },
    });

    return productionSnapshot;
  }

  async rollback(actorId: string): Promise<Snapshot<ZppaRecord>> {
    const backupSnapshot = await this.backup.read();
    if (!backupSnapshot) {
      throw new Error("No backup available for rollback");
    }

    const rollbackAt = new Date().toISOString();
    await this.production.write(backupSnapshot);
    await this.audit({
      dataset: "zppa",
      action: "rollback",
      actorId,
      timestamp: rollbackAt,
    });
    return backupSnapshot;
  }

  async getProduction(): Promise<Snapshot<ZppaRecord> | null> {
    return this.production.read();
  }

  async getStaging(): Promise<Snapshot<ZppaRecord> | null> {
    return this.staging.read();
  }

  private async audit(event: AuditEvent) {
    await this.auditHook?.(event);
  }
}
