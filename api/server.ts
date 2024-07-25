/**
 * A mock server to use when running tests
 *
 * I am tired of libraries that work only upto some point, then start failing.
 */

import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import {
  mockDb,
  createCookieHeader,
  use,
  getAuthenticatedUserId,
  respond401,
  getQueryString,
} from "./utils";
import {
  Project,
  Job,
  Device,
  DeviceCalibration,
  AuthProvider,
  User,
} from "../types";

const apiBaseUrl = process.env.VITE_API_BASE_URL;
const userIdCookieName = process.env.USER_ID_COOKIE_NAME ?? "userId";

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  cors({
    origin: true,
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "HEAD"],
    credentials: true,
  })
);

app.options("*", (req, res, next) => {
  next();
});

app.get(
  "/me/projects",
  use(async (req, res, next) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const myProjects = mockDb.getMany<Project>("projects", (v) =>
      v.user_ids.includes(currentUserId)
    );

    res.json(myProjects);
  })
);

app.get(
  "/me/jobs",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const myJobs = mockDb.getMany<Job>(
      "jobs",
      (v) => v.user_id === currentUserId
    );

    res.json(myJobs);
  })
);

app.get(
  "/devices",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const deviceList = mockDb.getMany<Device>("devices");
    res.json(deviceList);
  })
);

app.get(
  "/devices/:name",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const { params } = req;
    const data = mockDb.getOne<Device>(
      "devices",
      (v) => v.name === params.name
    );

    data
      ? res.json(data)
      : res.status(404).json({ detail: `device '${params.name}' not found` });
  })
);

app.get(
  "/calibrations",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const calibrationList = mockDb.getMany<DeviceCalibration>("calibrations");
    res.json(calibrationList);
  })
);

app.get(
  "/calibrations/:name",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const { params } = req;
    const data = mockDb.getOne<DeviceCalibration>(
      "calibrations",
      (v) => v.name === params.name
    );

    data
      ? res.json(data)
      : res
          .status(404)
          .json({ detail: `calibrations for  '${params.name}' not found` });
  })
);

app.get(
  "/auth/providers",
  use(async (req, res) => {
    const { domain } = req.query;
    const data = mockDb.getOne<AuthProvider>(
      "auth_providers",
      (v) => v.email_domain === domain
    );

    const queryString = getQueryString(req.query);
    return data
      ? res.redirect(
          `${apiBaseUrl}/auth/app/${data.name}/authorize${queryString}`
        )
      : respond401(res);
  })
);

app.get(
  "/auth/app/:provider/authorize",
  use(async (req, res) => {
    const queryString = getQueryString(req.query);
    res.json({
      authorization_url: `${apiBaseUrl}/oauth/callback${queryString}`,
    });
  })
);

// Dummy third party authenticator
app.get(
  "/oauth/callback",
  use(async (req, res) => {
    const { next: nextUrl } = req.query;

    const userId = req.cookies[userIdCookieName];
    const user = mockDb.getOne<User>("users", (v) => v.id === userId);

    if (user) {
      const cookieHeader = await createCookieHeader(user);
      res.set("Set-Cookie", cookieHeader);
      return res.redirect(nextUrl as string);
    }
    return respond401(res);
  })
);

app.get(
  "/auth/logout",
  use(async (req, res) => {
    const { next: nextUrl } = req.query;
    const userId = await getAuthenticatedUserId(req.cookies);
    const user = mockDb.getOne<User>("users", (v) => v.id === userId);

    if (user) {
      const staleCookieHeader = await createCookieHeader(user, -7_200_000);

      res.set("Set-Cookie", staleCookieHeader);
      return res.redirect(nextUrl as string);
    }
    return res.redirect(nextUrl as string);
  })
);

// NOTE: this mutates the database. I am using GET to avoid CORS issues
app.get("/refreshed-db", (req, res) => {
  mockDb.refresh();
  res.json(mockDb);
});

app.get("/", (req, res) => {
  res.json({ message: "hello world" });
});

app.listen(8002, "0.0.0.0", () => {
  console.log("api running on port 8002");
});
