# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Ma Ma Beignet Dashboard is a Next.js 15 application that provides a comprehensive business management system for a bakery. It integrates with Frappe/ERPNext as the backend ERP system and includes modules for POS, accounting, CRM, manufacturing, HR, and asset management.

## Development Commands

### Core Commands
```bash
# Development server (with Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### PowerShell-specific Commands (Windows)
Since this is a Windows environment with PowerShell, use these commands instead of Unix equivalents:

```powershell
# Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules, package-lock.json

# Install dependencies
npm install

# View running processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Kill specific process by port
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

## Architecture Overview

### Backend Integration
- **ERP System**: Frappe/ERPNext integration via `frappe-js-sdk`
- **Client**: Singleton pattern in `lib/frappe-client.ts` with comprehensive error handling
- **Authentication**: Token-based authentication using API keys
- **Environment Variables**: Requires `NEXT_PUBLIC_ERP_API_URL`, `ERP_API_KEY`, `ERP_API_SECRET`

### Frontend Structure
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Radix UI primitives with custom styling in `components/ui/`
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion for smooth interactions

### Key Modules
1. **Dashboard** (`app/dashboard/`): Main analytics dashboard with mock data visualization
2. **POS** (`app/pos/`): Point of sale system with real-time inventory
3. **Accounting** (`app/accounting/`): Sales/purchase invoices and journal entries
4. **CRM** (`app/crm/`): Customer management and sales analytics
5. **Manufacturing** (`app/manufacturing/`): BOM and production planning
6. **Assets** (`app/assets/`): Asset management system

### Data Flow
- API routes in `app/api/` handle Frappe integration
- Custom hooks in `hooks/` manage state and data fetching (SWR-based)
- TypeScript interfaces in `types/` define data structures matching ERPNext doctypes
- Error handling through `ApiResponse<T>` pattern with user-friendly error messages

### Component Architecture
- **Layout**: Collapsible sidebar with section-based navigation
- **Cards**: Reusable metric cards with embedded charts
- **Forms**: Dynamic forms for creating/editing ERP documents
- **Data Display**: Tables with filtering, sorting, and real-time updates

## Key Technical Decisions

### Frappe Integration Patterns
- All API calls go through the `frappeClient` singleton
- Error responses follow `ApiErrorResponse` interface with Frappe-specific error handling
- Stock calculations use warehouse-specific `Bin` documents
- POS items are categorized by name-based keywords (beignet, bread, croissant, etc.)

### State Management
- SWR for server state caching and synchronization
- Local state with React hooks for UI interactions
- Toast notifications for user feedback using custom toast provider

### Styling System
- CSS custom properties for theme colors (`--card`, `--card-foreground`, etc.)
- Responsive grid layouts with mobile-first approach
- Dark theme optimized (background: `#0f0f0f`)
- Motion variants for consistent animations

## Development Guidelines

### API Development
- Use `handleApiRequest` wrapper from `lib/api-template.ts` for consistent error handling
- Include `withEndpointLogging` for debugging API calls
- Follow ERPNext document structure when creating/updating documents
- Handle timestamp mismatches in document creation with retry logic

### Component Development
- Use TypeScript interfaces from `types/` for all data structures
- Implement loading states and error boundaries
- Include responsive design considerations
- Use motion components for enhanced UX

### Testing
- API endpoints include test routes (`/api/test-api`, `/api/test-env`)
- Mock data available in dashboard components for UI development
- Stock check functionality for POS item availability

## Environment Setup

Required environment variables:
- `NEXT_PUBLIC_ERP_API_URL`: Frappe/ERPNext server URL
- `ERP_API_KEY`: API key for authentication
- `ERP_API_SECRET`: API secret for authentication

## Common Debugging Patterns

### Frappe Connection Issues
- Check API credentials and server accessibility
- Use `/api/test-env` and `/api/test-api` endpoints to verify connection
- Review Frappe client error logs for specific error types (permissions, not found, etc.)

### Stock Calculation Problems
- Verify warehouse configuration in POS Profile
- Check `Bin` documents for accurate stock quantities
- Ensure item groups are properly structured under "Finished Goods"

### UI State Issues
- Check SWR cache invalidation for data updates
- Verify responsive grid breakpoints (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
- Review CSS custom property values for theming issues