import { jwtVerify, type JWTVerifyResult, SignJWT } from "jose";
import authProviderList from "../cypress/fixtures/auth-providers.json";
import deviceCalibrationList from "../cypress/fixtures/calibrations.json";
import deviceList from "../cypress/fixtures/device-list.json";
import jobList from "../cypress/fixtures/jobs.json";
import projectList from "../cypress/fixtures/projects.json";
import tokenList from "../cypress/fixtures/tokens.json";
import userList from "../cypress/fixtures/users.json";
import { type ParsedQs } from "qs";
import {
  type NextFunction,
  type Response as ExpressResponse,
  type Request as ExpressRequest,
} from "express";
import {
  AppToken,
  AuthProvider,
  DbRecord,
  Device,
  DeviceCalibration,
  ErrorInfo,
  Job,
  Project,
  User,
  UserRequest,
} from "../types";

const jwtSecret = process.env.JWT_SECRET ?? "no-token-really-noooo";
const authAudience = process.env.AUTH_AUDIENCE ?? "no-auth-audience-noooo";
const cookieName: string = process.env.VITE_COOKIE_NAME ?? "tergiteauth";
const cookieDomain = process.env.VITE_COOKIE_DOMAIN;
const jwtAlgorithm = "HS256";

/**
 * Generate a valid test JWT for the given user
 * @param user - the user for whom the JWT is generated
 * @param expiry - the unix timestamp in seconds at which this JWT is to exprire
 * @param options - extra options including
 *        - secret: the JWT secret to use
 *        - audience: the JWT audience
 * @returns - the JSON web token
 */
export async function generateJwt(
  user: User,
  expiry: number,
  options: { secret?: string; audience?: string } = {}
): Promise<string> {
  const { secret = jwtSecret, audience = authAudience } = options;
  const payload = { sub: user.id, roles: [...user.roles] };
  const encodedSecret = new TextEncoder().encode(secret);

  const alg = jwtAlgorithm;
  const audienceList = [audience];

  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setAudience(audienceList)
    .setExpirationTime(expiry)
    .sign(encodedSecret);
}

/**
 * Verified a given JWT token
 * @param token - the token to be verified
 * @param options - extra options including
 *        - secret: the JWT secret to use
 *        - audience: the JWT audience
 * @returns - the verifiration result including the claims stored  in the payload
 */
export async function verifyJwtToken(
  token: string,
  options: { secret?: string; audience?: string } = {}
): Promise<JWTVerifyResult> {
  const { secret = jwtSecret, audience = authAudience } = options;
  const algorithms = [jwtAlgorithm];
  const encodedSecret = new TextEncoder().encode(secret);

  return await jwtVerify(token, encodedSecret, { audience, algorithms });
}

/**
 * A random integer capped to the given max value
 *
 * @param max - the maximum possible random number
 * @returns - a random integer
 */
function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

class MockDb {
  cache: { [k: string | ItemType]: DbRecord[] } = {
    projects: [...(projectList as Project[])],
    users: [...(userList as User[])],
    tokens: [...(tokenList as AppToken[])],
    devices: [...(deviceList as Device[])],
    calibrations: [...(deviceCalibrationList as DeviceCalibration[])],
    jobs: [...(jobList as Job[])],
    approvals: [] as UserRequest[],
    auth_providers: [...(authProviderList as AuthProvider[])],
  };
  deleted: { [k: string | ItemType]: DeletedIndex } = {
    projects: {},
    users: {},
    tokens: {},
    devices: {},
    calibrations: {},
    jobs: {},
    approvals: {},
    auth_providers: {},
  };

  constructor() {
    this.refresh = this.refresh.bind(this);
    this.del = this.del.bind(this);
    this.getOne = this.getOne.bind(this);
    this.getMany = this.getMany.bind(this);
    this.update = this.update.bind(this);
    this.create = this.create.bind(this);
    this.refresh();
  }

  /**
   * Refreshes the mock database
   */
  refresh() {
    clearObj(this.cache);
    clearObj(this.deleted);

    this.cache = {
      projects: [...(projectList as Project[])],
      users: [...(userList as User[])],
      tokens: [...(tokenList as AppToken[])],
      devices: [...(deviceList as Device[])],
      calibrations: [...(deviceCalibrationList as DeviceCalibration[])],
      jobs: [...(jobList as Job[])],
      approvals: [] as UserRequest[],
      auth_providers: [...(authProviderList as AuthProvider[])],
    };
    this.deleted = {
      projects: {},
      users: {},
      tokens: {},
      devices: {},
      calibrations: {},
      jobs: {},
      approvals: {},
      auth_providers: {},
    };
  }

  /**
   * Delete a item of `itemType`
   * @param itemType - the type of the item to delete
   * @param id - the id of item
   */
  del(itemType: ItemType, id: string) {
    this.deleted[itemType][id] = true;
  }

  /**
   * Gets many items of `itemType`, skipping `skip` upto the given `limit`
   *
   * @param itemType - the type of the item to get
   * @param filterFn - filter function to find given value
   * @param skip - the number of matched items to skip
   * @param limit - the maximum number of items to return
   * @returns - the list of all undeleted projects
   */
  getMany<T extends DbRecord>(
    itemType: ItemType,
    filterFn: FilterFunc<T> = () => true,
    skip: number = 0,
    limit: number | undefined = undefined
  ): T[] {
    return (this.cache[itemType] as T[])
      .filter((item) => filterFn(item) && !this.deleted[itemType][item.id])
      .slice(skip, limit);
  }

  /**
   * Retrieves one item of `itemType` of the given id or undefined
   * if it doesnot exist
   *
   * @param itemType - the type of the item to get
   * @param filterFn - filter function to find given value
   * @returns - the item to return
   */
  getOne<T extends DbRecord>(
    itemType: ItemType,
    filterFn: FilterFunc<T>
  ): T | undefined {
    return (this.cache[itemType] as T[]).filter(
      (item) => filterFn(item) && !this.deleted[itemType][item.id]
    )[0];
  }

  /**
   * Creates the item, returning it on completion. It fails if any of the objects with the same values of unique fields already exist
   *
   * @param itemType - the type of the item to create
   * @param payload - the project to create
   * @param unique_fields - the fields that are unique
   * @returns - the created project
   */
  create<T extends DbRecord>(
    itemType: ItemType,
    payload: UnknownObject,
    unique_fields: string[] | undefined = undefined
  ): T {
    const filters = unique_fields?.reduce(
      (prev, k) => ({ ...prev, k: payload[k] }),
      {}
    );
    const preExistingItems =
      filters &&
      this.getOne(itemType, (item) => conformsToFilter(item, filters));

    if (preExistingItems) {
      const error = new Error(`${itemType} already exists`) as ErrorInfo;
      error.status = 400;
      throw error;
    }

    const timestamp = new Date().toISOString();
    const newItem = {
      ...payload,
      id: `${randInt(10000000)}`,
      created_at: timestamp,
      updated_at: timestamp,
    } as T;

    this.cache[itemType].push(newItem);
    return newItem;
  }

  /**
   * Updates the item of `itemType`, returning it on completion. It fails if item does not exist
   * @param itemType - the type of the item to
   * @param filterFn - filter function to find given value
   * @param payload - the updates to add
   * @returns - the updated project
   */
  update<T extends DbRecord>(
    itemType: ItemType,
    filterFn: FilterFunc<T>,
    payload: UnknownObject
  ): T {
    const preExistingItem = this.getOne(itemType, filterFn);
    if (!preExistingItem) {
      const error = new Error("Not Found") as ErrorInfo;
      error.status = 404;
      throw error;
    }

    const newItem = { ...preExistingItem, ...payload };
    this.cache[itemType] = (this.cache[itemType] as T[]).map((item) =>
      filterFn(item) ? newItem : item
    );

    return newItem;
  }
}

/**
 * Whether the item conforms to filters or not
 *
 * @param item - the item to check
 * @param filters - the filters to check against
 * @returns - whether the item confirms to filters or not
 */
export function conformsToFilter<T extends DbRecord>(
  item: T,
  filters: Partial<T>
): boolean {
  return Object.entries(filters).reduce(
    (prev, [k, v]) => prev && (v === undefined ? true : item[k] === v),
    true
  );
}

/**
 * An instance of the mock database
 */
export const mockDb = new MockDb();

/**
 * Clears a given object
 * @param obj - the object to clear
 */
function clearObj(obj: { [key: string]: unknown }) {
  for (const member in obj) delete obj[member];
}

/**
 * Creates a Set-Cookie header value for authentication
 *
 * @param user - the user for JWT token generation
 * @param lifeSpan - the life span of the cookie in milliseconds
 * @returns - the value for the Set-Cookie header
 */
export async function createCookieHeader(
  user: User,
  lifeSpan: number = 7_200_000 /* 2 hours in future */
): Promise<string> {
  const expiryTimestamp = new Date().getTime() + lifeSpan;
  const jwtToken = await generateJwt(user, Math.round(expiryTimestamp / 1000));
  const expiry = new Date(expiryTimestamp).toUTCString();

  return `${cookieName}=${jwtToken}; Domain=${cookieDomain}; Secure; HttpOnly; SameSite=Lax; Path=/; Expires=${expiry}`;
}

/**
 * Checks whether the user is authenticated
 *
 * @param cookies - the cookies to authenticate with
 */
export async function getAuthenticatedUserId(
  cookies: Record<string, string>
): Promise<string | undefined> {
  let accessToken: string | undefined;
  try {
    // There was a weird thing happening where the cookie string
    // took the format of '{accessToken} {cookieName}={accessToken} {cookieName}={accessToken}'
    // I am not sure what that was about :) Just another crazy bug to chase all over the code
    const cookieString = cookies[cookieName];
    const cookieParts = cookieString
      .split(",")
      .map((v) => v.replace(`${cookieName}=`, "").trim());
    accessToken = cookieParts[cookieParts.length - 1];

    const { payload } = await verifyJwtToken(accessToken);
    return payload.sub;
  } catch (error) {
    accessToken && console.error(error);
    return undefined;
  }
}

/**
 * A wrapper around the request handler that handles common tasks on request handlers
 *
 * @param reqHandler - the async request handler for express
 * @returns - a wrapped async request handler
 */
export function use(reqHandler: AsyncRequestHandler): AsyncRequestHandler {
  return async (req, res, next) => {
    try {
      await reqHandler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Constructs a URL query string from the express request query object
 *
 * @param query - the query object from the express request object
 * @returns - the query string
 */
export function getQueryString(query: ParsedQs) {
  const queryString = Object.entries(query).reduce(
    (prev, [k, v]) => `${prev}&${k}=${v}`,
    ""
  );

  return queryString ? `?${queryString}` : "";
}

/**
 * Respond with 401 unauthorized
 *
 * @param res - the express response object
 */
export function respond401(res: ExpressResponse) {
  res.status(401).json({ detail: "Unauthorized" });
}

/**
 * Converts an error into an HTTP error
 *
 * @param err - the error object
 * @returns - the HttpError version of the given error
 */
export function toHTTPError(err: Error | HttpError): HttpError {
  if (err instanceof ReferenceError) {
    return { ...err, status: 404 };
  }

  if ("status" in err) {
    return err;
  }

  console.error(err);
  return { ...err, status: 500, message: "unexpected server error" };
}

/**
 * Creates a NotFound ErrorInfo object
 *
 * @param message - the message in the not found error; default="not found"
 * @returns - the NotFoundError
 */
export function NotFound(message: string = "not found"): ErrorInfo {
  return {
    message,
    status: 404,
    name: "NotFound",
  };
}

type ItemType =
  | "projects"
  | "users"
  | "tokens"
  | "devices"
  | "calibrations"
  | "jobs"
  | "approvals"
  | "auth_providers";

type DeletedIndex = { [k: string]: boolean };
type UnknownObject = { [key: string]: unknown };
type FilterFunc<T> = (item: T) => boolean;
type AsyncRequestHandler = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) => Promise<void>;
interface HttpError extends ErrorInfo {
  status: number;
}
