# Cabinet Quoting Tool

A complete, production-ready web application for cabinet installers to create professional quotes on-site. Built with React, Node.js, TypeScript, and PostgreSQL.

## ✨ Features

### Phase 1 - Foundation ✅
- ✅ User authentication (JWT-based with role-based access control)
- ✅ Comprehensive database schema with Prisma ORM
- ✅ Complete REST API for all entities
- ✅ React frontend with Tailwind CSS
- ✅ Product catalog support (1,044 SKUs across 5 collections)
- ✅ Customer management
- ✅ Quote management system

### Phase 2 - Core Workflow ✅
- ✅ Complete quote creation workflow (4-step process)
- ✅ Advanced product catalog browser with search and filters
- ✅ Grid and list view modes for products
- ✅ Real-time quote calculations with tax
- ✅ Customer management interface with full CRUD operations
- ✅ Quote listing with status filters and search
- ✅ Quote detail view with status management

### Phase 3 - Enhanced Features ✅
- ✅ PDF generation for quotes with company branding
- ✅ Email quote functionality
- ✅ Quote status management (Draft, Sent, Approved, Rejected)
- ✅ Quote duplication
- ✅ Settings management UI for tax rates and company info
- ✅ Company information on PDFs

### Phase 4 - Polish & UX ✅
- ✅ Fully mobile responsive design
- ✅ Smooth animations and transitions
- ✅ Loading states and user feedback
- ✅ Accessibility improvements (keyboard navigation, focus states)
- ✅ Enhanced error handling with user-friendly messages
- ✅ Professional UI/UX polish

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Docker (optional, for easier database setup)

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- React Router v6
- Zustand (state management)
- Axios
- Vite

**Backend:**
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL 15
- JWT authentication
- bcryptjs
- PDFKit (PDF generation)

## 📦 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd Quote-tool
```

### 2. Start PostgreSQL database

**Option A: Using Docker (Recommended)**

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432 with the credentials defined in `docker-compose.yml`.

**Option B: Use existing PostgreSQL**

Make sure PostgreSQL is running and update the `DATABASE_URL` in `backend/.env`

### 3. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root and install concurrently for dev mode
cd ..
npm install
```

### 4. Configure environment variables

Create `backend/.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cabinet_quoting?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 5. Set up the database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# Seed database with default users and settings
npm run seed
```

### 6. Import product data (Optional)

If you have product data, save it to `backend/src/data/products.json`, then run:

```bash
cd backend
npx tsx src/scripts/import-products.ts
```

The product JSON should follow this format:
```json
[
  {
    "collection": "Essential & Charm",
    "style": "SA",
    "itemCode": "W3030",
    "description": "Wall Cabinet 30\"W x 30\"H x 12\"D",
    "category": "Wall Cabinets",
    "msrp": 500.00,
    "yourPrice": 200.00
  }
]
```

## 🚀 Running the Application

### Development Mode (Recommended)

Run both frontend and backend together from the root directory:

```bash
npm run dev
```

This will start:
- Backend API on http://localhost:3001
- Frontend on http://localhost:5173

### Run Separately (Alternative)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🔑 Default Credentials

After running the seed script, you can login with:

**Admin Account:**
- Email: `admin@cabinetquoting.com`
- Password: `admin123`
- Access: Full system access

**Installer Account:**
- Email: `installer@cabinetquoting.com`
- Password: `installer123`
- Access: Create quotes, manage customers

## 🎯 Using the Application

### Creating a Quote

1. **Select Customer** - Choose existing customer or create new one
2. **Choose Collection & Style** - Pick cabinet collection and style
3. **Add Products** - Browse catalog, filter by category, add items with quantities
4. **Review & Save** - Review totals, add notes, save as draft or mark as sent

### Managing Customers

- Navigate to **Customers** page
- View all customers in a searchable table
- Click **+ New Customer** to add customers
- Edit or delete existing customers
- Search by name, email, or phone

### Quote Management

- View all quotes on the **Quotes** page
- Filter by status (Draft, Sent, Approved, Rejected)
- Search by quote number or customer
- Click any quote to view details
- Download PDF quotes
- Send quotes via email
- Duplicate quotes for similar orders
- Update quote status

### Settings

- Configure default tax rate (appears on all new quotes)
- Set company information (name, email, phone, address)
- Company info appears on PDF quotes
- Preview how company info will look

## 📁 Project Structure

```
Quote-tool/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── middleware/            # Auth middleware
│   │   │   └── auth.ts
│   │   ├── routes/                # API route handlers
│   │   │   ├── auth.ts
│   │   │   ├── collections.ts
│   │   │   ├── customers.ts
│   │   │   ├── products.ts
│   │   │   ├── quotes.ts
│   │   │   ├── settings.ts
│   │   │   ├── styles.ts
│   │   │   └── users.ts
│   │   ├── scripts/               # Database scripts
│   │   │   ├── import-products.ts
│   │   │   └── seed.ts
│   │   ├── utils/                 # Utility functions
│   │   │   ├── jwt.ts
│   │   │   ├── pdfGenerator.ts
│   │   │   └── prisma.ts
│   │   └── index.ts               # Express server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable components
│   │   │   ├── Layout.tsx
│   │   │   └── ProductCatalog.tsx
│   │   ├── pages/                 # Page components
│   │   │   ├── Customers.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── NewQuote.tsx
│   │   │   ├── QuoteDetail.tsx
│   │   │   ├── Quotes.tsx
│   │   │   └── Settings.tsx
│   │   ├── services/              # API services
│   │   │   └── api.ts
│   │   ├── stores/                # Zustand stores
│   │   │   └── authStore.ts
│   │   ├── types/                 # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── index.css              # Global styles
│   │   └── main.tsx
│   └── package.json
├── docker-compose.yml
├── package.json
└── README.md
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following tables:

- **users** - System users with role-based access (ADMIN, INSTALLER)
- **collections** - Cabinet collections (5 total)
- **styles** - Cabinet styles within collections
- **products** - Cabinet products/SKUs (1,044 products)
- **customers** - Customer contact information
- **quotes** - Quote headers with totals and status
- **quote_items** - Line items in quotes
- **settings** - System settings (tax rate, company info)

## 🔌 Complete API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and receive JWT token

### Collections
- `GET /api/collections` - List all collections with styles
- `GET /api/collections/:id` - Get single collection
- `POST /api/collections` - Create collection (admin only)
- `PUT /api/collections/:id` - Update collection (admin only)
- `DELETE /api/collections/:id` - Delete collection (admin only)

### Products
- `GET /api/products` - List products with pagination and filters
  - Query params: `collectionId`, `category`, `search`, `page`, `limit`
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer (admin only)

### Quotes
- `GET /api/quotes` - List quotes with filters
  - Query params: `status`, `customerId`, `userId`, `startDate`, `endDate`, `search`
- `GET /api/quotes/:id` - Get single quote with items
- `POST /api/quotes` - Create new quote
- `PUT /api/quotes/:id` - Update quote
- `PATCH /api/quotes/:id/status` - Update quote status
- `POST /api/quotes/:id/duplicate` - Duplicate existing quote
- `DELETE /api/quotes/:id` - Delete quote (admin only)
- `GET /api/quotes/:id/pdf` - Generate and download PDF
- `POST /api/quotes/:id/send` - Send quote via email

### Quote Items
- `POST /api/quotes/:quoteId/items` - Add item to quote
- `PUT /api/quotes/:quoteId/items/:itemId` - Update quote item
- `DELETE /api/quotes/:quoteId/items/:itemId` - Remove quote item

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update setting value

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🔧 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cabinet_quoting?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"
```

## 🧪 Testing the API

Example requests using curl:

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cabinetquoting.com","password":"admin123"}'
```

**Get Products (with authentication):**
```bash
curl http://localhost:3001/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Customer:**
```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567"
  }'
```

## 🐛 Troubleshooting

### Database connection issues

1. **Check if PostgreSQL is running:**
   ```bash
   docker-compose ps
   ```

2. **Verify database credentials** in `backend/.env`

3. **Reset database if needed:**
   ```bash
   cd backend
   npx prisma migrate reset
   npm run seed
   ```

### Port conflicts

If port 3001 or 5173 is already in use:

1. **Backend:** Change `PORT` in `backend/.env`
2. **Frontend:** Change port in `frontend/vite.config.ts`

### Prisma errors

**Regenerate Prisma client:**
```bash
cd backend
npm run prisma:generate
```

**View database in Prisma Studio:**
```bash
cd backend
npm run prisma:studio
```

### Module not found errors

**Clear node_modules and reinstall:**
```bash
rm -rf backend/node_modules frontend/node_modules node_modules
cd backend && npm install
cd ../frontend && npm install
cd .. && npm install
```

## 📝 Development Workflow

### Creating a Feature

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test locally**

3. **Commit with descriptive message:**
   ```bash
   git add .
   git commit -m "Add feature: description"
   git push origin feature/your-feature-name
   ```

### Database Changes

When modifying the Prisma schema:

```bash
cd backend
# Edit prisma/schema.prisma
npm run prisma:migrate
npm run prisma:generate
```

## 🚀 Production Deployment

### Backend Deployment

1. **Set production environment variables**
2. **Run database migrations:**
   ```bash
   cd backend
   npm run build
   npx prisma migrate deploy
   ```
3. **Start server:**
   ```bash
   npm start
   ```

### Frontend Deployment

```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service (Vercel, Netlify, etc.)
```

### Recommended Hosting

- **Frontend:** Vercel, Netlify, or AWS S3 + CloudFront
- **Backend:** Railway, Render, Heroku, or AWS EC2
- **Database:** Supabase, Railway, or AWS RDS

## 📚 Product Data

The system supports 5 cabinet collections with 1,044 total products:

1. **Essential & Charm** (265 products)
   - Styles: SA, IB, AG, SW, GR, SE, NB, TC

2. **Classical & Double Shaker** (265 products)
   - Styles: AW, AC, CW, DDW, DSG

3. **Slim Shaker** (232 products)
   - Styles: SDW, SWO, SAG

4. **Frameless High Gloss** (160 products)
   - Styles: HW, HG

5. **Builder Grade** (134 products)
   - Styles: FW, FG, FE

**Product categories include:**
- Base Cabinets
- Wall Cabinets
- Tall Cabinets
- Specialty Cabinets
- Vanity Cabinets

## 🎨 Features Showcase

### Quote Creation Workflow
- **Step 1:** Select or create customer
- **Step 2:** Choose collection and style
- **Step 3:** Browse and add products with real-time search and filters
- **Step 4:** Review totals, add notes, and save

### Product Catalog
- Grid and list view modes
- Search by item code or description
- Filter by collection and category
- Pagination for large product sets
- Real-time filtering

### PDF Generation
- Professional quote PDFs
- Company branding and info
- Itemized product list
- Tax calculations
- Customer information

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support & Contributing

For questions, issues, or contributions:
1. Open an issue in the repository
2. Submit a pull request with improvements
3. Contact the development team

---

**Built with ❤️ for cabinet installers everywhere**

*Last updated: January 2026*
