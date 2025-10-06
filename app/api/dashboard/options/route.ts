// app/api/dashboard/options/route.ts
import { NextRequest } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';

interface DashboardOptions {
  companies: { name: string; label: string }[];
  warehouses: { name: string; label: string }[];
  dateRanges: { value: string; label: string }[];
  reportTypes: { value: string; label: string }[];
  itemGroups: { name: string; label: string }[];
}

export async function GET() {
  return handleApiRequest<DashboardOptions>(
    withEndpointLogging('/api/dashboard/options - GET')(async () => {
      // Get companies
      const companies = await frappeClient.db.getDocList('Company', {
        fields: ['name'],
        limit: 100
      });
      
      // Get warehouses
      const warehouses = await frappeClient.db.getDocList('Warehouse', {
        fields: ['name'],
        limit: 100
      });
      
      // Get item groups
      const itemGroups = await frappeClient.db.getDocList('Item Group', {
        fields: ['name'],
        filters: [
          ['parent_item_group', '=', 'All Item Groups'],
          ['is_group', '=', 1]
        ],
        limit: 100
      });
      
      // Define date ranges
      const dateRanges = [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'this_week', label: 'This Week' },
        { value: 'last_week', label: 'Last Week' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
        { value: 'this_quarter', label: 'This Quarter' },
        { value: 'last_quarter', label: 'Last Quarter' },
        { value: 'this_year', label: 'This Year' },
        { value: 'last_year', label: 'Last Year' },
        { value: 'custom', label: 'Custom Range' }
      ];
      
      // Define report types
      const reportTypes = [
        { value: 'sales', label: 'Sales Report' },
        { value: 'purchase', label: 'Purchase Report' },
        { value: 'inventory', label: 'Inventory Report' },
        { value: 'financial', label: 'Financial Statement' },
        { value: 'tax', label: 'Tax Report' }
      ];
      
      return {
        companies: companies.map(c => ({ name: c.name, label: c.name })),
        warehouses: warehouses.map(w => ({ name: w.name, label: w.name })),
        dateRanges,
        reportTypes,
        itemGroups: itemGroups.map(g => ({ name: g.name, label: g.name }))
      };
    })
  );
}