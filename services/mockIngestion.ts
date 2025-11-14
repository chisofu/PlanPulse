import { v4 as uuidv4 } from 'uuid';
import { ImportStatus, ValidationIssue, ZPPAImportBatch } from '../types';

const randomIssues = (status: ImportStatus): ValidationIssue[] => {
  if (status === 'Ready' || status === 'Published') {
    return [];
  }
  if (status === 'Failed') {
    return [
      {
        severity: 'error',
        field: 'Price',
        message: 'Detected negative values in 6 rows.',
        context: 'Rows 18, 22, 45, 71, 144, 188',
      },
    ];
  }
  return [
    {
      severity: 'warning',
      field: 'Average Price',
      message: 'Average price variance exceeds 22% for 15 lines.',
      context: 'Review Building Materials > Cement',
    },
  ];
};

let imports: ZPPAImportBatch[] = [
  {
    id: uuidv4(),
    filename: 'zppa_q1_2025.csv',
    uploadedBy: 'Pamela Banda',
    uploadedAt: '2025-01-03T08:15:00Z',
    status: 'Ready',
    recordCount: 2854,
    priceAverageDelta: 0.12,
    validationSummary: { status: 'passed', issues: [] },
    promotedAt: '2025-01-04T06:00:00Z',
  },
  {
    id: uuidv4(),
    filename: 'zppa_q1_2025_restock.xlsx',
    uploadedBy: 'Pamela Banda',
    uploadedAt: '2025-01-06T17:45:00Z',
    status: 'Validating',
    recordCount: 3112,
    priceAverageDelta: 0.21,
    validationSummary: { status: 'running', issues: randomIssues('Validating') },
  },
  {
    id: uuidv4(),
    filename: 'zppa_hotfix_december.csv',
    uploadedBy: 'Systems Bot',
    uploadedAt: '2024-12-19T12:00:00Z',
    status: 'Failed',
    recordCount: 912,
    priceAverageDelta: -0.32,
    validationSummary: { status: 'failed', issues: randomIssues('Failed') },
  },
];

export const mockIngestionService = {
  async listBatches(): Promise<ZPPAImportBatch[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return imports;
  },
  async triggerValidation(batchId: string): Promise<ZPPAImportBatch> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    imports = imports.map((batch) =>
      batch.id === batchId
        ? {
            ...batch,
            status: 'Validating',
            validationSummary: { status: 'running', issues: randomIssues('Validating') },
          }
        : batch
    );
    return imports.find((batch) => batch.id === batchId)!;
  },
  async promote(batchId: string): Promise<ZPPAImportBatch> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    imports = imports.map((batch) =>
      batch.id === batchId
        ? {
            ...batch,
            status: 'Published',
            promotedAt: new Date().toISOString(),
            validationSummary: { status: 'passed', issues: [] },
          }
        : batch
    );
    return imports.find((batch) => batch.id === batchId)!;
  },
  async rollback(batchId: string): Promise<ZPPAImportBatch> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    imports = imports.map((batch) =>
      batch.id === batchId
        ? {
            ...batch,
            status: 'RolledBack',
            validationSummary: {
              status: 'warnings',
              issues: [
                {
                  severity: 'info',
                  field: 'Rollback',
                  message: 'Rollback completed successfully.',
                  context: new Date().toISOString(),
                },
              ],
            },
          }
        : batch
    );
    return imports.find((batch) => batch.id === batchId)!;
  },
};
