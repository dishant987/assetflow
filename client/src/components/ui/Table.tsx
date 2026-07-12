import { CSSProperties, ReactNode, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
}

export function Table<T extends Record<string, unknown>>({ columns, data }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columnDefs = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col) => ({
        id: col.key,
        header: col.label,
        accessorFn: (row: T) => row[col.key] as string,
        enableSorting: col.sortable ?? false,
      })),
    [columns],
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const col = columns.find((c) => c.key === header.id);
                return (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: col?.sortable ? "pointer" : "default" } as CSSProperties}
                  >
                    {col?.label ?? header.id}
                    {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted() as string] ?? ""}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const col = columns.find((c) => c.key === cell.column.id);
                const val = row.original[col?.key ?? ""];
                return <td key={cell.id}>{col?.render ? col.render(row.original) : (val as ReactNode)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
