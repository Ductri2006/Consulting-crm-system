import type { SafeUser } from "../utils/sanitizeUser";
import type { PortalSession } from "../modules/customerPortal/customerPortal.types";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      customerPortal?: PortalSession;
    }
  }
}

export {};
