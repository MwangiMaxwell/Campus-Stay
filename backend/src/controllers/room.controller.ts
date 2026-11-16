import { listRooms, getRoomById } from '@/services/room.service';
import { sendSuccess } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { IdParams } from '@/validators/common';
import type { RoomQuery } from '@/validators/room.validator';

export const getRooms = asyncHandler(async (req, res) => {
  const query = req.validated?.query as RoomQuery;
  const data = await listRooms(query);
  sendSuccess(res, data);
});

// Return one room together with its hostel.
export const getRoom = asyncHandler(async (req, res) => {
  const params = req.validated?.params as IdParams;
  const room = await getRoomById(params.id);
  sendSuccess(res, room);
});
