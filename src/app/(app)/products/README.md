# Products Page - Search & Filter Features

## Overview

The products page now includes comprehensive search, filtering, sorting, and pagination capabilities using URL search parameters.

## Features

### 1. **Search Functionality**

- Search by product name or description
- Case-insensitive search
- Real-time updates via URL parameters

**URL Parameter:** `?search=cleaning`

### 2. **Status Filters**

- **All**: Show all products
- **In Stock**: Products with stock above minimum threshold
- **Low Stock**: Products at or below minimum stock level

**URL Parameter:** `?status=low-stock`

### 3. **Pagination**

- Configurable items per page (5, 10, 25, 50, 100)
- Smart page number display with ellipsis
- Previous/Next navigation
- Shows current range and total count

**URL Parameters:**

- `?page=2`
- `?perPage=25`

### 4. **Sorting**

Sort by multiple fields with ascending/descending order:

- **Name** (alphabetical)
- **Stock Level** (numerical)
- **Cost Per Unit** (numerical)
- **Created At** (date)

**URL Parameters:**

- `?sortBy=stockLevel`
- `?sortOrder=desc`

## URL Structure

All filters can be combined:

```
/products?search=cleaner&status=low-stock&sortBy=stockLevel&sortOrder=asc&page=1&perPage=25
```

## Components

### `page.tsx` (Server Component)

- Main products page
- Handles data fetching with Prisma
- Applies search and pagination logic
- Server-side rendering for SEO

### `ProductFilters.tsx` (Client Component)

- Interactive search input
- Status dropdown filter
- Per-page selector
- Sort buttons with visual indicators
- Uses `useRouter` for client-side navigation
- Shows loading state during transitions

### `ProductPagination.tsx` (Client Component)

- Page number navigation
- Previous/Next buttons
- Smart page number display (shows first, last, and pages around current)
- Results count display

## Implementation Details

### Search Params Pattern

The page uses Next.js 14+ App Router search params pattern:

```typescript
type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;
```

### Prisma Query

```typescript
const where: Prisma.ProductWhereInput = {};

if (search) {
  where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } },
  ];
}

const products = await db.product.findMany({
  where,
  include: { employeeProducts: { include: { employee: true } } },
  orderBy: { [sortBy]: sortOrder },
  skip: (page - 1) * perPage,
  take: perPage,
});
```

### Client-Side Filtering

Status filtering is done client-side after fetching to work with calculated fields:

```typescript
let filteredProducts = productsWithStats;
if (status === "low-stock") {
  filteredProducts = productsWithStats.filter((p) => p.isLowStock);
} else if (status === "in-stock") {
  filteredProducts = productsWithStats.filter((p) => !p.isLowStock);
}
```

## Performance Considerations

1. **Server-side pagination**: Only fetches required page of data
2. **Efficient queries**: Uses Prisma's `skip` and `take` for pagination
3. **Optimistic updates**: Client components use `useTransition` for smooth UX
4. **URL-based state**: Enables bookmarking and sharing of filtered views

## Future Enhancements

- [ ] Add export functionality (CSV, Excel)
- [ ] Add bulk actions (delete, update stock)
- [ ] Add advanced filters (cost range, date range)
- [ ] Add saved filter presets
- [ ] Add product analytics dashboard
