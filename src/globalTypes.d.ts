namespace API {
	enum UserRole {
		ADMIN = 'admin',
		USER = 'user',
		PARTNER = 'partner',
		RESEARCHER = 'researcher'
	}

	type User = {
		id: string;
		roles: UserRole[];
	};

	type ErrorMessage = { detail: string };

	namespace Response {
		type Authorize = {
			authorization_url: string;
		};
	}
}

namespace Tergite {
	interface ServiceLinkInfo {
		href: string;
		text: string;
	}
}

