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
  const emailDomain = user.email.split("@")[1];
  const isDomainSupported = supportedDomains.includes(emailDomain);

  describe(`login page for user '${user.name}'`, () => {
    beforeEach(() => {
      const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");
      const domain = Cypress.env("VITE_COOKIE_DOMAIN");
      const userIdCookieName = Cypress.env("USER_ID_COOKIE_NAME");

      cy.intercept("GET", `${apiBaseUrl}/devices`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects`).as("my-project-list");
      cy.intercept("GET", `${apiBaseUrl}/me/jobs`).as("my-jobs-list");
      cy.intercept("GET", `${apiBaseUrl}/oauth/callback`).as("oauth-callback");

      cy.setCookie(userIdCookieName, user.id, {
        domain,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      cy.visit("/");
      cy.wait("@my-project-list");
      cy.wait("@devices-list");

      cy.get("input[name=email]").as("emailInput");
      cy.get("button[type=submit]")
        .contains(/sign in/i)
        .as("signinBtn");
    });

    it("renders correctly", () => {
      cy.get("[data-cy-logo]").should("contain.text", "WACQT");
      cy.get("[data-cy-logo]").should(
        "contain.text",
        "Wallenberg Centre for Quantum Technology"
      );

      cy.get("@emailInput")
        .should("have.attr", "placeholder")
        .and("match", /email address:/i);

      cy.get("@signinBtn").should("be.visible");
    });

    !isDomainSupported &&
      it(`renders 'unauthorized' error message for '${user.email}'`, () => {
        cy.get("p.text-destructive").should("not.exist");

        cy.get("@emailInput").type(user.email);
        cy.get("@signinBtn").click();

        cy.wait("@oauth-callback");

        cy.get("p.text-destructive")
          .contains(/unauthorized/i)
          .should("be.visible");
      });

    it(`redirects to the home page of the dashboard`, () => {
      cy.get("@emailInput").type(user.email);
      cy.get("@signinBtn").click();

      cy.wait("@my-jobs-list");

      cy.url().should("equal", "http://127.0.0.1:5173/");
      cy.get("nav a")
        .contains(/dashboard/i)
        .should("be.visible");
    });
  });
});

invalidFormatEmailAddresses.forEach((email) =>
  describe(`login with invalid email ${email}`, () => {
    beforeEach(() => {
      const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");

      cy.intercept("GET", `${apiBaseUrl}/devices`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects`).as("my-project-list");

      cy.visit("/");
      cy.wait("@my-project-list");
      cy.wait("@devices-list");
    });

    it(`renders error message`, () => {
      cy.get("p.text-destructive").should("not.exist");

      cy.get("input[name=email]").type(email);
      cy.get("button[type=submit]")
        .contains(/sign in/i)
        .click();

      cy.get("p.text-destructive")
        .contains(/invalid email; expected xxx@bxxxx.xxx/i)
        .should("be.visible");
    });
  })
);
