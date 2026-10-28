# User manual

// TODO(member-1): add screenshots and the timed booking result before the final demo.

Owner: Member 1 (project manager and business analyst), with screenshots added by Member 5 when the screens stop being placeholders.

This outline records the steps that already work and the sections still to write. Replace each "To be completed" note with the final wording and a screenshot before the demo. Do not use real student data in the figures.

## Part A. Students

### A1. What CampusStay is for

CampusStay is the university hostel desk in a browser. You use it to find a room, reserve it, and pay the booking fee with M-Pesa.

To be completed: one screenshot of the home page and a sentence that names the university.

### A2. Create an account

1. Open the website and choose **Create a student account**.
2. Enter your full name, email, phone, and a password. The password needs at least 8 characters, one letter, and one number.
3. Add your student registration number if you have it.
4. Submit the form. You are signed in and taken to Rooms.

If the email is already used, the page says an account with that email already exists. Sign in instead.

To be completed: screenshot of a successful registration and of the duplicate-email error.

### A3. Sign in and sign out

1. Open **Log in**.
2. Enter the email and password.
3. Students land on Rooms. Staff land on the admin dashboard.
4. Choose **Log out** in the header. You return to the home page and must sign in again to open Rooms.

A wrong password shows "Invalid email or password". A suspended account shows "This account is suspended". Contact the hostel office if you see that message.

To be completed: screenshot of the login form, including the demo-account card used in class.

### A4. Reset a forgotten password

The reset form asks for your email. The service that sends the link is not finished. The page explains that, and the API responds that the feature is not implemented.

To be completed by Member 1 after Member 4 ships reset: the email the student receives, how long the link lasts, and what to do if it expires.

### A5. Search for a room

To be completed by Member 3. Describe:

- How to filter by hostel, room type, price, and availability
- What single, double, triple, and bedsitter mean
- What available, booked, and maintenance mean
- How to move between pages of results

Target: a new student understands the filters without a lesson.

### A6. Book a room

To be completed by Member 3 and Member 4. The steps must be:

1. Choose an available room.
2. Enter the check-in and check-out dates. Check-out must be after check-in.
3. Submit. The booking stays pending until an admin approves it.
4. If another student already has that room pending or approved, explain the message and tell the student to pick another room.

Time this path with someone who has not used the system. NFR2 requires the whole booking, from a new account to a pending booking, in under 5 minutes. Record the time and the date here.

### A7. Pay the booking fee

To be completed. Describe the M-Pesa prompt, the phone number to use, what a success receipt looks like, and what to do when the payment fails. Say clearly that the fee is the booking fee, not the full month's rent.

### A8. Your profile

To be completed. Show where the student checks their name, email, phone, and registration number.

## Part B. Administrators

### B1. Who can sign in

Admins and the super admin use the same login page as students. After login they open the dashboard. A student who tries an admin address is sent back to Rooms.

To be completed: a screenshot of the sidebar.

### B2. Dashboard

To be completed. Explain the occupancy summary, pending bookings, and recent payments the dashboard will show.

### B3. Rooms

To be completed. Document add, edit, and delete. Mention that a room number must be unique inside a hostel, and that a room in maintenance should not be offered to students.

### B4. Bookings

To be completed. Document approve and cancel, who is recorded as `approvedBy`, and what the student should see after each decision.

### B5. Users

To be completed. Explain that admins can look up users, and that only the super admin can create staff, change roles, or remove a user. Suspending a user blocks the next login and the next API call.

### B6. Payments

To be completed. Show how to find a receipt number and a failed attempt.

### B7. Reports

To be completed by Member 5. For bookings, payments, and occupancy, document:

- The date filters
- Any status or hostel filter
- Where the organization name and logo appear
- How to print or save the report

Include one sample of each report with the date visible.

## Part C. Class demo accounts

For the lab only, the seeded accounts in the root README can sign in after `npm run seed`. Tell the class not to reuse those passwords anywhere else. Remove this section from any manual that leaves the course.
