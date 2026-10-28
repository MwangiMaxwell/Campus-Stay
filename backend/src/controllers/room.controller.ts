import mongoose from 'mongoose';
import { listRooms } from '@/services/room.service';
import { AppError } from '@/utils/AppError';
import { sendSuccess } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { IdParams } from '@/validators/common';
import type { RoomQuery } from '@/validators/room.validator';

export const getRooms = asyncHandler(async (req, res) => {
  const query = req.validated?.query as RoomQuery;
  const data = await listRooms(query);
  sendSuccess(res, data);
});

// TODO(member-4): return one room together with its hostel.
export const getRoom = asyncHandler(async (req) => {
  const params = req.validated?.params as IdParams;
  if (!mongoose.isValidObjectId(params.id)) {
    throw new AppError(400, 'Invalid id');
  }
  throw new AppError(501, 'Not implemented');
});
