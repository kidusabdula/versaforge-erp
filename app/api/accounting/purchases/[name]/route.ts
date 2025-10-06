// app/api/accounting/purchases/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { PurchaseRecord, PurchaseItem } from '@/types/accounting';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> } // 1️⃣ Promise wrapper
) {
  const { name } = await params; // 2️⃣ unwrap

  return handleApiRequest<{ purchase: PurchaseRecord }>(
    withEndpointLogging(`/api/accounting/purchases/${name} - GET`)(
      async () => {
        const fullPurchase = await frappeClient.call.get('frappe.client.get', {
          doctype: 'Purchase Invoice',
          name,
        });

        if (!fullPurchase?.message) throw new Error('Purchase not found');

        const doc = fullPurchase.message;

        const purchase: PurchaseRecord = {
          name: doc.name,
          supplier: doc.supplier,
          supplier_name: doc.supplier_name,
          posting_date: doc.posting_date,
          due_date: doc.due_date,
          grand_total: doc.grand_total,
          total_amount: doc.grand_total,
          total_tax: doc.total_tax || 0,
          status: doc.status,
          docstatus: doc.docstatus,
          currency: doc.currency,
          company: doc.company,
          items: (doc.items || []).map((item: any): PurchaseItem => ({
            item_code: item.item_code,
            item_name: item.item_name,
            description: item.description,
            qty: item.qty,
            rate: item.rate,
            amount: item.amount,
          })),
        };

        return { purchase };
      }
    ),
    { requireAuth: true }
  );
}