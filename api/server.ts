/**
 * A mock server to use when running tests
 *
 * I am tired of libraries that work only upto some point, then start failing.
 */

import express, { ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import {
  mockDb,
  createCookieHeader,
  use,
  getAuthenticatedUserId,
  respond401,
  getQueryString,
  toHTTPError,
  NotFound,
} from "./utils";
import {
  Project,
  Job,
  Device,
  DeviceCalibration,
  AuthProvider,
  User,
} from "../types";
import path from "path";
import { fileURLToPath } from "url";
import logger from "morgan";

// "type": "module" in the package.json makes this an ES module, making it __filename
// and __dirname undefined, which they would be if this were a commonjs module
// Thanks to https://iamwebwiz.medium.com/how-to-fix-dirname-is-not-defined-in-es-module-scope-34d94a86694d
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiBaseUrl = process.env.VITE_API_BASE_URL;
const userIdCookieName = process.env.USER_ID_COOKIE_NAME ?? "userId";

const app = express();

app.use(logger("dev") as express.RequestHandler);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: true,
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "HEAD"],
    credentials: true,
  })
);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

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

// Dummy third party authenticator GET page
app.get(
  "/oauth/callback",
  use(async (req, res) => {
    const userId = req.cookies[userIdCookieName];
    if (!userId) {
      return res.render("oauth", {});
    }

    const user = mockDb.getOne<User>("users", (v) => v.id === userId);
    if (user) {
      const { next: nextUrl } = req.query;
      const cookieHeader = await createCookieHeader(user);
      res.set("Set-Cookie", cookieHeader);
      return res.redirect(nextUrl as string);
    }
    return respond401(res);
  })
);

// Dummy third party authenticator POST page
app.post(
  "/oauth/callback",
  use(async (req, res) => {
    const { email } = req.body;

    const user = mockDb.getOne<User>("users", (v) => v.email === email);
    if (user) {
      const { next: nextUrl } = req.query;
      const cookieHeader = await createCookieHeader(user);
      res.set("Set-Cookie", cookieHeader);
      return res.redirect(nextUrl as string);
    }
    return res.render("oauth", { emailError: "unknown email" });
  })
);

app.post(
  "/auth/logout",
  use(async (req, res) => {
    const userId = await getAuthenticatedUserId(req.cookies);
    const user = mockDb.getOne<User>("users", (v) => v.id === userId);

    if (user) {
      const staleCookieHeader = await createCookieHeader(user, -7_200_000);
      res.set("Set-Cookie", staleCookieHeader);
    }

    res.json({ message: "logged out" });
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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(NotFound());
});

// error handler
app.use(function (err, req, res, _next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  const error = toHTTPError(err);

  // render the error page
  res.status(error.status);
  res.json({ detail: error.message });
} as ErrorRequestHandler);

app.listen(8002, "0.0.0.0", () => {
  console.log("api running on port 8002");
});
