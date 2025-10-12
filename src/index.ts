import dotenv from "dotenv";

// Load environment variables (only load .env in development, not in Replit deployments)
if (!process.env.REPLIT_DEPLOYMENT) {
  dotenv.config();
}
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
import employeeRoutes from "./routes/employeeRoutes";
import lenderRoutes from "./routes/lenderRoutes";
import loanConnectionRoutes from "./routes/loanConnectionRoutes";
import loanProductRoutes from "./routes/loanProductRoutes";
import universalTermSheetRoutes from "./routes/universalTermSheetRoutes";
import openaiTestRoutes from "./routes/openaiTestRoutes";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://mortgage-broker-app.vercel.app",
      "https://www.themortgageplatform.com",
      "https://themortgageplatform.com",
      "https://api.themortgageplatform.com",
    ],
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
app.use("/api/v1/employee", employeeRoutes);
app.use("/api/v1/lender", lenderRoutes);
app.use("/api/v1/loan-connections", loanConnectionRoutes);
app.use("/api/v1/loan-products", loanProductRoutes);
app.use("/api/v1/universal-term-sheets", universalTermSheetRoutes);
app.use("/api/v1/openai-test", openaiTestRoutes);


app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
  console.log(`
🚀 Server ready at: http://localhost:${PORT}
🔐 Google OAuth enabled
🌐 CORS enabled for localhost:3000
⭐️ Auth endpoints: /api/v1/auth/google, /api/v1/auth/google/callback, /api/v1/auth/logout, /api/v1/auth/me`)
);
