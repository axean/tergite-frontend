/**
 * Converts a device's boolean property 'is_online' into 'online' or 'offline' literals
 * @param item - the current device
 * @returns 'online' or 'offline'
 */
export function filterParser(item: API.Response.Device): string {
	return item.is_online ? 'online' : 'offline';
}

/**
 * Retrieves a given value of a nested property basing on the given path
 * @param obj - the object
 * @param pathSegments - a list of strings to indicate a path to a nested property
 * @returns - the value at the given path
 */
export const getValueAtPath = (obj: { [key: string]: any }, pathSegments: string[]) =>
	pathSegments.reduce((prev, curr) => prev && prev[curr], obj);
