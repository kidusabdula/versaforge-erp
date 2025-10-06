import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.ERP_API_URL;
  const key = process.env.ERP_API_KEY;
  const secret = process.env.ERP_API_SECRET;
  return NextResponse.json({
    url: url || 'Not set',
    key: key ? 'Set' : 'Not set',
    secret: secret ? 'Set' : 'Not set',
  });
}
