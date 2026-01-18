/**
 * Example: How to use DataTable with Members
 * 
 * This file demonstrates how to integrate the new DataTable component
 * with your existing Members page while maintaining the emerald theme.
 * 
 * Features:
 * - Sorting on all columns
 * - Search/filtering
 * - Column visibility toggle
 * - Row selection
 * - Pagination
 * - Action buttons with emerald theme
 */

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye, FileSpreadsheet } from "lucide-react"
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

// Example type - adjust to match your actual Member type
export type Member = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  address?: string
}

// Define columns for the Members table
export const memberColumns: ColumnDef<Member>[] = [
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
    accessorKey: "firstName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-emerald-100 hover:text-emerald-900 dark:hover:bg-emerald-950 dark:hover:text-emerald-100"
        >
          First Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("firstName")}</div>,
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-emerald-100 hover:text-emerald-900 dark:hover:bg-emerald-950 dark:hover:text-emerald-100"
        >
          Last Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-emerald-100 hover:text-emerald-900 dark:hover:bg-emerald-950 dark:hover:text-emerald-100"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={status === 'active' ? 'default' : 'secondary'}
          className={status === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const member = row.original

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
              onClick={() => console.log('View', member.id)}
              className="hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log('Export', member.id)}
              className="hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
              Export Excel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => console.log('Edit', member.id)}
              className="hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log('Delete', member.id)}
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
 * Usage example in your Members.tsx page:
 * 
 * import { DataTable } from "@/components/ui/data-table"
 * import { memberColumns } from "@/components/members/member-columns"
 * 
 * // In your component:
 * <DataTable 
 *   columns={memberColumns}
 *   data={members}
 *   searchKey="firstName"
 *   searchPlaceholder="Search members by first name..."
 * />
 * 
 * This replaces your manual Table implementation with:
 * - Built-in sorting on all columns
 * - Column visibility toggle
 * - Row selection with checkboxes
 * - Automatic pagination
 * - Search/filter functionality
 * - All styled with your emerald theme!
 */
