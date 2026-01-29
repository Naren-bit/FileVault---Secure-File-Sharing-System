# FileVault - A Secure File Sharing System (SFS)

A production-ready, enterprise-grade secure file sharing platform built for a university laboratory evaluation. Implements comprehensive security features including NIST SP 800-63-2 compliant authentication, AES-256-GCM encryption, and role-based access control.

![Security Features](https://img.shields.io/badge/Encryption-AES--256--GCM-blue)
![MFA](https://img.shields.io/badge/MFA-TOTP%2FGoogle%20Auth-green)
![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20httpOnly-orange)

## 🔐 Security Features

### 1. Authentication (NIST SP 800-63-2 Compliant)
- **Multi-Factor Authentication**: Password + TOTP (Google Authenticator)
- **Password Hashing**: bcrypt with work factor 12
- **Account Lockout**: 5 failed attempts = 2-hour lockout
- **Secure Sessions**: httpOnly cookies with SameSite=Strict

### 2. Authorization (Access Control List)
| Role | System Logs | Encrypted Vault | Public Repository |
|------|-------------|-----------------|-------------------|
| Admin | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| Premium | ❌ | ✅ Own files | ✅ Read |
| Guest | ❌ | ❌ | ✅ Read + Download |

### 3. Encryption (AES-256-GCM)
- **Algorithm**: AES-256-GCM (AEAD - authenticated encryption)
- **Key Derivation**: PBKDF2-SHA256 with 100,000 iterations
- **Key Exchange**: Per-file encryption keys wrapped with user's master key

### 4. Integrity (SHA-256 Digital Signatures)
- File hash computed before encryption
- Hash verified on every download
- Integrity status displayed in UI ("✅ Integrity Check: PASSED")

### 5. QR Code Sharing
- Generate QR codes for secure file sharing
- Time-limited share links
- Encoded download URLs

## 📁 Project Structure

```
SFS/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Login, Register, MFA
│   │   ├── fileController.js        # Upload, Encrypt, Download
│   │   └── adminController.js       # Stats, Logs, User management
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   └── aclMiddleware.js         # Role-based ACL
│   ├── models/
│   │   ├── User.js                  # User schema with MFA
│   │   ├── File.js                  # File metadata + signature
│   │   └── AuditLog.js              # System audit logs
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── fileRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   ├── encryption.js            # AES-256-GCM functions
│   │   ├── keyDerivation.js         # PBKDF2 key management
│   │   └── qrGenerator.js           # QR code generation
│   ├── uploads/                     # Encrypted file storage
│   ├── server.js                    # Main Express server
│   └── .env                         # Environment variables
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Auth/                # Login, Register, MFA
    │   │   ├── Dashboard/           # Admin & User dashboards
    │   │   ├── Files/               # Vault, Public repo
    │   │   ├── Admin/               # Audit logs, User mgmt
    │   │   └── Layout/              # Sidebar, MainLayout
    │   ├── context/
    │   │   └── AuthContext.jsx      # Auth state management
    │   ├── services/
    │   │   └── api.js               # API client
    │   └── App.jsx                  # Routes & providers
    └── index.html
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Google Authenticator app

### Backend Setup
```bash
cd backend
npm install
# Configure .env file
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables (.env)
```env
MONGODB_URI=mongodb://localhost:27017/secure-file-sharing
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1d
PORT=5000
FRONTEND_URL=http://localhost:5173
```

## 📝 License

This project is for educational purposes (university laboratory evaluation).
