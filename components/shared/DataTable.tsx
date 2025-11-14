import React from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string;
  emptyState?: React.ReactNode;
  footer?: React.ReactNode;
}

export function DataTable<T>({ columns, data, getRowKey, emptyState, footer }: DataTableProps<T>) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-wider text-slate-500 ${
                  column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                } ${column.className ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">
                {emptyState ?? 'No data available'}
              </td>
            </tr>
          )}
          {data.map((row, index) => (
            <tr key={getRowKey(row, index)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-2 whitespace-nowrap text-sm text-slate-700 ${
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                  } ${column.className ?? ''}`}
                >
                  {column.render ? column.render(row, index) : (row as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot className="bg-slate-50">
            <tr>
              <td colSpan={columns.length} className="px-4 py-3 text-right">
                {footer}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default DataTable;
