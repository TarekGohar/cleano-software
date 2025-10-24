# Products Page Component Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    page.tsx (Server)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  - Authentication & Authorization                     │  │
│  │  - Parse Search Params (page, perPage, search, etc.)  │  │
│  │  - Build Prisma Query with filters                    │  │
│  │  - Fetch products with pagination                     │  │
│  │  - Calculate product stats (assigned, low stock)      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           ProductFilters.tsx (Client)                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  - Search Input (with form submission)          │  │  │
│  │  │  - Status Dropdown (All/In Stock/Low Stock)     │  │  │
│  │  │  - Per Page Selector (5/10/25/50/100)           │  │  │
│  │  │  - Sort Buttons (Name/Stock/Cost/Date)          │  │  │
│  │  │  - Loading State Indicator                       │  │  │
│  │  │  - useRouter for navigation                      │  │  │
│  │  │  - useTransition for smooth updates             │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Products Table (Server Rendered)            │  │
│  │  - Name, Description, Stock, Assigned, Status         │  │
│  │  - Badge components for Low Stock / In Stock          │  │
│  │  - View and Edit links for each product              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         ProductPagination.tsx (Client)                │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  - Results Count Display                         │  │  │
│  │  │  - Previous/Next Buttons                         │  │  │
│  │  │  - Page Number Links with Ellipsis              │  │  │
│  │  │  - Smart page display (first, last, current ±2) │  │  │
│  │  │  - useSearchParams for current state            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Action (Search/Filter/Sort)
        ↓
Client Component (ProductFilters)
        ↓
Update URL Search Params
        ↓
Next.js Router Navigation
        ↓
Server Component Re-render (page.tsx)
        ↓
Parse New Search Params
        ↓
Build Prisma Query
        ↓
Fetch Data from Database
        ↓
Calculate Stats
        ↓
Render Table with New Data
        ↓
Client Components Hydrate with New State
```

## Search Params State Management

```typescript
URL: /products?search=cleaner&status=low-stock&sortBy=stockLevel&sortOrder=desc&page=2&perPage=25

Parsed as:
{
  search: "cleaner",        // Filter by name/description
  status: "low-stock",      // Filter by stock status
  sortBy: "stockLevel",     // Sort field
  sortOrder: "desc",        // Sort direction
  page: "2",                // Current page
  perPage: "25"             // Items per page
}

Used by:
- Server: Build database query
- Client: Display current state in UI
- Both: Generate next navigation URLs
```

## Key Features

### 🔍 Search

- Case-insensitive
- Searches name AND description
- Instant URL update on submit

### 🎯 Filters

- Status: All / In Stock / Low Stock
- Per Page: 5 / 10 / 25 / 50 / 100
- Resets to page 1 when changed

### 📊 Sorting

- Fields: Name, Stock Level, Cost, Date
- Toggle ASC ↑ / DESC ↓
- Visual indicator for active sort

### 📄 Pagination

- Smart page display with ellipsis
- Previous/Next navigation
- Disabled state for boundaries
- Shows current range

## Benefits

✅ **SEO Friendly**: Server-rendered with URL params
✅ **Shareable**: Full state in URL
✅ **Bookmarkable**: Exact view can be saved
✅ **Fast**: Optimistic updates with useTransition
✅ **Efficient**: Server-side pagination
✅ **UX**: Loading states and smooth transitions
