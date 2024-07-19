import { http, HttpResponse } from "msw";
import { mockDb, verifyJwtToken } from "./utils";
import { Device, DeviceCalibration, Job, Project, User } from "../types";

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
      if (data === undefined) {
        return respond404(`device '${params.name}' not found`);
      }
      return HttpResponse.json(data);
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
      if (data === undefined) {
        return respond404(`calibrations for '${params.name}' not found`);
      }
      return HttpResponse.json(data);
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
  try {
    const { payload } = await verifyJwtToken(accessToken);
    return payload.sub;
  } catch (error) {
    return undefined;
  }
}
