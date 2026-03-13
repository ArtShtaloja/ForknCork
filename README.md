# Fork n Cork - Fast Food Restaurant Website

A complete full-stack web application for **Fork n Cork**, a fast food restaurant located in Gjakovë, Kosovo.

## Tech Stack

- **Backend:** Node.js, Express.js, mysql2/promise
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Database:** MySQL
- **Security:** bcrypt, helmet, express-validator, prepared SQL statements

## Architecture

The backend follows a clean layered architecture:

```
Routes → Controllers → Services → Repositories → Database
```

- **Routes** – map endpoints to controllers
- **Controllers** – handle HTTP req/res, delegate to services
- **Services** – contain business logic
- **Repositories** – contain all SQL queries (no ORM)

## Prerequisites

- Node.js (v18+)
- MySQL (v8+)
- npm

## Setup & Installation

### 1. Clone and install dependencies

```bash
cd Forkncork
npm install
```

### 2. Create the database

Import the SQL dump into MySQL:

```bash
mysql -u root -p < fork_n_cork.sql
```

This creates the `fork_n_cork` database with all tables and seed data.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fork_n_cork
JWT_SECRET=supersecret
SESSION_SECRET=anothersecret
```

### 4. Start the server

```bash
npm start
```

Or with auto-reload for development:

```bash
npm run dev
```

The app will be available at **http://localhost:5000**

## Default Admin Login

- **Email:** admin@forkncork.com
- **Password:** admin123

Access the admin panel at: http://localhost:5000/admin

## Pages

| URL | Description |
|-----|-------------|
| `/` | Homepage with featured products |
| `/menu` | Full menu with category filters |
| `/menu/product?id=1` | Product detail page |
| `/contact` | Contact form |
| `/admin` | Admin login |
| `/admin/dashboard` | Admin dashboard |

## API Endpoints

### Auth
- `POST /api/auth/login` – Admin login
- `POST /api/auth/logout` – Admin logout
- `GET /api/auth/profile` – Get admin profile (auth required)

### Categories
- `GET /api/categories` – List all categories
- `GET /api/categories/:id` – Get category by ID
- `POST /api/categories` – Create category (auth required)
- `PUT /api/categories/:id` – Update category (auth required)
- `DELETE /api/categories/:id` – Delete category (auth required)

### Products
- `GET /api/products` – List products (supports `?category_id=`, `?page=`, `?limit=`)
- `GET /api/products/featured` – Get featured products
- `GET /api/products/:id` – Get product by ID
- `POST /api/products` – Create product with image (auth required)
- `PUT /api/products/:id` – Update product (auth required)
- `DELETE /api/products/:id` – Delete product (auth required)

### Orders
- `POST /api/orders` – Place a new order (public)
- `GET /api/orders` – List all orders (auth required)
- `GET /api/orders/stats` – Order statistics (auth required)
- `GET /api/orders/:id` – Get order details (auth required)
- `PUT /api/orders/:id/status` – Update order status (auth required)

### Contact
- `POST /api/contact` – Submit contact message (public)
- `GET /api/contact` – List messages (auth required)
- `GET /api/contact/unread/count` – Count unread (auth required)
- `PUT /api/contact/:id/read` – Mark as read (auth required)
- `DELETE /api/contact/:id` – Delete message (auth required)

### Admin
- `GET /api/admin/dashboard` – Dashboard stats (auth required)
- `GET /api/admin/settings` – Get restaurant settings (auth required)
- `PUT /api/admin/settings/:key` – Update a setting (auth required)
- `GET /api/admin/opening-hours` – Get opening hours (auth required)
- `PUT /api/admin/opening-hours/:id` – Update opening hours (auth required)

## Project Structure

```
├── src/
│   ├── config/db.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   └── utils/
├── public/
│   ├── css/style.css
│   ├── js/
│   └── images/
├── views/
│   ├── home/
│   ├── menu/
│   ├── contact/
│   └── admin/
├── uploads/
├── server.js
├── fork_n_cork.sql
├── .env.example
└── package.json
```

## Order Statuses

`pending` → `confirmed` → `preparing` → `ready` → `completed`

Orders can also be `cancelled` at any stage.

## Restaurant Info

- **Location:** Yll Morina pn, Gjakovë 50000
- **Phones:** +383 44 168 776 / +383 45 660 127
- **Hours:** Monday–Sunday, 08:00–24:00
- **Features:** Dine-in, Drive-through
