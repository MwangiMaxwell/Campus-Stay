import { Router } from 'express';
import { adminRouter } from '@/routes/admin.routes';
import { authRouter } from '@/routes/auth.routes';
import { bookingRouter } from '@/routes/booking.routes';
import { healthRouter } from '@/routes/health.routes';
import { mpesaRouter } from '@/routes/mpesa.routes';
import { paymentRouter } from '@/routes/payment.routes';
import { roomRouter } from '@/routes/room.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/rooms', roomRouter);
apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/mpesa', mpesaRouter);
apiRouter.use('/admin', adminRouter);
