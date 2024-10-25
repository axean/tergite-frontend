/// <reference types="cypress" />
/// <reference types="cypress-real-events" />

import userList from "../fixtures/users.json";
import projectList from "../fixtures/projects.json";
import { generateJwt, getUsername } from "../../api/utils";
import { type User, UserRole, type AdminProject } from "../../types";

// Can view list of preojects
// can view details of single project
// can edit details of a single project
// can delete a project
//    - updates the user's projects in the top bar
//    - updates the admin projects
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

    // isAdmin &&
    //   it("renders project summary when row is clicked", () => {
    //     cy.viewport(1080, 750);
    //     cy.wait(100);
    //     cy.get("#project-table tbody tr").each((el, idx) => {
    //       cy.wrap({ el, idx }).then((obj) => {
    //         const project = projects[obj.idx];

    //         if (project) {
    //           cy.wrap(obj.el).realClick();

    //           cy.contains("#project-summary h3", project.name).should(
    //             "be.visible"
    //           );

    //           cy.contains("#project-summary div", /name/i).within(() => {
    //             cy.get("input").should("have.value", project.name);
    //           });

    //           cy.contains("#project-summary div", /external id/i).within(() => {
    //             cy.contains(project.ext_id).should("be.visible");
    //           });

    //           cy.contains("#project-summary div", /description/i).within(() => {
    //             cy.get("textarea").should("contain.text", project.description);
    //           });

    //           cy.contains("#project-summary div", /live/i).within(() => {
    //             cy.get('button[role="switch"]').should(
    //               "have.value",
    //               project.is_active ? "on" : "off"
    //             );
    //           });

    //           cy.contains("#project-summary div", /qpu seconds/i).within(() => {
    //             cy.get("input").should("have.value", `${project.qpu_seconds}`);
    //           });

    //           cy.contains("#project-summary div", /admin/i).within(() => {
    //             cy.contains(project.admin_email).should("be.visible");
    //           });

    //           cy.contains("#project-summary div", /members/i).within(() => {
    //             // cy.contains(project.ext_id).should("be.visible");
    //             for (
    //               let index = 0;
    //               index < project.user_emails.length;
    //               index++
    //             ) {
    //               const email = project.user_emails[index];

    //               cy.wrap({ index, email }).then(({ email, index }) => {
    //                 const wrapperId = `#user_emails-${index}-wrapper`;
    //                 const inputId = `#user_emails-${index}`;
    //                 const closeBtnId = `#user_emails-${index}-del-btn`;
    //                 cy.get(`${wrapperId} ${inputId}`).should(
    //                   "have.value",
    //                   email
    //                 );
    //                 cy.get(`${wrapperId} ${closeBtnId}[aria-label="X"]`).should(
    //                   "be.visible"
    //                 );
    //               });
    //             }
    //             cy.get('button[aria-label="plus"]').should("be.visible");
    //           });

    //           cy.contains("#project-summary div", /created/i).within(() => {
    //             cy.contains(
    //               /(\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+( ago)?/i
    //             ).should("be.visible");
    //           });

    //           cy.contains("#project-summary div", /last updated/i).within(
    //             () => {
    //               cy.contains(
    //                 /(\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+( ago)?/i
    //               ).should("be.visible");
    //             }
    //           );

    //           cy.contains("#project-summary button", /update/i).should(
    //             "be.visible"
    //           );

    //           cy.contains("#project-summary button", /delete/i).should(
    //             "be.visible"
    //           );
    //         }
    //       });
    //     });
    //   });

    ////////////////////////

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
