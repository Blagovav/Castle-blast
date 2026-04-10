import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { playerRouter } from './routes/player.js';
import { levelRouter } from './routes/level.js';
import { shopRouter } from './routes/shop.js';
import { referralRouter } from './routes/referral.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/player', playerRouter);
app.use('/api/level', levelRouter);
app.use('/api/shop', shopRouter);
app.use('/api/referral', referralRouter);
app.use('/api/leaderboard', leaderboardRouter);

// Error handler
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
