/**
 * Formats the datetime tick to be presentable
 *
 * @param tick - the current datetime tick
 * @param index - the index of the current datetime tick
 * @param ticks - all the ticks available
 * @returns - a string representation of the datetime tick
 */
export function formatDatetimeTick(tick: Date, index: number, allTicks: Date[]) {
	const options = { hour12: false };

	if (index > 0 && allTicks[index - 1].getDate() === tick.getDate()) {
		options['timeStyle'] = 'short';
	}

	return tick.toLocaleString(undefined, options);
}

/**
 * Formats the temperature tick to be presentable
 *
 * @param tick - the current temperature tick
 * @param index - the index of the current temperature tick
 * @param ticks - all the ticks available
 * @returns - a string representation of the temperature tick
 */
export function formatTemperatureTick(tick: number, index: number, allTicks: number[]) {
	if (`${tick}`.length > 6) {
		return tick.toFixed(4);
	}

	return tick;
}

/**
 * Gets the number of the given interval in the datapoints lists
 *
 * @param interval - the interval in milliseconds
 * @param data - the list of datapoints sorted in ascending order of timestamp
 * @returns - the number of intervals in the given data points
 */
export function getIntervalCount(
	interval: number,
	data: API.Response.ParsedCryostatTempDataPoint[]
) {
	let count = 1;

	if (data?.length > 0) {
		const firstDatapoint = data[0];
		const lastDatapoint = data[data.length - 1];
		const xRange = lastDatapoint.datetime - firstDatapoint.datetime;
		count = Math.ceil(Math.abs(xRange / interval));
	}

	return count;
}

/**
 * Gets the latest temperature as a string in the given data points.
 *
 * It defaults to an empty string
 *
 * @param data - the list of datapoints sorted in ascending order of timestamp
 * @returns - the number of intervals in the given data points
 */
export function getLatestTemperatureString(data: API.Response.ParsedCryostatTempDataPoint[]) {
	if (data?.length > 0) {
		const lastDatapoint = data[data.length - 1];
		return `${lastDatapoint.temperature.toFixed(4)} K`;
	}

	return '';
}

/**
 * Returns a string representation of a temperature data point to show in
 * a tool tip
 *
 * @param point - the parsed Temperature data point to turn into tool tip text
 * @returns - a string representation of the point to show in the tool tip
 */

export function toToolTipText(point: API.Response.ParsedCryostatTempDataPoint) {
	if (!point) {
		return '';
	}

	const timeString = new Date(point.datetime).toLocaleString(undefined, {
		hour12: false,
		timeStyle: 'short'
	});
	const temperatureString = `${point.temperature.toFixed(4)} K`;

	return `${timeString} - ${temperatureString}`;
}
