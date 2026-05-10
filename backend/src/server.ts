// server.ts — Express app setup and server entry point

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from '@/routes';
import { logger } from '@/lib/logger';

const app = express();
const port = process.env.PORT || 8000;

app.use(cors()); // handles OPTIONS preflight for all routes
app.use(express.json());

app.use('/api', apiRoutes);

app.listen(port, () => {
  logger.info(`Translation server running on http://localhost:${port}`);
});
