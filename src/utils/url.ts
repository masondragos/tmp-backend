export const getUrls = () => {
  const stage = process.env.STAGE;

  if (!stage) {
    throw new Error("STAGE is not set");
  }

  const callbackURL =
    stage === "dev"
      ? "http://localhost:4000/api/v1/auth/google/callback"
      : stage === "production"
      ? "https://api.themortgageplatform.com/api/v1/auth/google/callback"
      : "https://mortgage-broker-apis-eta.vercel.app/api/v1/auth/google/callback";

  const frontendURL =
    stage === "dev"
      ? "http://localhost:3000"
      : stage === "production"
      ? "https://themortgageplatform.com"
      : "https://mortgage-broker-app.vercel.app/";

  return { callbackURL, frontendURL };
};
