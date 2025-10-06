// app/api/accounting/chart-of-accounts/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';
import { ChartOfAccount } from '@/types/accounting';

// GET - Fetch chart of accounts
export async function GET(request: NextRequest) {
  return handleApiRequest<{ accounts: ChartOfAccount[] }>(
    withEndpointLogging('/api/accounting/chart-of-accounts - GET')(async () => {
      const { searchParams } = new URL(request.url);
      const company = searchParams.get('company');
      
      if (!company) {
        throw new Error('Company parameter is required');
      }

      const accounts = await frappeClient.db.getDocList<ChartOfAccount>('Account', {
        fields: [
          'name', 'account_name', 'account_type', 'parent_account', 
          'is_group', 'company', 'root_type', 'tax_rate'
        ],
        filters: [['company', '=', company]],
        orderBy: { field: 'account_name', order: 'asc' },
        limit: 1000,
      });

      return { accounts };
    })
  );
}

// POST - Create new account
export async function POST(request: NextRequest) {
  return handleApiRequest<{ account: ChartOfAccount }>(
    withEndpointLogging('/api/accounting/chart-of-accounts - POST')(async () => {
      const data: Omit<ChartOfAccount, 'name'> = await request.json();

      if (!data.account_name || !data.account_type || !data.company || !data.root_type) {
        throw new Error('Missing required fields: account_name, account_type, company, root_type');
      }

      const account = await frappeClient.db.createDoc('Account', data);
      return { account };
    })
  );
}