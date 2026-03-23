# Database

This directory contains the SQLite database file for user authentication.

## Database File

- `tzero.db` - SQLite database containing user authentication data

## Schema

The database includes a `users` table with the following fields:
- `id` - Unique user identifier
- `email` - User email (unique, case-insensitive)
- `password` - Hashed password (using bcrypt)
- `first_name` - User's first name
- `last_name` - User's last name
- `phone_number` - User's phone number
- `country_code` - Phone country code
- `terms_agreed` - Terms agreement (0 or 1)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

## Security

- Passwords are hashed using bcrypt with 10 salt rounds
- Email addresses are stored in lowercase for consistency
- Database file is excluded from version control (see .gitignore)

## Initialization

The database is automatically initialized when the application starts. The schema is created if it doesn't exist.
