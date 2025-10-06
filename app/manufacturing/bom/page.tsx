import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

const mockBOMs = [
  {
    id: "BOM-BREAD-WHITE-001",
    item: "White Bread",
    status: "Default",
    itemDescription: "Soft white sandwich bread",
    isActive: true,
    isDefault: true,
    lastUpdated: "3d",
  },
  {
    id: "BOM-CROISSANT-002",
    item: "Butter Croissant",
    status: "Approved",
    itemDescription: "Flaky layered French pastry",
    isActive: true,
    isDefault: true,
    lastUpdated: "2d",
  },
  {
    id: "BOM-CAKE-VANILLA-003",
    item: "Vanilla Cake",
    status: "Draft",
    itemDescription: "Layered vanilla sponge cake",
    isActive: true,
    isDefault: false,
    lastUpdated: "4h",
  },
  {
    id: "BOM-BAGUETTE-004",
    item: "Baguette",
    status: "Approved",
    itemDescription: "Traditional French baguette",
    isActive: true,
    isDefault: true,
    lastUpdated: "5d",
  },
  {
    id: "BOM-DOUGHNUT-005",
    item: "Glazed Doughnut",
    status: "Default",
    itemDescription: "Classic yeast doughnut with glaze",
    isActive: true,
    isDefault: true,
    lastUpdated: "1w",
  },
  {
    id: "BOM-PIE-APPLE-006",
    item: "Apple Pie",
    status: "Approved",
    itemDescription: "Classic spiced apple pie",
    isActive: true,
    isDefault: false,
    lastUpdated: "2w",
  },
  {
    id: "BOM-BROWNIE-007",
    item: "Chocolate Brownie",
    status: "Draft",
    itemDescription: "Rich fudgy chocolate brownie",
    isActive: true,
    isDefault: false,
    lastUpdated: "2m",
  },
  {
    id: "BOM-CUPCAKE-008",
    item: "Vanilla Cupcake",
    status: "Approved",
    itemDescription: "Vanilla cupcake with buttercream frosting",
    isActive: true,
    isDefault: false,
    lastUpdated: "5d",
  },
  {
    id: "BOM-BREAD-WHOLEWHEAT-009",
    item: "Whole Wheat Bread",
    status: "Default",
    itemDescription: "High-fiber whole wheat bread",
    isActive: true,
    isDefault: true,
    lastUpdated: "6d",
  },
  {
    id: "BOM-PUFFPASTRY-010",
    item: "Puff Pastry Sheets",
    status: "Draft",
    itemDescription: "Laminated dough for savory and sweet bakes",
    isActive: true,
    isDefault: false,
    lastUpdated: "3w",
  },
];


export default function BOM() {
  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-[var(--card-foreground)]">BOM</h1>
          <div className="space-x-2">
            <Button variant="outline" className="border-[var(--border)] text-[var(--card-foreground)]">
              List View
            </Button>
            <Link href="/manufacturing/add-bom">
            <Button variant="default" className="bg-[var(--primary)] text-[var(--primary-foreground)]">
              + Add BOM
            </Button>
            </Link>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[var(--card-foreground)] block mb-1">ID</label>
              <Input
                placeholder="ID"
                className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
              />
            </div>
            <div>
              <label className="text-[var(--card-foreground)] block mb-1">Item</label>
              <Input
                placeholder="Item"
                className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
              />
            </div>
            <div>
              <label className="text-[var(--card-foreground)] block mb-1">Status</label>
              <Select>
                <SelectTrigger className="w-full bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[var(--card-foreground)] block mb-1">Company</label>
              <Input
                placeholder="Company"
                className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
                defaultValue="Ma Ma Beignet"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <Button
              variant="outline"
              className="border-[var(--border)] text-[var(--card-foreground)]"
            >
              Filter
            </Button>
            <div className="space-x-2">
              <Button
                variant="outline"
                className="border-[var(--border)] text-[var(--card-foreground)]"
              >
                Filters <span className="ml-1">1</span>
              </Button>
              <Button
                variant="outline"
                className="border-[var(--border)] text-[var(--card-foreground)]"
              >
                Last Updated On
              </Button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[var(--card-foreground)]">ID</TableHead>
                <TableHead className="text-[var(--card-foreground)]">Item</TableHead>
                <TableHead className="text-[var(--card-foreground)]">Status</TableHead>
                <TableHead className="text-[var(--card-foreground)]">Item</TableHead>
                <TableHead className="text-[var(--card-foreground)]">Is Active</TableHead>
                <TableHead className="text-[var(--card-foreground)]">Is Default</TableHead>
                <TableHead className="text-[var(--card-foreground)]">Last Updated On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBOMs.map((bom, index) => (
                <TableRow key={index}>
                  <TableCell className="text-[var(--card-foreground)]">
                    <input type="checkbox" className="mr-2" />
                    {bom.id}
                  </TableCell>
                  <TableCell className="text-[var(--card-foreground)]">
                    {bom.item}
                  </TableCell>
                  <TableCell className="text-[var(--card-foreground)]">
                    <span
                      className={`px-2 py-1 rounded-full text-white ${
                        bom.status === "Draft" ? "bg-red-500" : "bg-green-500"
                      }`}
                    >
                      {bom.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[var(--card-foreground)]">
                    {bom.itemDescription}
                  </TableCell>
                  <TableCell className="text-[var(--card-foreground)]">
                    {bom.isActive ? "✓" : "✗"}
                  </TableCell>
                  <TableCell className="text-[var(--card-foreground)]">
                    {bom.isDefault ? "✓" : "✗"}
                  </TableCell>
                  <TableCell className="text-[var(--card-foreground)]">
                    {bom.lastUpdated}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-[var(--card-foreground)]">20 of 37</span>
            <div className="space-x-2">
              <Button
                variant="outline"
                className="border-[var(--border)] text-[var(--card-foreground)]"
                size="sm"
              >
                20
              </Button>
              <Button
                variant="outline"
                className="border-[var(--border)] text-[var(--card-foreground)]"
                size="sm"
              >
                100
              </Button>
              <Button
                variant="outline"
                className="border-[var(--border)] text-[var(--card-foreground)]"
                size="sm"
              >
                500
              </Button>
              <Button
                variant="outline"
                className="border-[var(--border)] text-[var(--card-foreground)]"
                size="sm"
              >
                2500
              </Button>
            </div>
          </div>
        </div>
      </div>

  );
}