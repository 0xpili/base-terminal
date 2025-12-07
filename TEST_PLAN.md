# Test Plan - Base Terminal Dashboard

## Current Test Coverage

### ✅ Fully Tested
1. **`lib/csv-utils.test.ts`** (253 lines, comprehensive)
   - CSV conversion with edge cases (commas, quotes, newlines)
   - Date formatting
   - Integration tests for pool/holder data

2. **`components/OtherDEXPoolsCard.test.tsx`** (340 lines, comprehensive)
   - Empty states
   - Multi-DEX rendering (Uniswap, PancakeSwap, Sushi, Alien)
   - TVL/volume calculations
   - UI elements and pool counts

### ❌ Not Tested (CRITICAL GAPS)

#### High Priority (Core Functionality)
1. **`lib/cambrian-api.ts`** ⚠️ MOST CRITICAL
   - fetchCambrian helper
   - Token endpoints
   - Price endpoints
   - Pool endpoints (all DEXes)
   - Columnar data transformation
   - Error handling (CambrianAPIError)
   - Pool enrichment logic
   - Filtering logic (especially Aerodrome client-side)

2. **`components/AerodromePoolsCard.tsx`**
   - Pool rendering
   - TVL/volume calculations
   - CSV export
   - Empty/loading states

3. **`components/PriceOverviewCard.tsx`**
   - Price display and formatting
   - Percentage calculations
   - Chart rendering
   - Error states

4. **`components/TokenSearch.tsx`**
   - Search functionality
   - Autocomplete
   - Token selection
   - Loading states

5. **`components/TopHoldersCard.tsx`**
   - Holder data display
   - Percentage calculations
   - CSV export
   - Empty states

#### Medium Priority (UI Components)
6. **`components/ErrorMessage.tsx`**
   - Error display
   - Different error types

7. **`components/LoadingSpinner.tsx`**
   - Render states

8. **`lib/utils.ts`**
   - formatCurrency
   - formatNumber
   - formatAddress
   - getBaseScanUrl
   - Date utilities

---

## Detailed Test Plan by Priority

### Priority 1: API Layer (lib/cambrian-api.ts)

**File**: `lib/cambrian-api.test.ts`

**Test Suites**:

1. **fetchCambrian Helper**
   ```typescript
   - Should construct correct URL with query params
   - Should set correct headers (API key, Accept)
   - Should handle successful 200 responses
   - Should throw CambrianAPIError on 400/500 errors
   - Should include error details in thrown error
   - Should handle network errors
   - Should handle timeout
   - Should respect cache headers
   ```

2. **transformColumnarToObjects**
   ```typescript
   - Should transform simple columnar data
   - Should handle empty columns
   - Should handle empty data
   - Should handle mixed types (string, number, boolean)
   - Should handle null values
   - Should handle mismatched column/data lengths
   ```

3. **Token Endpoints**
   ```typescript
   getTokens():
   - Should fetch and transform token list
   - Should handle empty token list
   - Should handle API errors

   searchTokens(query):
   - Should filter by symbol and name
   - Should handle case-insensitive search
   - Should return empty array for no matches
   ```

4. **Price Endpoints**
   ```typescript
   getCurrentPrice(address):
   - Should fetch current price
   - Should handle token not found
   - Should handle missing price data

   getPriceHistory(address, hours):
   - Should fetch price history
   - Should default to 24 hours
   - Should handle empty history
   ```

5. **Pool Endpoints (Each DEX)**
   ```typescript
   For each: getUniswapV3Pools, getPancakeV3Pools, etc.
   - Should fetch pools with token filter
   - Should fetch pools without filter
   - Should handle empty pool list
   - Should respect limit parameter
   - Should include token_address in params

   getAerodromeV2Pools (special):
   - Should NOT send chain_id/token_address params
   - Should filter client-side by token
   - Should check all field variations (token0, token0Address, token0_address)
   - Should handle pools with missing addresses
   ```

6. **Pool Detail Endpoints**
   ```typescript
   For each: getUniswapV3PoolDetail, etc.
   - Should fetch individual pool data
   - Should handle pool not found
   - Should handle missing TVL data
   ```

7. **Pool Enrichment**
   ```typescript
   enrichPoolsWithDetails(pools, dex):
   - Should enrich pools in parallel
   - Should skip pools that already have TVL
   - Should handle partial failures
   - Should preserve original pool data
   - Should merge detail data correctly
   ```

8. **Top Holders**
   ```typescript
   getTopHolders(address):
   - Should fetch holder list
   - Should transform addresses correctly
   - Should handle empty holders
   ```

---

### Priority 2: Core UI Components

#### AerodromePoolsCard.test.tsx

**Test Suites**:

1. **Empty & Loading States**
   ```typescript
   - Should show loading spinner while loading
   - Should show empty state for no pools
   - Should not crash with undefined pools
   ```

2. **Pool Rendering**
   ```typescript
   - Should render single pool correctly
   - Should render multiple pools
   - Should display token symbols correctly
   - Should show pool type badges (stable/volatile)
   - Should format TVL and volume
   - Should format APR correctly
   - Should show pool addresses with links
   ```

3. **Calculations**
   ```typescript
   - Should calculate total TVL correctly
   - Should calculate total volume correctly
   - Should handle missing TVL values
   - Should handle missing volume values
   ```

4. **CSV Export**
   ```typescript
   - Should generate CSV with correct headers
   - Should include all pool data
   - Should handle empty pools
   ```

5. **UI Elements**
   ```typescript
   - Should show header with subtitle
   - Should show CSV download button
   - Should show correct pool count (singular/plural)
   ```

---

#### PriceOverviewCard.test.tsx

**Test Suites**:

1. **Price Display**
   ```typescript
   - Should show current price
   - Should format price with currency
   - Should show "No data" for missing price
   ```

2. **Percentage Calculation**
   ```typescript
   - Should calculate positive percentage change
   - Should calculate negative percentage change
   - Should handle zero change
   - Should handle NaN/undefined gracefully
   - Should show correct color (green/red)
   ```

3. **Chart Rendering**
   ```typescript
   - Should render chart with price history
   - Should handle empty price history
   - Should format timestamps correctly
   - Should show tooltips on hover
   ```

4. **Error States**
   ```typescript
   - Should show error message on API failure
   - Should handle network errors
   ```

---

#### TokenSearch.test.tsx

**Test Suites**:

1. **Search Functionality**
   ```typescript
   - Should show search input
   - Should filter tokens as user types
   - Should debounce search queries
   - Should clear search on selection
   ```

2. **Autocomplete**
   ```typescript
   - Should show dropdown with results
   - Should highlight matching text
   - Should show "No results" for no matches
   - Should limit results to reasonable number
   ```

3. **Token Selection**
   ```typescript
   - Should call onSelect with token
   - Should update UI after selection
   - Should handle keyboard navigation (arrow keys, Enter)
   ```

4. **Loading States**
   ```typescript
   - Should show loading indicator
   - Should disable input while loading
   ```

---

#### TopHoldersCard.test.tsx

**Test Suites**:

1. **Holder Display**
   ```typescript
   - Should render holder list
   - Should show rank numbers
   - Should format addresses
   - Should format balances
   - Should format percentages
   - Should show links to BaseScan
   ```

2. **Calculations**
   ```typescript
   - Should calculate total balance
   - Should calculate correct percentages
   - Should handle zero balances
   ```

3. **CSV Export**
   ```typescript
   - Should generate CSV with holders
   - Should include all columns
   ```

4. **Empty States**
   ```typescript
   - Should show "No holders" message
   - Should handle loading state
   ```

---

### Priority 3: Utility Functions

#### lib/utils.test.ts

**Test Suites**:

1. **formatCurrency**
   ```typescript
   - Should format large numbers (1.5M, 2.3B)
   - Should format small numbers
   - Should handle zero
   - Should handle negative numbers
   - Should handle null/undefined
   ```

2. **formatNumber**
   ```typescript
   - Should format with commas
   - Should handle decimals
   - Should round appropriately
   ```

3. **formatAddress**
   ```typescript
   - Should shorten addresses (0x1234...5678)
   - Should handle invalid addresses
   - Should handle null/undefined
   ```

4. **getBaseScanUrl**
   ```typescript
   - Should generate correct URL
   - Should handle different address types
   ```

---

### Priority 4: Simple Components

#### ErrorMessage.test.tsx

```typescript
- Should render error message
- Should handle different error types
- Should be accessible (aria-labels)
```

#### LoadingSpinner.test.tsx

```typescript
- Should render spinner
- Should have animation class
- Should be accessible
```

---

## Testing Approach

### Tools & Setup
- **Framework**: Jest (already configured)
- **React Testing**: @testing-library/react
- **Mocking**: jest.mock() for API calls
- **Coverage Goal**: >80% for critical paths

### Mocking Strategy

1. **API Calls**: Mock `fetch` globally or per-test
   ```typescript
   global.fetch = jest.fn(() =>
     Promise.resolve({
       ok: true,
       status: 200,
       json: async () => mockData,
     })
   );
   ```

2. **Environment Variables**: Mock `process.env`
   ```typescript
   process.env.NEXT_PUBLIC_CAMBRIAN_API_KEY = 'test-key';
   ```

3. **Next.js Router**: Mock using `next-router-mock`

### Test Data
- Create `__mocks__` directory with sample API responses
- Reuse mock data across tests
- Include edge cases (empty, null, error responses)

---

## Implementation Order

### Phase 1: Critical (Week 1)
1. lib/cambrian-api.test.ts (highest priority)
2. lib/utils.test.ts
3. components/AerodromePoolsCard.test.tsx

### Phase 2: Core UI (Week 2)
4. components/PriceOverviewCard.test.tsx
5. components/TokenSearch.test.tsx
6. components/TopHoldersCard.test.tsx

### Phase 3: Polish (Week 3)
7. components/ErrorMessage.test.tsx
8. components/LoadingSpinner.test.tsx
9. Integration tests for app/page.tsx
10. E2E tests with Playwright (optional)

---

## Success Criteria

- [ ] All critical functions tested (cambrian-api.ts)
- [ ] All components have >80% coverage
- [ ] All edge cases covered (empty, error, loading states)
- [ ] Tests run fast (<10 seconds total)
- [ ] No flaky tests
- [ ] CI/CD integration (run on PR)

---

## Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific file
pnpm test cambrian-api.test.ts

# Watch mode
pnpm test --watch
```

---

## Notes

- **Mock Data**: Store in `__mocks__/cambrian-responses.ts`
- **Test Utilities**: Create `test-utils.tsx` for common render helpers
- **Snapshot Tests**: Avoid excessive snapshots, prefer explicit assertions
- **Accessibility**: Test with screen readers in mind (use semantic queries)

