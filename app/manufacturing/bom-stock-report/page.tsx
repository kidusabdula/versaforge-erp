import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const mockBOMStock = [
  {
    id: "BOM-STK-001",
    bomId: "BOM-MY AN EN-005",
    itemName: "My An En Bread",
    warehouse: "Stores - WPL",
    availableStock: 500.000,
    requiredStock: 600.000,
    allocatedStock: 500.000,
  },
  {
    id: "BOM-STK-002",
    bomId: "BOM-Ao khoac-003",
    itemName: "Pastry Jacket",
    warehouse: "Stores - WPL",
    availableStock: 200.000,
    requiredStock: 250.000,
    allocatedStock: 200.000,
  },
  {
    id: "BOM-STK-003",
    bomId: "BOM-Lap rap may tinh-001",
    itemName: "Bakery Mixer Assembly",
    warehouse: "Stores - WPL",
    availableStock: 10.000,
    requiredStock: 15.000,
    allocatedStock: 10.000,
  },
  // Add more mock data as needed
];

export default function BOMStockReport() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-[var(--card-foreground)]">
          BOM Stock Report
        </h1>
      </div>

      {/* Filters Section */}
      <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-[var(--card-foreground)] block mb-1">Company</label>
            <Input
              placeholder="Company"
              className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
              defaultValue="Ma Ma Beignet"
            />
          </div>
          <div>
            <label className="text-[var(--card-foreground)] block mb-1">BOM ID</label>
            <Input
              placeholder="BOM ID"
              className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
            />
          </div>
          <div>
            <label className="text-[var(--card-foreground)] block mb-1">Document Name</label>
            <Input
              placeholder="Document Name"
              className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
            />
          </div>
          <div>
            <label className="text-[var(--card-foreground)] block mb-1">Warehouse</label>
            <Input
              placeholder="Warehouse"
              className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
              defaultValue="Stores - WPL"
            />
          </div>
          <div>
            <label className="text-[var(--card-foreground)] block mb-1">Stock Date</label>
            <Input
              type="date"
              className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <div className="flex items-center space-x-2">
            <Checkbox id="include-sub-assembly" />
            <label
              htmlFor="include-sub-assembly"
              className="text-[var(--card-foreground)] text-sm"
            >
              Include Sub-assembly Stock
            </label>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[var(--card-foreground)]">ID</TableHead>
              <TableHead className="text-[var(--card-foreground)]">BOM ID</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Item Name</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Warehouse</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Available Stock</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Required Stock</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Allocated Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockBOMStock.map((stock, index) => (
              <TableRow key={index}>
                <TableCell className="text-[var(--card-foreground)]">
                  {stock.id}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {stock.bomId}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {stock.itemName}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {stock.warehouse}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {stock.availableStock}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {stock.requiredStock}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {stock.allocatedStock}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}