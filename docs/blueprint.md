# **App Name**: Attendease

## Core Features:

- Student Request Submission: Students log in and see their weekly timetable; select one or more missed classes; enter a reason; optionally select a pre-approved event; submitted requests are automatically routed to the correct faculty.
- Faculty Approval Panel: Faculty see only requests related to subjects they are mapped to; view student details; approve or reject with a comment; and provide real-time status updates to the student.
- Admin Management Dashboard: Admins can add/edit/delete users, upload/manage timetables (CSV, Excel, manual), manage pre-approved events, and view request logs sorted by various criteria.
- Timetable Upload: Timetable is uploaded per course + semester in Excel/CSV format with columns like Day, Time Slot, Subject Name, Faculty Name, Course, Semester; the uploaded timetable is shown to students.
- Student-Faculty Mapping: Admins manage a mapping system where each student belongs to a course & semester, and each subject is taught by a specific faculty; this ensures requests are sent to the correct teacher.
- Request & Data Logic: Each request includes student PRN & Name, missed class info (linked to timetable), reason, event (optional), timestamp, and status (Pending -> Approved / Rejected); includes validation rules for submissions.

## Style Guidelines:

- Primary Color: Muted Blue #64B5F6
- Accent Color: Soft Orange #FFA726
- Background: Light Gray #F0F4F8
- Body: Inter, sans-serif (modern and readable)
- Headline: Space Grotesk, sans-serif (bold but clean)
- Simple tabs for Students / Faculty / Admin; Clean visual separation of class slots, requests, and events; Consistent icons for statuses.