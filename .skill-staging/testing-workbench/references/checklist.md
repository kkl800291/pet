# Testing Checklist

## API

- Health and readiness endpoints respond correctly
- Auth flow succeeds and rejects bad credentials
- Core create/update/delete actions persist state
- Error responses are structured and meaningful
- Protected routes reject unauthorized access

## UI

- Primary page loads without fatal console errors
- Main CTA and destructive actions are clickable and complete
- State changes appear in UI after action
- Detail pages handle missing or deleted resources safely
- Filters and exports work when present

## Evidence

- At least one screenshot for the main success path
- Exact API response for the main mutation
- Console log or network response for any failure

## Classification

- `Passed`: worked as designed
- `Failed`: reproducible mismatch
- `Blocked`: could not verify due to environment or missing dependency
