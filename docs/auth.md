# Authentication and Authorization

This is a brief description of the authentication and authorization.
It is a continuation of the documentation of the same from [the tergite-mss repo](https://github.com/tergite/tergite-mss/tree/main/docs/auth.md)

## Authentication

-   We use oauth2 to authenticate, and store JWT tokens for each user in HTTP-only secure cookies on the same domain as MSS and any other services we intend to run.

### How to Add a new Oauth2 provider

-   Open the [`src/app/api/config/route.ts`](../src/app/api/config/route.ts) file and update its `oauth2Provider` list to include your new provider.

```typescript
const oauth2Providers: API.Oauth2ProviderInfo[] = [
	{
		name: 'github',
		logo: { src: `${appBaseUrl}/img/github-black.png`, ...extraProps }
	},
	{ name: 'puhuri' },
	{
		name: 'chalmers',
		logo: { src: `${appBaseUrl}/img/chalmers-logo.svg`, ...extraProps }
	},
	// say, we are adding a new provider called 'erikson'
	{
		name: 'erikson',
		logo: { src: `${appBaseUrl}/img/erikson-logo.svg`, ...extraProps }
	}
];
```

-   Do note that this provider must already be set up in MSS, as seen in the intructions in [MSS auth docs](https://github.com/tergite/tergite-mss/tree/main/docs/auth.md), and the names should match.
-   As you have noticed, there is an option of adding a logo for the given provider. You can add the logo in the [`public/img`](../public/img/) folder.

-   Start MSS.
    Instructions are on the [README.md](https://github.com/tergite/tergite-mss/tree/main/README.md)
-   Start the landing page.
    Instructions are on its [README.md](../README.md)

    **They must share the same domain if they are to work with cookies.**

-   Go to your browser at `/login` and attempt to login with your new provider, whose name should be shown on that page.

