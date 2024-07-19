import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AggregateValue, CalibrationValue } from "./types";
import { LoaderFunction, LoaderFunctionArgs, redirect } from "react-router-dom";

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
      // @ts-expect-error
      if (error.status === 401) {
        return redirect("/login");
      }

      throw error;
    }
  };
}
