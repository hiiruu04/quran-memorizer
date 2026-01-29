import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "@/db/index"
import * as schema from "@/db/schema"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ url }: { url: string }) => {
      console.log("Password reset link:", url)
    },
    sendVerificationEmail: async ({ url }: { url: string }) => {
      console.log("Verification link:", url)
    },
  },
  socialLogin: {
    enabled: true,
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/callback/google",
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        redirectUri: process.env.GITHUB_REDIRECT_URI || "http://localhost:3000/auth/callback/github",
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    cookiePrefix: "better-auth",
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  plugins: [tanstackStartCookies()],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
