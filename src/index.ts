import dotenv from "dotenv";

// Load environment variables
dotenv.config();
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./auth";
import { initializeGoogleStrategy } from "./auth";
import { getCookieOptions } from "./utils/cookies";

// Import routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import quoteRoutes from "./routes/quoteRoutes";

const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://mortgage-broker-app.vercel.app",
  "https://www.themortgageplatform.com",
  "https://themortgageplatform.com",
  "https://api.themortgageplatform.com",
];

// Add Replit domain if available
if (process.env.REPLIT_DEV_DOMAIN) {
  allowedOrigins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: getCookieOptions(),
  })
);

// Initialize Google OAuth Strategy
initializeGoogleStrategy();

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Use routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1/quotes", quoteRoutes);
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () =>
  console.log(`
🚀 Server ready at: http://${HOST}:${PORT}
🔐 Google OAuth ${process.env.GOOGLE_AUTH_CLIENT_ID ? 'enabled' : 'disabled (credentials missing)'}
🌐 CORS configured
⭐️ Auth endpoints: /api/v1/auth/google, /api/v1/auth/google/callback, /api/v1/auth/logout, /api/v1/auth/me`)
);
