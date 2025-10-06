// lib/api-template.ts
import { NextResponse } from 'next/server';
import { frappeClient, ApiResponse } from './frappe-client';

export interface ApiHandlerOptions {
  requireAuth?: boolean;
}

export async function handleApiRequest<T>(
  handler: () => Promise<T>,
  options: ApiHandlerOptions = { requireAuth: false }
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    // Validate environment variables
    const erpApiUrl = process.env.NEXT_PUBLIC_ERP_API_URL;
    const erpApiKey = process.env.ERP_API_KEY;
    const erpApiSecret = process.env.ERP_API_SECRET;

    if (!erpApiUrl || !erpApiKey || !erpApiSecret) {
      throw new Error('Missing ERP API environment variables');
    }

    // Optional: Verify authentication if required
    if (options.requireAuth) {
      const user = await frappeClient.auth.getLoggedInUser();
      if (!user) {
        throw new Error('Authentication required');
      }
    }

    // Execute the handler function
    const data = await handler();

    const successResponse: ApiResponse<T> = {
      success: true,
      data,
      message: 'Request successful',
    };

    return NextResponse.json(successResponse);

  } catch (error) {
    const errorResponse = frappeClient.handleError(error);

    console.error('API Request Error:', {
      error: errorResponse,
      timestamp: new Date().toISOString(),
      endpoint: 'unknown', // This should be set by the route
    });

    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode || 500,
    });
  }
}

// Utility function for specific endpoints
export function withEndpointLogging(endpoint: string) {
  return function <T>(handler: () => Promise<T>) {
    return async (): Promise<T> => {
      console.log(`API Call: ${endpoint}`, {
        timestamp: new Date().toISOString(),
      });
      return handler();
    };
  };
}

