import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'education-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Education Service - Assignments, grades, attendance',
    service: 'education-service',
    version: '1.0.0',
    assignedTo: 'Backend Dev 2'
  });
});

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log('🚀 education-service running on port', PORT);
  console.log('📍 Health check: http://localhost:' + PORT + '/health');
  console.log('👤 Assigned to: Backend Dev 2');
});

export default app;
