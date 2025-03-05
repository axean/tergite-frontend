db = db.getSiblingDB("testing"); // Create/use database

/**
 * Converts a JS object into a BSON-like object
 * @param {Object} obj - the object to convert to document
 * @returns {Object} - a BSON-like document
 */
const toDoc = ({ id, ...props }) => ({ _id: ObjectId(id), ...props });

/**
 * Converts a JS object into a BSON-like object for tokens
 * @param {Object} obj - the object to convert to document
 * @returns {Object} - a BSON-like document
 */
const toTokenDoc = ({ id, created_at, ...props }) => ({
  _id: ObjectId(id),
  created_at: ISODate(),
  ...props,
});

const statusMap = {
  pending: "REGISTERING",
  successful: "DONE",
  failed: "ERROR",
};

/**
 * Converts a JobV2 object into a JobV1 object
 * @param {Object} obj - the object to convert to document
 * @returns {Object} - a JobV1 object
 */
const toJobV1 = ({
  device: backend,
  created_at,
  status: v2Status,
  duration_in_secs,
  ...props
}) => {
  const status = statusMap[v2Status];
  const timelog = { REGISTERED: created_at };
  if (v2Status === "successful") {
    timelog["RESULT"] = { memory: [] };
  }

  let timestamps = null;
  if (duration_in_secs != null) {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setSeconds(endDate.getSeconds() + duration_in_secs);

    timestamps = {
      registration: null,
      pre_processing: null,
      execution: {
        started: ISODate(startDate.toISOString()),
        finished: ISODate(endDate.toISOString()),
      },
      post_processing: null,
      final: null,
    };
  }

  return { backend, timelog, status, timestamps, ...props };
};

console.log("Inserting initial data in mongo...");

// The following raw data will be replaced by JSON from
// fixtures when the tests start
const rawCalibrations = "[]";
const rawDevices = "[]";
const rawJobs = "[]";
const rawProjects = "[]";
const rawTokens = "[]";
const rawUserRequests = "[]";
const rawUsers = "[]";

console.log("Parsing initial documents ....");
// parse the raw results
const calibrations = JSON.parse(rawCalibrations).map(toDoc);
console.log({ calibrations });
const devices = JSON.parse(rawDevices).map(toDoc);
console.log({ devices });
const jobs = JSON.parse(rawJobs).map(toJobV1).map(toDoc);
console.log({ jobs });
const projects = JSON.parse(rawProjects).map(toDoc);
console.log({ projects });
const tokens = JSON.parse(rawTokens).map(toTokenDoc);
console.log({ tokens });
const userRequests = JSON.parse(rawUserRequests).map(toDoc);
console.log({ userRequests });
const users = JSON.parse(rawUsers).map(toDoc);
console.log({ users });

console.log("Preloading mongodb with...", {
  calibrations,
  devices,
  jobs,
  projects,
  tokens,
  userRequests,
  users,
});

db.auth_projects.insertMany(projects);
console.log("Inserted projects");
db.auth_app_tokens.insertMany(tokens);
console.log("Inserted tokens");
db.auth_users.insertMany(users);
console.log("Inserted users");
db.calibrations_v2.insertMany(calibrations);
console.log("Inserted calibrations");
db.devices.insertMany(devices);
console.log("Inserted devices");
db.jobs.insertMany(jobs);
console.log("Inserted jobs");
db.auth_user_requests.insertMany(userRequests);
console.log("Inserted user requests");
