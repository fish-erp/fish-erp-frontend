import React from "react";
import { Card } from "@/components/ui/card";

export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  renderMobileCard?: (row: T) => React.ReactNode;
  mobileCardClassName?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  renderMobileCard,
  mobileCardClassName,
}: DataTableProps<T>) {
  return (
    <>
      {/* Giao diện Mobile: Hiển thị danh sách dạng Mobile App Cards */}
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => {
          const key = rowKey(row);
          if (renderMobileCard) {
            return (
              <div key={key} className={mobileCardClassName}>
                {renderMobileCard(row)}
              </div>
            );
          }

          // Fallback tự động khi chưa truyền custom renderMobileCard
          const firstCol = columns[0];
          const actionCol = columns.find((c) => c.key === "actions" || !c.label);
          const otherCols = columns.filter((c) => c !== firstCol && c !== actionCol);

          return (
            <Card key={key} className="p-4 shadow-xs">
              {firstCol && (
                <div className="border-b pb-2.5 mb-2.5 font-medium">
                  {firstCol.render(row)}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {otherCols.map((col) => (
                  <div key={col.key} className="flex flex-col">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {col.label}
                    </span>
                    <div className="mt-0.5 text-foreground">{col.render(row)}</div>
                  </div>
                ))}
              </div>
              {actionCol && (
                <div className="mt-3 flex justify-end border-t pt-2">
                  {actionCol.render(row)}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Giao diện Desktop: Giữ nguyên 100% bảng DataTable chuẩn PC */}
      <Card className="hidden overflow-hidden p-0 lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
                      column.className ?? ""
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-4 ${column.className ?? ""}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
