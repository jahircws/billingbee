# BillingBee Monitoring

## Sentry

- Errors captured automatically via `instrumentation.ts` (server) and `sentry.client.config.ts` (browser)
- Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in environment variables
- Set `SENTRY_ORG` and `SENTRY_PROJECT` for source map uploads
- Error replay enabled on error (100%) and session (5%) for production

## Health Check

`GET /api/health` — public endpoint, returns:

```json
{ "status": "ok", "db": "ok", "timestamp": "...", "version": "0.1.0", "latencyMs": 12 }
```

Returns HTTP 503 if DB is unreachable.

## CloudWatch Alarms to Configure

| Metric | Threshold | Period |
|---|---|---|
| CPU Utilization (ECS/EC2) | > 70% | 5 min |
| RDS Connections | > 80% of max | 5 min |
| 5xx Error Rate | > 1% | 5 min |
| P95 Response Time | > 3 seconds | 5 min |
| DB storage | > 80% | 30 min |

### Recommended Actions

- **CPU > 70%**: Auto-scale or notify on-call
- **RDS connections > 80%**: Check for connection leaks, consider PgBouncer
- **5xx > 1%**: Page on-call immediately; check Sentry for error spike
- **P95 > 3s**: Profile slow DB queries; check Prisma query logs
- **DB storage > 80%**: Purge old AI usage logs or expand RDS volume

## Uptime Monitoring

Use a third-party uptime monitor (e.g. Better Uptime, Pingdom) to check `/api/health` every minute from multiple regions.

Suggested alert escalation:
1. Email on first failure
2. PagerDuty after 3 consecutive failures (3 minutes down)
