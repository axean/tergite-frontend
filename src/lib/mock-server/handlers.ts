import { http, HttpResponse } from "msw";
import { createCookieHeader, mockDb, verifyJwtToken } from "./utils";
import {
  AuthProvider,
  Device,
  DeviceCalibration,
  Job,
  Oauth2RedirectResponse,
  Project,
  User,
} from "../types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const cookieName = import.meta.env.VITE_COOKIE_NAME;

const respond401 = () =>
  HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });

const respond404 = (detail: string) =>
  HttpResponse.json({ detail }, { status: 404 });

export const handlers = [
  http.get(`${apiBaseUrl}/devices`, async ({ cookies }) => {
    if (await getAuthenticatedUserId(cookies)) {
      const deviceList = mockDb.getMany("devices");
      return HttpResponse.json(deviceList);
    }
    return respond401();
  }),

  http.get(`${apiBaseUrl}/devices/:name`, async ({ params, cookies }) => {
    if (await getAuthenticatedUserId(cookies)) {
      const data = mockDb.getOne<Device>(
        "devices",
        (v) => v.name === params.name
      );
      return data
        ? HttpResponse.json(data)
        : respond404(`device '${params.name}' not found`);
    }
    return respond401();
  }),

  http.get(`${apiBaseUrl}/calibrations`, async ({ cookies }) => {
    if (await getAuthenticatedUserId(cookies)) {
      const calibrationList = mockDb.getMany("calibrations");
      return HttpResponse.json(calibrationList);
    }
    return respond401();
  }),

  http.get(`${apiBaseUrl}/calibrations/:name`, async ({ params, cookies }) => {
    if (await getAuthenticatedUserId(cookies)) {
      const data = mockDb.getOne<DeviceCalibration>(
        "calibrations",
        (v) => v.name === params.name
      );
      return data
        ? HttpResponse.json(data)
        : respond404(`calibrations for '${params.name}' not found`);
    }
    return respond401();
  }),

  http.get(`${apiBaseUrl}/me/projects`, async ({ cookies }) => {
    const currentUserId = await getAuthenticatedUserId(cookies);
    if (currentUserId) {
      const user = mockDb.getOne<User>("users", (v) => v.id === currentUserId);
      if (user === undefined) {
        return HttpResponse.json({ detail: `Forbidden` }, { status: 403 });
      }
      const myProjects = mockDb.getMany<Project>("projects", (v) =>
        v.user_emails.includes(user.email)
      );

      return HttpResponse.json(myProjects);
    }
    return respond401();
  }),

  http.get(`${apiBaseUrl}/me/jobs`, async ({ cookies }) => {
    const currentUserId = await getAuthenticatedUserId(cookies);
    if (currentUserId) {
      const myJobs = mockDb.getMany<Job>(
        "jobs",
        (v) => v.user_id === currentUserId
      );

      return HttpResponse.json(myJobs);
    }
    return respond401();
  }),

  http.get(`${apiBaseUrl}/auth/providers`, async ({ request }) => {
    const url = new URL(request.url);
    const { searchParams, search } = url;
    const domain = searchParams.get("domain");
    const data = mockDb.getOne<AuthProvider>(
      "auth_providers",
      (v) => v.email_domain === domain
    );
    if (!data) {
      return respond401();
    }

    const authUrl = `${apiBaseUrl}/auth/app/${data.name}/authorize${search}`;
    return HttpResponse.redirect(authUrl);
  }),

  http.get(
    `${apiBaseUrl}/auth/app/:provider/authorize`,
    async ({ request }) => {
      const url = new URL(request.url);
      const { search } = url;
      return HttpResponse.json({
        authorization_url: `${apiBaseUrl}/oauth/callback${search}`,
      } as Oauth2RedirectResponse);
    }
  ),

  // Dummy third party authenticator
  http.get(`${apiBaseUrl}/oauth/callback`, async ({ request }) => {
    const url = new URL(request.url);
    const nextUrl = url.searchParams.get("next") as string;
    const email = url.searchParams.get("email") as string;
    const user = mockDb.getOne<User>("users", (v) => v.email === email);
    if (user) {
      const cookieHeader = await createCookieHeader(user);

      return new HttpResponse(null, {
        headers: {
          "Set-Cookie": cookieHeader,
          Location: nextUrl,
        },
        status: 302,
      });
    }
    return respond401();
  }),

  http.get(`${apiBaseUrl}/auth/logout`, async ({ request, cookies }) => {
    const url = new URL(request.url);
    const nextUrl = url.searchParams.get("next") as string;
    const currentUserId = await getAuthenticatedUserId(cookies);
    const user = mockDb.getOne<User>("users", (v) => v.id === currentUserId);
    if (user) {
      const staleCookieHeader = await createCookieHeader(user, -7_200_000);

      return new HttpResponse(null, {
        headers: {
          "Set-Cookie": staleCookieHeader,
          Location: nextUrl,
        },
        status: 302,
      });
    }
    return HttpResponse.redirect(nextUrl);
  }),
];

/**
 * Checks whether the user is authenticated
 *
 * @param cookies - the cookies to authenticate with
 */
async function getAuthenticatedUserId(
  cookies: Record<string, string>
): Promise<string | undefined> {
  const accessToken = cookies[cookieName];
  console.log({ accessToken });
  try {
    const { payload } = await verifyJwtToken(accessToken);
    return payload.sub;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
