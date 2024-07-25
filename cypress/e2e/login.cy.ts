/// <reference types="cypress" />

import users from "../fixtures/users.json";
import authProviders from "../fixtures/auth-providers.json";

const supportedDomains = authProviders.map((v) => v.email_domain);
const invalidFormatEmailAddresses = [
  "john",
  "1",
  "john.com",
  "http://example.com",
];

users.forEach((user) => {
  const isDomainSupported = supportedDomains.includes(user.email.split("@")[1]);

  describe(`login page for user '${user.name}'`, () => {
    beforeEach(() => {
      const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");
      const domain = Cypress.env("VITE_COOKIE_DOMAIN");
      const userIdCookieName = Cypress.env("USER_ID_COOKIE_NAME");

      cy.intercept("GET", `${apiBaseUrl}/devices`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/jobs`).as("my-job-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects`).as("my-project-list");

      cy.setCookie(userIdCookieName, user.id, {
        domain,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      cy.visit("/");
      cy.wait("@devices-list");
      cy.wait("@my-job-list");
      cy.wait("@my-project-list");
    });

    it("renders correctly", async () => {
      cy.get("[data-cy-logo]").should("contain", "WACQT");
      cy.get("[data-cy-logo]").should(
        "contain",
        "Wallenberg Centre for Quantum Technology"
      );

      cy.get("input[name=email]")
        .should("have.attr", "placeholder")
        .and("match", /email address:/i);

      cy.get("button[type=submit]").should("have.value", /sign in/i);
    });

    !isDomainSupported &&
      it(`renders 'unauthorized' error message for '${user.email}'`, async () => {
        // const user = userEvent.setup();
        // const errorMsgRegex = /unauthorized/i;
        // render(<App routerConstructor={createMemoryRouter} />);
        // const emailInput = await screen.findByPlaceholderText("Email address:");
        // expect(screen.queryByText(errorMsgRegex)).not.toBeInTheDocument();
        // await user.type(emailInput, email);
        // await user.click(
        //   screen.getByRole("button", {
        //     name: /sign in/i,
        //   })
        // );
        // expect(await screen.findByText(errorMsgRegex)).toBeInTheDocument();
      });

    invalidFormatEmailAddresses.forEach((email) =>
      it(`renders error invalid email message for '${email}'`, async () => {
        // const user = userEvent.setup();
        // const errorMsgRegex = /invalid email; expected xxx@bxxxx.xxx/;
        // render(<App routerConstructor={createMemoryRouter} />);
        // const emailInput = await screen.findByPlaceholderText("Email address:");
        // expect(screen.queryByText(errorMsgRegex)).not.toBeInTheDocument();
        // await user.type(emailInput, email);
        // await user.click(
        //   screen.getByRole("button", {
        //     name: /sign in/i,
        //   })
        // );
        // expect(await screen.findByText(errorMsgRegex)).toBeInTheDocument();
      })
    );

    it(`redirects to the home page of the dashboard`, async () => {
      // const user = userEvent.setup();
      // render(<App routerConstructor={createMemoryRouter} />);
      // const emailInput = await screen.findByPlaceholderText("Email address:");
      // await user.type(emailInput, email);
      // await user.click(
      //   screen.getByRole("button", {
      //     name: /sign in/i,
      //   })
      // );
      // expect(window.location.href).toBe("http://localhost:3000/");
      // expect(await screen.findByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});
