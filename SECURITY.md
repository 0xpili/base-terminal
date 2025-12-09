# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Base Terminal seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do not** open a public issue for security vulnerabilities
2. Email the maintainer directly or use GitHub's private vulnerability reporting feature
3. Include as much information as possible:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- Acknowledgment within 48 hours
- Regular updates on the progress
- Credit in the security advisory (unless you prefer to remain anonymous)

### Security Best Practices for Users

1. **API Keys**: Never commit API keys to version control
   - Use `.env.local` for local development
   - Use environment variables in production
   - The `.env.local` file is already in `.gitignore`

2. **Dependencies**: Keep dependencies up to date
   ```bash
   pnpm audit
   pnpm update
   ```

3. **Environment**: Use HTTPS in production

### Known Security Considerations

- **API Proxy**: The `/api/cambrian` route acts as a proxy to keep API keys server-side
- **No User Data**: This application does not store user data
- **Public Data**: All displayed data is public blockchain information

## Security Features

- Server-side API key handling (keys never exposed to client)
- Input validation on search queries
- CORS protection via Next.js API routes
- No database or user authentication (minimized attack surface)

Thank you for helping keep Base Terminal secure!
