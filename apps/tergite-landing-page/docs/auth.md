# Authentication and Authorization

This is a brief description of the authentication and authorization.
It is a continuation of the documentation of the same from [the tergite-mss repo](https://github.com/tergite/tergite-mss/tree/main/docs/auth.md)

## Authentication

-   We use oauth2 to authenticate, and store JWT tokens for each user in HTTP-only secure cookies on the same domain as MSS and any other services we intend to run.

### How to Add a new Oauth2 provider

-   Do note that this provider must already be set up in MSS, as seen in the instructions in [MSS auth docs](../../tergite-mss/docs/auth.md), and the names should match.
-   Add the logo for the new provider in the [`public/img`](../public/img/) folder.
-   Open the [`src/app/api/config/route.ts`](../src/app/api/config/route.ts) file and update its `OAUTH2_LOGOS` list to include your new provider's logo.
```typescript
const OAUTH2_LOGOS: { [key: string]: string } = {
	github: '/img/github-black.png',
	chalmers: '/img/chalmers-logo.svg',
	ericsson: '/img/ericsson-logo.svg',
};
```

-   Start MSS.
    Instructions are on the [README.md](../../tergite-mss/README.md)
-   Start the landing page.
    Instructions are on its [README.md](../README.md)

    **They must share the same domain if they are to work with cookies.**

-   Go to your browser at `/login` and attempt to login with your new provider, whose name should be shown on that page.

