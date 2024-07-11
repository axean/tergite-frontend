import { Row, flexRender } from "@tanstack/react-table";
import { TableCell, TableRow } from "@/components/ui/table";

export function DataTableRow<TData>({ row, onClick }: Props<TData>) {
  return (
    <TableRow
      className="cursor-pointer"
      data-state={row.getIsSelected() && "selected"}
      onClick={() => onClick && onClick(row)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          width={cell.column.columnDef.size}
          className={cell.column.columnDef.meta?.rowClassName ?? ""}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

interface Props<TData> {
  row: Row<TData>;
  onClick?: (row: Row<TData>) => void;
}
