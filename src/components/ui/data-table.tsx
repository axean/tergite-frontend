import {
  ColumnDef,
  ColumnFiltersState,
  Row,
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
import { Drawer, DrawerContent, DrawerTrigger } from "./drawer";
import { cn } from "@/lib/utils";

export type DataTableFilterField = ControllerRenderProps<
  {
    [x: string]: any;
  },
  string
>;

export interface DataTableFormConfig {
  [key: string]: {
    validation: z.ZodType<any, any, any>;
    defaultValue: any;
    label: string;
    /**
     * Generates the form field for the given key in the filter form
     *
     * @param field - the field value from the FormField for the given key
     * @returns - the react element to render for this form
     */
    getFormElement: (field: DataTableFilterField) => React.ReactElement;
  };
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchAccessKey?: string;
  filterFormProps?: DataTableFormConfig;
  onRefreshData?: () => void;
  getDrawerContent: (row: Row<TData>) => React.ReactElement;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchAccessKey,
  filterFormProps,
  getDrawerContent,
  onRefreshData,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const currentFiltersMap: { [k: string]: any } = React.useMemo(
    () =>
      columnFilters.reduce(
        (prev, curr) => ({ ...prev, [curr.id]: curr.value }),
        {}
      ),
    [columnFilters]
  );
  const isFiltered = columnFilters.length > 0;

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

  const isFilterFormAvailable = !!filterFormProps;

  const onFilterSubmit = (values: Object) => {
    for (const [key, value] of Object.entries(values)) {
      table.getColumn(key)?.setFilterValue(value);
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
          className={`ml-auto rounded-none ${
            isFilterFormAvailable ? "" : "rounded-tr-md"
          }`}
          size="icon"
          onClick={onRefreshData}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
        {isFilterFormAvailable && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="rounded-l-none rounded-br-none"
                size="icon"
              >
                <Filter
                  className={`h-4 w-4 ${
                    isFiltered ? "fill-secondary-foreground" : ""
                  }`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <DataFilterForm
                onSubmit={onFilterSubmit}
                onReset={() => setColumnFilters([])}
                fieldsConfig={filterFormProps}
                isFiltered={isFiltered}
                values={currentFiltersMap}
              />
            </PopoverContent>
          </Popover>
        )}
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
                <DetailDrawer
                  key={row.id}
                  row={row}
                  getDrawerContent={getDrawerContent}
                >
                  <TableRow
                    className="cursor-pointer"
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
                </DetailDrawer>
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

function DataFilterForm({
  onSubmit,
  onReset,
  fieldsConfig,
  isFiltered,
  values,
}: DataFilterFormProps) {
  const [rawSchemaObj, defaultValues] = React.useMemo(
    () =>
      Object.entries(fieldsConfig).reduce(
        (prev, [field, conf]) => [
          { ...prev[0], [field]: conf.validation },
          { ...prev[1], [field]: conf.defaultValue },
        ],
        [{}, {}]
      ),
    [fieldsConfig]
  );

  const filterForm = useForm<z.infer<z.ZodObject<any, any, any>>>({
    resolver: zodResolver(z.object(rawSchemaObj)),
    defaultValues,
    values,
  });

  const resetHandler = React.useCallback(() => {
    onReset();
    filterForm.reset(defaultValues);
  }, [defaultValues, filterForm, onReset]);

  return (
    <Form {...filterForm}>
      <form onSubmit={filterForm.handleSubmit(onSubmit)} className="space-y-8">
        {Object.entries(fieldsConfig).map(([name, fieldConfig]) => (
          <FormField
            control={filterForm.control}
            key={name}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldConfig.label}</FormLabel>
                <FormControl>{fieldConfig.getFormElement(field)}</FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <div className="flex justify-between">
          <Button
            type="submit"
            variant="outline"
            disabled={!filterForm.formState.isDirty}
          >
            Apply
          </Button>

          <Button
            variant="secondary"
            disabled={!isFiltered}
            onClick={resetHandler}
          >
            Clear
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface DataFilterFormProps {
  onSubmit: (values: Object) => void;
  onReset: () => void;
  fieldsConfig: DataTableFormConfig;
  isFiltered: boolean;
  values: { [k: string]: any };
}

function DetailDrawer<TData>({
  row,
  drawerClassName,
  getDrawerContent,
  children,
}: React.PropsWithChildren<DetailDrawerProps<TData>>) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className={cn("inset-y-0 right-0", drawerClassName)}>
        {getDrawerContent(row)}
      </DrawerContent>
    </Drawer>
  );
}

interface DetailDrawerProps<TData> {
  row: Row<TData>;
  drawerClassName?: string;
  getDrawerContent: (row: Row<TData>) => React.ReactElement;
}
