import UserService from "@repo/services/user";
import OrganizationService from "@repo/services/organization";
import MembershipService from "@repo/services/membership";

export const userService = new UserService();
export const organizationService = new OrganizationService();
export const membershipService = new MembershipService();
