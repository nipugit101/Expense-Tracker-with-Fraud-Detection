
# 💰 Expense Tracker with Fraud Detection

A full-featured **Expense Tracker** built with **Node.js, Express, MongoDB, and Mongoose** that helps users manage their finances while keeping them safe with **fraud detection alerts** and **email notifications**.

## ✨ Features

* 🔐 **User Authentication & Profiles**

  * JWT-based authentication
  * User registration, login, and profile management
  * Change password & deactivate account

* ⚙️ **User Preferences**

  * Set monthly spending limits
  * Configure category-based budgets
  * Enable/disable fraud alerts and email notifications

* 📊 **Transactions Management**

  * Add, update, delete, and list transactions
  * Categorize income and expenses
  * Dashboard with summaries

* 🚨 **Fraud Detection Engine**

  * High amount transaction detection
  * Category budget exceed alerts
  * Unusual spending patterns & times
  * Frequent transactions detection
  * Risk scoring system

* 📧 **Email Notifications (via Gmail SMTP)**

  * Email verification
  * Password reset
  * Fraud alerts
  * Monthly transaction summaries

* 👩‍💻 **Admin Panel**

  * List, search, and filter users
  * Activate/deactivate accounts
  * Review fraud alerts

---

## 🛠️ Tech Stack

* **Backend**: Node.js, Express.js
* **Database**: MongoDB + Mongoose
* **Auth**: JWT (JSON Web Tokens)
* **Email**: Nodemailer (Gmail SMTP with App Passwords)
* **Fraud Detection**: Custom rules engine + alerts

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```ini
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=your-mongodb-uri

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# OpenAI (optional, if used for insights/reports)
OPENAI_API_KEY=your-openai-api-key
```

⚠️ **Never commit `.env`** to version control.

### 4. Run the server

```bash
npm run dev   # with nodemon
# or
npm start
```

Server should be running at 👉 [http://localhost:5000](http://localhost:5000)

---

## 📂 Project Structure

```
.
├── models/              # Mongoose models (User, Transaction, FraudAlert)
├── routes/              # Express route handlers
├── middleware/          # Auth & error handling
├── utils/               # Email + Fraud Detection logic
├── config/              # DB & server configuration
├── .env.example         # Environment template
├── server.js            # App entry point
└── README.md
```

---

## 🚨 Fraud Detection Rules

* **High Amount Rule**: Flags expenses much higher than usual monthly spending.
* **Category Limit Rule**: Warns when category budgets (e.g., Food, Travel) are exceeded.
* **Frequent Transactions Rule**: Detects unusually high activity within short time frames.
* **Unusual Time Rule**: Flags transactions at odd hours (e.g., night).

Each alert is stored in MongoDB and can be reviewed by users/admins.

---

## 📧 Email Examples

* ✅ Verify email on signup
* 🔑 Reset password
* 🚨 Fraud alerts with severity levels
* 📊 Monthly spending summary

---

## 🛡️ Security Best Practices

* Keep `.env` **secret** and out of version control.
* Always rotate compromised API keys or credentials.
* Use Gmail **App Passwords** (not your main password).
* Change `JWT_SECRET` before production.

---

## 📜 License

MIT License © 2025 \[Nipu Matabbar]

---


