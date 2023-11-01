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

	export interface Config {
		baseUrl: string;
	}

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
