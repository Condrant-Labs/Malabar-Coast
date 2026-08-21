# Reservations, hall enquiries and Brevo email

## Deployment order

1. Apply the complete `supabase/schema.sql` before deploying the matching application build. The public table form stays paused if the booking contract cannot be reached.
2. Deploy the application and confirm `/api/health/ready` reports the database, Stripe and transactional email checks as ready.
3. Sign in to `/admin/reservations` and confirm capacity, sitting duration, arrival interval, maximum party size, service times, notice and advance-booking window.
4. Test one table reservation and one hall enquiry with dedicated test contact details. Confirm customer and owner messages, then remove or clearly label the test records.

## Brevo values

Set these server-only deployment secrets:

- `BREVO_API_KEY`: Brevo transactional email API key.
- `BREVO_SENDER_EMAIL`: a sender address verified in Brevo.
- `BREVO_SENDER_NAME`: the visible sender name, normally `Malabar Coast`.
- `BREVO_OWNER_EMAIL`: the restaurant inbox that receives operational notifications.

The application sends two messages for a paid order, confirmed table reservation or new hall enquiry: one to the customer and one to the owner. Hall approval or decline sends a customer update. Every logical message has a database delivery key; successful messages are never sent again, and failed deliveries can retry up to five times. With a 300-message daily allowance, allow operational headroom rather than treating 150 two-message events as a guaranteed daily limit.

## Table reservations

The default capacity is 40 seats, with 90-minute tables and 30-minute arrival intervals. Supabase locks each booking date while it counts overlapping confirmed reservations, so simultaneous requests cannot overbook the final seats. Cancelling a reservation releases its capacity. Completed and no-show states preserve the record for operations.

## Hall enquiries

Hall submissions are requests only. Staff review them in `/admin/hall-enquiries`, record call notes, and move each request through new, contacted, approved or declined. Approval means the team can proceed with detailed planning; it is not a payment receipt or event contract.
