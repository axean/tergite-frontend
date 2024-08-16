/// <reference types="cypress" />

import userList from "../fixtures/users.json";
import deviceList from "../fixtures/device-list.json";
import medianCalibrations from "../fixtures/median-calibrations.json";
import { generateJwt } from "../../api/utils";
import { type Device, type User } from "../../types";

const users = [...userList] as User[];
const devices = deviceList.slice(0, 3) as Device[];
const calibrationProperties: { [k: string]: RegExp } = {
  t1_decoherence: /t1 decoherence/i,
  t2_decoherence: /t2 decoherence/i,
  anharmonicity: /anharmonicity/i,
  frequency: /frequency/i,
  readout_assignment_error: /readout error/i,
};
const medianCalibrationsDataMap: {
  [k: string]: { t1: string; t2: string; readout_error: string };
} = { ...medianCalibrations };

users.forEach((user) => {
  devices.forEach((device) => {
    const calibrationMedians = medianCalibrationsDataMap[device.id];

    describe(`${device.name} device detail  for ${user.name}`, () => {
      beforeEach(() => {
        const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");
        const domain = Cypress.env("VITE_COOKIE_DOMAIN");
        const cookieName = Cypress.env("VITE_COOKIE_NAME");
        const secret = Cypress.env("JWT_SECRET");
        const audience = Cypress.env("AUTH_AUDIENCE");
        const cookieExpiry = Math.round(
          (new Date().getTime() + 800_000) / 1000
        );

        cy.intercept("GET", `${apiBaseUrl}/devices/${device.name}`).as(
          "devices-detail"
        );
        cy.intercept("GET", `${apiBaseUrl}/calibrations/${device.name}`).as(
          "calibrations-detail"
        );
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

        cy.visit(`/devices/${device.name}`);
        cy.wait("@my-project-list");
        cy.wait("@devices-detail");
        cy.wait("@calibrations-detail");
      });

      it("renders the summary of the device", () => {
        cy.viewport(1080, 750);
        cy.get("#device-summary").within(() => {
          // the header
          cy.contains(".grid", device.name).within(() => {
            cy.contains(device.name).should("be.visible");
            cy.contains(new RegExp(`version ${device.version}`, "i")).should(
              "be.visible"
            );
          });

          // the details body
          const statusRegex = device.is_online ? /online/i : /offline/i;
          const deviceTypeRegex = device.is_simulator
            ? /simulator/i
            : /physical/i;
          cy.contains(".grid", /details/i).within(() => {
            cy.contains("li", /status/i).within(() => {
              cy.contains(statusRegex).should("be.visible");
            });
            cy.contains("li", /basis gates/i).within(() => {
              cy.contains(device.basis_gates.join(", ")).should("be.visible");
            });
            cy.contains("li", /type/i).within(() => {
              cy.contains(deviceTypeRegex).should("be.visible");
            });
            cy.contains("li", /qubits/i).within(() => {
              cy.contains(`${device.number_of_qubits}`).should("be.visible");
            });
          });

          // the calibrations info
          cy.contains(".grid", /calibration information/i).within(() => {
            cy.contains("li", /median readout error/i).within(() => {
              cy.contains(calibrationMedians.readout_error).should(
                "be.visible"
              );
            });
            cy.contains("li", /median t1/i).within(() => {
              cy.contains(calibrationMedians.t1).should("be.visible");
            });
            cy.contains("li", /median t2/i).within(() => {
              cy.contains(calibrationMedians.t2).should("be.visible");
            });
          });

          // footer
          cy.contains("div", /last calibrated/i).within(() => {
            cy.contains(
              /last calibrated \d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?) ago/i
            ).should("be.visible");
          });
        });
      });

      it("renders the map view", () => {
        cy.viewport(1280, 750);
        for (const property of Object.keys(calibrationProperties)) {
          cy.wrap(property).then((property) => {
            const regex = calibrationProperties[property];

            cy.contains("button", /map view/i).click();
            cy.contains("button", /property:/i).click();
            cy.get("#prop-selector").within(() => {
              cy.contains(regex).as("item-btn");
              cy.get("@item-btn").click();
            });
            cy.get("#map-view").compareSnapshot({
              name: `map-view-for-${property}-of-${device.id}`,
              testThreshold: 0.3,
              retryOptions: {
                limit: 2,
                delay: 500,
              },
            });
          });
        }
      });

      it("renders the graph view", () => {
        cy.viewport(1280, 750);
        for (const property of Object.keys(calibrationProperties)) {
          cy.wrap(property).then((property) => {
            const regex = calibrationProperties[property];

            cy.contains("button", /graph view/i).click();
            cy.contains("button", /property:/i).click();
            cy.get("#prop-selector").within(() => {
              cy.contains(regex).as("item-btn");
              cy.get("@item-btn").click();
            });
            cy.get("#graph-view").compareSnapshot({
              name: `graph-view-for-${property}-of-${device.id}`,
              testThreshold: 0.3,
              retryOptions: {
                limit: 2,
                delay: 500,
              },
            });
          });
        }
      });

      it("renders the table view", () => {
        cy.viewport(1280, 750);
        cy.contains("button", /table view/i).click();
        cy.get("#table-view").compareSnapshot({
          name: `table-view-for-${device.id}`,
          testThreshold: 0.3,
          retryOptions: {
            limit: 2,
            delay: 500,
          },
        });
      });
    });
  });
});
