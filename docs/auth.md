# Authentication and Authorization

This is how MSS authenticates its users and controls their access to the quantum computer resource.

## Authentication

- It uses [Oauth2](https://oauth.net/2/), a standard similar to HTTP in the sense that for any system, 
 also called an **Oauth2 client**, to allow its users to authenticate with another system, 
 called an **Oauth2 provider**, all that is needed are two strings:
  - `CLIENT_ID`
  - `CLIENT_SECRET`
- The two strings are unique to this system, but are given by the Oauth2 provider
- Common Oauth2 providers include Google, Github, Microsoft, Chalmers (which uses Microsoft)
- Organizations which have a sort of ActiveDirectory can automatically be Oauth2 providers.
- We also use [OpenID Connect]() which is a flavour of Oauth2 that requires a third string, a `CONFIG_URI`,
 from where to get the configuration of the openID provider.

### How to Set Up a New Oauth2 Provider

- Let's say we want some 'Erikson' users to have access to MSS.
- Update the `.env` file in the project root directory to include:

```shell
ERIKSON_CLIENT_ID=<some-openid-client-id>
ERIKSON_CLIENT_SECRET=<some-openid-client-secret>
# ERIKSON_CONFIG_ENDPOINT is necessary if Erikson uses OpenID Connect, otherwise ignore.
ERIKSON_CONFIG_ENDPOINT=<some-openid-config-endpoint>
# the regex validation for emails to allow for this login. default: ".*"
ERIKSON_EMAIL_REGEX=".*"
# Roles that are automatically given to users who authenticate through Erikson
# roles can be: "admin", "user", "researcher", "partner". Default is "user".
ERIKSON_ROLES="partner,user"
# the URL to redirect to after user authenticates with the system.
# It is of the format {MSS_BASE_URL}/auth/app/{provider_name}/callback
ERIKSON_COOKIE_REDIRECT_URI=https://api.qal9000.se/auth/app/erikson/callback
```

- Update the [`settings.py`](../settings.py) file in the project root directory to read the environment variables you have added, 
 plus the name of this authentication method.

```python
ERIKSON_CLIENT_NAME = "erikson"
ERIKSON_CLIENT_ID = config("ERIKSON_CLIENT_ID", cast=str, default=None)
ERIKSON_CLIENT_SECRET = config("ERIKSON_CLIENT_SECRET", cast=str, default=None)
ERIKSON_CONFIG_ENDPOINT = config("ERIKSON_CONFIG_ENDPOINT", cast=str, default=None)
ERIKSON_COOKIE_REDIRECT_URI = config(
    "ERIKSON_COOKIE_REDIRECT_URI", cast=str, default=None
)
```

- Add the erikson authentication routes to the [`api/routers/auth.py`](../api/rest/routers/auth.py) file.

```python
# If Erikson uses microsoft to handle its users, we use the `get_microsoft_client` utility
# If openID, we use `get_openid_client`
# For any other provider, we can create similar utility functions, in services/auth/users/__init__.py
# Just copy, and paste, and change the return value.
# or instead of the utility, import the client from `httpx_oauth.clients`
_ERIKSON_OAUTH_CLIENT = get_microsoft_client(
    client_id=settings.ERIKSON_CLIENT_ID,
    client_secret=settings.ERIKSON_CLIENT_SECRET,
    name=settings.ERIKSON_CLIENT_NAME,
)

# for non-browser based auth i.e. no cookies
router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=_ERIKSON_OAUTH_CLIENT,
        backend=JWT_HEADER_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
    ),
    prefix=f"/{_ERIKSON_OAUTH_CLIENT.name}",
    tags=["auth"],
)

# For browser based auth
router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=_ERIKSON_OAUTH_CLIENT,
        backend=JWT_COOKIE_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
        redirect_url=settings.ERIKSON_COOKIE_REDIRECT_URI,
    ),
    prefix=f"/app/{_ERIKSON_OAUTH_CLIENT.name}",
    tags=["auth"],
)
```

- Update the [Landing page](https://github.com/tergite/tergite-landing-page) to include this provider also. 
 The instructions are found in the [auth docs](https://github.com/tergite/tergite-landing-page/src/main/docs/auth.md)
- Start MSS. 
  Instructions are on the [README.md](../README.md)
- Start the landing page.
  Instructions are on its [README.md](https://github.com/tergite/tergite-landing-page/src/main/README.md)

## Authorization

- We control access to MSS, and its BCCs using two ways
  - `roles` control basic access to auth-related endpoints e.g. project creation, token management etc.
  - `projects` control access to all other endpoints. To create a job, or get its results etc, 
     one must be attached to a project that has more than zero QPU seconds.
- QPU seconds are the number of seconds a project's experiments are allocated on the quantum computer.
- QPU seconds can be increased, decreased etc., but no job can be created without positive QPU seconds.
- A job could run for longer than the allocated project QPU seconds but 
  it may fail to update MSS of its results. A user must thus make sure their project has enough QPU seconds.

### How Authorization Works

Here is an interaction diagram of QAL9000 auth showcasing authentication via [MyAccessID](https://ds.myaccessid.org/).


![Interaction diagram of QAL9000 auth showcasing MyAccessID](./assets/qal9000-auth.png)

**The raw editable drawio diagram can be found [in the assets folder](./assets/qal9000-auth.drawio)**

### FAQs

#### - How do we bypass authentication in development?

We use feature flag `IS_AUTH_ENABLED` environment variable, setting it to False

```shell
IS_AUTH_ENABLED=False
```

**Note: `/auth` endpoints will still require authentication because they depend on the current user**

#### - How do we ensure that in production, authentication is always turned on?

On startup, we raise a ValueError when environment variables `IS_AUTH_ENABLED=False` yet `APP_SETTINGS=production` and log it.

#### - How do we allow other qal9000 services (e.g. BCC or calibration workers) to access MSS, without user intervention?

Use app tokens created by any user who had the 'system' role. 
The advantage of using app tokens is that they are more secure because they can easily be revoked and scoped.
Since they won't be used to run jobs, their project QPU seconds are expected not to run out.

If you are in development mode, you can just switch of authentication altogether.

#### How do I log in?

- You need to run both [MSS](https://github.com/tergite/tergite-mss/) and the [landing page](https://github.com/tergite/tergite-landing-page/).
- **Make sure that your `.env` files have all variables filled appropriately** for example, both applications should have the same `JWT_SECRET`.
- The landing page, when running, has appropriate links, say in the navbar, to direct you on how to the authentication screens.
- However, you can also log in without running the landing page app first. See the next FAQ.

#### How do I log in without having to run the landing page?

- **Make sure that your `.env` file has all variables filled appropriately**. 
  The `dot-env-template.txt` is a good template to copy from, but it must all placeholder (`<some-stuff>`) must be replaced in the actual `.env` file.
- Run the application

```shell
./start_mss.sh
```

- Visit the http://localhost:8002/auth/github/authorize endpoint in your browser if you are running on local host.
- Copy the “authorization_url” from the response and paste it in another tab in your browser. Follow any prompts the browser gives you.
- After you are redirected back to http://localhost:8002/auth/github/callback, you should see an “access_token”. Copy it to your clipboard.  
  If you run into any errors, ensure that the `TERGITE_CLIENT_ID` and `TERGITE_CLIENT_SECRET` in your `.env` file are appropriately set.
- You can then try to create an app token or anything auth related using `curl` or [postman](https://www.postman.com/).  
  To authenticate those requests, you must always pass an "Authorization" header of format `Bearer <access_token>`.  
  **Do note that this auth token can only be used on `/auth/...` endpoints. It will return 401/403 errors on all other endpoints**.
- Do note also that some endpoints are only accessible to users that have a given role e.g. 'admin' or 'system' etc.

#### How does BCC get authenticated?

- A client (say [tergite-qiskit-connector](https://github.com/tergite/tergite-qiskit-connector)) sends a `POST` 
  request is sent to `/jobs` on MSS (this app) with an `app_token` in its `Authorization` header
- A new job entry is created in the database, together with a new unique `job_id`.
- MSS notifies BCC of the `job_id` and its associated `app_token` by sending a `POST` request to `/auth` endpoint 
  of [BCC](https://github.com/tergite/tergite-bcc).
- In the response to the client, MSS returns the `/jobs` url for the given BCC backend
- The client then sends its experiment data to the BCC `/jobs` url, with the same `app_token` in 
  its `Authorization` header and the same `job_id` in the experiment data.
- BCC checks if the `job_id` and the `app_token` are first of all associated, and if no other experiment data has
  been sent already with the same `job_id`-`app_token` pair. This is to ensure no user attempts to fool the system
  by using the same `job_id` for multiple experiments, which is theoretically possible.
- If BCC is comfortable with the results of the check, it allows the job to be submitted. Otherwise, either a 401
  or a 403 HTTP error is thrown.
- The same `job_id`-`app_token` pair is used to download raw logfiles from BCC at `/logfiles/{job_id}` endpoint.
  This time, BCC just checks that the pair match but it does not check if the pair was used already.
- This is the same behaviour when reading the job results at `jobs/{job_id}/result` 
  or the job status at `jobs/{job_id}/status` or the entire job entry at `jobs/{job_id}` in BCC. 
- This is also the same behaviour when attempting to delete the job at `/jobs/{job_id}` or to cancel it at 
  `/jobs/{job_id}/cancel` in BCC.
