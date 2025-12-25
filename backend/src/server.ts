import app from './app';
import { env } from './config/env';

const start = () => {
  const server = app.listen(env.port, () => {
    console.log(`Backend running on port ${env.port}`);
  });

  const shutdown = () => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
