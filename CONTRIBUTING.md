# Contributing to Base Terminal

Thank you for your interest in contributing to Base Terminal. This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (browser, OS, Node.js version)

### Suggesting Features

Feature requests are welcome! Please:

- Check if the feature has already been requested
- Provide a clear description of the feature
- Explain why this feature would be useful
- Consider how it fits with the project's goals

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `pnpm install`
3. **Make your changes** following our coding standards
4. **Write or update tests** as needed
5. **Run the test suite**: `pnpm test`
6. **Run the linter**: `pnpm lint`
7. **Commit your changes** with a clear message
8. **Push to your fork** and submit a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/base-terminal.git
cd base-terminal/base-terminal-dashboard

# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local
# Add your Cambrian API key to .env.local

# Start development server
pnpm dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any` when possible)
- Export types alongside functions
- Use interfaces for object shapes

```typescript
// Good
interface TokenData {
  address: string;
  symbol: string;
  decimals: number;
}

export function getToken(address: string): Promise<TokenData> {
  // ...
}

// Avoid
export function getToken(address: any): Promise<any> {
  // ...
}
```

### React Components

- Use functional components with hooks
- Keep components focused and small
- Use TypeScript interfaces for props
- Include proper loading and error states

```typescript
interface CardProps {
  title: string;
  data?: DataType;
  loading?: boolean;
}

export default function Card({ title, data, loading = false }: CardProps) {
  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState />;
  return <div>{/* content */}</div>;
}
```

### Styling

- Use Tailwind CSS utility classes
- Follow the terminal theme (`terminal-*` classes)
- Ensure responsive design (mobile-first)
- Use semantic HTML elements

### File Organization

```
components/       # React components
lib/              # Utilities and API clients
types/            # TypeScript type definitions
app/              # Next.js pages and routes
```

### Naming Conventions

- **Files**: PascalCase for components (`TokenSearch.tsx`), camelCase for utilities (`cambrian-api.ts`)
- **Components**: PascalCase (`TokenSearch`)
- **Functions**: camelCase (`getCurrentPrice`)
- **Types/Interfaces**: PascalCase (`TokenData`)
- **Constants**: SCREAMING_SNAKE_CASE (`BASE_CHAIN_ID`)

### Testing

- Write tests for new features and bug fixes
- Use React Testing Library for component tests
- Mock external dependencies
- Aim for meaningful test coverage

```typescript
import { render, screen } from '@testing-library/react';
import TokenSearch from './TokenSearch';

describe('TokenSearch', () => {
  it('renders search input', () => {
    render(<TokenSearch onSearch={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

## Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(search): add token address validation
fix(pools): handle empty API response
docs: update contributing guide
```

## Pull Request Process

1. Update the README.md if needed
2. Update the documentation if needed
3. Ensure all tests pass
4. Request review from maintainers
5. Address review feedback
6. Once approved, a maintainer will merge your PR

## Questions?

Feel free to open an issue for any questions or join discussions in existing issues.

Thank you for contributing!
