/// <reference types="cypress" />
/// <reference types="cypress-real-events" />

import userList from "../fixtures/users.json";
import projectList from "../fixtures/projects.json";
import { generateJwt, getUsername } from "../../api/utils";
import { type User, UserRole, type AdminProject } from "../../types";

// can create a new project
//    - updates the user's projects in the top bar
//    - updates the admin projects
//    - sets the current project being viewd as the newest project

const users = [...userList] as User[];
const userIdEmailMap = Object.fromEntries(users.map((v) => [v.id, v.email]));
const projects = [...projectList].map((v) => ({
  ...v,
  admin_email: userIdEmailMap[v.admin_id],
  user_emails: v.user_ids.map((id) => userIdEmailMap[id]),
  description: v.description ?? "",
})) as AdminProject[];

const projectsTableHeaders = ["Name", "Admin", "QPU seconds", "Status"];
const projectsTableDataProps = [
  "name",
  "admin_email",
  "qpu_seconds",
  "is_active",
];

users.forEach((user) => {
  const isAdmin = user.roles.includes(UserRole.ADMIN);
  const username = getUsername(user);

  describe(`admin projects page for ${username}`, () => {
    beforeEach(() => {
      const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");
      const domain = Cypress.env("VITE_COOKIE_DOMAIN");
      const cookieName = Cypress.env("VITE_COOKIE_NAME");
      const secret = Cypress.env("JWT_SECRET");
      const audience = Cypress.env("AUTH_AUDIENCE");
      const cookieExpiry = Math.round((new Date().getTime() + 800_000) / 1000);

      cy.intercept("GET", `${apiBaseUrl}/devices`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects`).as("my-project-list");
      cy.intercept("GET", `${apiBaseUrl}/me`).as("my-user-info");
      cy.intercept("GET", `${apiBaseUrl}/admin/projects*`).as("projects-list");
      cy.intercept("POST", `${apiBaseUrl}/admin/projects`).as("create-project");
      cy.intercept("PUT", `${apiBaseUrl}/admin/projects*`).as("update-project");
      cy.intercept("DELETE", `${apiBaseUrl}/admin/projects*`).as(
        "delete-project"
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

      cy.request(`${apiBaseUrl}/refreshed-db`);

      cy.visit("/admin-projects");
      cy.wait("@my-user-info");
      cy.wait("@my-project-list");
      isAdmin && cy.wait("@projects-list");
    });

    isAdmin &&
      it("renders the admin projects page when nav item is clicked", () => {
        cy.visit("/");
        cy.wait("@my-user-info");
        cy.url().should("equal", "http://127.0.0.1:5173/");

        cy.contains("[data-testid='sidebar'] a", /projects/i).click();
        cy.url().should("equal", "http://127.0.0.1:5173/admin-projects");
      });

    !isAdmin &&
      it("projects link in sidebar does not exist", () => {
        cy.visit("/");
        cy.wait("@my-user-info");
        cy.url().should("equal", "http://127.0.0.1:5173/");

        cy.contains("[data-testid='sidebar'] a", /projects/i).should(
          "not.exist"
        );
      });

    !isAdmin &&
      it("redirects to home when admin-projects URL is visited", () => {
        cy.url().should("equal", "http://127.0.0.1:5173/");
      });

    isAdmin &&
      it("renders all projects", () => {
        cy.viewport(1080, 750);
        cy.wait(200);
        cy.contains("#projects-table", /projects/i).within(() => {
          cy.get("table").as("projects-table");

          // header
          cy.get("@projects-table")
            .get("thead th")
            .each((el, idx) => {
              expect(el.text()).to.eql(projectsTableHeaders[idx]);
            });

          // body
          cy.get("@projects-table")
            .get("tbody")
            .within(() => {
              cy.get("tr").each((el, idx) => {
                cy.wrap({ el, idx }).then((obj) => {
                  const project = projects[obj.idx];

                  if (project) {
                    cy.wrap(obj.el).within(() => {
                      cy.get("td").each((td, cellIdx) => {
                        cy.wrap({ td, project, idx: cellIdx }).then((cell) => {
                          const prop = projectsTableDataProps[cell.idx];
                          if (prop === "is_active") {
                            const statusText = cell.project[prop]
                              ? /live/i
                              : /expired/i;
                            expect(cell.td.text()).to.match(statusText);
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

    isAdmin &&
      it("filters the list of projects", () => {
        const filterMaps = [
          {
            input: { name: "ate" },
            result: projects.filter((v) => /ate/i.test(v.name)),
          },
          {
            input: { name: "te", is_active: true },
            result: projects.filter((v) => /te/i.test(v.name) && v.is_active),
          },
          {
            input: { admin_email: "da" },
            result: projects.filter((v) => /da/i.test(v.admin_email)),
          },
          {
            input: { name: "te", is_active: false, admin_email: undefined },
            result: projects.filter((v) => /te/i.test(v.name) && !v.is_active),
          },
          {
            input: { is_active: false },
            result: projects.filter((v) => !v.is_active),
          },
          {
            input: { is_active: true },
            result: projects.filter((v) => v.is_active),
          },
          {
            input: { name: "te", is_active: true, admin_email: "ja" },
            result: projects.filter(
              (v) =>
                /te/i.test(v.name) && v.is_active && /ja/i.test(v.admin_email)
            ),
          },
        ];

        cy.viewport(1080, 750);
        cy.get("#projects-table table").as("project-list-table");
        cy.get("#projects-table [aria-label='Filter']").as("filterBtn");

        cy.get("@filterBtn")
          .click()
          .then(() => {
            cy.get("[data-cy-filter-form] input[name='name']").as("nameInput");
            cy.get("[data-cy-filter-form] input[name='admin_email']").as(
              "adminEmailInput"
            );
            cy.get("[data-cy-filter-form] button[role='combobox']").as(
              "isActiveSelect"
            );
            cy.get("[data-cy-filter-form] button[type='submit']").as(
              "submitBtn"
            );
            cy.get("[data-cy-filter-form] button[type='reset']").as("clearBtn");

            for (const filterMap of filterMaps) {
              cy.wrap(filterMap).then(({ input, result }) => {
                input.name && cy.get("@nameInput").type(input.name);
                input.admin_email &&
                  cy.get("@adminEmailInput").type(input.admin_email);
                input.is_active !== undefined &&
                  cy
                    .get("@isActiveSelect")
                    .click()
                    .then(() => {
                      cy.get("[data-cy-project-status-select]").within(() => {
                        const statusText = input.is_active
                          ? /live/i
                          : /expired/i;
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
                          .should("have.length", projects.length || 1);

                        for (const project of projects) {
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

    isAdmin &&
      it("renders project summary when row is clicked", () => {
        cy.viewport(1080, 750);
        cy.wait(100);
        cy.get("#projects-table tbody tr").each((el, idx) => {
          cy.wrap({ el, idx }).then((obj) => {
            const project = projects[obj.idx];

            if (project) {
              cy.wrap(obj.el).click();

              cy.contains("#project-summary h3", project.name).should(
                "be.visible"
              );

              cy.contains("#project-summary div", /name/i).within(() => {
                cy.get("input").should("have.value", project.name);
              });

              cy.contains("#project-summary div", /external id/i).within(() => {
                cy.contains(project.ext_id).should("be.visible");
              });

              cy.contains("#project-summary div", /description/i).within(() => {
                cy.get("textarea").should("contain.text", project.description);
              });

              cy.contains("#project-summary div", /live/i).within(() => {
                cy.get(
                  `button[role="switch"][data-state="${
                    project.is_active ? "checked" : "unchecked"
                  }"]`
                ).should("be.visible");
              });

              cy.contains("#project-summary div", /qpu seconds/i).within(() => {
                cy.get("input").should("have.value", `${project.qpu_seconds}`);
              });

              cy.contains("#project-summary div", /admin/i).within(() => {
                cy.get("input").should("have.value", project.admin_email);
              });

              cy.contains("#project-summary div", /members/i).within(() => {
                for (
                  let index = 0;
                  index < project.user_emails.length;
                  index++
                ) {
                  const email = project.user_emails[index];

                  cy.wrap({ index, email }).then(({ email, index }) => {
                    const wrapperId = `#user_emails-${index}-wrapper`;
                    const inputId = `#user_emails-${index}`;
                    const closeBtnId = `#user_emails-${index}-del-btn`;
                    cy.get(`${wrapperId} ${inputId}`).should(
                      "have.value",
                      email
                    );
                    cy.get(`${wrapperId} ${closeBtnId}[aria-label="X"]`).should(
                      "be.visible"
                    );
                  });
                }
                cy.get('button[aria-label="Plus"]').should("be.visible");
              });

              cy.contains("#project-summary div", /created/i).within(() => {
                cy.contains(
                  /(\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+( ago)?/i
                ).should("be.visible");
              });

              cy.contains("#project-summary div", /last updated/i).within(
                () => {
                  cy.contains(
                    /(\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+( ago)?/i
                  ).should("be.visible");
                }
              );

              cy.contains("#project-summary button", /update/i).should(
                "be.visible"
              );

              cy.contains("#project-summary button", /delete/i).should(
                "be.visible"
              );
            }
          });
        });
      });

    isAdmin &&
      it("editing project details updates the details of the project in the table and in the summary", () => {
        const testData: Partial<AdminProject>[] = [
          {
            admin_email: "david.doe@example.com",
            user_emails: undefined,
            is_active: true,
            name: "fooo bar",
            description: "fancy description",
            qpu_seconds: 36_000,
          },
          {
            admin_email: undefined,
            user_emails: ["tom.doe@example.com", "jane.doe@example.com"],
            is_active: false,
            name: "fenecansi owenyini",
            description: "Musa yateeza amajju",
            qpu_seconds: 340_000_000,
          },
          {
            admin_email: "john.doe@example.com",
            user_emails: ["paul.doe@example.com"],
            is_active: true,
            name: undefined,
            description: "Bulyomu akajunwa hwabwembazi za Ruhanga",
            qpu_seconds: undefined,
          },
          {
            admin_email: "new.user@xample.com",
            user_emails: [],
            is_active: false,
            name: "Mukama ahaisibwe",
            description: undefined,
            qpu_seconds: 1_000,
          },
        ];

        cy.viewport(1080, 750);
        cy.wait(100);
        cy.get("#projects-table tbody tr").each((el, idx) => {
          cy.wrap({ el, idx }).then((obj) => {
            const project = projects[obj.idx];
            const updates = testData[obj.idx % 4];
            const expected = Object.fromEntries(
              Object.entries(project).map(([k, v]) => [k, updates[k] ?? v])
            ) as AdminProject;
            expected.user_emails = [
              ...new Set([expected.admin_email, ...expected.user_emails]),
            ];

            if (project) {
              cy.wrap(obj.el).click();

              cy.contains("#project-summary h3", project.name).should(
                "be.visible"
              );

              cy.contains("#project-summary div", /name/i).within(() => {
                updates.name && cy.get("input").clear().type(updates.name);
              });

              cy.contains("#project-summary div", /external id/i).within(() => {
                cy.contains(project.ext_id).should("be.visible");
              });

              cy.contains("#project-summary div", /description/i).within(() => {
                updates.description &&
                  cy.get("textarea").clear().type(updates.description);
              });

              cy.contains("#project-summary div", /live/i).within(() => {
                if (
                  updates.is_active != undefined &&
                  project.is_active !== updates.is_active
                ) {
                  cy.get('button[role="switch"]').click();
                }
              });

              cy.contains("#project-summary div", /qpu seconds/i).within(() => {
                updates.qpu_seconds != undefined &&
                  cy.get("input").clear().type(`${updates.qpu_seconds}`);
              });

              cy.contains("#project-summary div", /admin/i).within(() => {
                updates.admin_email &&
                  cy.get("input").clear().type(updates.admin_email);
              });

              cy.contains("#project-summary div", /members/i).within(() => {
                if (updates.user_emails != undefined) {
                  for (let i = project.user_emails.length - 1; i >= 0; i--) {
                    // remove all users
                    cy.wrap({ i }).then(({ i }) => {
                      cy.get(
                        `#user_emails-${i}-del-btn[aria-label="X"]`
                      ).click();
                    });
                  }

                  // Add new user emails
                  for (let i = 0; i < updates.user_emails.length; i++) {
                    const newEmail = updates.user_emails[i];

                    cy.get('button[aria-label="Plus"]')
                      .click()
                      .then(() => {
                        cy.get(`#user_emails-${i}`).clear().type(newEmail);
                      });
                  }
                }
              });

              cy.contains("#project-summary button", /update/i).click();

              // Assertions

              // the summary should be updated
              cy.contains("#project-summary h3", expected.name).should(
                "be.visible"
              );

              cy.contains("#project-summary div", /name/i).within(() => {
                cy.get("input").should("have.value", expected.name);
              });

              cy.contains("#project-summary div", /external id/i).within(() => {
                cy.contains(project.ext_id).should("be.visible");
              });

              cy.contains("#project-summary div", /description/i).within(() => {
                cy.get("textarea").should("contain.text", expected.description);
              });

              cy.contains("#project-summary div", /live/i).within(() => {
                cy.get(
                  `button[role="switch"][data-state="${
                    expected.is_active ? "checked" : "unchecked"
                  }"]`
                ).should("be.visible");
              });

              cy.contains("#project-summary div", /qpu seconds/i).within(() => {
                cy.get("input").should("have.value", `${expected.qpu_seconds}`);
              });

              cy.contains("#project-summary div", /admin/i).within(() => {
                cy.get("input").should("have.value", expected.admin_email);
              });

              cy.contains("#project-summary div", /members/i).within(() => {
                for (
                  let index = 0;
                  index < expected.user_emails.length;
                  index++
                ) {
                  const email = expected.user_emails[index];

                  cy.wrap({ index, email }).then(({ email, index }) => {
                    const wrapperId = `#user_emails-${index}-wrapper`;
                    const inputId = `#user_emails-${index}`;
                    const closeBtnId = `#user_emails-${index}-del-btn`;
                    cy.get(`${wrapperId} ${inputId}`).should(
                      "have.value",
                      email
                    );
                    cy.get(`${wrapperId} ${closeBtnId}[aria-label="X"]`).should(
                      "be.visible"
                    );
                  });
                }
                cy.get('button[aria-label="Plus"]').should("be.visible");
              });

              cy.contains("#project-summary div", /created/i).within(() => {
                cy.contains(
                  /(\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+( ago)?/i
                ).should("be.visible");
              });

              cy.contains("#project-summary div", /last updated/i).within(
                () => {
                  cy.contains(/\d+ (seconds?)( ago)?/i).should("be.visible");
                }
              );

              cy.contains("#project-summary button", /delete/i).should(
                "be.visible"
              );

              cy.contains("#project-summary button", /update/i).should(
                "be.disabled"
              );

              // the table should be updated
              cy.get(`#projects-table tbody tr[data-id='${obj.idx}']`).within(
                () => {
                  cy.contains("td[data-header='name']", expected.name).should(
                    "be.visible"
                  );
                  cy.contains(
                    "td[data-header='admin_email']",
                    expected.admin_email
                  ).should("be.visible");
                  cy.contains(
                    "td[data-header='qpu_seconds']",
                    `${expected.qpu_seconds}`
                  ).should("be.visible");
                  cy.contains(
                    "td[data-header='is_active']",
                    expected.is_active ? /live/i : /expired/i
                  ).should("be.visible");
                }
              );
            }
          });
        });
      });

    isAdmin &&
      it("deleting of project removes project from list, summary and top bar", () => {
        cy.viewport(1080, 750);

        for (const project of projects) {
          cy.wrap(project).then((project) => {
            cy.contains("#projects-table tbody tr", project.name).click();
            cy.contains("#project-summary h3", project.name).should(
              "be.visible"
            );
            cy.contains('[data-testid="topbar"] button', /project:/i).as(
              "project-selector"
            );
            if (project.user_ids.includes(user.id)) {
              // if current user is a member of the given project, open the project selector
              cy.get("@project-selector").click();
              cy.contains('#project-selector [role="option"]', project.name, {
                timeout: 500,
              }).should("be.visible");
              // to close the dropdown
              cy.contains('#project-selector [role="option"]', /none/i, {
                timeout: 500,
              }).click();
            }

            cy.contains("#project-summary button", /delete/i)
              .realClick()
              .then(() => {
                cy.contains("#confirm-dialog button", /confirm/i).realClick();

                cy.get("#confirm-dialog").should("not.exist");
                cy.contains("#projects-table tbody td", project.name).should(
                  "not.exist"
                );
                cy.get("#project-summary").should("not.exist");

                if (project.user_ids.includes(user.id)) {
                  // if current user is a member of the given project, open the project selector
                  cy.get("@project-selector").click();
                  cy.contains(
                    '#project-selector [role="option"]',
                    project.name,
                    { timeout: 500 }
                  ).should("not.exist");
                  // close the project selector drop down
                  cy.contains('#project-selector [role="option"]', /none/i, {
                    timeout: 500,
                  }).click();
                }
              });
          });
        }
      });

    isAdmin &&
      it("cancelling deletion of project does nothing", () => {
        cy.viewport(1080, 750);

        for (const project of projects) {
          cy.wrap(project).then((project) => {
            cy.contains("#projects-table tbody tr", project.name).click();
            cy.contains("#project-summary h3", project.name).should(
              "be.visible"
            );

            cy.contains("#project-summary button", /delete/i).realClick();

            cy.contains("#confirm-dialog button", /cancel/i).click();

            cy.get("#confirm-dialog").should("not.exist");
            cy.contains("#projects-table tbody td", project.name).should(
              "be.visible"
            );
            cy.contains("#project-summary h3", project.name).should(
              "be.visible"
            );

            if (project.user_ids.includes(user.id)) {
              // if current user is a member of the given project, open the project selector
              cy.contains('[data-testid="topbar"] button', /project:/i).click();
              cy.contains('#project-selector [role="option"]', project.name, {
                timeout: 500,
              }).should("be.visible");
              cy.contains('#project-selector [role="option"]', /none/i, {
                timeout: 500,
              }).click();
            }
          });
        }
      });

    //////

    // isAdmin &&
    //   it("approving a QPU time request increases project QPU time and removes request from pending list", () => {
    //     cy.viewport(1080, 750);
    //     const projectsMap = Object.fromEntries(
    //       projects.map((v) => [v.id, { ...v }])
    //     );
    //     const counts = { pending: pendingUserRequests.length };

    //     for (const request of qpuTimeRequests) {
    //       cy.wrap({ request, projectsMap, counts }).then((obj) => {
    //         const projectId = obj.request.request.project_id;
    //         const project = obj.projectsMap[projectId];
    //         const projectIdx = projectsIndex[projectId];
    //         const isProjectMember = project.user_ids.includes(user.id);

    //         // visit projects page if user is project member
    //         if (isProjectMember) {
    //           cy.visit("/projects");
    //           cy.wait("@my-project-list");

    //           cy.contains(
    //             `.bg-card tbody tr[data-id='${projectIdx}'] td[data-header='qpu_seconds']`,
    //             new RegExp(
    //               `${obj.projectsMap[projectId].qpu_seconds} seconds`,
    //               "i"
    //             )
    //           ).should("be.visible");
    //         }

    //         // visit requests page
    //         cy.visit("/admin-requests");
    //         cy.wait("@user-requests-list");

    //         const reqTitle = getTitle(obj.request);
    //         cy.contains(".bg-card tbody tr", reqTitle).click();

    //         cy.contains("#project-summary h3", reqTitle).should("be.visible");
    //         cy.contains(".bg-card tbody td", reqTitle).should("be.visible");

    //         cy.contains("#project-summary button", /approve/i).realClick();

    //         cy.contains(".bg-card tbody td", reqTitle).should("not.exist");
    //         cy.get("#project-summary").should("not.exist");

    //         // update data
    //         obj.counts.pending -= 1;
    //         obj.projectsMap[projectId].qpu_seconds +=
    //           obj.request.request.seconds;

    //         // sidebar shows correct number
    //         cy.contains("[data-testid='sidebar'] div", /requests/i).within(
    //           () => {
    //             cy.contains(".bg-primary", `${obj.counts.pending}`);
    //           }
    //         );

    //         // visit projects page again if user is project member; QPU seconds is incremented
    //         if (isProjectMember) {
    //           cy.visit("/projects");
    //           cy.wait("@my-project-list");

    //           cy.contains(
    //             `.bg-card tbody tr[data-id='${projectIdx}'] td[data-header='qpu_seconds']`,
    //             new RegExp(
    //               `${obj.projectsMap[projectId].qpu_seconds} seconds`,
    //               "i"
    //             )
    //           ).should("be.visible");
    //         }
    //       });
    //     }
    //   });

    // isAdmin &&
    //   it("rejecting a QPU time request removes request from pending list", () => {
    //     cy.viewport(1080, 750);
    //     const projectsMap = Object.fromEntries(
    //       projects.map((v) => [v.id, { ...v }])
    //     );
    //     const counts = { pending: pendingUserRequests.length };

    //     for (const request of qpuTimeRequests) {
    //       cy.wrap({ request, projectsMap, counts }).then((obj) => {
    //         const projectId = obj.request.request.project_id;
    //         const project = obj.projectsMap[projectId];
    //         const projectIdx = projectsIndex[projectId];
    //         const isProjectMember = project.user_ids.includes(user.id);

    //         // visit projects page if user is project member
    //         if (isProjectMember) {
    //           cy.visit("/projects");
    //           cy.wait("@my-project-list");

    //           cy.contains(
    //             `.bg-card tbody tr[data-id='${projectIdx}'] td[data-header='qpu_seconds']`,
    //             new RegExp(
    //               `${obj.projectsMap[projectId].qpu_seconds} seconds`,
    //               "i"
    //             )
    //           ).should("be.visible");
    //         }

    //         // visit requests page
    //         cy.visit("/admin-requests");
    //         cy.wait("@user-requests-list");

    //         const reqTitle = getTitle(obj.request);
    //         cy.contains(".bg-card tbody tr", reqTitle).click();

    //         cy.contains("#project-summary h3", reqTitle).should("be.visible");
    //         cy.contains(".bg-card tbody td", reqTitle).should("be.visible");

    //         cy.contains("#project-summary button", /reject/i).realClick();

    //         cy.contains(".bg-card tbody td", reqTitle).should("not.exist");
    //         cy.get("#project-summary").should("not.exist");

    //         // update data
    //         obj.counts.pending -= 1;

    //         // sidebar shows correct number
    //         cy.contains("[data-testid='sidebar'] div", /requests/i).within(
    //           () => {
    //             cy.contains(".bg-primary", `${obj.counts.pending}`);
    //           }
    //         );

    //         // visit projects page again if user is project member; QPU seconds is unchanged
    //         if (isProjectMember) {
    //           cy.visit("/projects");
    //           cy.wait("@my-project-list");

    //           cy.contains(
    //             `.bg-card tbody tr[data-id='${projectIdx}'] td[data-header='qpu_seconds']`,
    //             new RegExp(
    //               `${obj.projectsMap[projectId].qpu_seconds} seconds`,
    //               "i"
    //             )
    //           ).should("be.visible");
    //         }
    //       });
    //     }
    //   });
  });
});
