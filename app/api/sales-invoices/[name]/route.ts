import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { SalesInvoice } from '@/types/pos';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  
  return handleApiRequest<{ salesInvoice: SalesInvoice }>(
    withEndpointLogging(`/api/sales-invoices/${name} - GET`)(async () => {
      // Get the complete sales invoice document with child tables using frappe.client.get
      const invoiceDoc = await frappeClient.call.get('frappe.client.get', {
        doctype: 'Sales Invoice',
        name: name,
      });
      
      // Extract the main invoice data and items
      const salesInvoice = invoiceDoc.message;
      const items = salesInvoice.items || [];
      
      return { 
        salesInvoice: {
          ...salesInvoice,
          items
        } 
      };
    }),
    { requireAuth: true }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  
  return handleApiRequest<{ salesInvoice: SalesInvoice }>(
    withEndpointLogging(`/api/sales-invoices/${name} - PUT`)(async () => {
      const data = await request.json();
      
      const salesInvoice = await frappeClient.db.updateDoc('Sales Invoice', name, data);
      
      // Get the updated invoice with items
      const invoiceDoc = await frappeClient.call.get('frappe.client.get', {
        doctype: 'Sales Invoice',
        name: name,
      });
      
      const items = invoiceDoc.message.items || [];
      
      return { 
        salesInvoice: {
          ...salesInvoice,
          items
        } 
      };
    }),
    { requireAuth: true }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  
  return handleApiRequest<{ message: string }>(
    withEndpointLogging(`/api/sales-invoices/${name} - DELETE`)(async () => {
      try {
        // Cancel the invoice to restore stock
        await frappeClient.db.cancel('Sales Invoice', name);
        return { message: `Sales Invoice ${name} cancelled successfully` };
      } catch (error) {
        console.error('Error cancelling sales invoice:', error);
        
        // If direct cancel fails, try using frappe.call
        try {
          await frappeClient.call.post('frappe.client.cancel', {
            doctype: 'Sales Invoice',
            name: name
          });
          return { message: `Sales Invoice ${name} cancelled successfully` };
        } catch (callError) {
          console.error('Error cancelling with frappe.call:', callError);
          throw new Error(`Failed to cancel Sales Invoice ${name}`);
        }
      }
    }),
    { requireAuth: true }
  );
}