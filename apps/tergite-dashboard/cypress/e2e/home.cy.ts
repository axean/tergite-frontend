/// <reference types="cypress" />
/// <reference types="cypress-real-events" />

import userList from "../fixtures/users.json";
import deviceList from "../fixtures/device-list.json";
import jobList from "../fixtures/jobs.json";
import projectList from "../fixtures/projects.json";
import { generateJwt, getUsername } from "../../api/utils";
import { type Project, type Device, type Job, type User } from "../../types";

const users = [...userList] as User[];
const devices = [...deviceList] as Device[];
const jobs = [...jobList] as Job[];
const projects = [...projectList] as Project[];

const visibleDevices = devices.slice(0, 3);
const onlineDevices = devices.filter((v) => v.is_online);

users.forEach((user) => {
  const jobTableHeaders = [
    "Job ID",
    "Device",
    "Duration",
    "Created at",
    "Status",
  ];
  const jobTableDataProps = [
    "job_id",
    "device",
    "duration_in_secs",
    "created_at",
    "status",
  ];

  let refetchIntervalMs: number;
  const userProjects = projects.filter(
    (v) => v.user_ids.includes(user.id) && v.is_active
  );
  const username = getUsername(user);
  const allUserJobs = jobs
    .filter((v) => v.user_id === user.id)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  describe(`home page for ${username}`, () => {
    beforeEach(() => {
      const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");
      const dbResetUrl = Cypress.env("DB_RESET_URL");
      const domain = Cypress.env("VITE_COOKIE_DOMAIN");
      const cookieName = Cypress.env("VITE_COOKIE_NAME");
      const secret = Cypress.env("JWT_SECRET");
      const audience = Cypress.env("AUTH_AUDIENCE");
      refetchIntervalMs = parseFloat(Cypress.env("VITE_REFETCH_INTERVAL_MS"));
      const cookieExpiry = Math.round((new Date().getTime() + 800_000) / 1000);

      cy.intercept("GET", `${apiBaseUrl}/devices/*`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects/?is_active=true`).as(
        "my-project-list"
      );
      cy.intercept("GET", `${apiBaseUrl}/me/jobs/*`).as("my-jobs-list");

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

      // We need to reset the mongo database before each test
      cy.request(`${dbResetUrl}`);
      cy.wait(500);

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
                            ? /\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?) ago/i
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

    it("renders the list of all user's jobs with no project selected", () => {
      cy.viewport(1080, 750);
      cy.contains(".bg-card", /status of your jobs in all projects/i).within(
        () => {
          cy.get("table").as("job-list-table");

          // header
          cy.get("@job-list-table")
            .get("thead th")
            .each((el, idx) => {
              expect(el.text()).to.eql(jobTableHeaders[idx]);
            });

          // body
          cy.get("@job-list-table")
            .get("tbody")
            .within(() => {
              cy.get("tr").each((el, idx) => {
                cy.wrap({ el, idx }).then((obj) => {
                  const job = allUserJobs[obj.idx];

                  if (job) {
                    cy.wrap(obj.el).within(() => {
                      cy.get("td").each((td, cellIdx) => {
                        cy.wrap({ td, job, idx: cellIdx }).then((cell) => {
                          const prop = jobTableDataProps[cell.idx];
                          if (prop === "created_at") {
                            expect(cell.td.text()).to.match(
                              // FIXME: Not the right regx for ~ 'Oct 14, 1983, 9:30 AM' but might work
                              /\d+ \w+ \d+, \d+:\d+ ?(AM)|(PM)?/i
                            );
                          } else if (prop === "duration_in_secs") {
                            expect(cell.td.text()).to.match(
                              cell.job.duration_in_secs
                                ? // FIXME: Not the right regx for ~ '1 days, 2 minutes, 30 seconds' but might work
                                  /(\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+/i
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
              });
            });
        }
      );
    });

    it("renders the list of user's jobs in selected project", () => {
      cy.viewport(1080, 750);
      cy.wait(500);
      for (const project of userProjects) {
        cy.wrap(project).then((project) => {
          cy.contains('[data-testid="topbar"] button', /project:/i).realClick();
          cy.contains('#project-selector [role="option"]', project.name, {
            timeout: 500,
          }).realClick();

          const jobsForProject = allUserJobs.filter(
            (v) => v.project_id === project.id
          );
          cy.wrap({ jobs: jobsForProject, project }).then((params) => {
            cy.contains(
              ".bg-card",
              new RegExp(`status of your jobs in ${params.project.name}`, "i")
            ).within(() => {
              cy.get("table").as("job-list-table");

              // header
              cy.get("@job-list-table")
                .get("thead th")
                .each((el, idx) => {
                  expect(el.text()).to.eql(jobTableHeaders[idx]);
                });

              // body
              cy.get("@job-list-table")
                .get("tbody")
                .within(() => {
                  cy.get("tr").each((el, idx) => {
                    cy.wrap({ el, idx }).then((obj) => {
                      const job = params.jobs[obj.idx];

                      if (job) {
                        cy.wrap(obj.el).within(() => {
                          cy.get("td").each((td, cellIdx) => {
                            cy.wrap({ td, job, idx: cellIdx }).then((cell) => {
                              const prop = jobTableDataProps[cell.idx];
                              if (prop === "created_at") {
                                expect(cell.td.text()).to.match(
                                  // FIXME: Not the right regx for ~ 'Oct 14, 1983, 9:30 AM' but might work
                                  /\d+ \w+ \d+, \d+:\d+ ?(AM)|(PM)?/i
                                );
                              } else if (prop === "duration_in_secs") {
                                expect(cell.td.text()).to.match(
                                  cell.job.duration_in_secs
                                    ? // FIXME: Not the right regx for ~ '1 days, 2 minutes, 30 seconds' but might work
                                      /(\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+/i
                                    : /N\/A/i
                                );
                              } else {
                                expect(cell.td.text()).to.eql(
                                  `${cell.job[prop]}`
                                );
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
                  });
                });
            });
          });
        });
      }
    });

    it("refreshes device list every after the refresh interval", () => {
      for (let i = 0; i < 3; i++) {
        cy.wait("@devices-list", { timeout: 1.5 * refetchIntervalMs });
      }
    });

    it("refreshes jobs list every after the refresh interval", () => {
      for (let i = 0; i < 3; i++) {
        cy.wait("@my-jobs-list", { timeout: 1.5 * refetchIntervalMs });
      }
    });

    it("filters the list of jobs", () => {
      const filterMaps = [
        {
          input: { device: "lo" },
          result: allUserJobs.filter((v) =>
            v.device.toLowerCase().startsWith("lo")
          ),
        },
        {
          input: { device: "lo", job_id: "1" },
          result: allUserJobs.filter(
            (v) =>
              v.device.toLowerCase().startsWith("lo") &&
              v.job_id.startsWith("1")
          ),
        },
        {
          input: { job_id: "6" },
          result: allUserJobs.filter((v) => v.job_id.startsWith("6")),
        },
        {
          input: { device: "lo", status: "failed" },
          result: allUserJobs.filter(
            (v) =>
              v.device.toLowerCase().startsWith("lo") && v.status === "failed"
          ),
        },
        {
          input: { status: "pending" },
          result: allUserJobs.filter((v) => v.status === "pending"),
        },
        {
          input: { status: "successful" },
          result: allUserJobs.filter((v) => v.status === "successful"),
        },
        {
          input: { device: "lo", status: "pending", job_id: "4" },
          result: allUserJobs.filter(
            (v) =>
              v.device.toLowerCase().startsWith("lo") &&
              v.job_id.startsWith("4") &&
              v.status === "pending"
          ),
        },
      ];

      cy.viewport(1080, 750);
      cy.contains("table", /Job ID/i).as("job-list-table");
      cy.get("[aria-label='Filter']").as("filterBtn");

      cy.get("@filterBtn")
        .click()
        .then(() => {
          cy.get("[data-cy-filter-form] input[name='job_id']").as("jobIdInput");
          cy.get("[data-cy-filter-form] input[name='device']").as(
            "deviceInput"
          );
          cy.get("[data-cy-filter-form] button[role='combobox']").as(
            "statusSelect"
          );
          cy.get("[data-cy-filter-form] button[type='submit']").as("submitBtn");
          cy.get("[data-cy-filter-form] button[type='reset']").as("clearBtn");

          for (const filterMap of filterMaps) {
            cy.wrap(filterMap).then(({ input, result }) => {
              input.job_id && cy.get("@jobIdInput").type(input.job_id);
              input.device && cy.get("@deviceInput").type(input.device);
              input.status &&
                cy
                  .get("@statusSelect")
                  .click()
                  .then(() => {
                    cy.get("[data-cy-job-status-select]").within(() => {
                      cy.contains(new RegExp(input.status, "i")).click();
                    });
                  });
              cy.get("@submitBtn")
                .click()
                .then(() => {
                  cy.get("@job-list-table")
                    .find("tbody tr")
                    .should("have.length", result.length || 1);

                  for (const job of result) {
                    cy.wrap(job).then((job) => {
                      cy.get("@job-list-table").within(() =>
                        cy
                          .get("tr td:first-child")
                          .contains(job.job_id)
                          .should("be.visible")
                      );
                    });
                  }

                  cy.get("@clearBtn")
                    .click()
                    .then(() => {
                      cy.get("@job-list-table")
                        .find("tbody tr")
                        .should("have.length", allUserJobs.length || 1);

                      for (const job of allUserJobs) {
                        cy.wrap(job).then((job) => {
                          cy.get("@job-list-table").within(() =>
                            cy
                              .get("tr td:first-child")
                              .contains(job.job_id)
                              .should("be.visible")
                          );
                        });
                      }
                    });
                });
            });
          }
        });
    });

    it("renders the details of each job", () => {
      cy.viewport(1080, 750);
      cy.contains("table", /Job ID/i).as("job-list-table");

      for (const job of allUserJobs) {
        cy.wrap(job).then((job) => {
          cy.get("@job-list-table")
            .within(() =>
              cy.get("tr td:first-child").contains(job.job_id).click()
            )
            .then(() => {
              cy.contains("[data-cy-job-detail]", /details about this job/i, {
                timeout: 10000,
              }).within(() => {
                const durationRegex = job.duration_in_secs
                  ? // FIXME: Not the right regx for ~ '1 days, 2 minutes, 30 seconds' but might work
                    /Duration:\s?(\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+/i
                  : /Duration:\s?N\/A/i;
                cy.contains(new RegExp(`Job:\\s?${job.job_id}`, "i")).should(
                  "be.visible"
                );
                cy.contains(new RegExp(`Status:\\s?${job.status}`, "i")).should(
                  "be.visible"
                );
                cy.contains(
                  /Created at:\s?\d+ \w+ \d+, \d+:\d+ ?(AM)|(PM)?/i
                ).should("be.visible");
                cy.contains(new RegExp(`Device:\\s?${job.device}`, "i")).should(
                  "be.visible"
                );
                cy.contains(durationRegex).should("be.visible");
                job.failure_reason &&
                  cy
                    .contains(
                      new RegExp(`Error:\\s?${job.failure_reason}`, "i")
                    )
                    .should("be.visible");

                // close the drawer
                cy.get('button[aria-label="X"]').click();
              });
            });
        });
      }
    });
  });
});
