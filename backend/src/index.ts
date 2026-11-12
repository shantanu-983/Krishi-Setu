import { connectDatabase, disconnectDatabase } from './config/database';
import { createApp } from './app';
import { config } from './config/env';

async function main() {
  await connectDatabase();
  const app = createApp();
  const server = app.listen(config.PORT, () => {
    console.log(`🌱  Krishi Setu backend running on http://localhost:${config.PORT}`);
    console.log(`   Environment : ${config.NODE_ENV}`);
    console.log(`   API base    : http://localhost:${config.PORT}/api/v1`);
    console.log(`   Health      : http://localhost:${config.PORT}/api/v1/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n🛑  Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('🏁  Process terminated cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
