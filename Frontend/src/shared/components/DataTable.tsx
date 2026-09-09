import type { ReactNode } from 'react';

export interface DataColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({ rows, columns, emptyText = 'No records found' }: { rows: T[]; columns: DataColumn<T>[]; emptyText?: string }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>{columns.map(column => <th key={column.key} className={`p-4 ${column.className ?? ''}`}>{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-slate-100 hover:bg-slate-50/70">
              {columns.map(column => <td key={column.key} className={`p-4 align-top ${column.className ?? ''}`}>{column.render(row)}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="p-6 text-center text-slate-500" colSpan={columns.length}>{emptyText}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
