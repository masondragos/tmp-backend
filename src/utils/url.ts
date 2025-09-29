export const getUrls = () => {
  const stage = process.env.STAGE || "dev";
  const replitDomain = process.env.REPLIT_DEV_DOMAIN;

  // If running on Replit, use Replit domain
  const baseURL = replitDomain 
    ? `https://${replitDomain}`
    : stage === "production"
    ? "https://api.themortgageplatform.com"
    : "http://localhost:4000";

  const callbackURL =
    stage === "dev" && !replitDomain
      ? "http://localhost:4000/api/v1/auth/google/callback"
      : stage === "production"
      ? "https://api.themortgageplatform.com/api/v1/auth/google/callback"
      : replitDomain
      ? `https://${replitDomain}/api/v1/auth/google/callback`
      : "https://mortgage-broker-apis-eta.vercel.app/api/v1/auth/google/callback";

  const frontendURL =
    stage === "dev" && !replitDomain
      ? "http://localhost:3000"
      : stage === "production"
      ? "https://themortgageplatform.com"
      : replitDomain
      ? `https://${replitDomain}`
      : "https://mortgage-broker-app.vercel.app/";

  return { callbackURL, frontendURL };
};
