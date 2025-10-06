"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function AddBOMPage() {
  const [bomDetails, setBomDetails] = useState({
    item: "",
    company: "Ma Ma Beignet",
    quantity: "",
    isActive: false,
    isDefault: false,
    allowAlternate: false,
    rateBasedOnBOM: false,
    project: "",
  });
  const [rawMaterials, setRawMaterials] = useState([{ no: 1, itemCode: "", qty: 0, rate: 0, amount: 0 }]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setBomDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleRawMaterialChange = (index: number, field: string, value: string | number) => {
    const newRawMaterials = [...rawMaterials];
    // @ts-expect-error: Error
    newRawMaterials[index][field] = value;
    if (field === "qty" || field === "rate") {
        // @ts-expect-error: Error
      newRawMaterials[index]["amount"] = (parseFloat(newRawMaterials[index]["qty"] as string) || 0) * (parseFloat(newRawMaterials[index]["rate"] as string) || 0);
    }
    setRawMaterials(newRawMaterials);
  };

  const addRow = () => {
    setRawMaterials([...rawMaterials, { no: rawMaterials.length + 1, itemCode: "", qty: 0, rate: 0, amount: 0 }]);
  };

  const addMultiple = () => {
    setRawMaterials([
      ...rawMaterials,
      ...Array(5).map((_, i) => ({ no: rawMaterials.length + i + 1, itemCode: "", qty: 0, rate: 0, amount: 0 })),
    ]);
  };

  const removeRow = (index: number) => {
    if (rawMaterials.length > 1) {
      setRawMaterials(rawMaterials.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-[var(--card-foreground)]">New BOM <span className="text-red-600 text-sm">Not Saved</span></h1>
        <Button variant="default" className="bg-[var(--primary)] text-[var(--primary-foreground)]">Save</Button>
      </div>

      <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
        <div className="space-y-4">
          <div>
            <label className="text-[var(--card-foreground)] block mb-1">Production Item</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Item to be manufactured or repacked"
                className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)] flex-1"
                value={bomDetails.item}
                onChange={(e) => handleInputChange("item", e.target.value)}
              />
              <Select
                value={bomDetails.company}
                onValueChange={(value) => handleInputChange("company", value)}
              >
                <SelectTrigger className="w-1/3 bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ma Ma Beignet">Ma Ma Beignet</SelectItem>
                  <SelectItem value="Wind Power LLC">Wind Power LLC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[var(--card-foreground)] block mb-1">Quantity *</label>
            <Input
              placeholder="1,000 of item obtained after manufacturing/repacking from given quantities of raw materials"
              className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
              value={bomDetails.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <Checkbox
              id="isActive"
              checked={bomDetails.isActive}
              onCheckedChange={(checked) => handleInputChange("isActive", checked as boolean)}
            />
            <label htmlFor="isActive" className="text-[var(--card-foreground)]">Is Active</label>
            <Checkbox
              id="isDefault"
              checked={bomDetails.isDefault}
              onCheckedChange={(checked) => handleInputChange("isDefault", checked as boolean)}
            />
            <label htmlFor="isDefault" className="text-[var(--card-foreground)]">Is Default</label>
          </div>
          <div className="flex items-center space-x-4">
            <Checkbox
              id="allowAlternate"
              checked={bomDetails.allowAlternate}
              onCheckedChange={(checked) => handleInputChange("allowAlternate", checked as boolean)}
            />
            <label htmlFor="allowAlternate" className="text-[var(--card-foreground)]">Allow Alternate Item</label>
            <Checkbox
              id="rateBasedOnBOM"
              checked={bomDetails.rateBasedOnBOM}
              onCheckedChange={(checked) => handleInputChange("rateBasedOnBOM", checked as boolean)}
            />
            <label htmlFor="rateBasedOnBOM" className="text-[var(--card-foreground)]">Set rate of sub-assembly item based on BOM</label>
          </div>
          <div>
            <label className="text-[var(--card-foreground)] block mb-1">Project</label>
            <Input
              placeholder="Project"
              className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)]"
              value={bomDetails.project}
              onChange={(e) => handleInputChange("project", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)]">
        <h3 className="text-[var(--card-foreground)] mb-4">Cost Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[var(--card-foreground)] block mb-1">Raw Materials</label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[var(--card-foreground)] w-4"></TableHead>
                  <TableHead className="text-[var(--card-foreground)]">No.</TableHead>
                  <TableHead className="text-[var(--card-foreground)]">Item Code *</TableHead>
                  <TableHead className="text-[var(--card-foreground)]">Qty</TableHead>
                  <TableHead className="text-[var(--card-foreground)]">Rate (USD $)</TableHead>
                  <TableHead className="text-[var(--card-foreground)]">Amount (USD $)</TableHead>
                  <TableHead className="text-[var(--card-foreground)]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawMaterials.map((material, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-[var(--card-foreground)]">
                      <input type="checkbox" className="mr-2" />
                    </TableCell>
                    <TableCell className="text-[var(--card-foreground)]">{material.no}</TableCell>
                    <TableCell className="text-[var(--card-foreground)]">
                      <Input
                        placeholder="Item Code"
                        className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)] w-40"
                        value={material.itemCode}
                        onChange={(e) => handleRawMaterialChange(index, "itemCode", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-[var(--card-foreground)]">
                      <Input
                        type="number"
                        className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)] w-20"
                        value={material.qty}
                        onChange={(e) => handleRawMaterialChange(index, "qty", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-[var(--card-foreground)]">
                      <Input
                        type="number"
                        className="bg-[var(--input)] text-[var(--card-foreground)] border-[var(--border)] w-20"
                        value={material.rate}
                        onChange={(e) => handleRawMaterialChange(index, "rate", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-[var(--card-foreground)]">{(material.amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-[var(--card-foreground)]">
                      <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeRow(index)}
                      >
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" className="border-[var(--border)] text-[var(--card-foreground)]" onClick={addRow}>
                Add Row
              </Button>
              <Button variant="outline" className="border-[var(--border)] text-[var(--card-foreground)]" onClick={addMultiple}>
                Add Multiple
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}