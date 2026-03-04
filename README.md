# NexMart — AI-Powered E-Commerce Platform

<div align="center">
  <img src="screenshots/landing page.png" alt="NexMart" width="100%" />
  
  <p>
    <strong>A full-stack, production-ready e-commerce platform with 7+ AI features, real-time chat, Stripe payments, and more.</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" />
    <img src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" />
    <img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai" />
    <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" />
  </p>
</div>

---

## ✨ Features

### 🤖 AI Features (Built with GPT-4)
| Feature | Description |
|---|---|
| **NexBot Shopping Assistant** | Conversational AI that recommends products, answers questions, extracts product suggestions from responses |
| **AI Description Generator** | One-click generation of SEO-optimized product title, description, tags & meta from product name |
| **Image Search** | Upload a photo (GPT-4 Vision) to find visually similar products |
| **Smart Price Prediction** | ML-based price trend analysis on historical data to forecast future price |
| **Review Sentiment Analysis** | Automatic sentiment analysis + fake review detection on all product reviews |
| **Personalized Recommendations** | Collaborative filtering based on purchase history, wishlist, and browsing |
| **Smart Search Enhancement** | AI-powered query understanding, typo correction, synonym expansion, product comparison |

### 🛒 E-Commerce Features
- **Multi-seller marketplace** — buyers, sellers, admin roles
- **Flash Sales** with real-time countdown timer
- **Voucher / Coupon system** with percentage & fixed discounts
- **Stripe Checkout** — card payment with 3D Secure, PaymentIntents
- **Real-time buyer–seller chat** with Socket.io and typing indicators
- **Wishlist, order tracking, address book**
- **Category browsing, full-text search, filters, sorting**
- **Product image gallery, variants (size/color), specs table**
- **Push notifications** (in-app)
- **Responsive design** — mobile-first, works on all screen sizes

### 📊 Seller Dashboard
- Revenue trend charts (Recharts — Line, Area, Bar, Pie)
- Top products by sales & revenue
- Order management with status updates
- AI product description generator built-in

---

## 🖥 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS 3, Framer Motion, Redux Toolkit, React Query, Recharts |
| **Backend** | Node.js 20, Express 5, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 (ioredis) |
| **AI** | OpenAI GPT-4o, GPT-4o-mini, GPT-4 Vision |
| **Payments** | Stripe (PaymentIntents, Webhooks, Elements) |
| **Storage** | Cloudinary (image upload & optimization) |
| **Real-time** | Socket.io 4 |
| **Auth** | JWT (access + refresh tokens) + Google OAuth 2.0 |
| **Email** | Nodemailer (welcome, order confirmation, password reset) |
| **Deployment** | Docker Compose (postgres + redis + server + nginx client) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- PostgreSQL 16 (or use Docker Compose)
- Redis (or use Docker Compose)

### Option A — Docker (Recommended)
```bash
# 1. Clone and navigate
git clone https://github.com/Mostafa-Anwar-Sagor/ecommerce-website-Nexmart.git
cd ecommerce-website-Nexmart

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your API keys (OpenAI, Stripe, Cloudinary, etc.)

# 3. Start all services
docker-compose up --build
```
Visit: http://localhost:3000

---

### Option B — Manual Setup

#### Backend
```bash
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

# Start dev server
npm run dev
```

#### Frontend
```bash
cd client
npm install
npm run dev
```

Visit: http://localhost:5173

---

## 🔑 Environment Variables

Create `server/.env` from `server/.env.example`:

```env
DATABASE_URL=postgresql://nexmart:nexmart@localhost:5432/nexmart
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

OPENAI_API_KEY=sk-...       # Required for all AI features
STRIPE_SECRET_KEY=sk_test_... # Required for payments
STRIPE_WEBHOOK_SECRET=whsec_... # For Stripe webhooks

CLOUDINARY_CLOUD_NAME=...   # Required for image uploads
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

GOOGLE_CLIENT_ID=...         # Optional: Google OAuth
SMTP_HOST=smtp.gmail.com     # Optional: Email notifications
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
```

---

## 👥 Demo Credentials

After running `npx prisma db seed`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@nexmart.com | Admin@123456 |
| Seller | seller@nexmart.com | Seller@123456 |
| Buyer | buyer@nexmart.com | Buyer@123456 |

---

## 📁 Project Structure

```
nexmart/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ai/          # NexBot Chat Assistant
│   │   │   ├── cart/        # CartDrawer
│   │   │   ├── home/        # FlashSaleTimer
│   │   │   └── product/     # ProductCard
│   │   ├── pages/           # Route pages
│   │   │   ├── buyer/       # Profile, Orders, Wishlist, Chat, Vouchers
│   │   │   └── seller/      # Dashboard, AddProduct, Orders, Analytics
│   │   ├── services/        # API service layer
│   │   ├── store/           # Redux Toolkit slices
│   │   └── types/           # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                  # Node.js backend
│   ├── src/
│   │   ├── ai/              # 7 AI modules
│   │   ├── config/          # DB, Redis, Stripe, Cloudinary, OpenAI
│   │   ├── controllers/     # 11 controllers
│   │   ├── middleware/       # Auth, error handler
│   │   ├── routes/          # 11 route files
│   │   ├── services/        # Email service
│   │   └── socket/          # Socket.io chat & notifications
│   ├── prisma/
│   │   ├── schema.prisma    # 21 database models
│   │   └── seed.ts          # Database seeder
│   └── Dockerfile
│
└── docker-compose.yml       # Full stack orchestration
```

---

## 🤖 AI Architecture

```
NexMart AI Layer (server/src/ai/)
├── chatbot.ts          → GPT-4o-mini: Shopping assistant with product search
├── descriptionGenerator.ts → GPT-4o: SEO content from product name
├── sentimentAnalysis.ts → GPT-4o-mini: Review analysis + fake detection
├── recommendation.ts   → Collaborative filtering: purchase/wishlist/views
├── imageSearch.ts      → GPT-4o Vision: Image → product search
├── priceOptimizer.ts   → Statistical: Moving average price forecasting
└── searchEnhancer.ts   → GPT-4o-mini: Query understanding + comparison
```

---

## 🌐 API Endpoints

| Route | Description |
|---|---|
| `POST /api/auth/register` | User registration |
| `POST /api/auth/login` | Login with JWT |
| `GET /api/products` | List products (filter, sort, paginate) |
| `POST /api/products` | Create product (seller) |
| `POST /api/orders` | Create order + Stripe PaymentIntent |
| `POST /api/ai/chat` | NexBot AI chat |
| `POST /api/ai/generate-description` | AI product description |
| `POST /api/ai/image-search` | Visual product search |
| `GET /api/ai/recommendations` | Personalized recommendations |
| `GET /api/seller/analytics` | Seller analytics & charts |
| `GET /api/chat/conversations` | Chat conversations |

Full API documentation available at `/api/health` after starting the server.

---

## 📱 Screenshots

### 🏠 Landing Page
> The main storefront with hero banner, featured products, flash sales, and category browsing.

<p align="center">
  <img src="screenshots/landing page.png" alt="Landing Page" width="100%" />
</p>

---

### 🛍️ Products Page
> Browse, filter, sort, and search through the full product catalog with grid/list view.

<p align="center">
  <img src="screenshots/products.png" alt="Products Page" width="100%" />
</p>

---

### 🤖 AI Chatbot (NexBot)
> Conversational AI shopping assistant powered by GPT-4o-mini — finds products, answers questions, and gives personalized recommendations.

<p align="center">
  <img src="screenshots/chatbot.png" alt="AI Chatbot" width="100%" />
</p>

---

### 📦 My Orders
> Order history with status tracking, order details, and real-time delivery updates.

<p align="center">
  <img src="screenshots/my order.png" alt="My Orders" width="100%" />
</p>

---

### 🎫 Vouchers
> Voucher & coupon system with percentage and fixed discount codes.

<p align="center">
  <img src="screenshots/vouchers.png" alt="Vouchers" width="100%" />
</p>

---

### 🏪 Become a Seller
> Multi-step seller application form with image uploads, shop type selection, and admin approval workflow.

<p align="center">
  <img src="screenshots/become a seller form.png" alt="Become a Seller Form" width="100%" />
</p>

---

### 📊 Admin Dashboard
> Admin overview with revenue metrics, user stats, order analytics, and quick actions.

<p align="center">
  <img src="screenshots/Admin dashboard.png" alt="Admin Dashboard" width="100%" />
</p>

---

### 👥 User Management (Admin)
> Manage all users — view roles, verify accounts, update status, and monitor activity.

<p align="center">
  <img src="screenshots/user_management.png" alt="User Management" width="100%" />
</p>

---

### 📦 Order Management (Admin)
> Admin order management with status updates, filtering, and order details.

<p align="center">
  <img src="screenshots/Order management .png" alt="Order Management" width="100%" />
</p>

---

### 🏬 Shop Management (Admin)
> Approve/reject seller applications, manage shop statuses, and monitor marketplace shops.

<p align="center">
  <img src="screenshots/shop_management.png" alt="Shop Management" width="100%" />
</p>

---

### 📝 Product Management (admin)
> Seller product management — add, edit, and manage inventory with AI description generator.

<p align="center">
  <img src="screenshots/products_management.png" alt="Product Management" width="100%" />
</p>

---

## 🛠 Development Scripts

```bash
# Backend
npm run dev          # Start with hot reload (ts-node-dev)
npm run build        # Compile TypeScript
npm run start        # Run compiled JS
npx prisma studio    # Open Prisma database GUI
npx prisma migrate dev # Run new migrations

# Frontend  
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

<div align="center">
  <p>Built with ❤️ by <strong>Mostafa Anwar Sagor</strong></p>
  <p>
    <a href="https://linkedin.com/in/mostafa-anwar-sagor">LinkedIn</a> ·
    <a href="https://github.com/mostafa-anwar-sagor">GitHub</a>
  </p>
</div>
