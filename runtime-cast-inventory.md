# Runtime `as unknown as` Inventory

## Scope

- Includes only runtime application files (`src/**/+page.server.ts`, `src/lib/server/**`)
- Excludes tests (`*.test.ts`) and comments/docs

## Current Status

- Total runtime `as unknown as`: **4**
- All 4 are in cross-route reuse flows in budgets routes.
- All are **kept intentionally** due to SvelteKit RouteId typing constraints.

## Kept (Justified)

1. `src/routes/(app)/budgets/new/+page.server.ts:14`
   - `budgetsLoad(...) as unknown as Parameters<typeof budgetsLoad>[0]`
   - Reason: route event type is `/(app)/budgets/new`, but reused load expects
     `/(app)/budgets`.

2. `src/routes/(app)/budgets/new/+page.server.ts:34`
   - `event as unknown as Parameters<typeof budgetsActions.create>[0]`
   - Reason: `RequestEvent` RouteId mismatch in cross-route action reuse.

3. `src/routes/(app)/budgets/[budget_id]/update/+page.server.ts:17`
   - `budgetsLoad(...) as unknown as Parameters<typeof budgetsLoad>[0]`
   - Reason: route event type is `/(app)/budgets/[budget_id]/update`, reused
     load expects `/(app)/budgets`.

4. `src/routes/(app)/budgets/[budget_id]/update/+page.server.ts:66`
   - `event as unknown as Parameters<typeof budgetsActions.update>[0]`
   - Reason: `RequestEvent` RouteId mismatch in cross-route action reuse.

## Removed In This Refactor Wave

- `src/routes/(app)/seguimiento/+page.server.ts`
  - Replaced relation casts with guarded readers (`readBudgetId`,
    `readTutorFullName`).
- `src/routes/(app)/recipes/new/+page.server.ts`
  - Replaced tutor relation cast with guarded reader (`readTutorName`).
- `src/routes/(app)/recipes/[recipe_id]/update/+page.server.ts`
  - Replaced tutor relation cast with guarded reader (`readTutorName`).
- `src/lib/server/budgets/whatsapp.ts`
  - Removed unknown-cast by typing the fetched budget directly as
    `BudgetWhatsappRow` after null/error guard.
