// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const mockProductionPlans = [
  {
    id: "BAK-ORD-001",
    itemCode: "BRD-CH-001",
    itemName: "Chocolate Bread",
    warehouse: "Main Bakery - WH",
    order: 50.0,
    available: 20.0,
    deliveryDate: "2025-06-20",
    rawMaterial: "Chocolate Dough",
    rawMaterialWarehouse: "Dough Storage - WH",
    required: 45.0,
    allocated: 40.0,
  },
  {
    id: "BAK-ORD-002",
    itemCode: "CK-VN-002",
    itemName: "Vanilla Cupcake",
    warehouse: "Main Bakery - WH",
    order: 120.0,
    available: 0.0,
    deliveryDate: "2025-06-22",
    rawMaterial: "Vanilla Batter",
    rawMaterialWarehouse: "Batter Room - WH",
    required: 100.0,
    allocated: 90.0,
  },
  {
    id: "BAK-ORD-003",
    itemCode: "PS-CR-003",
    itemName: "Croissant",
    warehouse: "Main Bakery - WH",
    order: 200.0,
    available: 75.0,
    deliveryDate: "2025-06-19",
    rawMaterial: "Croissant Dough",
    rawMaterialWarehouse: "Dough Storage - WH",
    required: 150.0,
    allocated: 150.0,
  },
  {
    id: "BAK-ORD-004",
    itemCode: "CK-CH-004",
    itemName: "Cheesecake",
    warehouse: "Cold Storage - WH",
    order: 30.0,
    available: 10.0,
    deliveryDate: "2025-06-21",
    rawMaterial: "Cream Cheese Mix",
    rawMaterialWarehouse: "Cold Mix Room - WH",
    required: 30.0,
    allocated: 25.0,
  },
  {
    id: "BAK-ORD-005",
    itemCode: "BRD-SD-005",
    itemName: "Sourdough Bread",
    warehouse: "Main Bakery - WH",
    order: 40.0,
    available: 15.0,
    deliveryDate: "2025-06-23",
    rawMaterial: "Sourdough Starter",
    rawMaterialWarehouse: "Starter Fridge - WH",
    required: 35.0,
    allocated: 30.0,
  },
  {
    id: "BAK-ORD-006",
    itemCode: "CK-CHIP-006",
    itemName: "Chocolate Chip Cookie",
    warehouse: "Main Bakery - WH",
    order: 150.0,
    available: 50.0,
    deliveryDate: "2025-06-24",
    rawMaterial: "Cookie Dough",
    rawMaterialWarehouse: "Dough Storage - WH",
    required: 140.0,
    allocated: 130.0,
  },
];


export default function ProductionPlanningReport() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-[var(--card-foreground)]">
          Production Planning Report
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
            <label className="text-[var(--card-foreground)] block mb-1">Sales Order</label>
            <Input
              placeholder="Sales Order"
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
            <label className="text-[var(--card-foreground)] block mb-1">Raw Material Warehouse</label>
            <Input
              placeholder="Raw Material Warehouse"
              className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
              defaultValue="Stores - WPL"
            />
          </div>
          <div>
            <label className="text-[var(--card-foreground)] block mb-1">Delivery Date</label>
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
              Include Sub-assembly Raw
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
              <TableHead className="text-[var(--card-foreground)]">Item Code</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Item Name</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Warehouse</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Order</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Available</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Delivery Date</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Raw Material</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Raw Material Warehouse</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Required</TableHead>
              <TableHead className="text-[var(--card-foreground)]">Allocated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockProductionPlans.map((plan, index) => (
              <TableRow key={index}>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.id}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.itemCode}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.itemName}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.warehouse}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.order}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.available}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.deliveryDate}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.rawMaterial}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.rawMaterialWarehouse}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.required}
                </TableCell>
                <TableCell className="text-[var(--card-foreground)]">
                  {plan.allocated}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}