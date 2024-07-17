import { http, HttpResponse } from "msw";
import {
  deviceCalibrationData,
  deviceList,
  jobList,
  projectList,
} from "./data";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const handlers = [
  http.get(`${apiBaseUrl}/devices`, () => {
    // FIXME: Can we check for valid auth?
    return HttpResponse.json(deviceList);
  }),
  http.get(`${apiBaseUrl}/devices/:name`, ({ params }) => {
    // FIXME: Can we check for valid auth?
    const data = deviceList.filter((v) => v.name === params.name)[0];
    if (data === undefined) {
      return HttpResponse.json(
        { detail: `device '${params.name}' not found` },
        { status: 404 }
      );
    }
    return HttpResponse.json(data);
  }),
  http.get(`${apiBaseUrl}/calibrations`, () => {
    // FIXME: Can we check for valid auth?
    return HttpResponse.json(deviceCalibrationData);
  }),
  http.get(`${apiBaseUrl}/calibrations/:name`, ({ params }) => {
    // FIXME: Can we check for valid auth?
    const data = deviceCalibrationData.filter((v) => v.name === params.name)[0];
    if (data === undefined) {
      return HttpResponse.json(
        { detail: `calibrations for '${params.name}' not found` },
        { status: 404 }
      );
    }
    return HttpResponse.json(data);
  }),
  http.get(`${apiBaseUrl}/me/projects`, () => {
    // FIXME: Can we check for valid auth?
    return HttpResponse.json(projectList);
  }),
  http.get(`${apiBaseUrl}/me/jobs`, () => {
    // FIXME: Can we check for valid auth?
    return HttpResponse.json(jobList);
  }),
];
