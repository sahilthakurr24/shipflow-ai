import { db, eq } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { env } from "../env";
import { googleOAuth2Client } from "../clients/google-oauth";
import {
  GetAuthenticationMethodOutputSchema,
  updateUserInput,
  UpdateUserInputType,
  userEmailInput,
  UserEmailInputType,
  userIdInput,
  UserIdInputType,
} from "./model";

class UserService {
  public async getAuthenticationMethods(): Promise<
    ReadonlyArray<GetAuthenticationMethodOutputSchema>
  > {
    const supportedAuthenticationProviders: GetAuthenticationMethodOutputSchema[] = [];

    const isGoogleConfigured = !!(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);

    if (isGoogleConfigured) {
      const url = googleOAuth2Client.generateAuthUrl();
      supportedAuthenticationProviders.push({
        provider: "GOOGLE_OAUTH",
        displayName: "Google",
        displayText: "Signin with Google",
        authUrl: url,
      });
    }

    return supportedAuthenticationProviders;
  }

  public async getUserById(payload: UserIdInputType) {
    const { id } = await userIdInput.parseAsync(payload);

    const [result] = await db.select().from(usersTable).where(eq(usersTable.id, id));

    return { user: result };
  }

  public async getUserByEmail(payload: UserEmailInputType) {
    const { email } = await userEmailInput.parseAsync(payload);

    const [result] = await db.select().from(usersTable).where(eq(usersTable.email, email));

    return { user: result };
  }

  public async updateUser(payload: UpdateUserInputType) {
    const { id, fullName, profileImageUrl } = await updateUserInput.parseAsync(payload);

    const [result] = await db
      .update(usersTable)
      .set({ fullName, profileImageUrl })
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id });

    return { id: result?.id };
  }

  public async deleteUser(payload: UserIdInputType) {
    const { id } = await userIdInput.parseAsync(payload);

    await db.delete(usersTable).where(eq(usersTable.id, id));
  }
}

export default UserService;
