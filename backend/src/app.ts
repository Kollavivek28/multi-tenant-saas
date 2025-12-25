import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { healthCheck } from './controllers/health.controller';

const app = express();

app.use(helmet());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowOrigins = new Set(env.frontendOrigins.length ? env.frontendOrigins : ['http://localhost:5173']);
const allowAllOrigins = env.nodeEnv !== 'production' || allowOrigins.has('*');

app.use(
  cors({
    origin: allowAllOrigins
      ? true
      : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          if (!origin) return callback(null, true);
          if (allowOrigins.has(origin)) return callback(null, true);
          return callback(new Error('Not allowed by CORS'));
        },
    credentials: true
  })
);

app.get('/api/health', healthCheck);
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
