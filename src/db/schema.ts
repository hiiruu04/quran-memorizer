import { pgTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/pg-core"

// User table with Better Auth schema
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: varchar("image", { length: 255 }),
  username: varchar("username", { length: 255 }).unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// Session table for Better Auth
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 255 }),
  userAgent: varchar("userAgent", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => [index("session_userId_idx").on(table.userId)])

// Account table for OAuth providers
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  providerId: varchar("providerId", { length: 50 }).notNull(),
  accountId: varchar("accountId", { length: 255 }).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => [index("account_userId_idx").on(table.userId)])

// Verification table for email verification
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)])

// Progress tracking for Quran memorization (not managed by Better Auth)
export const progress = pgTable("progress", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  surahNumber: varchar("surahNumber", { length: 10 }).notNull(),
  ayahNumber: varchar("ayahNumber", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'not_started', 'in_progress', 'memorized', 'revised'
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})
