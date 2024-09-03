import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Time,
  type AggregateValue,
  type AppToken,
  type CalibrationValue,
  type ExtendedAppToken,
  type Project,
} from "../../types";
import { LoaderFunction, LoaderFunctionArgs, redirect } from "react-router-dom";
import { DateTime } from "luxon";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Copies the value to the clipboard
 *
 * @param value - the value to copy
 */
export function copyToClipboard(value: string) {
  navigator.clipboard.writeText(value);
}

/**
 * Computes the median of each given field in the array of fields
 *
 * @param values - the array of objects for which the medians are to be computed
 * @param fields - the fields whose medians are to be computed
 * @returns - a mapping of field and its median
 */
export function getCalibrationMedians(
  values: { [k: string]: CalibrationValue }[],
  fields: string[]
): { [k: string]: AggregateValue } {
  const constituentLists: { [k: string]: number[] } = Object.fromEntries(
    fields.map((field) => [field, values.map((v) => v[field].value).sort()])
  );

  const middle = Math.floor(values.length / 2);
  const isLengthEven = values.length % 2 === 0;
  const medianFunc = isLengthEven
    ? (v: number[]) => (v[middle - 1] + v[middle]) / 2
    : (v: number[]) => v[middle];

  return Object.fromEntries(
    fields.map((field) => [
      field,
      {
        // Assume that the unit of the first item is the one for all
        unit: values[0][field]?.unit,
        value: medianFunc(constituentLists[field]),
      },
    ])
  );
}

/**
 * Wraps the loader function in a handler for 401 errors to redirect to login page
 *
 * @param loaderFn - the actual loader function
 * @returns - a new loader function
 */
export function loadOrRedirectIf401(loaderFn: LoaderFunction) {
  return async (params: LoaderFunctionArgs) => {
    try {
      return await loaderFn(params);
    } catch (error) {
      // @ts-expect-error error can be any
      if (error.status === 401) {
        return redirect("/login");
      }

      throw error;
    }
  };
}

/**
 * Converts an AppToken instance to an ExtendedAppToken instance
 *
 * It computes the computed properties
 *
 * @param token - the AppToken instance
 * @param project - the project it is attached the app token is attached to
 */
export function extendAppToken(
  token: AppToken,
  project: Project
): ExtendedAppToken {
  const expires_at = DateTime.fromISO(token.created_at).plus({
    seconds: token.lifespan_seconds,
  });
  const is_expired = DateTime.now() > expires_at;
  const project_name = project.name;

  return { ...token, expires_at, is_expired, project_name };
}

/**
 * Converts a string into an integer or undefined if it has no equivalent
 *
 * @param value - the string value to parse to integer
 * @returns - the values as an integer or undefined
 */
export function safeParseInt(value: string): number | undefined {
  const result = parseInt(value);
  return isNaN(result) ? undefined : result;
}
/**
 * Extracts the Time value from an ISO time string (HH:mm:ss[.SSSSSS])
 *
 * @param value - the value in ISO time format
 * @returns - the Time value from the string
 */
export function extractTime(value: string): Time {
  const timeRegex = /(\d\d):(\d\d)(:(\d\d))?(\.(\d+))?/;
  const [
    _wholeValue,
    hourStr,
    minuteStr,
    _colonAndSeconds,
    secondStr,
    _pointAndMillisecons,
    millisecondStr,
  ] = timeRegex.exec(value) ?? [];
  return {
    hour: safeParseInt(hourStr),
    minute: safeParseInt(minuteStr),
    second: safeParseInt(secondStr),
    millisecond: safeParseInt(millisecondStr),
  };
}
/**
 * Converts a time instance into a string of ISO format (HH:mm:ss[.SSSSSS])
 *
 * @param value - the Time instance
 * @returns - the ISO string representation of the value
 */
export function timeAsString({
  hour,
  minute,
  second,
  millisecond,
}: Time): string {
  const paddedMinute = `${minute}`.padStart(2, "0");
  const paddedSecond = `${second}`.padStart(2, "0");
  const paddedHour = `${hour}`.padStart(2, "0");
  const secondStr = second === undefined ? "" : `:${paddedSecond}`;
  const secondsAndMilliseconds =
    millisecond === undefined
      ? secondStr
      : `${secondStr || "00"}.${millisecond}`; // if milliseconds exist without seconds, have 00 as seconds

  return `${paddedHour}:${paddedMinute}${secondsAndMilliseconds}`;
}
