import { Hostel } from '@/models';
import { sendSuccess } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

// Public list of hostels, used by the room filters and the admin room form.
export const getHostels = asyncHandler(async (_req, res) => {
  const hostels = await Hostel.find().select('name location contactPhone').sort({ name: 1 }).lean();

  sendSuccess(res, {
    hostels: hostels.map((hostel) => ({
      id: String(hostel._id),
      name: hostel.name,
      location: hostel.location,
      contactPhone: hostel.contactPhone,
    })),
  });
});
