# 🍕 Pizza Delivery Full-Stack Application

**Oasis Infobyte Web Development & Design Internship — Level 3, Task 1**

A production-grade, full-stack pizza ordering and inventory management platform built with the MERN stack, featuring real-time order tracking, live payment gateway integration, and automated inventory alerts.

## 🔗 Live Demo

- **Frontend:** https://oibsip-kappa-five.vercel.app
- **Backend API:** https://oibsip-production.up.railway.app

## ✨ Features

### User Side
- Registration with email verification (Nodemailer)
- Secure login with JWT-based authorization
- Forgot / reset password flow with time-limited email links
- 4-step custom pizza builder (base → sauce → cheese → vegetables)
- Order summary with dynamic pricing
- **Real Razorpay checkout integration** (test mode) with signature verification
- Live order status tracking (Order Received → In Kitchen → Sent to Delivery) via Socket.IO — no page refresh needed

### Admin Side
- Separate, secured admin authentication (isolated from user registration)
- Inventory dashboard grouped by category (bases, sauces, cheeses, vegetables)
- Manual stock updates
- Automatic stock decrement on successful payment
- Automated low-stock email alerts via a scheduled cron job (checks hourly)
- Order management panel with live status updates pushed to the customer's dashboard in real time

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, Socket.IO Client

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Nodemailer, node-cron, Socket.IO, Razorpay SDK

**Database:** MongoDB Atlas

**Deployment:** Vercel (frontend), Railway (backend)

## 📁 Project Structure

```
WebDev-L3-PizzaDeliveryApp/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route logic (auth, orders, inventory, admin)
│   ├── jobs/             # node-cron low-stock alert job
│   ├── middleware/       # JWT auth middleware (user & admin)
│   ├── models/           # Mongoose schemas (User, Admin, Order, InventoryItem)
│   ├── routes/           # Express routes
│   ├── seed/             # Inventory seed script
│   ├── utils/             # Email + Razorpay helpers
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/           # Axios instances (user & admin)
│       ├── components/    # Navbar, protected routes
│       ├── context/        # Auth context (user & admin)
│       └── pages/
│           ├── user/       # Register, Login, Dashboard, Pizza Builder
│           └── admin/      # Admin Login, Admin Dashboard
└── docker-compose.yml    # Local MongoDB (development only)
```

## ⚙️ Local Setup

**Backend:**
```bash
cd backend
npm install
# Create a .env file — see the required variables below
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev


**Environment variables required (backend/.env):**

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
EMAIL_USER=your_gmail_address
EMAIL_APP_PASSWORD=your_gmail_app_password
ADMIN_SETUP_KEY=your_chosen_secret
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
STOCK_CHECK_CRON=0 * * * *
```

## 💳 Payment Testing

This app uses **Razorpay Test Mode**. To simulate a payment during checkout, use any Razorpay test card (e.g. Mastercard `5267 3181 8797 5449`, any future expiry, any CVV) and any OTP when prompted.

## 👤 Author

**Ayush Kumar Mahapatra**
CSE Undergraduate, KIIT | Web Development & Design Intern, Oasis Infobyte

---

*Submitted as part of the OIBSIP (Oasis Infobyte Student Internship Program) — Web Development & Design track, Level 3.*