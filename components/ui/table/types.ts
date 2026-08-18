import type { ReactNode } from "react";

export type TableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  /** Rows per page. Default 5. Set to 0 or false-ish via paginate={false} to disable. */
  pageSize?: number;
  /** When false, all rows render with no pagination UI. Default true. */
  paginate?: boolean;
};
