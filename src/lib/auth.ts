import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: { 
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || "secret-key-change-in-production",
});