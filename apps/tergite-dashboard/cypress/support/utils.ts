import { DateTime } from "luxon";
import { AppToken, ExtendedAppToken, Project } from "../../types";

/**
 * Converts an AppToken instance to an ExtendedAppToken instance
 *
 * It computes the computed properties
 *
 * @param token - the AppToken instance
 * @param project - the project it is attached the app token is attached to
 */
export function extendAppToken(
  token: AppToken,
  project: Project
): ExtendedAppToken {
  const expires_at = DateTime.fromISO(token.created_at).plus({
    seconds: token.lifespan_seconds,
  });
  const is_expired = DateTime.now() > expires_at;
  const project_name = project.name;

  return { ...token, expires_at, is_expired, project_name };
}
