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
		project_ext_id: string;
		lifespan_seconds: number;
		created_at: string;
	}

	export interface CreatedAppToken {
		access_token: string;
		token_type: string;
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
		serviceLinks: ServiceLinkInfo[];
		oauth2Providers: Oauth2ProviderInfo[];
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

	export interface ServiceLinkInfo {
		href: string;
		text: string;
	}

	export interface Oauth2ProviderInfo {
		name: string;
		logo?: ImageInfo;
	}

	export interface ImageInfo {
		src: string;
		// height and width are not necessary for SVGs
		height?: number;
		width?: number;
		blurDataUrl?: string;
	}
}
