import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@repo/database";
import {
  usersTable,
  sessionsTable,
  accountsTable,
  verificationsTable,
} from "@repo/database/schema";
import { env } from "./env";


export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
      verification: verificationsTable,
    },
  }),
  // Let Postgres generate uuid primary keys (matches the rest of the schema).
  advanced: {
    database: {
      generateId: false,
    },
  },
  // Map BetterAuth's `name`/`image` fields onto the existing user columns.
  user: {
    fields: {
      name: "fullName",
      image: "profileImageUrl",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});
