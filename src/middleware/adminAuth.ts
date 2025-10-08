import { Request, Response, NextFunction } from "express";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    next();
  } catch (error) {
    console.error("Error checking admin role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requireEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    } else {
      if ((user as any).role === "admin" || (user as any).role === "employee") {
        next();
      } else {
        return res
          .status(403)
          .json({ error: "Access denied. Employee role required." });
      }
    }
  } catch (error) {
    console.error("Error checking admin role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
