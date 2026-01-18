/**
 * Example: DataTable columns for Tontines
 * 
 * This demonstrates different column types and formatting options
 * for the Tontines table with emerald theme.
 */

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export type Tontine = {
  id: string
  name: string
  description: string
  contributionAmount: number
  frequency: string
  startDate: string
  status: string
  memberCount?: number
}

export const tontineColumns: ColumnDef<Tontine>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-emerald-100 hover:text-emerald-900 dark:hover:bg-emerald-950 dark:hover:text-emerald-100"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-semibold text-emerald-700 dark:text-emerald-400">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "contributionAmount",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-emerald-100 hover:text-emerald-900 dark:hover:bg-emerald-950 dark:hover:text-emerald-100"
          >
            Contribution
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("contributionAmount"))
      const formatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XAF", // Central African Franc
      }).format(amount)

      return <div className="text-right font-medium text-emerald-700 dark:text-emerald-400">{formatted}</div>
    },
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    cell: ({ row }) => {
      const frequency = row.getValue("frequency") as string
      return (
        <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
          {frequency}
        </Badge>
      )
    },
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-emerald-100 hover:text-emerald-900 dark:hover:bg-emerald-950 dark:hover:text-emerald-100"
        >
          Start Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("startDate"))
      return date.toLocaleDateString("fr-FR")
    },
  },
  {
    accessorKey: "memberCount",
    header: ({ column }) => {
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-emerald-100 hover:text-emerald-900 dark:hover:bg-emerald-950 dark:hover:text-emerald-100"
          >
            <Users className="mr-2 h-4 w-4" />
            Members
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const count = (row.getValue("memberCount") as number) || 0
      return (
        <div className="text-center">
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            {count}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusColors = {
        active: "bg-emerald-600 hover:bg-emerald-700",
        pending: "bg-yellow-600 hover:bg-yellow-700",
        completed: "bg-blue-600 hover:bg-blue-700",
        cancelled: "bg-red-600 hover:bg-red-700",
      }
      return (
        <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.active}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const tontine = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-950"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => console.log('View', tontine.id)}
              className="hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log('Members', tontine.id)}
              className="hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <Users className="mr-2 h-4 w-4 text-emerald-600" />
              View members
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => console.log('Edit', tontine.id)}
              className="hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log('Delete', tontine.id)}
              className="hover:bg-red-50 dark:hover:bg-red-950 text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

/**
 * Usage in Tontines.tsx:
 * 
 * import { DataTable } from "@/components/ui/data-table"
 * import { tontineColumns } from "@/components/tontines/tontine-columns"
 * 
 * <DataTable 
 *   columns={tontineColumns}
 *   data={tontines}
 *   searchKey="name"
 *   searchPlaceholder="Search tontines..."
 * />
 */
