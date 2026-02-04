# Advertly Backend

Základní backend pro Advertly aplikaci s MongoDB a JWT autentizací.

## Instalace

```bash
npm install
```

## Nastavení

1. Otevřete `.env` soubor
2. Nahraďte `<db_password>` vaším MongoDB heslem
3. Nastavte `JWT_SECRET` na bezpečný klíč

```env
MONGODB_URI=mongodb+srv://growthspect_db_user:<db_password>@databaze.0aetpgs.mongodb.net/?appName=Databaze
JWT_SECRET=your_secret_key
```

## Spuštění

```bash
npm run dev
```

Server poběží na `http://localhost:5000`

## API Endpoints

### Autentizace

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Jméno Příjmení",
  "email": "user@example.com",
  "password": "heslo123"
}

Response:
{
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "fullName": "Jméno Příjmení",
    "email": "user@example.com"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "heslo123"
}

Response:
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "fullName": "Jméno Příjmení",
    "email": "user@example.com"
  }
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "user": {
    "id": "user_id",
    "fullName": "Jméno Příjmení",
    "email": "user@example.com"
  }
}
```

### Health Check
```
GET /api/health

Response:
{
  "message": "Server is running"
}
```

## Struktura

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   └── authController.js  # Auth logic
├── middleware/
│   └── auth.js            # JWT middleware
├── models/
│   └── User.js            # User schema
├── routes/
│   └── auth.js            # Auth routes
├── server.js              # Main server file
├── .env                   # Environment variables
└── package.json
```

## Frontend Integration

V AppContext.tsx aktualizujte API calls:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';

// Login
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Register
const response = await fetch(`${API_BASE_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullName, email, password })
});
```

## Poznámky

- Hesla jsou hashována pomocí bcryptjs
- JWT tokeny vyprší za 7 dní
- CORS je nakonfigurován pro localhost
