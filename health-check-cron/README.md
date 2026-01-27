# Health Check Cron Job

This service runs a scheduled cron job that pings the `/health` endpoint of all microservices every 14 seconds to prevent Render from spinning down services due to inactivity.

## Why This Matters

Render's free tier (and some paid tiers) will automatically spin down services after a period of inactivity. By pinging the health endpoints regularly, we ensure:

- Services remain active and responsive
- No cold start delays when users access the application
- Predictable performance and reliability

## Services Monitored

The cron job currently monitors:

- **API Gateway**: `https://api-gateway.adorss.com/health`
- **Auth Service**: `https://auth.adorss.com/health`

Add more services by updating the `HEALTH_ENDPOINTS` array in `src/index.ts`.

## Configuration

### Environment Variables

Update `render.yaml` with your actual service URLs:

```env
API_GATEWAY_URL=https://api-gateway.adorss.com
AUTH_SERVICE_URL=https://auth.adorss.com
```

### Ping Interval

The default interval is **14 seconds**. To change it:

1. Update `PING_INTERVAL_SECONDS` in `src/index.ts`
2. Update the `schedule` field in `render.yaml` if using Render's native cron

## Local Testing

```bash
npm install
npm run dev
```

## Deployment

### Option 1: Deploy as Render Cron Job (Recommended)

1. Push this service to your Git repository
2. In Render Dashboard, create a new service
3. Select "Cron Job"
4. Connect your repository and select this directory
5. Set build command: `npm install && npm run build`
6. Set start command: `npm start`
7. Add environment variables as shown above
8. Deploy

### Option 2: Deploy as Render Background Service

If Render doesn't recognize the cron job type, deploy as a background service instead. It will run continuously.

### Option 3: External Cron Service

Alternatively, use external services like:

- **EasyCron** (https://www.easycron.com/): Free, 10-minute minimum interval
- **UptimeRobot** (https://uptimerobot.com/): Free, 5-minute minimum interval
- **Cron-Job.org** (https://cron-job.org/): Free, 1-minute minimum interval

For EasyCron, create a cron job with:

```
URL: https://api-gateway.adorss.com/health
Interval: Every 14 seconds
```

Then add the other endpoints as separate jobs.

## Monitoring

The service logs health check results to the console:

```
[2026-01-27T12:00:00.000Z] Health check cron job started (interval: 14s)
[2026-01-27T12:00:00.000Z] Monitoring endpoints:
  - https://api-gateway.adorss.com/health
  - https://auth.adorss.com/health
[2026-01-27T12:00:00.500Z] ✓ Health check passed: https://api-gateway.adorss.com/health (200)
[2026-01-27T12:00:00.650Z] ✓ Health check passed: https://auth.adorss.com/health (200)
[2026-01-27T12:00:14.500Z] ✓ Health check passed: https://api-gateway.adorss.com/health (200)
[2026-01-27T12:00:14.650Z] ✓ Health check passed: https://auth.adorss.com/health (200)
```

View logs in Render Dashboard → Service → Logs

## Troubleshooting

### Service Not Running

1. Check Render logs for errors
2. Verify environment variables are set correctly
3. Test health endpoints manually: `curl https://api-gateway.adorss.com/health`

### Health Checks Failing

1. Verify the service URL is correct
2. Check if the service has a `/health` endpoint
3. Ensure the service is accessible from Render (no firewall blocks)
4. Check the target service logs for errors

### High Memory/CPU Usage

- Reduce the number of endpoints being monitored
- Increase the ping interval
- Check if health endpoint queries are causing database load

## Architecture Notes

- Uses `node-cron` for scheduling (though implementation uses `setInterval` for precise 14-second intervals)
- Uses `axios` for HTTP requests with 5-second timeout
- Graceful shutdown handling for deployment updates
- Error handling with detailed logging

## Future Enhancements

- Add Slack/email notifications for persistent health check failures
- Create dashboard to visualize health check history
- Add metrics collection (response times, uptime percentage)
- Support for custom health check paths per service
- Support for health checks with authentication (API keys, JWT)
