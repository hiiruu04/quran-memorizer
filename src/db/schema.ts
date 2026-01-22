import { pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core"
import { id } from "drizzle-orm/pg-core"

// User table with Better Auth schema
export const user = pgTable("user", {
  id: varchar("id", { length: 32 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  name: varchar("name", { length: 255 }),
  username: varchar("username", { length: 255 }).unique(),
  image: varchar("image", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// Session table for Better Auth
export const session = pgTable("session", {
  id: varchar("id", { length: 32 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("userId", { length: 32 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 255 }),
  userAgent: varchar("userAgent", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// Account table for OAuth providers
export const account = pgTable("account", {
  id: varchar("id", { length: 32 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("userId", { length: 32 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  providerId: varchar("providerId", { length: 50 }).notNull(),
  accountId: varchar("accountId", { length: 255 }).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// Verification table for email verification
export const verification = pgTable("verification", {
  id: varchar("id", { length: 32 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Progress tracking for Quran memorization
export const progress = pgTable("progress", {
  id: varchar("id", { length: 32 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("userId", { length: 32 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  surahNumber: varchar("surahNumber", { length: 10 }).notNull(),
  ayahNumber: varchar("ayahNumber", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'not_started', 'in_progress', 'memorized', 'revised'
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})
