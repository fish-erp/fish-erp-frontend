import { Card } from "@/components/ui/card";

export interface Column<T> { key: string; label: string; className?: string; render: (row: T) => React.ReactNode }

export function DataTable<T>({ columns, rows, rowKey }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string }) {
  return <Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead className="bg-[#75646c] text-white"><tr>{columns.map((column) => <th key={column.key} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${column.className ?? ""}`}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={rowKey(row)} className="border-b last:border-0 hover:bg-muted/50">{columns.map((column) => <td key={column.key} className={`px-4 py-4 ${column.className ?? ""}`}>{column.render(row)}</td>)}</tr>)}</tbody></table></div></Card>;
}
