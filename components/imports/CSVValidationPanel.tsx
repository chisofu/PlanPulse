import React, { useMemo, useState } from 'react';
import { Mode, ValidationIssue } from '../../types';
import { parseCsv } from '../../services/csv';
import { getModeTheme } from '../layout/ModeTheme';
import { useNotifications } from '../../providers/NotificationProvider';

type FlowType = 'import' | 'export';

type RequiredField = {
  id: 'description' | 'category' | 'unit' | 'unitPrice';
  label: string;
  aliases: string[];
};

const REQUIRED_FIELDS: RequiredField[] = [
  { id: 'description', label: 'Description', aliases: ['description', 'item', 'item description', 'name'] },
  { id: 'category', label: 'Category', aliases: ['category', 'segment', 'group'] },
  { id: 'unit', label: 'Unit', aliases: ['unit', 'uom', 'measure'] },
  { id: 'unitPrice', label: 'Unit Price', aliases: ['unit price', 'unitprice', 'price', 'unit_price', 'cost'] },
];

const DEVIATION_THRESHOLD = 0.3; // 30%

interface PriceInsights {
  average?: number;
  deviationCount: number;
  mostExtremeRow?: number;
  mostExtremeDeviation?: number;
}

const severityRank = {
  error: 0,
  warning: 1,
  info: 2,
} as const;

const formatRowList = (rows: number[]): string => {
  if (rows.length === 0) {
    return '';
  }
  if (rows.length <= 8) {
    return rows.join(', ');
  }
  const head = rows.slice(0, 6).join(', ');
  const tail = rows[rows.length - 1];
  return `${head}, …, ${tail}`;
};

const normaliseHeader = (header: string): string => header.trim().toLowerCase();

const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const toNumber = (value: string | undefined): number | null => {
  if (value === undefined) return null;
  const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (cleaned.trim().length === 0) {
    return null;
  }
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

const evaluateRows = (rows: Record<string, string>[], flow: FlowType) => {
  const issues: ValidationIssue[] = [];
  const resolvedColumns: Record<RequiredField['id'], string | undefined> = {
    description: undefined,
    category: undefined,
    unit: undefined,
    unitPrice: undefined,
  };

  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const headerLookup = new Map(headers.map((header) => [normaliseHeader(header), header] as const));

  REQUIRED_FIELDS.forEach((field) => {
    const match = field.aliases.find((alias) => headerLookup.has(normaliseHeader(alias)));
    if (match) {
      resolvedColumns[field.id] = headerLookup.get(normaliseHeader(match));
    }
  });

  const missingColumns = REQUIRED_FIELDS.filter((field) => !resolvedColumns[field.id]).map((field) => field.label);

  if (rows.length === 0) {
    issues.push({
      severity: 'info',
      field: 'Dataset',
      message: 'No data rows detected.',
      context: 'Verify that the CSV has a header row followed by at least one data row before importing or exporting.',
    });
  }

  if (missingColumns.length > 0) {
    issues.push({
      severity: 'error',
      field: 'Schema',
      message: `Missing required columns: ${missingColumns.join(', ')}.`,
      context: `Add the missing headers before attempting to ${flow === 'import' ? 'import' : 'export'} this file.`,
    });
  }

  const missingValueMap = new Map<string, number[]>();
  const invalidPriceRows: number[] = [];
  const negativePriceRows: number[] = [];
  const priceEntries: { row: number; value: number }[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // account for header row

    REQUIRED_FIELDS.forEach((field) => {
      const columnName = resolvedColumns[field.id];
      if (!columnName) {
        return;
      }
      const value = row[columnName];
      if (value === undefined || value === null || value.trim().length === 0) {
        if (!missingValueMap.has(field.label)) {
          missingValueMap.set(field.label, []);
        }
        missingValueMap.get(field.label)!.push(rowNumber);
        return;
      }

      if (field.id === 'unitPrice') {
        const parsed = toNumber(value);
        if (parsed === null) {
          invalidPriceRows.push(rowNumber);
          return;
        }
        if (parsed < 0) {
          negativePriceRows.push(rowNumber);
        }
        priceEntries.push({ row: rowNumber, value: parsed });
      }
    });
  });

  missingValueMap.forEach((rowsForField, label) => {
    issues.push({
      severity: 'error',
      field: label,
      message: `Missing ${label.toLowerCase()} values in ${rowsForField.length} row${rowsForField.length > 1 ? 's' : ''}.`,
      context: `Rows ${formatRowList(rowsForField)} need ${label.toLowerCase()} values before you ${flow === 'import' ? 'import' : 'export'} the file.`,
    });
  });

  if (invalidPriceRows.length > 0) {
    issues.push({
      severity: 'error',
      field: 'Unit Price',
      message: `Found ${invalidPriceRows.length} non-numeric price value${invalidPriceRows.length > 1 ? 's' : ''}.`,
      context: `Rows ${formatRowList(invalidPriceRows)} should only contain numbers (e.g. 125.50). Remove text or currency symbols before proceeding.`,
    });
  }

  if (negativePriceRows.length > 0) {
    issues.push({
      severity: 'error',
      field: 'Unit Price',
      message: `Detected ${negativePriceRows.length} negative price value${negativePriceRows.length > 1 ? 's' : ''}.`,
      context: `Rows ${formatRowList(negativePriceRows)} must be zero or positive before you ${flow === 'import' ? 'promote the import' : 'finalise the export'}.`,
    });
  }

  const priceInsights: PriceInsights = {
    deviationCount: 0,
  };

  const validPriceEntries = priceEntries.filter((entry) => Number.isFinite(entry.value));
  if (validPriceEntries.length > 0) {
    const average = validPriceEntries.reduce((total, entry) => total + entry.value, 0) / validPriceEntries.length;
    priceInsights.average = average;

    const deviations: { row: number; deviation: number }[] = [];
    validPriceEntries.forEach((entry) => {
      if (average <= 0) {
        return;
      }
      const deviation = Math.abs(entry.value - average) / average;
      if (deviation > DEVIATION_THRESHOLD) {
        deviations.push({ row: entry.row, deviation });
      }
    });

    priceInsights.deviationCount = deviations.length;
    if (deviations.length > 0) {
      const mostExtreme = deviations.reduce((currentMax, candidate) =>
        candidate.deviation > currentMax.deviation ? candidate : currentMax,
      deviations[0]);
      priceInsights.mostExtremeRow = mostExtreme.row;
      priceInsights.mostExtremeDeviation = mostExtreme.deviation;

      issues.push({
        severity: 'warning',
        field: 'Unit Price',
        message: `${deviations.length} row${deviations.length > 1 ? 's show' : ' shows'} a price swing greater than ${(DEVIATION_THRESHOLD * 100).toFixed(0)}% of the file average.`,
        context: `Largest variance on row ${mostExtreme.row}: ${(mostExtreme.deviation * 100).toFixed(1)}% vs. average K${currencyFormatter.format(average)}. Add a note or double-check supplier quotes before proceeding.`,
      });
    }
  }

  const sortedIssues = issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return {
    issues: sortedIssues,
    priceInsights,
    missingColumns,
  };
};

interface CSVValidationPanelProps {
  mode: Mode;
}

export const CSVValidationPanel: React.FC<CSVValidationPanelProps> = ({ mode }) => {
  const theme = getModeTheme(mode);
  const { notifyInfo, notifySuccess, notifyError } = useNotifications();
  const [flow, setFlow] = useState<FlowType>('import');
  const [fileName, setFileName] = useState<string | undefined>();
  const [rowCount, setRowCount] = useState<number>(0);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [priceInsights, setPriceInsights] = useState<PriceInsights>({ deviationCount: 0 });
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);
  const [lastValidatedAt, setLastValidatedAt] = useState<string | undefined>();
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const warningCount = useMemo(() => issues.filter((issue) => issue.severity === 'warning').length, [issues]);
  const blockingCount = useMemo(() => issues.filter((issue) => issue.severity === 'error').length, [issues]);

  const headers = useMemo(() => (sampleRows[0] ? Object.keys(sampleRows[0]) : []), [sampleRows]);

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsValidating(true);

    try {
      const text = await file.text();
      setFileName(file.name);
      const rows = parseCsv(text);
      setRowCount(rows.length);
      setSampleRows(rows.slice(0, 5));
      const result = evaluateRows(rows, flow);
      setIssues(result.issues);
      setPriceInsights(result.priceInsights);
      setLastValidatedAt(new Date().toISOString());

      if (rows.length === 0) {
        notifyInfo('The CSV is empty', 'Add at least one data row before continuing.');
      } else if (result.issues.length === 0) {
        notifySuccess('No issues detected', `${rows.length} row${rows.length > 1 ? 's are' : ' is'} ready for ${flow}.`);
      } else if (result.issues.some((issue) => issue.severity === 'error')) {
        notifyError('Resolve the highlighted errors', 'Fix the blocking rows and re-run the validator.');
      } else {
        notifyInfo('File is valid with warnings', 'Review the flagged price swings before finalising.');
      }
    } catch (error) {
      console.error('[CSV Validator] Failed to parse file', error);
      notifyError('Unable to read the CSV file', 'Ensure the file is saved as UTF-8 CSV and try again.');
      setFileName(undefined);
      setRowCount(0);
      setSampleRows([]);
      setIssues([]);
      setPriceInsights({ deviationCount: 0 });
      setLastValidatedAt(undefined);
    } finally {
      setIsValidating(false);
      event.target.value = '';
    }
  };

  const validationSummary = useMemo(
    () => [
      { label: 'Rows scanned', value: rowCount.toLocaleString() },
      { label: 'Blocking issues', value: blockingCount.toString() },
      { label: 'Warnings', value: warningCount.toString() },
    ],
    [blockingCount, rowCount, warningCount],
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">Client-side CSV validator</h4>
          <p className="text-sm text-slate-600">
            Check your {flow} files for schema issues, negative pricing, and outliers before handing them off.
          </p>
          {lastValidatedAt && (
            <p className="text-xs text-slate-400 mt-1">Last run {new Date(lastValidatedAt).toLocaleString()}</p>
          )}
        </div>
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          {(['import', 'export'] as FlowType[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFlow(option)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                flow === option ? `${theme.accentBgClass} text-white shadow` : 'text-slate-600'
              }`}
            >
              {option === 'import' ? 'Import review' : 'Export review'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-4">
        <label className="flex-1 border border-dashed border-slate-300 rounded-xl p-4 text-center text-sm text-slate-600 cursor-pointer hover:border-slate-400 transition">
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileSelection}
            disabled={isValidating}
          />
          <span className="font-semibold text-slate-700">
            {isValidating ? 'Validating…' : 'Select a CSV file'}
          </span>
          <p className="text-xs text-slate-500 mt-1">UTF-8 CSV up to 10 MB. We never upload files to the server.</p>
        </label>
        {fileName && (
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-800">{fileName}</p>
            <p>{rowCount.toLocaleString()} rows scanned</p>
            {priceInsights.average !== undefined && (
              <p className="text-xs text-slate-500 mt-1">
                Average unit price: K{currencyFormatter.format(priceInsights.average)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {validationSummary.map((item) => (
          <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
            <p className="text-lg font-semibold text-slate-800">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Validation findings</h5>
        {issues.length === 0 ? (
          <p className="text-sm text-emerald-600 font-semibold">All checks passed. You are ready to continue.</p>
        ) : (
          issues.map((issue, index) => (
            <div key={`${issue.field}-${index}`} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{issue.field}</p>
                  <p className="text-sm text-slate-600">{issue.message}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    issue.severity === 'error'
                      ? 'bg-red-100 text-red-700'
                      : issue.severity === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {issue.severity}
                </span>
              </div>
              {issue.context && <p className="text-xs text-slate-500 mt-2">{issue.context}</p>}
            </div>
          ))
        )}
      </div>

      {sampleRows.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Sample preview</h5>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-semibold text-slate-600">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sampleRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((header) => (
                      <td key={header} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                        {row[header] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {priceInsights.deviationCount > 0 && (
        <div className={`border rounded-lg p-4 ${theme.accentBgClass} bg-opacity-5`}> 
          <p className={`text-sm font-semibold text-${theme.accentKey}`}>
            Price deviation guidance
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {priceInsights.deviationCount} row{priceInsights.deviationCount > 1 ? 's have' : ' has'} swings greater than
            {(DEVIATION_THRESHOLD * 100).toFixed(0)}%. Consider annotating supplier justifications or double-checking
            sourcing notes before you proceed.
          </p>
          {priceInsights.mostExtremeRow && priceInsights.mostExtremeDeviation !== undefined && (
            <p className="text-xs text-slate-500 mt-1">
              Largest variance on row {priceInsights.mostExtremeRow}:{' '}
              {(priceInsights.mostExtremeDeviation * 100).toFixed(1)}% from the file average.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
