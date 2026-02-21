/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import clsx from "clsx";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  emptyMessage = "No data",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const cmp = a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (data.length === 0) {
    return <div className="py-12 text-center text-[#4b4b58] text-sm">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full z-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                className={clsx(col.sortable && "cursor-pointer hover:text-white/60 select-none")}
              >
                {col.header}
                {sortKey === col.key && (
                  <span className="ml-1 text-[#f59e0b]">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr key={String(item[keyField])}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(item) : String(item[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
