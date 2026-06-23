// Client-only entry point. Importing this must NOT pull in the server `auth`
// instance (which depends on the database / pg and cannot be bundled for the
// browser). Keep this file free of any `./auth` or `@repo/database` imports.
export { createAuthClient } from "better-auth/react";
