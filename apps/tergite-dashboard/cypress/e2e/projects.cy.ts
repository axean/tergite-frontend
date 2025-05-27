/// <reference types="cypress" />
/// <reference types="cypress-real-events" />

import userList from "../fixtures/users.json";
import tokenList from "../fixtures/tokens.json";
import projectList from "../fixtures/projects.json";
import userRequestList from "../fixtures/user-requests.json";
import { bulkUpdate, generateJwt, getUsername } from "../../api/utils";
import {
  type QpuTimeExtensionUserRequest,
  type Project,
  type User,
  UserRequestType,
} from "../../types";

const projects = [...projectList] as Project[];
const qpuTimeRequests = userRequestList.filter(
  (v) => v.type === UserRequestType.PROJECT_QPU_SECONDS
) as QpuTimeExtensionUserRequest[];
const qpuTimeRequestsProjectsMap = Object.fromEntries(
  qpuTimeRequests.map((v) => [v.request.project_id, { ...v }])
);

const updatedTokenList = bulkUpdate(tokenList, {
  created_at: new Date().toISOString(),
});
const userIds = updatedTokenList.map((v) => v.user_id);
const users = userList.filter((v) => userIds.includes(v.id)) as User[];

const projectsTableHeaders = [
  "Name",
  "External ID",
  "Status",
  "Available QPU time",
  "Requests",
];
const projectsTableDataProps = [
  "name",
  "ext_id",
  "is_active",
  "qpu_seconds",
  "requests",
];

users.forEach((user) => {
  const username = getUsername(user);
  const userProjects = projects.filter((v) => v.user_ids.includes(user.id));

  describe(`normal user projects page for ${username}`, () => {
    const dashboardUrl = Cypress.config("baseUrl");

    beforeEach(() => {
      const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");
      const dbResetUrl = Cypress.env("DB_RESET_URL");
      const domain = Cypress.env("VITE_COOKIE_DOMAIN");
      const cookieName = Cypress.env("VITE_COOKIE_NAME");
      const secret = Cypress.env("JWT_SECRET");
      const audience = Cypress.env("AUTH_AUDIENCE");
      const cookieExpiry = Math.round((new Date().getTime() + 800_000) / 1000);

      cy.intercept("GET", `${apiBaseUrl}/devices/*`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects/?is_active=true`).as(
        "my-active-project-list"
      );
      cy.intercept("GET", `${apiBaseUrl}/me/projects/?*`).as("my-project-list");
      cy.intercept("GET", `${apiBaseUrl}/me`).as("my-user-info");
      cy.intercept("GET", `${apiBaseUrl}/admin/qpu-time-requests/*`).as(
        "my-qpu-requests-list"
      );
      cy.intercept("POST", `${apiBaseUrl}/admin/qpu-time-requests/*`).as(
        "qpu-requests-create"
      );
      cy.intercept("DELETE", `${apiBaseUrl}/admin/qpu-time-requests/*`).as(
        "qpu-requests-delete"
      );

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

      cy.visit("/projects");
      cy.wait("@my-user-info");
      cy.wait("@my-active-project-list");
      cy.wait("@my-project-list");
    });

    it("renders the projects page when nav item is clicked", () => {
      cy.visit("/");
      cy.wait("@my-user-info");
      cy.url().should("equal", dashboardUrl);

      cy.get("[data-testid='topbar'] [aria-label='UserRound']").click({
        force: true,
      });
      cy.contains(
        '[data-radix-popper-content-wrapper] [role="menuitem"]',
        /projects/i
      ).click();
      cy.url().should("equal", `${dashboardUrl}projects`);
    });

    it("renders all user's projects", () => {
      cy.viewport(1080, 750);
      cy.wait(100);
      cy.contains(".bg-card", /projects/i).within(() => {
        cy.get("table").as("project-list-table");

        // header
        cy.get("@project-list-table")
          .get("thead th")
          .each((el, idx) => {
            expect(el.text()).to.eql(projectsTableHeaders[idx]);
          });

        // body
        cy.get("@project-list-table")
          .get("tbody")
          .within(() => {
            cy.get("tr").each((el, idx) => {
              cy.wrap({ el, idx }).then((obj) => {
                const project = userProjects[obj.idx];

                if (project) {
                  cy.wrap(obj.el).within(() => {
                    cy.get("td").each((td, cellIdx) => {
                      cy.wrap({ td, project, idx: cellIdx }).then((cell) => {
                        const prop = projectsTableDataProps[cell.idx];
                        if (prop === "qpu_seconds") {
                          expect(cell.td.text()).to.match(
                            // '1 day' or '2 days 2 hours'
                            /(\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+/i
                          );
                        } else if (prop === "is_active") {
                          const statusText = cell.project[prop]
                            ? /live/i
                            : /expired/i;
                          expect(cell.td.text()).to.match(statusText);
                        } else if (prop === "requests") {
                          if (cell.project.admin_id !== user.id) {
                            cy.wrap(cell.td).contains("div", /n\/a/i);
                          } else if (
                            qpuTimeRequestsProjectsMap[project.id]?.status ===
                            "pending"
                          ) {
                            cy.wrap(cell.td)
                              .contains("button", /request pending/i)
                              .should("be.disabled");
                          } else {
                            cy.wrap(cell.td)
                              .contains("button", /more qpu time/i)
                              .should("not.be.disabled");
                          }
                        } else {
                          expect(cell.td.text()).to.eql(
                            `${cell.project[prop]}`
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

    it("filters the list of projects", () => {
      const filterMaps = [
        {
          input: { name: "ate" },
          result: userProjects.filter((v) => /ate/i.test(v.name)),
        },
        {
          input: { name: "te", is_active: true },
          result: userProjects.filter((v) => /te/i.test(v.name) && v.is_active),
        },
        {
          input: { ext_id: "est1" },
          result: userProjects.filter((v) => /est1/i.test(v.ext_id)),
        },
        {
          input: { name: "te", is_active: false },
          result: userProjects.filter(
            (v) => /te/i.test(v.name) && !v.is_active
          ),
        },
        {
          input: { is_active: false },
          result: userProjects.filter((v) => !v.is_active),
        },
        {
          input: { is_active: true },
          result: userProjects.filter((v) => v.is_active),
        },
        {
          input: { name: "te", is_active: true, ext_id: "test2" },
          result: projects.filter(
            (v) => /te/i.test(v.name) && v.is_active && /test2/i.test(v.ext_id)
          ),
        },
      ];

      cy.viewport(1080, 750);
      cy.get(".bg-card table").as("project-list-table");
      cy.get(".bg-card [aria-label='Filter']").as("filterBtn");

      cy.get("@filterBtn")
        .click()
        .then(() => {
          cy.get("[data-cy-filter-form] input[name='name']").as("nameInput");
          cy.get("[data-cy-filter-form] input[name='ext_id']").as("extIdInput");
          cy.get("[data-cy-filter-form] button[role='combobox']").as(
            "isActiveSelect"
          );
          cy.get("[data-cy-filter-form] button[type='submit']").as("submitBtn");
          cy.get("[data-cy-filter-form] button[type='reset']").as("clearBtn");

          for (const filterMap of filterMaps) {
            cy.wrap(filterMap).then(({ input, result }) => {
              input.name && cy.get("@nameInput").type(input.name);
              input.ext_id && cy.get("@extIdInput").type(input.ext_id);
              input.is_active !== undefined &&
                cy
                  .get("@isActiveSelect")
                  .click()
                  .then(() => {
                    cy.get("[data-cy-project-status-select]").within(() => {
                      const statusText = input.is_active ? /live/i : /expired/i;
                      cy.contains(statusText).click();
                    });
                  });
              cy.get("@submitBtn")
                .click()
                .then(() => {
                  cy.get("@project-list-table")
                    .find("tbody tr")
                    .should("have.length", result.length || 1);

                  for (const project of result) {
                    cy.wrap(project).then((project) => {
                      cy.get("@project-list-table").within(() =>
                        cy
                          .get("tr td:first-child")
                          .contains(project.name)
                          .should("be.visible")
                      );
                    });
                  }

                  cy.get("@clearBtn")
                    .click()
                    .then(() => {
                      cy.get("@project-list-table")
                        .find("tbody tr")
                        .should("have.length", userProjects.length || 1);

                      for (const project of userProjects) {
                        cy.wrap(project).then((project) => {
                          cy.get("@project-list-table").within(() =>
                            cy
                              .get("tr td:first-child")
                              .contains(project.name)
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

    it("renders sidebar placeholder by default", () => {
      cy.viewport(1080, 750);
      // project summary should not exist
      cy.get("#project-summary").should("not.exist");
      cy.contains("#sidebar-placeholder h3", /project title/i).should(
        "be.visible"
      );
      cy.contains(
        "#sidebar-placeholder .font-semibold",
        /project details/i
      ).should("be.visible");
      cy.contains(
        "#sidebar-placeholder .text-muted-foreground",
        /click any row to show details here/i
      ).should("be.visible");
    });

    it("renders user's project' summary when row is clicked", () => {
      cy.viewport(1080, 750);
      cy.wait(100);
      cy.get(".bg-card tbody tr").each((el, idx) => {
        cy.wrap({ el, idx }).then((obj) => {
          const project = userProjects[obj.idx];

          if (project) {
            cy.wrap(obj.el).realClick();

            // sidebar placeholder should not exist
            cy.get("#sidebar-placeholder").should("not.exist");

            cy.contains("#project-summary h3", project.name).should(
              "be.visible"
            );

            cy.contains("#project-summary div", /external id/i).within(() => {
              cy.contains(project.ext_id).should("be.visible");
            });

            cy.contains("#project-summary div", /status/i).within(() => {
              const statusText = project.is_active ? /live/i : /expired/i;
              cy.contains(statusText).should("be.visible");
            });

            cy.contains("#project-summary div", /available qpu time/i).within(
              () => {
                cy.contains(
                  /(\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+/i
                ).should("be.visible");
              }
            );

            cy.contains("#project-summary div", /created at/i).within(() => {
              cy.contains(
                /(in)? (\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+( ago)?/i
              ).should("be.visible");
            });

            if (project.admin_id === user.id) {
              // only members that are admins of the project can see the delete button
              cy.contains("#project-summary button", /delete/i).should(
                "be.visible"
              );
            } else {
              // members who are not admins of the project cannot delete it
              cy.contains("#project-summary button", /delete/i).should(
                "not.exist"
              );
            }
          }
        });
      });
    });

    it("deleting of project by admin of project removes project from list and summary", () => {
      cy.viewport(1080, 750);

      for (const project of userProjects) {
        cy.wrap(project).then((project) => {
          cy.contains(".bg-card tbody tr", project.name).click();
          cy.contains("#project-summary h3", project.name).should("be.visible");

          cy.contains(".bg-card tbody td", project.name).should("be.visible");

          if (project.admin_id === user.id) {
            // only members that are admins of the project can delete it
            cy.contains("#project-summary button", /delete/i).realClick();

            cy.contains(
              "#delete-project-dialog button",
              /I want to delete this project/i
            ).click();

            cy.get("#delete-project-dialog").should("not.exist");
            cy.contains(".bg-card tbody td", project.name).should("not.exist");
            cy.get("#project-summary").should("not.exist");
          }
        });
      }
    });

    it("requesting for more QPU time for project updates the request to 'pending'", () => {
      cy.viewport(1080, 750);

      for (let index = 0; index < userProjects.length; index++) {
        cy.wrap(index).then((index) => {
          const project = userProjects[index];

          // only projects with no pending requests and with current user as admin of project
          if (
            qpuTimeRequestsProjectsMap[project.id]?.status !== "pending" &&
            project.admin_id === user.id
          ) {
            cy.contains(
              `.bg-card tbody tr[data-id='${index}']`,
              project.name
            ).click();

            cy.contains(
              `.bg-card tbody tr[data-id='${index}'] td[data-header='requests'] button`,
              /more qpu time/i
            ).click();

            // set 1 day
            cy.get("#qpu-time-dialog input[name='days']").clear().type("1");

            // set 20 hours
            cy.get("#qpu-time-dialog input[name='hours']").clear().type("20");

            // set 3 minutes
            cy.get("#qpu-time-dialog input[name='minutes']").clear().type("3");

            // set 10 seconds
            cy.get("#qpu-time-dialog input[name='seconds']").clear().type("10");

            // set some reason
            cy.get("#qpu-time-dialog textarea[name='reason']")
              .clear()
              .type("just some reason");

            // save
            cy.contains(
              "#qpu-time-dialog button[type='submit']",
              /submit/i
            ).click();

            cy.get("#qpu-time-dialog").should("not.exist");

            // table updated
            cy.contains(
              `.bg-card tbody tr[data-id='${index}'] td[data-header='requests'] button`,
              /request pending/i
            ).should("be.disabled");
          }
        });
      }
    });

    it("requesting for more QPU time for project that has pending qpu time requests is not allowed", () => {
      cy.viewport(1080, 750);

      for (let index = 0; index < userProjects.length; index++) {
        cy.wrap(index).then((index) => {
          const project = userProjects[index];

          // projects with pending requests and with current user as admin of project
          if (
            qpuTimeRequestsProjectsMap[project.id]?.status !== "pending" &&
            project.admin_id === user.id
          ) {
            cy.contains(
              `.bg-card tbody tr[data-id='${index}'] td[data-header='requests'] button`,
              /request pending/i
            ).should("be.disabled");
          }
        });
      }
    });
  });
});
