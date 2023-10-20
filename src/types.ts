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

	export namespace Response {
		export type Authorize = {
			authorization_url: string;
		};
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
