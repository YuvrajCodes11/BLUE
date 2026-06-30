import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { RecordStatus } from "@/types/domain";

export type TableRow = Record<string, string | number>;
export type SimpleColumn = { key: string; label: string };

type DataTableProps = {
  columns: SimpleColumn[];
  rows: TableRow[];
};

function isStatus(value: unknown): value is RecordStatus {
  return typeof value === "string" && ["Active", "Pending", "Validated", "Flagged", "Draft", "Closed"].includes(value);
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-[var(--soft)] text-xs uppercase tracking-[0.2em] text-[var(--muted-text)]">
          <tr>{columns.map((column) => <th key={column.key} className="px-4 py-4 font-semibold">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-[var(--line)] text-[var(--text)] hover:bg-[var(--soft)]">
              {columns.map((column) => {
                const value = row[column.key];
                return <td key={column.key} className="px-4 py-4">{isStatus(value) ? <StatusBadge status={value} /> : String(value)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
