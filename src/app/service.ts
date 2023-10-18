import { cookies } from 'next/headers';
const jwtCookieKey = 'access-token';

/**
 * Retreives the currently loggedin user
 * 
 * @returns the current logged in user
 */
export async function getCurrentUser(): Promise<API.User | null> {
    const resp = await fetch("/api/me");
    let data = null;
    if(resp.ok){
         data = await resp.json()
        if(!data.id){
            console.error(data);
            return null;
        } 
    }
    return data;
}

export function getAccessToken() {
	return cookies().get(jwtCookieKey)?.value;
}




/**
 * Attempt to logout the user
 */
export function logout() {
	return cookies().delete(jwtCookieKey);
}
