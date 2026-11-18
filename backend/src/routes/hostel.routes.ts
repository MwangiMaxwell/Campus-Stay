import { Router } from 'express';
import { getHostels } from '@/controllers/hostel.controller';

export const hostelRouter = Router();

hostelRouter.get('/', getHostels);
