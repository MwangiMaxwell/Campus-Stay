// TODO(member-2): extend this seed when new demo records are required.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '@/config/db';
import { Hostel, Room, User } from '@/models';
import type { AvailabilityStatus, RoomType, UserRole, UserStatus } from '@/types';

const BCRYPT_ROUNDS = 12;

interface SeedUser {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  studentRegNo?: string;
}

const users: SeedUser[] = [
  {
    fullName: 'Peter Kamau',
    email: 'peter.kamau@campusstay.test',
    phone: '+254733000001',
    password: 'SuperAdmin#2026',
    role: 'super_admin',
    status: 'active',
  },
  {
    fullName: 'Grace Mwangi',
    email: 'grace.mwangi@campusstay.test',
    phone: '+254722000001',
    password: 'Admin#2026',
    role: 'admin',
    status: 'active',
  },
  {
    fullName: 'Amina Wanjiku',
    email: 'amina.wanjiku@campusstay.test',
    phone: '+254711000001',
    password: 'Student#2026',
    role: 'student',
    status: 'active',
    studentRegNo: 'SCT-1001',
  },
  {
    fullName: 'Brian Otieno',
    email: 'brian.otieno@campusstay.test',
    phone: '+254711000002',
    password: 'Student#2026',
    role: 'student',
    status: 'active',
    studentRegNo: 'SCT-1002',
  },
];

const rooms: Array<{
  hostel: string;
  roomNumber: string;
  roomType: RoomType;
  price: number;
  capacity: number;
  availabilityStatus: AvailabilityStatus;
}> = [
  {
    hostel: 'Kilimo Hostels',
    roomNumber: 'A-101',
    roomType: 'single',
    price: 8000,
    capacity: 1,
    availabilityStatus: 'available',
  },
  {
    hostel: 'Kilimo Hostels',
    roomNumber: 'A-102',
    roomType: 'double',
    price: 12000,
    capacity: 2,
    availabilityStatus: 'available',
  },
  {
    hostel: 'Kilimo Hostels',
    roomNumber: 'A-103',
    roomType: 'triple',
    price: 15000,
    capacity: 3,
    availabilityStatus: 'available',
  },
  {
    hostel: 'Kilimo Hostels',
    roomNumber: 'A-104',
    roomType: 'bedsitter',
    price: 18000,
    capacity: 1,
    availabilityStatus: 'available',
  },
  {
    hostel: 'Kilimo Hostels',
    roomNumber: 'A-105',
    roomType: 'single',
    price: 8500,
    capacity: 1,
    availabilityStatus: 'maintenance',
  },
  {
    hostel: 'Lakeside Hall',
    roomNumber: 'B-201',
    roomType: 'single',
    price: 9000,
    capacity: 1,
    availabilityStatus: 'available',
  },
  {
    hostel: 'Lakeside Hall',
    roomNumber: 'B-202',
    roomType: 'double',
    price: 13000,
    capacity: 2,
    availabilityStatus: 'available',
  },
  {
    hostel: 'Lakeside Hall',
    roomNumber: 'B-203',
    roomType: 'triple',
    price: 16000,
    capacity: 3,
    availabilityStatus: 'booked',
  },
  {
    hostel: 'Lakeside Hall',
    roomNumber: 'B-204',
    roomType: 'bedsitter',
    price: 20000,
    capacity: 1,
    availabilityStatus: 'available',
  },
  {
    hostel: 'Lakeside Hall',
    roomNumber: 'B-205',
    roomType: 'double',
    price: 12500,
    capacity: 2,
    availabilityStatus: 'maintenance',
  },
];

async function seed(): Promise<void> {
  await connectDb();

  const savedUsers = new Map<string, string>();
  for (const person of users) {
    const passwordHash = await bcrypt.hash(person.password, BCRYPT_ROUNDS);
    const saved = await User.findOneAndUpdate(
      { email: person.email },
      {
        $set: {
          fullName: person.fullName,
          phone: person.phone,
          passwordHash,
          role: person.role,
          status: person.status,
          studentRegNo: person.studentRegNo,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true },
    );
    if (!saved) {
      throw new Error(`Could not seed ${person.email}`);
    }
    savedUsers.set(person.email, String(saved._id));
  }

  const managerId = savedUsers.get('grace.mwangi@campusstay.test');
  if (!managerId) {
    throw new Error('Admin user is missing');
  }

  const hostels = [
    {
      name: 'Kilimo Hostels',
      location: 'North Campus',
      contactPhone: '+254700000001',
    },
    {
      name: 'Lakeside Hall',
      location: 'South Campus',
      contactPhone: '+254700000002',
    },
  ];

  const hostelIds = new Map<string, string>();
  for (const hostel of hostels) {
    const saved = await Hostel.findOneAndUpdate(
      { name: hostel.name },
      { $set: { ...hostel, manager: managerId } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true },
    );
    if (!saved) {
      throw new Error(`Could not seed ${hostel.name}`);
    }
    hostelIds.set(hostel.name, String(saved._id));
  }

  for (const room of rooms) {
    const hostelId = hostelIds.get(room.hostel);
    if (!hostelId) {
      throw new Error(`Hostel ${room.hostel} is missing`);
    }
    await Room.findOneAndUpdate(
      { hostel: hostelId, roomNumber: room.roomNumber },
      {
        $set: {
          roomType: room.roomType,
          price: room.price,
          capacity: room.capacity,
          availabilityStatus: room.availabilityStatus,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true },
    );
  }

  console.log('Seeded CampusStay demo data');
  console.log('super_admin  peter.kamau@campusstay.test  SuperAdmin#2026');
  console.log('admin        grace.mwangi@campusstay.test  Admin#2026');
  console.log('student      amina.wanjiku@campusstay.test  Student#2026');
  console.log('student      brian.otieno@campusstay.test  Student#2026');
  console.log(`Hostels: ${hostels.length}`);
  console.log(`Rooms: ${rooms.length}`);
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDb();
  });
