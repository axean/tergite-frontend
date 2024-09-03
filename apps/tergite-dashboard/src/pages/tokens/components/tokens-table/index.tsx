import { DataTable } from "@/components/ui/data-table";

import { type ExtendedAppToken } from "types";

import { columns } from "./columns";
import { filterFormProps } from "./filter-form";
import { Row } from "@tanstack/react-table";

export function TokensTable({ data, onRowClick }: Props) {
  return (
    <DataTable
      columns={columns}
      data={data}
      filterFormProps={filterFormProps}
      onRowClick={onRowClick}
      options={{ enableMultiRowSelection: false }}
    />
  );
}

interface Props {
  data: ExtendedAppToken[];
  onRowClick: (row: Row<ExtendedAppToken>) => void;
}
