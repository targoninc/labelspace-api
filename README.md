# LabelSpace API (artist-space-backend)

Backend API server for the LabelSpace platform. Built with Express, Passport.js, and MariaDB. Handles authentication, CRUD for tracks/albums/artists, payments (PayPal), royalties, statistics, media processing, search, newsletter, MFA (TOTP/WebAuthn), Bandcamp integration, and file storage.

## Prerequisites

- [Bun](https://bun.sh) 1.x
- MariaDB 10+ / MySQL 8+
- SMTP mail server
- ffmpeg (for audio processing)
- PayPal Developer account (for payment features)
- Bandcamp Developer account (optional, for Bandcamp integration)

## Quick Start (Development)

1. Clone the repo and copy the env template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your local settings. At minimum:
   - `MARIADB_HOST`, `MARIADB_PORT`, `MARIADB_USER`, `MARIADB_PASSWORD`, `MARIADB_NAME`
   - `SESSION_SECRET` (generate a random string)
   - `SUBMISSION_MAILS` (comma-separated emails)
   - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD` (SMTP)
   - `COOKIE_DOMAIN`, `CORS_ORIGINS`

3. Install dependencies and start:
   ```bash
   bun install
   bun run start-bun-dev
   ```

## Docker

### Run with full stack (recommended)

From the repository root:

```bash
# Copy all .env.example files
cp artist-space-backend/.env.example artist-space-backend/.env
cp artist-space-ui/.env.example artist-space-ui/.env
cp tri-web/.env.example tri-web/.env

# Edit .env files with your settings

# Start everything
docker compose up -d
```

### Run API standalone with dependencies

```bash
docker compose up -d db api
```

### Environment Variables

| Variable                    | Required | Description                                  |
|-----------------------------|----------|----------------------------------------------|
| `PORT`                      | No       | Server port (default: 8090)                  |
| `MARIADB_HOST`              | Yes      | MariaDB/MySQL host                           |
| `MARIADB_PORT`              | Yes      | Database port                                |
| `MARIADB_USER`              | Yes      | Database user                                |
| `MARIADB_PASSWORD`          | Yes      | Database password                            |
| `MARIADB_NAME`              | Yes      | Database name                                |
| `SESSION_SECRET`            | Yes      | Session encryption secret                    |
| `SUBMISSION_MAILS`          | Yes      | Comma-separated emails for submissions       |
| `COOKIE_DOMAIN`             | Yes      | Cookie domain                                |
| `CORS_ORIGINS`              | Yes      | Comma-separated allowed CORS origins         |
| `MAIL_HOST`                 | Yes      | SMTP host                                    |
| `MAIL_PORT`                 | Yes      | SMTP port                                    |
| `MAIL_SECURE`               | No       | Use TLS (default: false)                     |
| `MAIL_USER`                 | Yes      | SMTP username                                |
| `MAIL_PASSWORD`             | Yes      | SMTP password                                |
| `PORTAL_API_URL`            | No       | This API's public URL                        |
| `PORTAL_UI_URL`             | No       | Artist UI public URL                         |
| `LABEL_WEBSITE`             | No       | Public label website URL                     |
| `WEBAUTHN_ORIGIN`           | No       | WebAuthn relying party origin                |
| `PAYPAL_CLIENT_ID`          | Yes*     | PayPal REST API client ID                    |
| `PAYPAL_CLIENT_SECRET`      | Yes*     | PayPal REST API secret                       |
| `PAYPAL_WEBHOOK_ID`         | No       | PayPal webhook ID                            |
| `BANDCAMP_BAND_ID`          | No       | Bandcamp band ID                             |
| `BANDCAMP_CLIENT_ID`        | No       | Bandcamp API client ID                       |
| `BANDCAMP_CLIENT_SECRET`    | No       | Bandcamp API client secret                   |
| `ARTIST_SPACE_STORAGE_PATH` | No       | Local storage path (default: mock/storage)   |
| `TEST_NEWSLETTER`           | No       | Enable test newsletter mode                  |

\* Required for payment features.

## Third-Party Services

- **MariaDB/MySQL** — Primary database
- **SMTP Server** — Email sending (registration, password reset, newsletters)
- **PayPal** — Payment processing (requires PayPal Developer account)
- **Bandcamp** — Optional sales/payout integration (requires Bandcamp API access)
