# Security Guide

## Environment Variables

### Required
- `DISCORD_TOKEN`: Keep secret, never commit to git
- `CLIENT_ID`: Public, safe to share

### Sensitive Variables (MUST change in production)
- `ADMIN_PASSWORD`: Used for admin API endpoints
- `JWT_SECRET`: Used for dashboard authentication tokens
- `DASHBOARD_PASSWORD`: Dashboard login password

### Recommendations
1. Use strong passwords (20+ characters, random)
2. Rotate secrets every 90 days
3. Never commit .env file to git (already in .gitignore)
4. Use different credentials for development vs production

## API Security

### Rate Limiting
- Web API: 100 requests per 15 minutes per IP
- VIP commands: Per-user cooldowns (1-5 minutes)
- Lottery: 50 tickets per day max

### Authentication
- Dashboard uses JWT tokens with 24h expiry
- Admin endpoints require ADMIN_PASSWORD
- All tokens include role-based access control

### Input Validation
- User IDs validated with regex (17-19 digits)
- Request body size limited to 1MB
- File paths validated to prevent traversal
- String inputs sanitized (HTML tags removed)

## File I/O Security

### Path Validation
All file operations validate paths to prevent directory traversal:
- Only files within data/ directory are accessible
- Paths normalized before validation
- Attempts to access outside data/ throw errors

### Caching
- Coins cache: 5 second TTL
- Inventory cache: 5 second TTL
- Cooldown cache: 10 second TTL
- All caches use LRU eviction

## Bot Permissions

### Required Permissions
- Send Messages
- Embed Links
- Manage Roles (for shop purchases)
- Use Slash Commands

### Principle of Least Privilege
- Bot should NOT have Administrator permission
- Role hierarchy: Bot role must be higher than shop roles
- Limit to specific channels if possible

## Monitoring

### Logs to Monitor
- Failed authentication attempts
- Rate limit violations
- File I/O errors
- Permission errors

### Alerts
Consider setting up alerts for:
- Multiple failed admin login attempts
- Unusual API traffic patterns
- Memory usage spikes
- Database errors

## Vulnerability Reporting

If you discover a security vulnerability, please email the bot owner
or create a private security advisory on GitHub.

**Do NOT open public issues for security vulnerabilities.**

## Recent Security Improvements

### v2.0.0 - Security Hardening (January 2025)
- Added rate limiting on all API endpoints
- Implemented file path validation to prevent directory traversal
- Added request body size limits (1MB)
- Removed hardcoded fallback passwords
- Added input validation middleware
- Implemented file caching with TTL
- Added environment variable validation on startup
- Standardized error handling across all modules
- Fixed InteractionAlreadyReplied bug in VIP module
