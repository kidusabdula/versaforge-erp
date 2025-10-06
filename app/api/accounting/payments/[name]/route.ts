// app/api/accounting/payments/[name]/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { PaymentEntry } from '@/types/accounting';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> } // 1️⃣ Promise wrapper
) {
  const { name } = await params; // 2️⃣ await it

  return handleApiRequest<{ payment: PaymentEntry }>(
    withEndpointLogging(`/api/accounting/payments/${name} - GET`)(
      async () => {
        const fullPayment = await frappeClient.call.get('frappe.client.get', {
          doctype: 'Payment Entry',
          name,
        });

        if (!fullPayment?.message) throw new Error('Payment not found');

        const doc = fullPayment.message;

        // Helper to fetch a single field value
        const getField = (doctype: string, name: string, field: string) =>
          frappeClient.call
            .get('frappe.client.get_value', { doctype, name, fieldname: field })
            .then((r) => r?.message ?? name);

        const [paidFromName, paidToName, partyName] = await Promise.all([
          getField('Account', doc.paid_from, 'account_name'),
          getField('Account', doc.paid_to, 'account_name'),
          (async () => {
            if (!doc.party) return '';
            const doctype =
              doc.party_type === 'Customer'   ? 'Customer'
              : doc.party_type === 'Supplier' ? 'Supplier'
              : doc.party_type === 'Employee' ? 'Employee'
              : '';
            return doctype
              ? getField(doctype, doc.party, `${doctype.toLowerCase()}_name`)
              : doc.party;
          })(),
        ]);

        const payment: PaymentEntry = {
          name: doc.name,
          payment_type: doc.payment_type,
          party_type: doc.party_type,
          party: doc.party,
          party_name: partyName,
          posting_date: doc.posting_date,
          amount: doc.amount,
          paid_amount: doc.paid_amount || 0,
          received_amount: doc.received_amount || 0,
          reference_no: doc.reference_no,
          reference_date: doc.reference_date,
          status: doc.status,
          payment_method: doc.mode_of_payment,
          company: doc.company,
          currency: doc.currency,
          mode_of_payment: doc.mode_of_payment,
          paid_from: doc.paid_from,
          paid_to: doc.paid_to,
          paid_from_account_name: paidFromName,
          paid_to_account_name: paidToName,
        };

        return { payment };
      }
    ),
    { requireAuth: true }
  );
}