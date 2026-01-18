# Cabinet Quoting Tool

A modern web application for cabinet installers to create professional quotes on-site. Built with React, Node.js, TypeScript, and PostgreSQL.

## 🚀 Features

**Phase 1 - Complete ✅**
- ✅ User authentication (JWT-based)
- ✅ Database schema with Prisma ORM
- ✅ REST API for all entities
- ✅ React frontend with Tailwind CSS
- ✅ Product catalog support (1,044 SKUs across 5 collections)
- ✅ Customer management
- ✅ Quote management system

**Phase 2 - Coming Soon**
- 🔄 Quote creation workflow
- 🔄 Product catalog UI
- 🔄 PDF generation

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Docker (optional, for easier database setup)

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form
- Zustand (state management)
- React Query (data fetching)
- Axios

**Backend:**
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcryptjs

## 📦 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd cabinet-quoting-tool
```

### 2. Start PostgreSQL database

**Option A: Using Docker (Recommended)**

```bash
docker-compose up -d
```

**Option B: Use existing PostgreSQL**

Make sure PostgreSQL is running and update the `DATABASE_URL` in `backend/.env`

### 3. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Set up the database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with default users and settings
npm run seed
```

### 5. Import product data

Save the product JSON data to `backend/src/data/products.json`, then run:

```bash
cd backend
npx tsx src/scripts/import-products.ts
```

## 🚀 Running the Application

### Development Mode

**Option 1: Run both frontend and backend together (from root)**

```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔑 Default Credentials

After running the seed script, you can login with:

**Admin Account:**
- Email: `admin@cabinetquoting.com`
- Password: `admin123`

**Installer Account:**
- Email: `installer@cabinetquoting.com`
- Password: `installer123`

## 📁 Project Structure

```
cabinet-quoting-tool/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── middleware/            # Express middleware
│   │   ├── routes/                # API routes
│   │   ├── scripts/               # Database scripts
│   │   ├── utils/                 # Utility functions
│   │   └── index.ts               # Express server
│   ├── .env                       # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API services
│   │   ├── stores/                # Zustand stores
│   │   ├── types/                 # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - System users (installers/admins)
- **collections** - Cabinet collections (Essential & Charm, etc.)
- **styles** - Cabinet styles within collections
- **products** - Cabinet products/SKUs
- **customers** - Customer information
- **quotes** - Quote headers
- **quote_items** - Individual items in quotes
- **settings** - System settings

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Collections
- `GET /api/collections` - List all collections
- `GET /api/collections/:id` - Get single collection
- `POST /api/collections` - Create collection (admin)
- `PUT /api/collections/:id` - Update collection (admin)
- `DELETE /api/collections/:id` - Delete collection (admin)

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories/:collectionId` - Get categories
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer (admin)

### Quotes
- `GET /api/quotes` - List quotes (with filters)
- `GET /api/quotes/:id` - Get single quote
- `POST /api/quotes` - Create quote
- `PUT /api/quotes/:id` - Update quote
- `PATCH /api/quotes/:id/status` - Update quote status
- `POST /api/quotes/:id/duplicate` - Duplicate quote
- `DELETE /api/quotes/:id` - Delete quote (admin)

### Quote Items
- `POST /api/quotes/:quoteId/items` - Add item to quote
- `PUT /api/quotes/:quoteId/items/:itemId` - Update quote item
- `DELETE /api/quotes/:quoteId/items/:itemId` - Remove quote item

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update setting (admin)

### Users
- `GET /api/users` - List users (admin)
- `GET /api/users/:id` - Get single user (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

## 🔧 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cabinet_quoting?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

## 🧪 Testing the API

You can test the API using tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

Example login request:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cabinetquoting.com","password":"admin123"}'
```

## 🐛 Troubleshooting

### Database connection issues

1. Make sure PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Check database credentials in `backend/.env`

3. Reset database:
   ```bash
   cd backend
   npm run prisma:migrate -- reset
   npm run seed
   ```

### Port already in use

If port 3001 or 5173 is already in use:

1. Change the port in `backend/.env` (PORT)
2. Change the port in `frontend/vite.config.ts`

### Prisma client errors

Regenerate Prisma client:

```bash
cd backend
npm run prisma:generate
```

## 📝 Development Workflow

1. **Create a new feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   - Backend: http://localhost:3001
   - Frontend: http://localhost:5173

3. **Commit and push**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

## 🚀 Deployment

### Backend Deployment

1. Set environment variables
2. Run database migrations
3. Build TypeScript
4. Start server

```bash
cd backend
npm run build
npm start
```

### Frontend Deployment

```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

## 📚 Product Data Structure

The system supports 5 cabinet collections:

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

Each product has:
- Item Code (e.g., W1212GD)
- Description with dimensions
- Category
- MSRP
- Your Price (typically 40% of MSRP)

## 🎯 Next Steps (Phase 2)

- [ ] Implement quote creation workflow
- [ ] Build product selection UI with filters
- [ ] Add PDF quote generation
- [ ] Implement customer search and autocomplete
- [ ] Add room-by-room organization
- [ ] Mobile responsive improvements

## 📄 License

MIT

## 👥 Support

For questions or issues, please contact the development team.

---

**Built with ❤️ for cabinet installers**
