/// <reference types="cypress" />

import userList from "../fixtures/users.json";
import deviceList from "../fixtures/device-list.json";
import { generateJwt } from "../../api/utils";
import { type Device, type User } from "../../types";

const users = [...userList] as User[];
const devices = [...deviceList] as Device[];

users.forEach((user) => {
  const username = user.email.split("@")[0];

  describe(`devices list page for ${username}`, () => {
    beforeEach(() => {
      const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");
      const domain = Cypress.env("VITE_COOKIE_DOMAIN");
      const cookieName = Cypress.env("VITE_COOKIE_NAME");
      const secret = Cypress.env("JWT_SECRET");
      const audience = Cypress.env("AUTH_AUDIENCE");
      const cookieExpiry = Math.round((new Date().getTime() + 800_000) / 1000);

      cy.intercept("GET", `${apiBaseUrl}/devices`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects`).as("my-project-list");

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

      cy.visit("/devices");
      cy.wait("@my-project-list");
      cy.wait("@devices-list");
    });

    it("renders the summaries of all devices", () => {
      cy.viewport(1080, 750);
      for (const device of devices) {
        cy.wrap(device).then((device) => {
          cy.contains(".bg-card", device.name).within(() => {
            const statusRegex = device.is_online ? /online/i : /offline/i;
            const lastOnlineRegex = device.last_online
              ? /\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?) ago/i
              : /N\/A/i;

            cy.contains(device.name).should("be.visible");
            cy.contains(statusRegex).should("be.visible");
            cy.contains("div", /last seen/i).within(() => {
              cy.contains(lastOnlineRegex).should("be.visible");
            });
            cy.contains("div", /qubits/i).within(() => {
              cy.contains(`${device.number_of_qubits}`).should("be.visible");
            });
          });
        });
      }
    });
  });
});
