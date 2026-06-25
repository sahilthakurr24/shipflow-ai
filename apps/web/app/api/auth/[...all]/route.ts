import { auth } from "@repo/auth";
import { toNextJsHandler } from "@repo/auth";

export const { POST, GET } = toNextJsHandler(auth);
