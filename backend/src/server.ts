import 'dotenv/config';
import { createApp } from '@/app';
import { connectDb, disconnectDb } from '@/config/db';
import { env } from '@/config/env';
import { expireStalePayments } from '@/services/payment.service';
import { runBookingMaintenance } from '@/services/booking.service';
import { logger } from '@/utils/logger';

const MAINTENANCE_INTERVAL_MS = 5 * 60 * 1000;

async function runMaintenance(): Promise<void> {
  try {
    const payments = await expireStalePayments();
    const bookings = await runBookingMaintenance();
    if (payments > 0 || bookings.expired > 0 || bookings.completed > 0) {
      logger.info({ payments, ...bookings }, 'Maintenance sweep finished');
    }
  } catch (error) {
    logger.error({ err: error }, 'Maintenance sweep failed');
  }
}

async function main(): Promise<void> {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'CampusStay API listening');
  });

  // Release unpaid holds and close finished stays without waiting for a request.
  void runMaintenance();
  const sweep = setInterval(() => void runMaintenance(), MAINTENANCE_INTERVAL_MS);
  sweep.unref();

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    clearInterval(sweep);
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      disconnectDb()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to start');
  process.exit(1);
});
