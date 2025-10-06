// lib/frappe-client.ts
import { FrappeApp } from "frappe-js-sdk";

// Frappe Error Interface
export interface FrappeError {
  message: string;
  httpStatus?: number;
  httpStatusText?: string;
  exceptions?: string[];
  exception?: string;
}

// Type guard for FrappeError
export function isFrappeError(error: unknown): error is FrappeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as FrappeError).message === "string"
  );
}

// API Response Types
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  statusCode?: number;
  frappeError?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Frappe Client Singleton
class FrappeClient {
  private static instance: FrappeClient;
  public db: ReturnType<FrappeApp["db"]>;
  public auth: ReturnType<FrappeApp["auth"]>;
  public call: ReturnType<FrappeApp["call"]>;
  public file: ReturnType<FrappeApp["file"]>;

  private constructor() {
    const erpApiUrl = process.env.NEXT_PUBLIC_ERP_API_URL;
    const erpApiKey = process.env.ERP_API_KEY;
    const erpApiSecret = process.env.ERP_API_SECRET;

    if (!erpApiUrl || !erpApiKey || !erpApiSecret) {
      throw new Error("Missing ERP API environment variables");
    }

    const frappe = new FrappeApp(erpApiUrl, {
      useToken: true,
      token: () => `${erpApiKey}:${erpApiSecret}`,
      type: "token",
    });

    this.db = frappe.db();
    this.auth = frappe.auth();
    this.call = frappe.call();
    this.file = frappe.file();
  }

  public static getInstance(): FrappeClient {
    if (!FrappeClient.instance) {
      FrappeClient.instance = new FrappeClient();
    }
    return FrappeClient.instance;
  }

  // Helper method to handle Frappe errors
  public handleError(error: unknown): ApiErrorResponse {
    console.error("Frappe Client Error:", error);

    if (isFrappeError(error)) {
      return {
        success: false,
        error: "Frappe API Error",
        details: error.message,
        statusCode: error.httpStatus,
        frappeError: error.exceptions || error.exception,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: "Application Error",
        details: error.message,
      };
    }

    return {
      success: false,
      error: "Unknown Error",
      details: String(error),
    };
  }
  // lib/frappe-client.ts (add this method to the FrappeClient class)
  public handleFrappeError(
    error: unknown,
    context: string = ""
  ): ApiErrorResponse {
    console.error(`Frappe Error [${context}]:`, error);

    if (isFrappeError(error)) {
      // Handle specific Frappe error types
      let userFriendlyError = error.message;
      let statusCode = error.httpStatus || 500;

      // Common Frappe error patterns
      if (
        error.message.includes("does not exist") ||
        error.message.includes("not found")
      ) {
        userFriendlyError = "The requested resource was not found";
        statusCode = 404;
      } else if (
        error.message.includes("permission") ||
        error.message.includes("access")
      ) {
        userFriendlyError = "You do not have permission to perform this action";
        statusCode = 403;
      } else if (
        error.message.includes("duplicate") ||
        error.message.includes("already exists")
      ) {
        userFriendlyError = "A record with these details already exists";
        statusCode = 409;
      } else if (
        error.message.includes("required") ||
        error.message.includes("mandatory")
      ) {
        userFriendlyError = "Required fields are missing or invalid";
        statusCode = 400;
      }

      return {
        success: false,
        error: userFriendlyError,
        details: error.message,
        statusCode,
        frappeError: error.exceptions || error.exception,
      };
    }

    // Fallback to generic error handling
    return this.handleError(error);
  }
}

export const frappeClient = FrappeClient.getInstance();
