"use client";

import * as React from "react";

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

interface Task {
  id: string;
  name: string;
  dueDate: string; // ISO format date string
  priority?: number;
  waitingTime?: number; // in hours
  turnaroundTime?: number; // in hours
}

interface DataTableProps<TData extends Task> {
  columns: ColumnDef<TData>[];
  data: TData[];
}

export function DataTable<TData extends Task>({
  columns,
  data,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const enrichedData = React.useMemo(() => {
    const currentDate = new Date();

    // Added SJF logic to calculate remaining time, sort by shortest remaining time
    const tasksWithRemainingTime = data.map((task) => ({
      ...task,
      remainingTime: new Date(task.dueDate).getTime() - currentDate.getTime(),
    }));

    const sortedTasks = tasksWithRemainingTime
      .slice()
      .sort((a, b) => a.remainingTime - b.remainingTime);

    let totalWaitingTime = 0;

    return sortedTasks.map((task, index) => {
      const waitingTime = totalWaitingTime;
      const turnaroundTime = waitingTime + task.remainingTime;

      // Update total waiting time for the next task
      totalWaitingTime += task.remainingTime > 0 ? task.remainingTime : 0;

      return {
        ...task,
        priority: index + 1,
        waitingTime: waitingTime / (1000 * 60 * 60), // Convert ms to hours
        turnaroundTime: turnaroundTime / (1000 * 60 * 60), // Convert ms to hours
      };
    });
  }, [data]);

  const enrichedColumns: ColumnDef<TData>[] = React.useMemo(() => {
    return [
      ...columns,
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => row.original.priority,
      },
      {
        accessorKey: "waitingTime",
        header: "Waiting Time (hrs)",
        cell: ({ row }) =>
          row.original.waitingTime?.toFixed(2) || "N/A",
      },
      {
        accessorKey: "turnaroundTime",
        header: "Turnaround Time (hrs)",
        cell: ({ row }) =>
          row.original.turnaroundTime?.toFixed(2) || "N/A",
      },
    ];
  }, [columns]);

  const table = useReactTable({
    data: enrichedData,
    columns: enrichedColumns,
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

  return (
    <div>
      <div className="rounded-md border">
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={enrichedColumns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      </div>
  );
}
