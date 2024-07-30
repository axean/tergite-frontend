/// <reference types="cypress" />

import userList from "../fixtures/users.json";
import projectList from "../fixtures/projects.json";
import { generateJwt } from "../../api/utils";
import { type Project, type User } from "../../types";

const users = [...userList] as User[];
const projects = [...projectList] as Project[];

users.forEach((user) => {
  const userProjects = projects.filter((v) => v.user_ids.includes(user.id));

  describe(`dashboard-layout for ${user.name}`, () => {
    beforeEach(() => {
      const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");
      const domain = Cypress.env("VITE_COOKIE_DOMAIN");
      const cookieName = Cypress.env("VITE_COOKIE_NAME");
      const secret = Cypress.env("JWT_SECRET");
      const audience = Cypress.env("AUTH_AUDIENCE");
      const cookieExpiry = Math.round((new Date().getTime() + 800_000) / 1000);

      cy.intercept("GET", `${apiBaseUrl}/devices`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects`).as("my-project-list");
      cy.intercept("GET", `${apiBaseUrl}/me/jobs`).as("my-jobs-list");
      cy.intercept("POST", `${apiBaseUrl}/auth/logout`).as("logout");

      if (user.id) {
        cy.wrap(generateJwt(user, cookieExpiry, { secret, audience })).then(
          (jwtToken) => {
            cy.setCookie(cookieName, jwtToken as string, {
              domain,
              httpOnly: true,
              secure: false,
              sameSite: "lax",
            });
          }
        );
      }

      cy.visit("/");
      cy.wait("@my-project-list");
      cy.wait("@devices-list");
    });

    it("renders the sidebar in desktop mode", () => {
      cy.viewport(1080, 720);
      cy.get("[data-testid='sidebar']").should("be.visible");
      cy.get("[data-testid='sidebar']").within(() => {
        cy.contains("WACQT").should("be.visible");
        cy.contains(/Wallenberg Centre for Quantum Technology/i).should(
          "be.visible"
        );
        cy.get("nav")
          .contains(/dashboard/i)
          .should("be.visible");
        cy.get("nav")
          .contains(/devices/i)
          .should("be.visible");

        // collapse button
        cy.get("[aria-label='PanelLeftClose']").should("be.visible");
      });
    });

    it("renders the mobile-menu in mobile mode", () => {
      cy.viewport(320, 400);
      cy.contains("button", "Toggle Menu").should("be.visible");

      cy.get('[data-testid="mobile-menu"]').should("not.exist");

      cy.contains("button", "Toggle Menu").click();

      cy.get('[data-testid="mobile-menu"]').within(() => {
        cy.get("nav")
          .contains(/dashboard/i)
          .should("be.visible");
        cy.get("nav")
          .contains(/devices/i)
          .should("be.visible");
      });
    });

    it("renders the collapsed sidebar when collapse button is pressed", () => {
      cy.get("[data-testid='sidebar']").within(() => {
        cy.get("nav")
          .contains("div", /dashboard/i)
          .should("have.text", "DashboardDashboard");
        cy.get("nav")
          .contains("div", /devices/i)
          .should("have.text", "DevicesDevices");
        cy.get("[aria-label='PanelLeftClose']").should("be.visible");
        cy.get("[aria-label='PanelRightClose']").should("not.exist");

        cy.get("[aria-label='PanelLeftClose']").parent().click();

        cy.get("[aria-label='PanelLeftClose']").should("not.exist");
        cy.get("[aria-label='PanelRightClose']").should("be.visible");

        cy.get("nav [aria-label='Home']").should("be.visible");
        cy.get("nav [aria-label='Cpu']").should("be.visible");
        cy.get("nav")
          .contains("div", /dashboard/i)
          .should("have.text", "Dashboard");
        cy.get("nav")
          .contains("div", /devices/i)
          .should("have.text", "Devices");

        cy.get("[aria-label='PanelRightClose']").parent().click();

        cy.get("[aria-label='PanelLeftClose']").should("be.visible");
        cy.get("[aria-label='PanelRightClose']").should("not.exist");

        cy.get("nav [aria-label='Home']").should("be.visible");
        cy.get("nav [aria-label='Cpu']").should("be.visible");

        cy.get("nav")
          .contains("div", /dashboard/i)
          .should("have.text", "DashboardDashboard");
        cy.get("nav")
          .contains("div", /devices/i)
          .should("have.text", "DevicesDevices");
      });
    });

    it("renders the topbar", () => {
      cy.get('[data-testid="topbar"]').within(() => {
        cy.contains(/project:/i).should("be.visible");
        cy.get("[aria-label='UserRound']").should("be.visible");
      });
    });

    it("renders the topbanner", () => {
      cy.get('[data-testid="top-banner"]').within(() => {
        cy.contains(/api token/i).should("be.visible");
        cy.get("input").should("be.visible");
        cy.get("[aria-label='RefreshCcw']").should("be.visible");
        cy.get("[aria-label='Copy']").should("be.visible");
      });
    });

    it("logout button logs current user out", () => {
      cy.get("[data-testid='topbar'] [aria-label='UserRound']").click({
        force: true,
      });
      cy.contains(/logout/i).click();
      cy.wait("@logout");
      cy.url().should("equal", "http://127.0.0.1:5173/login");
    });

    it("current project can be selected from list of projects", () => {
      cy.get('[data-testid="topbar"]')
        .contains("button", /project:/i)
        .as("projectSelectBtn");
      cy.get("@projectSelectBtn").should(
        "have.text",
        "Project: Select project"
      );

      for (const project of userProjects) {
        cy.get("@projectSelectBtn").click();
        cy.get(`[data-cy-project='${project.name}']`).should("be.visible");
        cy.get(`[data-cy-project='${project.name}']`).click();
        cy.get("@projectSelectBtn").should(
          "have.text",
          `Project: ${project.name}`
        );
      }
    });

    it("generates new api token on token-refresh button click", () => {
      cy.get('[data-testid="topbar"]')
        .contains("button", /project:/i)
        .as("projectSelectBtn");

      cy.get('[data-testid="top-banner"] [aria-label="RefreshCcw"]').as(
        "newTokenBtn"
      );

      cy.get('[data-testid="top-banner"] input#api-token').as("appTokenInput");

      for (const project of userProjects) {
        cy.get("@projectSelectBtn").click();
        cy.get("[data-radix-popper-content-wrapper]")
          .contains(project.name)
          .click()
          .then(() => {
            cy.get("@newTokenBtn")
              .click()
              .then(() => {
                cy.get("@appTokenInput")
                  .invoke("val")
                  .then((value) => expect(value).not.to.eql(""));
              });
          });
      }
    });

    it("copies current api token on token-copy button click", () => {
      cy.get('[data-testid="topbar"]')
        .contains("button", /project:/i)
        .as("projectSelectBtn");

      cy.get('[data-testid="top-banner"] [aria-label="RefreshCcw"]').as(
        "newTokenBtn"
      );

      cy.get('[data-testid="top-banner"] [aria-label="Copy"]').as("copyBtn");

      cy.get('[data-testid="top-banner"] input#api-token').as("appTokenInput");

      for (const project of userProjects) {
        cy.get("@projectSelectBtn").click();
        cy.get("[data-radix-popper-content-wrapper]")
          .contains(project.name)
          .click();
        cy.get("@newTokenBtn").click();
        cy.get("@copyBtn").focus().click();
        cy.clipboard().then((text) => {
          cy.get("@appTokenInput")
            .invoke("val")
            .then((value) => expect(value).to.eql(text));
        });
      }
    });
  });
});
