/// <reference types="cypress" />

import userList from "../fixtures/users.json";
import deviceList from "../fixtures/device-list.json";
import jobList from "../fixtures/jobs.json";
import { generateJwt } from "../../api/utils";
import { type Device, type Job, type User } from "../../types";

const users = [...userList] as User[];
const devices = [...deviceList] as Device[];
const jobs = [...jobList] as Job[];

// FIXME: Should the jobs be specific to only the current project?

const visibleDevices = devices.slice(0, 3);
const onlineDevices = devices.filter((v) => v.is_online);

users.forEach((user) => {
  const userJobs = jobs.filter((v) => v.user_id === user.id);
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

    it("renders the device online status chart", () => {
      const percentOnline = Math.round(
        (onlineDevices.length / devices.length) * 100
      );
      cy.contains(".bg-card", /devices online/i)
        .contains("svg", `${percentOnline}%`)
        .should("have.attr", "aria-valuenow", `${percentOnline}`);
    });

    it("renders the first 3 devices", () => {
      cy.viewport(1080, 750);
      cy.contains(".bg-card", /list of available devices/i).within(() => {
        cy.get("table").as("device-list-table");

        // header
        const headers = ["Device", "Qubits", "Status", "Last Seen"];
        cy.get("@device-list-table")
          .get("thead")
          .get("th")
          .each((el, idx) => {
            expect(el.text()).to.eql(headers[idx]);
          });

        // body
        const rowProps = [
          "name",
          "number_of_qubits",
          "is_online",
          "last_online",
        ];
        cy.get("@device-list-table")
          .get("tbody")
          .within(() => {
            cy.get("tr").each((el, idx) => {
              cy.wrap({ el, idx }).then((obj) => {
                const device = visibleDevices[obj.idx];

                cy.wrap(obj.el).within(() => {
                  cy.get("td").each((td, cellIdx) => {
                    cy.wrap({ td, device, idx: cellIdx }).then((cell) => {
                      const prop = rowProps[cell.idx];
                      if (prop === "is_online") {
                        const statusText = cell.device[prop]
                          ? /online/i
                          : /offline/i;
                        expect(cell.td.text()).to.match(statusText);
                      } else if (prop === "last_online") {
                        expect(cell.td.text()).to.match(
                          cell.device.last_online
                            ? /\d+ (seconds)|(minutes)|(hours)|(days)|(weeks)|(months)|(years) ago/i
                            : /N\/A/i
                        );
                      } else {
                        expect(cell.td.text()).to.eql(`${cell.device[prop]}`);
                      }
                    });
                  });
                });
              });
            });
          });
      });
    });

    it("renders the list of jobs", () => {
      cy.viewport(1080, 750);
      cy.contains(".bg-card", /status of your jobs/i).within(() => {
        cy.get("table").as("job-list-table");

        // header
        const headers = [
          "Job ID",
          "Device",
          "Duration",
          "Created at",
          "Status",
        ];
        cy.get("@job-list-table")
          .get("thead")
          .get("th")
          .each((el, idx) => {
            expect(el.text()).to.eql(headers[idx]);
          });

        // body
        const rowProps = [
          "job_id",
          "device",
          "duration_in_secs",
          "created_at",
          "status",
        ];
        cy.get("@job-list-table")
          .get("tbody")
          .within(() => {
            cy.get("tr").each((el, idx) => {
              cy.wrap({ el, idx }).then((obj) => {
                const job = userJobs[obj.idx];

                if (job) {
                  cy.wrap(obj.el).within(() => {
                    cy.get("td").each((td, cellIdx) => {
                      cy.wrap({ td, job, idx: cellIdx }).then((cell) => {
                        const prop = rowProps[cell.idx];
                        if (prop === "created_at") {
                          expect(cell.td.text()).to.match(
                            // FIXME: Not the right regx for ~ 'Oct 14, 1983, 9:30 AM' but might work
                            /\d+ \w+ \d+, \d+:\d+/i
                          );
                        } else if (prop === "duration_in_secs") {
                          expect(cell.td.text()).to.match(
                            cell.job.duration_in_secs
                              ? // FIXME: Not the right regx for ~ '1 days, 2 minutes, 30 seconds' but might work
                                /(\d+ (seconds)|(minutes)|(hours)|(days)|(weeks)|(months)|(years),?)+/i
                              : /N\/A/i
                          );
                        } else {
                          expect(cell.td.text()).to.eql(`${cell.job[prop]}`);
                        }
                      });
                    });
                  });
                } else {
                  cy.wrap(obj.el).within(() => {
                    cy.contains("td", /no results/i).should("be.visible");
                  });
                }
              });

              // cy.wrap(el)
              // .get("td")
              // .each((td, cellIdx) => {
              //   const prop = rowProps[cellIdx];
              //   if (prop === "created_at") {
              //     expect(td.text()).to.match(
              //       // FIXME: Not the right regx for ~ 'Oct 14, 1983, 9:30 AM' but might work
              //       /\w+ \d+, \d+, \d+:\d+ (AM)|(AM)/i
              //     );
              //   } else if (prop === "duration_in_secs") {
              //     expect(td.text()).to.match(
              //       // FIXME: Not the right regx for ~ '1 days, 2 minutes, 30 seconds' but might work
              //       /(\d+ (seconds)|(minutes)|(hours)|(days)|(weeks)|(months)|(years),?)+/i
              //     );
              //   } else {
              //     expect(td.text()).to.eql(userJobs[idx][prop]);
              //   }
              // });
            });
          });
      });
    });

    // it("filters the list of jobs", () => {
    //   // open the filter modal
    //   // input the filter options
    //   // check that only the filtered rows show up
    //   // filter by device
    //   // filter by status
    //   // filter by job id
    // });

    // it("renders the details of each job", () => {});
  });
});
