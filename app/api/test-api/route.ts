// app/api/test-api/route.ts
// import { NextResponse } from 'next/server';
import { frappeClient } from '@/lib/frappe-client';
import { handleApiRequest, withEndpointLogging } from '@/lib/api-template';

interface TestApiResponse {
  user: string;
  timestamp: string;
}

export async function GET() {
  return handleApiRequest<TestApiResponse>(
    withEndpointLogging('/api/test-api')(async () => {
      const user = await frappeClient.auth.getLoggedInUser();
      
      if (!user) {
        throw new Error('No user data received from API');
      }

      return {
        user,
        timestamp: new Date().toISOString(),
      };
    })
  );
}