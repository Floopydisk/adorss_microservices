# PostgreSQL Setup Guide for ADORSS Platform

**Date:** January 27, 2026  
**Database:** PostgreSQL 15+  
**Framework:** Laravel 11

---

## WHY POSTGRESQL?

**Advantages over MySQL:**
- Better JSON support (for context fields, metadata)
- More robust transaction handling
- Better performance for complex queries
- Superior data integrity features
- Built-in full-text search
- Better handling of concurrent connections

---

## OPTION 1: RENDER POSTGRESQL (RECOMMENDED)

### Why Render PostgreSQL?

- **Free tier available** (1GB storage)
- **Managed service** (automatic backups, updates)
- **Fast connectivity** to other Render services
- **Easy setup** (no server management)
- **Scalable** (upgrade as you grow)

### Step-by-Step Setup

**1. Create PostgreSQL Database on Render:**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → PostgreSQL
3. Configure:
   - Name: `adorss-auth-db`
   - Database: `adorss_auth_prod`
   - User: `adorss_user` (auto-generated)
   - Region: `Oregon (US West)` or closest to you
   - Plan: **Free** (for testing) or **Starter ($7/mo)** for production
4. Click "Create Database"

**2. Get Connection Details:**

After creation, Render provides:

```
Internal Database URL (for services on Render):
postgresql://adorss_user:password@dpg-xxxxx/adorss_auth_prod

External Database URL (for cPanel or local):
postgresql://adorss_user:password@dpg-xxxxx-a.oregon-postgres.render.com/adorss_auth_prod

Separate credentials:
- Host: dpg-xxxxx-a.oregon-postgres.render.com
- Port: 5432
- Database: adorss_auth_prod
- Username: adorss_user
- Password: [auto-generated, 32 characters]
```

**3. Configure Laravel Auth Service:**

**If using separate environment variables:**

```env
DB_CONNECTION=pgsql
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_DATABASE=adorss_auth_prod
DB_USERNAME=adorss_user
DB_PASSWORD=your_auto_generated_password
DB_SSLMODE=require
```

**Or using DATABASE_URL (simpler):**

```env
DB_CONNECTION=pgsql
DATABASE_URL=postgresql://adorss_user:password@dpg-xxxxx-a.oregon-postgres.render.com/adorss_auth_prod
```

**Note:** When using `DATABASE_URL`, Laravel will parse it automatically. You don't need separate `DB_HOST`, `DB_PORT`, etc.

**4. Test Connection:**

```bash
# SSH into cPanel
ssh your_user@your_domain.com
cd /path/to/auth-service

# Test database connection
php artisan tinker

# In tinker prompt:
>>> DB::connection()->getPdo();
# Should return PDO object without errors

>>> DB::select('SELECT version()');
# Should return PostgreSQL version
```

**5. Run Migrations:**

```bash
php artisan migrate --force
php artisan db:seed --class=RolesAndPermissionsSeeder --force
```

### Render PostgreSQL Plans

| Plan | Storage | Connections | Backups | Cost |
|------|---------|-------------|---------|------|
| Free | 1 GB | 97 | Daily (7 days) | $0 |
| Starter | 10 GB | 97 | Daily (7 days) | $7/mo |
| Standard | 100 GB | 197 | Daily (90 days) | $20/mo |
| Pro | 512 GB | 397 | Daily (365 days) | $90/mo |

**Recommendation:** Start with **Starter ($7)** for production.

---

## OPTION 2: CPANEL POSTGRESQL (IF AVAILABLE)

### Check if cPanel Has PostgreSQL

Not all cPanel installations include PostgreSQL. Check:

1. Log into cPanel
2. Look for "PostgreSQL Databases" in the Databases section
3. If not available, use Render (Option 1) instead

### If Available:

**1. Create Database:**

1. cPanel → PostgreSQL Databases
2. Create New Database: `adorss_auth_prod`
3. Create User: `adorss_user`
4. Set strong password
5. Add user to database with ALL PRIVILEGES

**2. Enable Remote Access (if needed):**

1. cPanel → Remote PostgreSQL
2. Add your IP address (or % for all - not recommended)
3. Save

**3. Configure Laravel:**

```env
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=adorss_auth_prod
DB_USERNAME=adorss_user
DB_PASSWORD=your_password
DB_SSLMODE=prefer
```

---

## OPTION 3: EXTERNAL POSTGRESQL (AWS RDS, DIGITAL OCEAN, ETC.)

### AWS RDS PostgreSQL

**Pros:** Enterprise-grade, highly scalable  
**Cons:** More expensive, complex setup  
**Cost:** ~$15-30/month minimum

**Quick Setup:**

1. AWS Console → RDS → Create Database
2. Choose PostgreSQL
3. Choose template: Free tier or Production
4. Configure:
   - DB instance identifier: `adorss-auth-db`
   - Master username: `adorss_user`
   - Master password: [generate strong one]
   - DB instance class: db.t3.micro (free tier) or db.t3.small
   - Storage: 20 GB
   - Enable auto scaling
5. Configure connectivity:
   - Public access: Yes (if connecting from cPanel)
   - Security group: Allow PostgreSQL (5432) from your IPs
6. Create database

**Get connection details:**

```
Endpoint: adorss-auth-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
Port: 5432
Database: postgres (create your DB after connecting)
```

**Create database:**

```bash
psql -h adorss-auth-db.xxxxxxxxx.us-east-1.rds.amazonaws.com -U adorss_user -d postgres

CREATE DATABASE adorss_auth_prod;
\q
```

**Configure Laravel:**

```env
DB_CONNECTION=pgsql
DB_HOST=adorss-auth-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_DATABASE=adorss_auth_prod
DB_USERNAME=adorss_user
DB_PASSWORD=your_password
DB_SSLMODE=require
```

### Digital Ocean Managed PostgreSQL

**Pros:** Simple, affordable, good performance  
**Cons:** Fewer regions than AWS  
**Cost:** ~$15/month

**Quick Setup:**

1. Digital Ocean → Databases → Create Database
2. Choose PostgreSQL
3. Configure:
   - Cluster name: `adorss-auth-db`
   - Database: `adorss_auth_prod`
   - Region: Closest to you
   - Plan: Basic ($15) or Professional
4. Add trusted sources (your cPanel server IP)
5. Create

**Connection details provided automatically**

---

## PHP EXTENSIONS REQUIRED

Laravel needs the PostgreSQL PDO extension. Verify:

```bash
php -m | grep pgsql

# Should show:
# pdo_pgsql
# pgsql
```

**If not installed:**

**On cPanel:** Contact hosting provider (they usually install via WHM)

**On Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install php8.1-pgsql php8.1-pdo
sudo systemctl restart apache2
```

**On CentOS/RHEL:**

```bash
sudo yum install php-pgsql
sudo systemctl restart httpd
```

---

## LARAVEL CONFIGURATION

### 1. Update database.php (Already Done)

The `config/database.php` should have `pgsql` as default:

```php
'default' => env('DB_CONNECTION', 'pgsql'),
```

### 2. Update .env

```env
DB_CONNECTION=pgsql
DB_HOST=your-postgres-host
DB_PORT=5432
DB_DATABASE=adorss_auth_prod
DB_USERNAME=adorss_user
DB_PASSWORD=your_password
DB_SSLMODE=require  # Important for external connections
```

### 3. Test Connection

```bash
php artisan migrate:status

# Should show migration table or ready to migrate
```

### 4. Run Migrations

```bash
# Fresh install
php artisan migrate

# Or if already have MySQL data, migrate fresh
php artisan migrate:fresh --seed
```

---

## MIGRATION FROM MYSQL (IF NEEDED)

If you already have data in MySQL and want to move to PostgreSQL:

### Option 1: Export/Import (Simple, Small Datasets)

**1. Export from MySQL:**

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder > data.sql
```

**2. Adjust SQL for PostgreSQL:**

- Change `` ` `` (backticks) to `"` (quotes)
- Change `AUTO_INCREMENT` to `SERIAL`
- Change `DATETIME` to `TIMESTAMP`

**3. Import to PostgreSQL:**

```bash
psql -h host -U adorss_user -d adorss_auth_prod < data.sql
```

### Option 2: Use pgloader (Better for Large Datasets)

**1. Install pgloader:**

```bash
# Ubuntu/Debian
sudo apt-get install pgloader

# macOS
brew install pgloader
```

**2. Create conversion script (`migrate.load`):**

```sql
LOAD DATABASE
    FROM mysql://adorss_user:password@localhost/adorss_auth_mysql
    INTO postgresql://adorss_user:password@host/adorss_auth_prod

WITH include drop, create tables, create indexes, reset sequences

SET maintenance_work_mem to '512MB',
    work_mem to '128MB'

CAST type datetime to timestamp
     drop default drop not null using zero-dates-to-null;
```

**3. Run migration:**

```bash
pgloader migrate.load
```

### Option 3: Fresh Start (Recommended)

Since your auth service is new:

1. Just run migrations fresh on PostgreSQL
2. Seed the permissions again
3. No need to migrate old data

```bash
# Clear everything and start fresh
php artisan migrate:fresh
php artisan db:seed --class=RolesAndPermissionsSeeder
```

---

## POSTGRESQL-SPECIFIC OPTIMIZATIONS

### 1. Indexes for Performance

Already created in migrations, but verify:

```sql
-- User roles table
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_organization ON user_roles(organization_id);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, is_active);

-- Audit logs table
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
```

### 2. JSON Columns (PostgreSQL Advantage)

Update migrations to use `jsonb` instead of `json` for better performance:

```php
// In migrations
$table->jsonb('context')->nullable();  // Instead of json()
$table->jsonb('metadata')->nullable();
$table->jsonb('request_data')->nullable();
```

PostgreSQL can index JSONB columns:

```sql
CREATE INDEX idx_user_roles_context ON user_roles USING GIN (context);
```

### 3. Connection Pooling

**For production, use PgBouncer (connection pooler):**

Render includes this automatically. For other hosts:

```env
DB_CONNECTION=pgsql
DB_HOST=pgbouncer-host
DB_PORT=6432  # PgBouncer default port
```

---

## BACKUP & RESTORE

### Render PostgreSQL (Automatic)

- **Free tier:** 7 days of daily backups
- **Starter:** 7 days of daily backups
- **Standard:** 90 days of daily backups

**Manual backup:**

```bash
# From Render dashboard
Dashboard → Your DB → Backups → Create Backup Now
```

**Restore:**

```bash
Dashboard → Your DB → Backups → Select backup → Restore
```

### Manual Backups (Any PostgreSQL)

**Backup:**

```bash
pg_dump -h host -U adorss_user -d adorss_auth_prod > backup.sql

# Or compressed
pg_dump -h host -U adorss_user -d adorss_auth_prod | gzip > backup.sql.gz
```

**Restore:**

```bash
psql -h host -U adorss_user -d adorss_auth_prod < backup.sql

# Or from compressed
gunzip -c backup.sql.gz | psql -h host -U adorss_user -d adorss_auth_prod
```

### Automated Backups (cPanel Cron)

```bash
# crontab -e
# Daily backup at 2 AM
0 2 * * * pg_dump -h host -U adorss_user -d adorss_auth_prod | gzip > /backups/auth-$(date +\%Y\%m\%d).sql.gz

# Keep only last 30 days
0 3 * * * find /backups/auth-*.sql.gz -mtime +30 -delete
```

---

## MONITORING POSTGRESQL

### Check Connection Count

```sql
SELECT count(*) FROM pg_stat_activity;
```

### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size('adorss_auth_prod'));
```

### Check Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Slow Queries

```sql
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

---

## TROUBLESHOOTING

### Issue: "SQLSTATE[08006] Could not connect to server"

**Cause:** Network issue, wrong host, or firewall blocking

**Fix:**
1. Verify host and port: `telnet host 5432`
2. Check firewall allows PostgreSQL (port 5432)
3. Verify SSL mode: Try `DB_SSLMODE=disable` temporarily (for testing only)
4. Check credentials are correct

### Issue: "FATAL: password authentication failed"

**Cause:** Wrong password or username

**Fix:**
1. Double-check username and password (copy-paste to avoid typos)
2. Verify user exists: `psql -h host -U adorss_user -d postgres -c "\du"`
3. Reset password if needed

### Issue: "SQLSTATE[08P01] insufficient privilege"

**Cause:** User doesn't have permissions

**Fix:**

```sql
-- Connect as superuser
psql -h host -U postgres

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE adorss_auth_prod TO adorss_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO adorss_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO adorss_user;
```

### Issue: "Too many connections"

**Cause:** Reached max connection limit

**Fix:**

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections (as superuser)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < now() - interval '5 minutes';
```

Or increase max connections (Render: upgrade plan, or contact support)

---

## SECURITY BEST PRACTICES

1. **Use strong passwords** (32+ characters, auto-generated)
2. **Enable SSL** (`DB_SSLMODE=require` in production)
3. **Whitelist IPs** (don't allow 0.0.0.0/0)
4. **Use read-only replicas** for reporting (Render Pro plan)
5. **Regular backups** (automated daily)
6. **Monitor failed logins** (check audit_logs table)
7. **Rotate credentials** (every 90 days)

---

## QUICK REFERENCE

| Task | Command |
|------|---------|
| Test connection | `php artisan tinker` → `DB::connection()->getPdo()` |
| Run migrations | `php artisan migrate` |
| Fresh migrations | `php artisan migrate:fresh` |
| Seed database | `php artisan db:seed --class=RolesAndPermissionsSeeder` |
| Check status | `php artisan migrate:status` |
| Backup database | `pg_dump -h host -U user -d db > backup.sql` |
| Restore database | `psql -h host -U user -d db < backup.sql` |
| Check DB version | `psql -c "SELECT version()"` |

---

## RECOMMENDED SETUP FOR ADORSS

**For Production:**

```
Auth Service (cPanel) → Render PostgreSQL Starter ($7/mo)
- 10GB storage
- Automatic backups (7 days)
- SSL enabled
- 97 concurrent connections
```

**Configuration:**

```env
DB_CONNECTION=pgsql
DATABASE_URL=postgresql://adorss_user:password@dpg-xxxxx-a.oregon-postgres.render.com/adorss_auth_prod

# Or separate:
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_DATABASE=adorss_auth_prod
DB_USERNAME=adorss_user
DB_PASSWORD=your_password
DB_SSLMODE=require
```

**Why this setup?**
- ✅ Managed database (no server maintenance)
- ✅ Automatic backups
- ✅ Fast connection to cPanel
- ✅ Scales easily
- ✅ Low cost ($7/month)
- ✅ SSL included

---

**Document Version:** 1.0  
**Last Updated:** January 27, 2026  
**Next Review:** After first deployment
