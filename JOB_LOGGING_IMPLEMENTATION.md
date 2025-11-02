# Job Logging & Employee Time Tracking Implementation

## Overview

This implementation adds a comprehensive job logging system and an employee-focused "My Jobs" page with clock in/out functionality and automatic product usage tracking.

## What Was Implemented

### 1. Database Schema Changes (`prisma/schema.prisma`)

#### New Model: `JobLog`

Tracks all changes made to jobs with the following fields:

- `action`: Type of change (CREATED, UPDATED, CLOCKED_IN, CLOCKED_OUT, etc.)
- `description`: Human-readable description of the change
- `field`, `oldValue`, `newValue`: For tracking specific field changes
- `userId`: Who made the change
- `createdAt`: When the change occurred

#### Updates to `Job` Model

- Added `clockInTime` and `clockOutTime` fields for time tracking
- Added `logs` relation to JobLog model

#### Updates to `JobProductUsage` Model

- Added `inventoryBefore` and `inventoryAfter` fields to track product usage

### 2. Server Actions

#### `clockIn.ts`

- Validates user is assigned to the job
- Records clock in time
- Updates job status to IN_PROGRESS
- Creates log entries

#### `clockOut.ts`

- Validates user is clocked in
- Records clock out time
- Calculates product usage based on before/after inventory
- Updates employee product inventory
- Creates log entries for all product usage
- Updates job status to COMPLETED

#### `createJobLog.ts`

- Utility function for creating manual log entries

### 3. My Jobs Page (`/my-jobs/page.tsx`)

A dedicated employee view that shows:

- **Currently Working**: Jobs that are in progress (clocked in)
- **Upcoming Jobs**: Scheduled jobs not yet started
- **Completed Jobs**: Recently finished jobs

Each job card displays:

- Client name, location, and job type
- Date and time information
- Employee pay (for main employee)
- Team members
- Clock in/out status with duration
- Product usage summary
- Clock in/out action buttons

### 4. Clock In/Out Components

#### `ClockInButton.tsx`

Simple button that calls the clockIn server action.

#### `ClockOutButton.tsx`

Opens a modal that:

- Displays all products assigned to the employee
- Shows the starting inventory level
- Allows input of remaining inventory
- Calculates and displays amount used
- Submits all inventory updates when clocking out

### 5. Job Details Page Updates

Added an **Activity Log** section that displays:

- Timeline view of all job changes
- Icons for different action types
- Timestamps for each activity
- Field changes (old → new values)

### 6. Navigation Update

Added "My Jobs" link in the navigation for non-admin users.

## What You Need To Do

### Step 1: Run the Database Migration

When your database is available, run:

```bash
npx prisma db push
```

Or create a proper migration:

```bash
npx prisma migrate dev --name add_job_logs_and_clock_times
```

This will:

- Add the JobLog table
- Add clockInTime and clockOutTime to the Job table
- Add inventoryBefore and inventoryAfter to JobProductUsage
- Create the JobLogAction enum
- Regenerate Prisma types (fixing the TypeScript errors)

### Step 2: Test the Flow

1. **As an Admin:**

   - Create a job and assign it to an employee
   - Assign products to that employee in their inventory

2. **As an Employee:**

   - Navigate to "My Jobs" page
   - Click "Clock In" on an assigned job
   - Work on the job
   - Click "Clock Out"
   - Enter remaining inventory amounts
   - Confirm clock out

3. **View the Results:**
   - Check the job details page to see:
     - Updated clock in/out times
     - Product usage calculations
     - Activity log showing all changes

### Step 3: Optional Enhancements

Consider adding job logs when:

- Jobs are created (modify the create job action)
- Jobs are updated (modify the update job action)
- Payment is received (add a payment received action)
- Invoices are sent (add an invoice sent action)

You can use the `createJobLog` action for this:

```typescript
import { createJobLog } from "@/app/(app)/actions/createJobLog";

await createJobLog({
  jobId: job.id,
  action: "PAYMENT_RECEIVED",
  description: "Payment of $500 received",
});
```

## Key Features

### Automatic Product Usage Tracking

When an employee clocks out:

1. System compares inventory before (when assigned) and after (when clocked out)
2. Calculates the difference automatically
3. Updates the job's product usage records
4. Updates the employee's inventory
5. Logs the usage in the activity log

### Comprehensive Activity Timeline

Every action is logged:

- Who did it
- When they did it
- What changed
- Visual timeline on job details page

### Employee-Centric View

The My Jobs page gives employees:

- Clear view of their schedule
- Easy clock in/out process
- Visibility into their pay
- Product usage tracking

## Color Scheme

All new UI components use the consistent teal color scheme:

- Primary: `#90B3DD` (dark teal)
- Secondary: `#77C8CC` (light teal)

## Notes

- The one remaining TypeScript error in `jobs/[id]/page.tsx` will be resolved after running the migration
- All type assertions using `as any` are temporary and will be properly typed after Prisma regenerates
- The clock in/out functionality is tied to the actual time tracking, not the scheduled times
- Product usage is only recorded when clocking out, ensuring accurate tracking
