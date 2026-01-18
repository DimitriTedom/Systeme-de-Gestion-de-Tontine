/**
 * DataTable Demo Page
 * 
 * This page demonstrates the new DataTable component with sample data.
 * You can view this by temporarily adding it to your router in App.tsx
 * 
 * Features demonstrated:
 * - Sortable columns
 * - Search/filter
 * - Column visibility toggle
 * - Row selection
 * - Pagination with emerald theme
 * - Action buttons
 */

import { DataTable } from "@/components/ui/data-table"
import { memberColumns, type Member } from "@/components/members/member-columns"
import { tontineColumns, type Tontine } from "@/components/tontines/tontine-columns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sample data for Members
const sampleMembers: Member[] = [
  {
    id: "1",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@email.com",
    phone: "+237 6 99 99 99 99",
    status: "active",
    address: "Yaoundé, Cameroun"
  },
  {
    id: "2",
    firstName: "Marie",
    lastName: "Kouassi",
    email: "marie.kouassi@email.com",
    phone: "+237 6 88 88 88 88",
    status: "active",
    address: "Douala, Cameroun"
  },
  {
    id: "3",
    firstName: "Paul",
    lastName: "Mbarga",
    email: "paul.mbarga@email.com",
    phone: "+237 6 77 77 77 77",
    status: "inactive",
    address: "Bafoussam, Cameroun"
  },
  {
    id: "4",
    firstName: "Sophie",
    lastName: "Nana",
    email: "sophie.nana@email.com",
    phone: "+237 6 66 66 66 66",
    status: "active",
    address: "Yaoundé, Cameroun"
  },
  {
    id: "5",
    firstName: "Ahmed",
    lastName: "Diabaté",
    email: "ahmed.diabate@email.com",
    phone: "+237 6 55 55 55 55",
    status: "active",
    address: "Garoua, Cameroun"
  },
]

// Sample data for Tontines
const sampleTontines: Tontine[] = [
  {
    id: "1",
    name: "Tontine Solidarité",
    description: "Tontine mensuelle pour l'entraide communautaire",
    contributionAmount: 50000,
    frequency: "monthly",
    startDate: "2024-01-15",
    status: "active",
    memberCount: 12
  },
  {
    id: "2",
    name: "Épargne Développement",
    description: "Épargne collective pour projets d'investissement",
    contributionAmount: 100000,
    frequency: "weekly",
    startDate: "2024-02-01",
    status: "active",
    memberCount: 8
  },
  {
    id: "3",
    name: "Tontine Amitié",
    description: "Tontine entre amis pour soutien mutuel",
    contributionAmount: 25000,
    frequency: "monthly",
    startDate: "2023-12-01",
    status: "completed",
    memberCount: 15
  },
  {
    id: "4",
    name: "Projet Logement",
    description: "Tontine pour financement de logements",
    contributionAmount: 200000,
    frequency: "monthly",
    startDate: "2024-03-01",
    status: "pending",
    memberCount: 5
  },
]

export default function DataTableDemo() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
          DataTable Component Demo
        </h1>
        <p className="text-muted-foreground mt-2">
          Advanced table with sorting, filtering, pagination, and emerald theme
        </p>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger 
            value="members"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            Members Table
          </TabsTrigger>
          <TabsTrigger 
            value="tontines"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            Tontines Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-700 dark:text-emerald-400">
                Members DataTable
              </CardTitle>
              <CardDescription>
                Sample members data with sorting, search, and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={memberColumns}
                data={sampleMembers}
                searchKey="firstName"
                searchPlaceholder="Search by first name..."
              />
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
            <CardHeader>
              <CardTitle className="text-sm">Features</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Click column headers to sort</li>
                <li>Use search box to filter by first name</li>
                <li>Click "Columns" to show/hide columns</li>
                <li>Select rows with checkboxes</li>
                <li>Use pagination buttons to navigate</li>
                <li>Click actions menu (⋮) for row actions</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tontines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-700 dark:text-emerald-400">
                Tontines DataTable
              </CardTitle>
              <CardDescription>
                Sample tontines data with currency formatting and badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={tontineColumns}
                data={sampleTontines}
                searchKey="name"
                searchPlaceholder="Search tontines by name..."
              />
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
            <CardHeader>
              <CardTitle className="text-sm">Advanced Features</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Currency formatting:</strong> Contribution amounts in XAF</li>
                <li><strong>Date formatting:</strong> French locale date display</li>
                <li><strong>Custom badges:</strong> Status with emerald/yellow/blue/red colors</li>
                <li><strong>Icon columns:</strong> Member count with Users icon</li>
                <li><strong>Styled cells:</strong> Custom colors for emphasis</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
        <CardHeader>
          <CardTitle className="text-emerald-800 dark:text-emerald-200">
            🎨 Emerald Theme Preserved
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-emerald-900 dark:text-emerald-100 space-y-2">
          <p>All table elements use your existing emerald color scheme:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Header: emerald-50/emerald-950 backgrounds</li>
            <li>Hover states: emerald-50/emerald-950 highlights</li>
            <li>Active badges: emerald-600/emerald-700</li>
            <li>Selected rows: emerald-100/emerald-900</li>
            <li>Pagination: emerald accents</li>
            <li>Checkboxes: emerald-600 when checked</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Use in your existing pages:</h3>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
{`import { DataTable } from "@/components/ui/data-table"
import { memberColumns } from "@/components/members/member-columns"

// Replace your current Table with:
<DataTable 
  columns={memberColumns}
  data={members}
  searchKey="firstName"
  searchPlaceholder="Search members..."
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Customize columns:</h3>
            <p className="text-muted-foreground">
              Edit the column definitions in <code className="bg-muted px-1 py-0.5 rounded">member-columns.tsx</code> or{" "}
              <code className="bg-muted px-1 py-0.5 rounded">tontine-columns.tsx</code> to match your needs.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Connect actions:</h3>
            <p className="text-muted-foreground">
              Replace the <code className="bg-muted px-1 py-0.5 rounded">console.log</code> calls in the actions
              dropdown with your actual functions (edit, delete, view details, etc.)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
