/// <reference types="cypress" />

import userList from "../fixtures/users.json";
import authProviders from "../fixtures/auth-providers.json";
import { User } from "../../types";

const invalidFormatEmailAddresses = [
  "john",
  "1",
  "john.com",
  "http://example.com",
];

const users = [...userList] as User[];

users.forEach((user) => {
  const [username, emailDomain] = user.email.split("@");
  const availableAuthProviders = authProviders.filter(
    (v) => v.email_domain === emailDomain
  );
  const isDomainSupported = availableAuthProviders.length > 0;

  describe(`login page for authenticated user '${username}'`, () => {
    beforeEach(() => {
      const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");
      const domain = Cypress.env("VITE_COOKIE_DOMAIN");
      const userIdCookieName = Cypress.env("USER_ID_COOKIE_NAME");

      cy.intercept("GET", `${apiBaseUrl}/devices`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects`).as("my-project-list");
      cy.intercept("GET", `${apiBaseUrl}/me/jobs`).as("my-jobs-list");

      cy.setCookie(userIdCookieName, user.id, {
        domain,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      cy.visit("/");
      cy.wait("@devices-list");

      cy.get("input[name=email]").as("emailInput");
      cy.get("button[type=submit]").contains(/next/i).as("nextBtn");
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

      cy.get("@nextBtn").should("be.visible");
    });

    !isDomainSupported &&
      it(`renders 'unauthorized' error message for '${user.email}'`, () => {
        cy.get("p.text-destructive").should("not.exist");

        cy.get("@emailInput").clear();
        cy.get("@emailInput").type(user.email);
        cy.get("@nextBtn").click();

        cy.get("p.text-destructive")
          .contains(/not found/i)
          .should("be.visible");
      });

    isDomainSupported &&
      it(`redirects to the home page of the dashboard`, () => {
        cy.get("@emailInput").clear();
        cy.get("@emailInput").type(user.email);
        cy.get("@nextBtn").click();

        cy.get("[data-cy-login-link]").first().click();
        cy.wait("@my-jobs-list");

        cy.url().should("equal", "http://127.0.0.1:5173/");
        cy.get("nav a")
          .contains(/dashboard/i)
          .should("be.visible");
      });
  });

  describe(`login page for unauthenticated user '${username}'`, () => {
    let apiBaseUrl: string;
    beforeEach(() => {
      apiBaseUrl = Cypress.env("VITE_API_BASE_URL");

      cy.intercept("GET", `${apiBaseUrl}/devices`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects`).as("my-project-list");
      cy.intercept("GET", `${apiBaseUrl}/me/jobs`).as("my-jobs-list");
      cy.intercept(
        "GET",
        `${apiBaseUrl}/auth/providers?domain=${emailDomain}`
      ).as("auth-providers");

      cy.visit("/");
      cy.wait("@devices-list");

      cy.get("input[name=email]").as("emailInput");
      cy.get("button[type=submit]").contains(/next/i).as("nextBtn");
    });

    it("toggles dark mode", () => {
      cy.get('[aria-label="Moon"]').as("toDarkBtn");
      cy.get('[aria-label="Sun"]').should("not.exist");

      cy.get("@toDarkBtn").click();
      cy.get("html.dark").should("be.visible");
      cy.get("@toDarkBtn").should("not.exist");

      cy.get('[aria-label="Sun"]').as("toLightBtn");
      cy.get("@toLightBtn").should("be.visible");

      cy.get("@toLightBtn").click();
      cy.get("html.dark").should("not.exist");
      cy.get("@toDarkBtn").should("be.visible");
      cy.get("@toLightBtn").should("not.exist");
    });

    isDomainSupported &&
      it(`redirects to the home page of the dashboard`, () => {
        cy.get("@emailInput").clear();
        cy.get("@emailInput").type(user.email);
        cy.get("@nextBtn").click();

        cy.wait("@auth-providers");

        for (const provider of availableAuthProviders) {
          cy.wrap(provider).then((provider) => {
            cy.contains(
              "a",
              new RegExp(`login with ${provider.name}`, "i")
            ).should(
              "have.attr",
              "href",
              `${apiBaseUrl}/auth/${provider.name}/authorize?next=http://127.0.0.1:5173`
            );
          });
        }
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
      cy.wait("@devices-list");
    });

    it(`renders error message`, () => {
      cy.get("p.text-destructive").should("not.exist");

      cy.get("input[name=email]").type(email);
      cy.get("button[type=submit]").contains(/next/i).click();

      cy.get("p.text-destructive")
        .contains(/invalid email; expected xxx@bxxxx.xxx/i)
        .should("be.visible");
    });
  })
);
