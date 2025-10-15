import dotenv from "dotenv";

// Load environment variables (only load .env in development, not in Replit deployments)
if (!process.env.REPLIT_DEPLOYMENT) {
  dotenv.config();
}
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
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

// Import controllers
import { parsePDF } from "./controllers/pdfParserController";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB limit
});

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
  }),
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
  }),
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
app.use("/api/v1/term-sheets", universalTermSheetRoutes);
app.use("/api/v1/openai-test", openaiTestRoutes);



// PDF parsing route with multer middleware
app.post("/api/v1/parse-pdf", upload.single('file'), parsePDF);

app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0'; // Bind to all interfaces for Replit deployments

const server = app.listen(PORT, HOST, () =>
  console.log(`
🚀 Server ready at: http://${HOST}:${PORT}
🔐 Google OAuth enabled
🌐 CORS enabled for localhost:3000
⭐️ Auth endpoints: /api/v1/auth/google, /api/v1/auth/google/callback, /api/v1/auth/logout, /api/v1/auth/me`),
);
