import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import passport from "passport";

// Load environment variables
dotenv.config();
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getUrls } from "./utils/url";

const prisma = new PrismaClient();

// Initialize Google OAuth Strategy
export const initializeGoogleStrategy = () => {
  // Debug environment variables

  if (
    !process.env.GOOGLE_AUTH_CLIENT_ID ||
    !process.env.GOOGLE_AUTH_CLIENT_SECRET
  ) {
    throw new Error(
      "Google OAuth credentials are missing from environment variables"
    );
  }
  
  const { callbackURL } = getUrls();

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
        callbackURL: callbackURL,
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await prisma.user.findUnique({
            where: { google_id: profile.id },
          });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email but different Google ID
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.emails?.[0]?.value },
          });

          if (existingUser) {
            // Update existing user with Google ID
            user = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                google_id: profile.id,
                avatar: profile.photos?.[0]?.value,
              },
            });
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                google_id: profile.id,
                email: profile.emails?.[0]?.value!,
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value,
              },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );
};

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, undefined);
  }
});

export default passport;
