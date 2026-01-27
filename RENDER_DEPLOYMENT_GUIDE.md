# ADORSS Platform - Deployment Guide

**Platform:** Render.com + cPanel  
**Date:** January 25, 2026  
**Status:** Auth Service & API Gateway ready for deployment

---

## QUICK OVERVIEW

**Deployment Strategy:**

- **Auth Service** → Your company's cPanel (Laravel + PostgreSQL)
- **API Gateway** → Render (Node.js/TypeScript)
- **Education Service** → Render (Node.js/TypeScript) - Coming soon
- **Messaging Service** → Render (Node.js/TypeScript) - Coming soon
- **Finance Service** → Render (Node.js/TypeScript) - Coming soon
- **Mobility Service** → Render (Node.js/TypeScript) - Coming soon

**Why This Split:**

- cPanel hosting is already paid for (cost savings)
- Render is better for Node.js microservices (easier scaling)
- Consistent tech stack on Render (all Node.js services)

---

## PART 1: AUTH SERVICE - CPANEL DEPLOYMENT

### Prerequisites

- Access to cPanel account (admin panel)
- PostgreSQL database available on cPanel (or external like Render/AWS RDS)
- PHP 8.1+ installed on cPanel with `pdo_pgsql` extension
- Git installed on cPanel server (or FTP access)

### Step 1: Create PostgreSQL Database

**Option A: Via cPanel PostgreSQL Databases (if available):**

1. Go to cPanel → PostgreSQL Databases
2. Create new database: `adorss_auth_prod`
3. Create database user: `adorss_user`
4. Set password (strong, 16+ characters)
5. Grant all privileges to user on database
6. **Save credentials** - you'll need these

**Option B: Use Render PostgreSQL (Recommended - Free tier available):**

1. Go to Render Dashboard → New → PostgreSQL
2. Name: `adorss-auth-db`
3. Database: `adorss_auth_prod`
4. User: `adorss_user`
5. Region: Choose closest to your cPanel server
6. Plan: Starter (Free) or higher
7. Click Create
8. **Copy the connection details:**
   - Internal Database URL (if Auth on Render)
   - External Database URL (if Auth on cPanel)
   - Host, Port, Database, Username, Password

**Option C: Use external PostgreSQL (AWS RDS, Digital Ocean, etc.):**

1. Create PostgreSQL instance
2. Create database `adorss_auth_prod`
3. Create user with privileges
4. Note connection details

### Step 2: Upload Auth Service to cPanel

**Option A: Using Git (Recommended)**

```bash
# SSH into cPanel server
ssh your_cpanel_user@your_domain.com

# Navigate to public_html folder
cd public_html

# Clone repository (or pull latest code)
git clone https://github.com/your-org/adorss-auth-service.git auth-service
cd auth-service

# Install dependencies
composer install

# Create .env file (copy from .env.example)
cp .env.example .env
```

**Option B: Using FTP**

1. Connect via FTP client
2. Upload all files from `auth-service/` folder
3. Navigate to directory and continue below

### Step 3: Configure Environment Variables

**Edit `.env` file on cPanel:**

```bash
# SSH access
nano /home/username/public_html/auth-service/.env

# Edit these values:

APP_NAME=ADORSS_Auth
APP_ENV=production
APP_DEBUG=false
APP_URL=https://auth.adorss.com

# Database (from Step 1)
DB_CONNECTION=pgsql
DB_HOST=your-postgres-host.render.com  # or localhost if cPanel has PostgreSQL
DB_PORT=5432
DB_DATABASE=adorss_auth_prod
DB_USERNAME=adorss_user
DB_PASSWORD=your_password_from_step_1
DB_SSLMODE=require  # Important for external connections

# Alternative: Use full DATABASE_URL (Render provides this)
# DATABASE_URL=postgresql://adorss_user:password@host:5432/adorss_auth_prod

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET=YOUR_GENERATED_SECRET_HERE

# Mail configuration (if using company email)
MAIL_DRIVER=smtp
MAIL_HOST=mail.adorss.com
MAIL_PORT=587
MAIL_USERNAME=noreply@adorss.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_ADDRESS=noreply@adorss.com

# App port (cPanel handles this, usually 80/443)
APP_PORT=80

# Session & cache
SESSION_DRIVER=cookie
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
```

**Save & Exit:** Press Ctrl+X, then Y, then Enter

### Step 4: Run Database Migrations

```bash
# SSH into your domain
ssh your_cpanel_user@your_domain.com
cd /home/username/public_html/auth-service

# Run migrations
php artisan migrate --force

# Seed the database (creates roles, permissions)
php artisan db:seed --class=RolesAndPermissionsSeeder --force
```

**What this does:**

- Creates `user_roles`, `user_links`, `audit_logs`, etc. tables
- Populates 55 permissions
- Creates 7 role assignments (admin, teacher, student, etc.)

### Step 5: Set File Permissions

```bash
# SSH access
ssh your_cpanel_user@your_domain.com
cd /home/username/public_html/auth-service

# Make storage writable
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
```

### Step 6: Configure cPanel to Serve the App

**Using cPanel:**

1. Go to cPanel → Domains
2. Point your domain to `public_html/auth-service/public`
3. Or create subdomain: `auth.adorss.com` pointing to same folder

**Or using .htaccess (automatic on cPanel):**

The Laravel `.htaccess` file should already be in `public/` folder.

### Step 7: Test Auth Service

```bash
# From your local machine
curl -X GET https://auth.adorss.com/health

# Should return:
# {"status": "ok", "service": "auth-service"}

# Test registration
curl -X POST https://auth.adorss.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "admin@adorss.com",
    "password": "SecurePassword123!",
    "role": "admin",
    "organization_id": 1,
    "organization_type": "school"
  }'
```

### Step 8: Enable HTTPS

**On cPanel:**

1. Go to cPanel → AutoSSL
2. Or manually in "SSL/TLS" section
3. Let's Encrypt is usually auto-installed

### Step 9: Set Up Monitoring (Optional but Recommended)

**Add monitoring script to cron:**

```bash
# SSH access
crontab -e

# Add this line (runs health check every 5 minutes)
*/5 * * * * curl -s https://auth.adorss.com/health > /dev/null 2>&1

# If fails, you can setup alerts
```

### cPanel Auth Service - Complete Checklist

- [ ] Database created on cPanel
- [ ] Code uploaded via Git or FTP
- [ ] `.env` file configured with correct database credentials
- [ ] Migrations ran successfully
- [ ] Database seeded with roles/permissions
- [ ] File permissions set correctly
- [ ] Domain/subdomain configured
- [ ] HTTPS enabled
- [ ] Health check endpoint responds
- [ ] Registration endpoint tested
- [ ] Login endpoint tested
- [ ] Backups configured

---

## PART 2: API GATEWAY - RENDER DEPLOYMENT

### What is Render?

Render is a cloud platform that runs your apps. Think of it as:

- **Server** to run your code
- **Database connection** to talk to services
- **Domain** management
- **Auto-scaling** (handles traffic spikes)
- **Monitoring** built-in

### Prerequisites

1. Create Render.com account (free tier available, but upgrade to $7/month plan)
2. Have GitHub repo for api-gateway (must push code there)
3. Know environment variables needed

### Step 1: Create GitHub Repository

**If not already done:**

```bash
# In api-gateway folder
cd api-gateway

# Initialize git
git init
git add .
git commit -m "Initial commit - API Gateway"

# Create repo on GitHub (go to github.com/new)
# Then push:
git remote add origin https://github.com/your-org/adorss-api-gateway.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Service

**On Render.com Dashboard:**

1. Go to Dashboard → Create New → Web Service
2. Connect your GitHub account (if not done)
3. Select repository: `adorss-api-gateway`
4. Set configuration:

   | Field         | Value                         |
   | ------------- | ----------------------------- |
   | Name          | `api-gateway`                 |
   | Environment   | Node                          |
   | Build Command | `npm install`                 |
   | Start Command | `npm start` or `npm run prod` |
   | Plan          | Starter ($7/month)            |

### Step 3: Set Environment Variables on Render

**In Render Dashboard:**

1. Go to Web Service → api-gateway
2. Click "Environment" tab
3. Add these variables:

```
AUTH_SERVICE_URL=https://auth.adorss.com
NODE_ENV=production
PORT=10000
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGINS=https://app.adorss.com,https://admin.adorss.com
JWT_SECRET=same_as_auth_service_JWT_SECRET
```

**Explanation:**

- `AUTH_SERVICE_URL` - Where Auth Service lives (cPanel)
- `PORT` - Render assigns this (usually 10000)
- `LOG_LEVEL` - How much logging (info=normal, debug=verbose)
- `RATE_LIMIT_ENABLED` - Protect from abuse
- `CORS_ORIGINS` - Which apps can call this (your mobile apps)
- `JWT_SECRET` - Must match Auth Service for token validation

### Step 4: Configure package.json for Render

**Make sure your `package.json` has:**

```json
{
  "name": "adorss-api-gateway",
  "version": "1.0.0",
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  },
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "prod": "npm run build && npm start",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "dotenv": "^16.0.3",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.7.0"
  }
}
```

### Step 5: Add Render Configuration File

**Create `render.yaml` in root folder:**

```yaml
services:
  - type: web
    name: api-gateway
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: AUTH_SERVICE_URL
        value: https://auth.adorss.com
      - key: LOG_LEVEL
        value: info
```

### Step 6: Deploy to Render

**Once everything is set:**

1. Go to Render Dashboard
2. Click "Manual Deploy"
3. Select branch: `main`
4. Render will:
   - Pull code from GitHub
   - Run `npm install`
   - Run `npm run build`
   - Start the service
   - Assign you a URL like: `api-gateway-xxxxx.onrender.com`

**First deployment takes 5-10 minutes**

### Step 7: Test API Gateway on Render

```bash
# Get the Render URL from dashboard, then:

# Check health
curl https://api-gateway-xxxxx.onrender.com/health

# Test auth endpoint (should redirect to auth service)
curl -X POST https://api-gateway-xxxxx.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@adorss.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'

# Should return: token + user info (or error if auth service down)
```

### Step 8: Configure Custom Domain (Optional)

**To use `api.adorss.com` instead of `api-gateway-xxxxx.onrender.com`:**

1. In Render Dashboard → Settings
2. Add Custom Domain: `api.adorss.com`
3. Follow DNS instructions (update your domain registrar)
4. Wait for DNS propagation (1-24 hours)

### Step 9: Enable Auto-Deploys

**In Render Dashboard:**

1. Go to Web Service → Deployments
2. Enable "Auto-Deploy"
3. Select branch: `main`
4. Now every git push → automatic deployment

### Step 10: Set Up Monitoring

**In Render Dashboard:**

1. Go to Logs tab (see real-time logs)
2. Set up notifications (if service crashes)
3. Monitor response times

### Render API Gateway - Complete Checklist

- [ ] GitHub repo created and pushed
- [ ] Render account created
- [ ] Web Service created
- [ ] Environment variables added (AUTH_SERVICE_URL, etc.)
- [ ] package.json configured correctly
- [ ] First deployment successful
- [ ] Health endpoint responds
- [ ] Auth endpoint returns token
- [ ] Custom domain configured (optional)
- [ ] Auto-deploy enabled
- [ ] Monitoring set up

---

## PART 3: OTHER SERVICES - RENDER DEPLOYMENT (WHEN READY)

### When Education Service is Ready

**Repeat the same process:**

1. Push `education-service` to GitHub
2. Create new Render Web Service
3. Set environment variables:

```
AUTH_SERVICE_URL=https://auth.adorss.com
API_GATEWAY_URL=https://api.adorss.com
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:pass@host:5432/education_prod
```

4. Deploy
5. Update API Gateway routes to point to new service URL

**Same for:** Messaging Service, Finance Service, Mobility Service

### Environment Variables Template for All Services

```bash
# Core
NODE_ENV=production
PORT=10000  # Render assigns automatically

# Authentication
AUTH_SERVICE_URL=https://auth.adorss.com
JWT_SECRET=from_auth_service

# API Gateway (for services that need to call it)
API_GATEWAY_URL=https://api.adorss.com

# Database (if service has its own DB)
DATABASE_URL=postgresql://user:password@host:5432/database_name
DB_CONNECTION=pgsql
DB_HOST=host
DB_PORT=5432
DB_DATABASE=database_name
DB_USERNAME=user
DB_PASSWORD=password
DB_SSLMODE=require

# Logging
LOG_LEVEL=info

# Service Discovery
MESSAGING_SERVICE_URL=https://messaging-service-xxxxx.onrender.com
FINANCE_SERVICE_URL=https://finance-service-xxxxx.onrender.com
MOBILITY_SERVICE_URL=https://mobility-service-xxxxx.onrender.com
EDUCATION_SERVICE_URL=https://education-service-xxxxx.onrender.com
```

---

## PART 4: TESTING AFTER DEPLOYMENT

### Test Auth Service (cPanel)

```bash
# Test 1: Health check
curl -X GET https://auth.adorss.com/health
# Expected: {"status": "ok"}

# Test 2: Register
curl -X POST https://auth.adorss.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Teacher",
    "email": "john@school.com",
    "password": "Pass@1234",
    "role": "teacher",
    "organization_id": 1,
    "organization_type": "school"
  }'
# Expected: {"success": true, "token": "...", "user": {...}}

# Test 3: Login
curl -X POST https://auth.adorss.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@school.com",
    "password": "Pass@1234",
    "role": "teacher"
  }'
# Expected: {"success": true, "token": "...", "expires_in": 3600}

# Test 4: Get my roles
curl -X GET https://auth.adorss.com/auth/me/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: List of roles
```

### Test API Gateway (Render)

```bash
# Test 1: Health check
curl -X GET https://api.adorss.com/health
# Expected: {"status": "ok", "gateway": "active"}

# Test 2: Login through gateway
curl -X POST https://api.adorss.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@school.com",
    "password": "Pass@1234",
    "role": "teacher"
  }'
# Expected: Same as direct auth service (gateway proxies it)

# Test 3: Protected endpoint (should fail without token)
curl -X GET https://api.adorss.com/api/education/assignments
# Expected: {"error": "Unauthorized"}

# Test 4: Protected endpoint (with token)
curl -X GET https://api.adorss.com/api/education/assignments \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: [] (empty for now, education service not ready) or data
```

### Load Testing (Before Going Live)

```bash
# Install Apache Bench
brew install httpd  # macOS
# or apt-get install apache2-utils  # Linux

# Test with 100 concurrent requests
ab -n 1000 -c 100 https://api.adorss.com/health

# Look for:
# - Requests per second (should be >100)
# - Failed requests (should be 0)
# - Response time (should be <1000ms)
```

---

## PART 5: MONITORING & MAINTENANCE

### Daily Monitoring

**Check Render Dashboard:**

- CPU usage (should be <50%)
- Memory usage (should be <70%)
- Response times (should be <1000ms)
- Error rate (should be <1%)
- Logs (no red errors)

**Check cPanel:**

- Email for error alerts
- Check error logs in cPanel
- Verify database backups running

### Weekly Tasks

- [ ] Review error logs (look for patterns)
- [ ] Check API response times (sign of issues)
- [ ] Verify backups completed successfully
- [ ] Monitor service health

### Monthly Tasks

- [ ] Update dependencies (npm update)
- [ ] Review JWT secrets (rotate if needed)
- [ ] Audit database for unused data
- [ ] Check Render plan usage (upgrade if needed)

### Emergency: Service Down

**If API Gateway down (Render):**

1. Go to Render Dashboard → Logs
2. Look for error messages
3. Check if auth service is reachable
4. Restart service (click "Restart")
5. If persistent, rollback last deployment

**If Auth Service down (cPanel):**

1. SSH into cPanel
2. Check error logs: `/home/username/public_html/auth-service/storage/logs/`
3. Check database connection: `php artisan tinker` → `DB::connection()->getPdo()`
4. Restart PHP if needed (cPanel may auto-restart)
5. Contact hosting provider if database is down

---

## PART 6: SECURITY CHECKLIST

- [ ] All `.env` files removed from GitHub (use .gitignore)
- [ ] Secrets stored only in Render environment variables
- [ ] HTTPS enabled on both platforms
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] Database passwords are strong (16+ characters)
- [ ] cPanel has backup enabled
- [ ] Render has backup strategy (or manual exports)
- [ ] CORS configured to allow only your apps
- [ ] Rate limiting enabled
- [ ] IP whitelisting (optional, if needed)
- [ ] Audit logs captured (database tracks all changes)
- [ ] Email alerts configured for errors

---

## PART 7: COST BREAKDOWN

### Monthly Costs

| Service                  | Platform | Cost        | Notes                     |
| ------------------------ | -------- | ----------- | ------------------------- |
| Auth Service             | cPanel   | ~$5-10      | Already paid              |
| PostgreSQL Database      | Render   | Free-$7     | Free tier or Starter      |
| API Gateway              | Render   | $7          | 0.5 CPU, 512MB RAM        |
| Education Service        | Render   | $7          | When deployed             |
| Messaging Service        | Render   | $7          | When deployed             |
| Finance Service          | Render   | $7          | When deployed             |
| Mobility Service         | Render   | $7          | When deployed             |
| Database backups         | Render   | Included    | Auto backups on all plans |
| SSL certificates         | Both     | Free        | Let's Encrypt             |
| **Total (All Deployed)** |          | **~$50-57** | Scales with traffic       |

**Note:**

- Render PostgreSQL Free tier: 1GB storage, good for development/testing
- Render PostgreSQL Starter ($7): 10GB storage, recommended for production
- Render Web Service Starter ($7) can handle ~200-500 concurrent users. For higher traffic, upgrade to Standard ($25) or Professional ($50+).

---

## PART 8: DEPLOYMENT TIMELINE

### Week 1 (Jan 25-31)

- [ ] Auth Service deployed on cPanel
- [ ] API Gateway deployed on Render
- [ ] Both tested and working
- [ ] Custom domains configured

### Week 2 (Feb 1-7)

- [ ] Monitoring set up
- [ ] Backup strategy configured
- [ ] Team trained on troubleshooting
- [ ] Documentation updated

### Week 3+ (As services ready)

- [ ] Education Service deployed
- [ ] Messaging Service deployed
- [ ] Finance Service deployed
- [ ] Mobility Service deployed

---

## QUICK REFERENCE URLS

Once deployed:

| Service           | URL                          | Status    |
| ----------------- | ---------------------------- | --------- |
| Auth Service      | https://auth.adorss.com      | **Ready** |
| API Gateway       | https://api.adorss.com       | **Ready** |
| Education Service | https://education.adorss.com | Pending   |
| Messaging Service | https://messaging.adorss.com | Pending   |
| Finance Service   | https://finance.adorss.com   | Pending   |
| Mobility Service  | https://mobility.adorss.com  | Pending   |

---

## TROUBLESHOOTING

### Issue: "Cannot connect to Auth Service from API Gateway"

**Cause:** AUTH_SERVICE_URL environment variable wrong

**Fix:**

1. On Render → Environment variables
2. Check AUTH_SERVICE_URL is exactly `https://auth.adorss.com`
3. Check auth service is actually running (curl test it)
4. Restart API Gateway service

### Issue: "Database connection refused"

**Cause:** Wrong credentials or database not accepting connections

**Fix:**

1. Verify credentials in `.env` (for cPanel) or environment variables (for Render)
2. Check database exists (PostgreSQL): `psql -U adorss_user -d adorss_auth_prod -c "SELECT 1;"`
3. Check privileges (PostgreSQL): `GRANT ALL PRIVILEGES ON DATABASE adorss_auth_prod TO adorss_user;`
4. Check SSL mode - external connections require `DB_SSLMODE=require`
5. Verify firewall allows connection to PostgreSQL port (5432)
6. If using Render PostgreSQL, use the provided DATABASE_URL or connection details

### Issue: "Service shows as down on Render"

**Cause:** Render couldn't start the service (crash on startup)

**Fix:**

1. Check Logs in Render → click "View Logs"
2. Look for error message
3. Common issues:
   - Missing environment variable
   - npm install failed
   - Port conflict
4. Fix the issue and restart

### Issue: "Token validation failing"

**Cause:** JWT_SECRET mismatch between services

**Fix:**

1. Get JWT_SECRET from Auth Service (.env file on cPanel)
2. Set it exactly the same in API Gateway environment variables on Render
3. Restart API Gateway
4. Test with fresh token

### Issue: "Slow response times (>5 seconds)"

**Cause:**

- Auth Service overloaded
- Network latency
- Database slow

**Fix:**

1. Check Render CPU/memory usage (if >90%, upgrade plan)
2. Check cPanel resource usage
3. Enable caching in API Gateway
4. Optimize database queries

---

## NEXT STEPS

1. **Today:** Set up cPanel for Auth Service (Steps 1-7)
2. **Tomorrow:** Deploy Auth Service, test it, fix any issues
3. **Day 3:** Set up Render and deploy API Gateway
4. **Day 4:** Test full integration (Auth + Gateway)
5. **Day 5:** Configure custom domains, enable HTTPS, set up monitoring
6. **Week 2:** Train team on deployment process and troubleshooting
7. **Week 3+:** Deploy other services as they're completed

---

## GETTING HELP

**Render Support:** support@render.com (included with plan)  
**cPanel Support:** Contact your hosting provider  
**Laravel Issues:** laravel.com/docs  
**Node.js Issues:** nodejs.org/docs

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Next Update:** After first deployment (Feb 1, 2026)
