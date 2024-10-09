import { Router } from "express";
import cors from "cors";
import {
  conformsToFilter,
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
  PaginatedData,
  QpuTimeExtensionUserRequest,
} from "../../types";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";

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
  "/me",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const data = mockDb.getOne<User>("users", (v) => v.id === currentUserId);

    res.json(data);
  })
);

router.get(
  "/me/projects",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const data = mockDb.getMany<Project>(
      "projects",
      (v) => v.user_ids.includes(currentUserId) && !v.is_deleted
    );

    res.json({ skip: 0, limit: null, data } as PaginatedData<Project[]>);
  })
);

router.delete(
  "/me/projects/:id",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const { params } = req;
    const project = mockDb.getOne<Project>("projects", (v) =>
      conformsToFilter(v, { admin_id: currentUserId, id: params.id })
    );
    if (project === undefined) {
      res.status(403).json({ detail: `Forbidden` });
      return;
    }

    mockDb.del("projects", project.id);

    // no content
    res.status(204).send();
  })
);

router.get(
  "/me/jobs",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const { project_id } = req.query as { [k: string]: string };
    const myJobs = mockDb.getMany<Job>("jobs", (v) =>
      conformsToFilter(v, { user_id: currentUserId, project_id })
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

    const payload = { ...req.body, user_id };
    const project = mockDb.getOne<Project>(
      "projects",
      (v) =>
        v.ext_id == (payload as AppToken).project_ext_id &&
        v.user_ids.includes(user_id) &&
        !v.is_deleted
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
  "/me/tokens",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const { project_ext_id } = req.query as { [k: string]: string };
    const data = mockDb.getMany<AppToken>("tokens", (v) =>
      conformsToFilter(v, { user_id: currentUserId, project_ext_id })
    );

    res.json({ skip: 0, limit: null, data } as PaginatedData<AppToken[]>);
  })
);

router.delete(
  "/me/tokens/:id",
  use(async (req, res) => {
    const currentUserId = await getAuthenticatedUserId(req.cookies);
    if (!currentUserId) {
      return respond401(res);
    }

    const { params } = req;
    const token = mockDb.getOne<AppToken>("tokens", (v) =>
      conformsToFilter(v, { user_id: currentUserId, id: params.id })
    );
    if (token === undefined) {
      res.status(403).json({ detail: `Forbidden` });
      return;
    }

    mockDb.del("tokens", token.id);

    // no content
    res.status(204).send();
  })
);

router.put(
  "/me/tokens/:id",
  use(async (req, res) => {
    const user_id = await getAuthenticatedUserId(req.cookies);
    if (!user_id) {
      return respond401(res);
    }

    const { body, params } = req;
    const filterFn = (v) => conformsToFilter(v, { user_id, id: params.id });
    const oldToken = mockDb.getOne<AppToken>("tokens", filterFn);
    if (!oldToken) {
      res.status(404).json({ detail: `Not Found` });
      return;
    }

    const lifespan_seconds = DateTime.fromISO(body.expires_at).diff(
      DateTime.fromISO(oldToken.created_at),
      "seconds"
    ).seconds;

    const token = mockDb.update<AppToken>("tokens", filterFn, {
      lifespan_seconds,
    });

    res.json(token);
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
    // FIXME: This should return multiple ways in case the same email domain can login in many ways
    const data = mockDb.getMany<AuthProvider>(
      "auth_providers",
      (v) => v.email_domain === domain
    );

    if (data.length === 0) {
      res.status(404).json({ detail: `not found` });
      return;
    }

    res.json(
      data.map(
        (item) =>
          ({
            url: `${apiBaseUrl}/auth/${item.name}/authorize`,
            name: item.name,
          } as AuthProviderResponse)
      )
    );
  })
);

router.get(
  "/auth/:provider/authorize",
  use(async (req, res) => {
    const queryString = getQueryString(req.query);
    return res.redirect(`${apiBaseUrl}/oauth/callback${queryString}`);
  })
);

router.post(
  "/auth/logout",
  use(async (req, res) => {
    // FIXME: Add a next query param
    const userId = await getAuthenticatedUserId(req.cookies);
    const user = mockDb.getOne<User>("users", (v) => v.id === userId);

    if (user) {
      const staleCookieHeader = await createCookieHeader(user, -7_200_000);
      res.set("Set-Cookie", staleCookieHeader);
    }

    res.json({ message: "logged out" });
  })
);

router.get(
  "/admin/qpu-time-requests",
  use(async (req, res) => {
    const requester_id = await getAuthenticatedUserId(req.cookies);
    if (!requester_id) {
      return respond401(res);
    }

    const { status, project_id: projectIds } = req.query;

    const requestList = mockDb.getMany<QpuTimeExtensionUserRequest>(
      "user_requests",
      (v) => {
        return (
          (status === undefined || v.status === status) &&
          (projectIds === undefined ||
            projectIds === v.request.project_id ||
            // @ts-ignore
            projectIds.includes(v.request.project_id))
        );
      }
    );
    res.json(requestList);
  })
);

router.post(
  "/admin/qpu-time-requests",
  use(async (req, res) => {
    const requester_id = await getAuthenticatedUserId(req.cookies);
    if (!requester_id) {
      return respond401(res);
    }

    const currentTimestamp = new Date().toISOString();
    const userRequest: QpuTimeExtensionUserRequest = {
      request: { ...req.body },
      requester_id,
      updated_at: currentTimestamp,
      created_at: currentTimestamp,
      type: "project-qpu-seconds",
      status: "pending",
      id: randomUUID(),
    };

    mockDb.create<QpuTimeExtensionUserRequest>("user_requests", userRequest);
    res.status(201);
    res.json(userRequest);
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
