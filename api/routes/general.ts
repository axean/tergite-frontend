import { Router } from "express";
import cors from "cors";
import {
  createCookieHeader,
  getAuthenticatedUserId,
  getQueryString,
  mockDb,
  respond401,
  use,
} from "../utils";
import {
  AuthProvider,
  Device,
  DeviceCalibration,
  Job,
  AuthProviderResponse,
  Project,
  User,
  AppToken,
  AppTokenCreationResponse,
} from "../../types";
import { randomUUID } from "crypto";

const apiBaseUrl = process.env.VITE_API_BASE_URL;
const router = Router();

router.use(
  cors({
    origin: true,
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "HEAD"],
    credentials: true,
  })
);

router.options("*", (req, res, next) => {
  next();
});

router.get(
  "/me/projects",
  use(async (req, res) => {
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

router.get(
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

router.post(
  "/me/tokens",
  use(async (req, res) => {
    const user_id = await getAuthenticatedUserId(req.cookies);
    if (!user_id) {
      return respond401(res);
    }

    const payload = { ...req.body, userId: user_id };
    const project = mockDb.getOne<Project>(
      "projects",
      (v) =>
        v.ext_id == (payload as AppToken).project_ext_id &&
        v.user_ids.includes(user_id)
    );
    if (!project) {
      return respond401(res);
    }

    const access_token = randomUUID();
    payload["access_token"] = access_token;

    mockDb.create<AppToken>("tokens", payload);
    res.status(201);
    res.json({
      access_token,
      token_type: "bearer",
    } as AppTokenCreationResponse);
  })
);

router.get(
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

router.get(
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

router.get(
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

router.get(
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

router.get(
  "/auth/providers",
  use(async (req, res) => {
    const { domain } = req.query;
    const data = mockDb.getOne<AuthProvider>(
      "auth_providers",
      (v) => v.email_domain === domain
    );

    if (!data) {
      res.status(404).json({ detail: `not found` });
      return;
    }

    const queryString = getQueryString(req.query);
    res.json({
      url: `${apiBaseUrl}/auth/router/${data.name}/authorize${queryString}`,
      name: data.name,
    } as AuthProviderResponse);
  })
);

router.get(
  "/auth/router/:provider/authorize",
  use(async (req, res) => {
    const queryString = getQueryString(req.query);
    return res.redirect(`${apiBaseUrl}/oauth/callback${queryString}`);
  })
);

router.post(
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
router.get("/refreshed-db", (req, res) => {
  mockDb.refresh();
  res.json(mockDb);
});

router.get("/", (req, res) => {
  res.json({ message: "hello world" });
});

export default router;
