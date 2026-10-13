
# Forest Camp Backend

This is the backend server for the Forest Camp website. It provides APIs for user authentication, program management, registration, payments, and email communications.

## Setup Instructions

1. **Install dependencies**

```bash
cd server
npm install
```

2. **Configure environment variables**

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Update the following variables in the `.env` file:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secret key for JWT token generation
- `EMAIL_*`: Configuration for your email provider
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

3. **Seed the database**

```bash
node seeder.js -i
```

This will create a default admin user and sample programs and announcements.

4. **Start the server**

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on port 5000 by default (or the port specified in your .env file).

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new admin (super admin only)
- `POST /api/auth/login` - Login admin
- `GET /api/auth/me` - Get current admin details
- `GET /api/auth/logout` - Logout admin

### Admin Management
- `GET /api/admin` - Get all admins (super admin only)
- `GET /api/admin/:id` - Get single admin (super admin only)
- `PUT /api/admin/:id` - Update admin (super admin only)
- `DELETE /api/admin/:id` - Delete admin (super admin only)

### Programs
- `GET /api/programs` - Get all programs
- `GET /api/programs/:id` - Get single program
- `POST /api/programs` - Create program (admin only)
- `PUT /api/programs/:id` - Update program (admin only)
- `DELETE /api/programs/:id` - Delete program (admin only)

### Announcements
- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/:id` - Get single announcement
- `POST /api/announcements` - Create announcement (admin only)
- `PUT /api/announcements/:id` - Update announcement (admin only)
- `DELETE /api/announcements/:id` - Delete announcement (admin only)

### Registrations
- `GET /api/registrations` - Get all registrations (admin only)
- `GET /api/registrations/:id` - Get single registration (admin only)
- `POST /api/registrations` - Create registration (public)
- `PUT /api/registrations/:id` - Update registration (admin only)
- `DELETE /api/registrations/:id` - Delete registration (admin only)

### Contact Form
- `POST /api/contact` - Submit contact form (public)
- `GET /api/contact` - Get all contact submissions (admin only)
- `GET /api/contact/:id` - Get single contact submission (admin only)
- `PUT /api/contact/:id` - Update contact status (admin only)
- `POST /api/contact/:id/reply` - Reply to contact (admin only)
- `DELETE /api/contact/:id` - Delete contact submission (admin only)

### Payments
- `POST /api/payment/:registrationId` - Create Stripe checkout session
- `POST /api/payment/mpesa/:registrationId` - Process M-Pesa payment
- `POST /api/payment/webhook` - Handle Stripe webhook events
- `GET /api/payment/verify/:registrationId` - Verify payment status
- `PUT /api/payment/manual/:registrationId` - Manually update payment status (admin only)

## Frontend Integration

To connect this backend to the frontend:

1. Update the API URLs in your frontend code to point to this backend server.
2. Replace the in-memory data service with API calls to these endpoints.
3. Implement JWT token storage and authentication flows.

## Security Notes

- In production, ensure you have proper HTTPS setup.
- Configure CORS settings in server.js to only allow requests from your frontend domain.
- Regularly rotate JWT secrets and API keys.
- Consider implementing rate limiting for public endpoints.
