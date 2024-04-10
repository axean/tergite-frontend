/**
 * Makes the first letter of the text upper case
 *
 * @param text - the string to work on
 * @returns - the string with the first letter in upper case
 */

export function capitalizeFirstWord(text: string) {
	const firstLetter = text.charAt(0).toUpperCase();
	return `${firstLetter}${text.slice(1)}`;
}
