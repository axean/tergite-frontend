db = db.getSiblingDB("testing"); // Create/use database

const toDoc = ({ id, ...props }) => ({ _id: ObjectId(id), ...props });
const toTokenDoc = ({ id, created_at, ...props }) => ({
  _id: ObjectId(id),
  created_at: ISODate(),
  ...props,
});

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

// parse the raw results
const calibrations = JSON.parse(rawCalibrations).map(toDoc);
const devices = JSON.parse(rawDevices).map(toDoc);
const jobs = JSON.parse(rawJobs).map(toDoc);
const projects = JSON.parse(rawProjects).map(toDoc);
const tokens = JSON.parse(rawTokens).map(toTokenDoc);
const userRequests = JSON.parse(rawUserRequests).map(toDoc);
const users = JSON.parse(rawUsers).map(toDoc);

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
db.auth_app_tokens.insertMany(tokens);
db.auth_users.insertMany(users);
db.calibrations_v2.insertMany(calibrations);
db.devices.insertMany(devices);
db.jobs.insertMany(jobs);
db.auth_user_requests.insertMany(userRequests);
