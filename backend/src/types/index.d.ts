import "express";
import { UserRole } from "@prisma/client";

declare module "express" {
  export interface Request {
    user?: {
      userId: string;
      role: UserRole;
      email: string;
    };
  }
}