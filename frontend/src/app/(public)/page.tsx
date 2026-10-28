import Link from 'next/link';
import { Card } from '@/components/ui/Card';

const steps = [
  {
    title: 'Search',
    text: 'Filter hostels by room type, monthly price, and whether a room is free.',
  },
  {
    title: 'Book',
    text: 'A signed-in student reserves one available room. The same room cannot be booked twice.',
  },
  {
    title: 'Pay',
    text: 'Pay the booking fee with M-Pesa. The system keeps the receipt and sends confirmation.',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="grid items-center gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
            University hostels
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Find a room on campus and book it in one sitting.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            CampusStay is the shared system for students, hostel admins, and the super admin. Search
            rooms, request a booking, and pay the booking fee with M-Pesa.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              Create a student account
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold"
            >
              Log in
            </Link>
          </div>
        </div>
        <Card>
          <h2 className="text-lg font-semibold">Who uses it</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>Students register, search, book, and pay.</li>
            <li>Admins approve bookings and keep rooms up to date.</li>
            <li>The super admin also manages staff accounts.</li>
          </ul>
        </Card>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title}>
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-muted">{step.text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
