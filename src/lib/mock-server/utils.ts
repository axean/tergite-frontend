import {
  Approval,
  AppToken,
  AuthProvider,
  DbRecord,
  Device,
  DeviceCalibration,
  ErrorInfo,
  Job,
  Project,
  User,
} from "../types";
import { jwtVerify, type JWTVerifyResult, SignJWT } from "jose";
import {
  authProviderList,
  deviceCalibrationList,
  deviceList,
  jobList,
  projectList,
  tokenList,
  userList,
} from "./data";

const jwtSecret = import.meta.env.JWT_SECRET ?? "no-token-really-noooo";
const authAudience = import.meta.env.AUTH_AUDIENCE ?? "no-auth-audience-noooo";
const cookieName = import.meta.env.VITE_COOKIE_NAME;
const cookieDomain = import.meta.env.VITE_COOKIE_DOMAIN;
const jwtAlgorithm = "HS256";

/**
 * Generate a valid test JWT for the given user
 * @param user - the user for whom the JWT is generated
 * @returns - the JSON web token
 */
export async function generateJwt(user: User): Promise<string> {
  const payload = { sub: user.id, roles: [...user.roles] };
  const secret = new TextEncoder().encode(jwtSecret);

  const alg = jwtAlgorithm;
  const audience = [authAudience];

  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setAudience(audience)
    .setExpirationTime("1h")
    .sign(secret);
}

/**
 * Verified a given JWT token
 * @param token - the token to be verified
 * @returns - the verifiration result including the claims stored  in the payload
 */
export async function verifyJwtToken(token: string): Promise<JWTVerifyResult> {
  const audience = authAudience;
  const algorithms = [jwtAlgorithm];
  const secret = new TextEncoder().encode(jwtSecret);

  return await jwtVerify(token, secret, { audience, algorithms });
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
    approvals: [] as Approval[],
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
      approvals: [] as Approval[],
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
  create(
    itemType: ItemType,
    payload: UnknownObject,
    unique_fields: string[] = []
  ): DbRecord {
    const filters = unique_fields.reduce(
      (prev, k) => ({ ...prev, k: payload[k] }),
      {}
    );
    const preExistingItems = this.getOne(itemType, (item) =>
      conformsToFilter(item, filters)
    );
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
    } as DbRecord;

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
function conformsToFilter(item: DbRecord, filters: UnknownObject): boolean {
  return Object.entries(filters).reduce(
    // @ts-ignore
    (prev, [k, v]) => prev && item[k] === v,
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
  for (var member in obj) delete obj[member];
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
  const jwtToken = await generateJwt(user);
  const expiryTimestamp = new Date().getTime() + lifeSpan;
  const expiry = new Date(expiryTimestamp).toUTCString();

  // Removed HttpOnly because msw cannot set cookies except via javascript.
  // This for testing purpses only.
  return `${cookieName}=${jwtToken}; Domain=${cookieDomain}; Secure; SameSite=Lax; Path=/; Expires=${expiry}`;
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
