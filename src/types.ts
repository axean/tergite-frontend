export namespace API {
	export enum UserRole {
		ADMIN = 'admin',
		USER = 'user',
		PARTNER = 'partner',
		RESEARCHER = 'researcher'
	}

	export type User = {
		id: string;
		roles: UserRole[];
	};

	export type ErrorMessage = { detail: string };

	export type StatusMessage = { message: string };

	export interface Project {
		id: string;
		ext_id: string;
		user_emails?: string[];
		qpu_seconds: number;
	}

	export interface ProjectPartial {
		id?: string;
		ext_id?: string;
		user_emails?: string[];
		qpu_seconds?: number;
	}

	export interface AppToken {
		id: string;
		title: string;
		token?: string;
		project_ext_id: string;
		lifespan_seconds: number;
		created_at: string;
	}

	/**
	 * Payload for app token generation
	 */
	export interface AppTokenPartial {
		title: string;
		project_ext_id: string;
		lifespan_seconds: number;
	}

	/**
	 * Status of a token
	 */
	export enum TokenStatus {
		EXPIRED = 'expired',
		LIVE = 'live'
	}

	/**
	 * User friendly info about a token
	 */
	export interface TokenInfo {
		id: string;
		token?: string;
		name: string;
		project: string;
		expiration: string;
		status: TokenStatus;
	}

	/**
	 * Config variables about this application
	 */
	export interface Config {
		baseUrl: string;
	}

	/**
	 * An error object that has some extra information useful in handling it
	 */
	export type EnhancedError = Error & { status?: number };

	export namespace Response {
		export type Authorize = {
			authorization_url: string;
		};

		export interface Paginated<T> {
			skip: number;
			limit: number | null;
			data: T[];
		}
	}
}

export namespace Tergite {
	export interface ServiceLinkInfo {
		href: string;
		text: string;
	}

	export interface Oauth2ProviderInfo {
		name: string;
		logo?: string;
	}
}
