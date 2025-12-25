import dotenv from 'dotenv';

dotenv.config();

const required = ['JWT_SECRET', 'DATABASE_URL'];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const frontendUrlEnv = process.env.FRONTEND_URL || 'http://localhost:3000';
const frontendOrigins = frontendUrlEnv
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  frontendUrl: frontendOrigins[0],
  frontendOrigins
};
