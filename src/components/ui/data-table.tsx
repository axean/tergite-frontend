import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import { Button } from "./button";
import { Input } from "./input";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCcw,
  Search,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ControllerRenderProps, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

// const formSchema = z.object({
//   username: z.string().min(2).max(50),
// });

interface FilterFormProps {
  [key: string]: {
    validation: z.ZodAny;
    label: string;
    /**
     * Generates the form field for the given key in the filter form
     *
     * @param field - the field value from the FormField for the given key
     * @returns - the react element to render for this form
     */
    formElement: (
      field: ControllerRenderProps<
        {
          [x: string]: any;
        },
        string
      >
    ) => React.ReactElement;
  };
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchAccessKey?: string;
  filterFormProps?: FilterFormProps;
  onRefreshData?: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchAccessKey,
  filterFormProps,
  onRefreshData,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const isFilterFormAvailable = !!filterFormProps;
  const filterFormSchema: z.ZodObject<any, any, any> = z.object({});
  if (isFilterFormAvailable) {
    for (const key in filterFormProps) {
      filterFormSchema.setKey(key, filterFormProps[key].validation);
    }
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const defaultFilterValues: any = {};
  for (const key in filterFormSchema) {
    defaultFilterValues[key] = table.getColumn(key)?.getFilterValue();
  }

  const filterForm = useForm<z.infer<typeof filterFormSchema>>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: defaultFilterValues,
  });

  const onFilterSubmit = (values: z.infer<typeof filterFormSchema>) => {
    for (const key in values) {
      table.getColumn(key)?.setFilterValue(values[key]);
    }
  };

  return (
    <div>
      <div className="flex">
        {searchAccessKey && (
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8"
              value={
                (table
                  .getColumn(searchAccessKey)
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table
                  .getColumn(searchAccessKey)
                  ?.setFilterValue(event.target.value)
              }
            />
          </div>
        )}
        <Button
          variant="outline"
          className="ml-auto rounded-none"
          size="icon"
          onClick={onRefreshData}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="rounded-l-none rounded-br-none"
              size="icon"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            {isFilterFormAvailable && onFilterSubmit && (
              <Form {...filterForm}>
                <form
                  onSubmit={filterForm.handleSubmit(onFilterSubmit)}
                  className="space-y-8"
                >
                  {filterFormProps &&
                    Object.keys(filterFormProps).map((fieldName) => (
                      <FormField
                        control={filterForm.control}
                        name={fieldName}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {filterFormProps[fieldName].label}
                            </FormLabel>
                            <FormControl>
                              {filterFormProps[fieldName].formElement(field)}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  ;<Button type="submit">Submit</Button>
                </form>
              </Form>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="border rounded-bl-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          className="rounded-none rounded-bl-md"
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="rounded-none rounded-br-md"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
