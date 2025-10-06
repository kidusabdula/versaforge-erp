// app/api/accounting/sales/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { SalesInvoice } from '@/types/accounting';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> } // 1️⃣ Promise wrapper
) {
  const { name } = await params; // 2️⃣ unwrap

  return handleApiRequest<{ salesInvoice: SalesInvoice }>(
    withEndpointLogging(`/api/accounting/sales/${name} - GET`)(async () => {
      const fullInvoice = await frappeClient.call.get('frappe.client.get', {
        doctype: 'Sales Invoice',
        name,
      });

      if (!fullInvoice?.message) throw new Error('Sales invoice not found');

      const doc = fullInvoice.message;

      const salesInvoice: SalesInvoice = {
        name: doc.name,
        customer: doc.customer,
        customer_name: doc.customer_name,
        posting_date: doc.posting_date,
        due_date: doc.due_date,
        grand_total: doc.grand_total,
        status: doc.status,
        docstatus: doc.docstatus,
        currency: doc.currency,
        company: doc.company,
        items: doc.items || [],
      };

      return { salesInvoice };
    }),
    { requireAuth: true }
  );
}