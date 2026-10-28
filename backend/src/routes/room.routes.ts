import { Router } from 'express';
import { getRoom, getRooms } from '@/controllers/room.controller';
import { validate } from '@/middleware/validate';
import { idParamsSchema } from '@/validators/common';
import { roomQuerySchema } from '@/validators/room.validator';

export const roomRouter = Router();

roomRouter.get('/', validate({ query: roomQuerySchema }), getRooms);
roomRouter.get('/:id', validate({ params: idParamsSchema }), getRoom);
