/// <reference types="cypress" />
/// <reference types="cypress-real-events" />

// test for:
//  - updating the lifespan of the selected token updates its value in the summary
//  - updating the lifespan of the selected token updates its value in the table

import userList from "../fixtures/users.json";
import deviceList from "../fixtures/device-list.json";
import tokenList from "../fixtures/tokens.json";
import projectList from "../fixtures/projects.json";
import { generateJwt } from "../../api/utils";
import {
  type Project,
  type Device,
  type User,
  type AppToken,
} from "../../types";
import { extendAppToken } from "../support/utils";

const projects = [...projectList] as Project[];
const projectsMap = Object.fromEntries(
  projects.map((v) => [v.ext_id, { ...v }])
);
const userIds = tokenList.map((v) => v.user_id);
const users = userList.filter((v) => userIds.includes(v.id)) as User[];
const extendedTokens = tokenList
  .filter((v) => projectsMap[v.project_ext_id])
  .map((v) => extendAppToken(v, projectsMap[v.project_ext_id]));
const tokensTableHeaders = [
  "Title",
  "Project Ext ID",
  "Project",
  "Expires",
  "Status",
  "Actions",
];
const tokensTableDataProps = [
  "title",
  "project_ext_id",
  "project_name",
  "expires_at",
  "is_expired",
  "actions",
];

users.forEach((user) => {
  const userProjects = projects.filter((v) => v.user_ids.includes(user.id));
  const allUserTokens = extendedTokens.filter((v) => v.user_id === user.id);
  describe(`tokens page for ${user.name}`, () => {
    beforeEach(() => {
      const apiBaseUrl = Cypress.env("VITE_API_BASE_URL");
      const domain = Cypress.env("VITE_COOKIE_DOMAIN");
      const cookieName = Cypress.env("VITE_COOKIE_NAME");
      const secret = Cypress.env("JWT_SECRET");
      const audience = Cypress.env("AUTH_AUDIENCE");
      const cookieExpiry = Math.round((new Date().getTime() + 800_000) / 1000);

      cy.intercept("GET", `${apiBaseUrl}/devices`).as("devices-list");
      cy.intercept("GET", `${apiBaseUrl}/me/projects`).as("my-project-list");
      cy.intercept("GET", `${apiBaseUrl}/me/tokens*`).as("my-token-list");
      cy.intercept("PUT", `${apiBaseUrl}/me/tokens*`).as("my-tokens-update");
      cy.intercept("POST", `${apiBaseUrl}/me/tokens*`).as("my-tokens-create");
      cy.intercept("DELETE", `${apiBaseUrl}/me/tokens*`).as("my-tokens-delete");

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

      cy.visit("/tokens");
      cy.wait("@my-project-list");
      cy.wait("@my-token-list");
    });

    it("renders the tokens page when nav item is clicked", () => {
      cy.visit("/");
      cy.wait("@my-project-list");
      cy.url().should("equal", "http://127.0.0.1:5173/");

      cy.get("[data-testid='topbar'] [aria-label='UserRound']").click({
        force: true,
      });
      cy.contains(/tokens/i).click();
      cy.url().should("equal", "http://127.0.0.1:5173/tokens");
    });

    it("renders all user's tokens with no project selected", () => {
      cy.viewport(1080, 750);
      cy.wait(100);
      cy.contains(".bg-card", /api tokens for all projects/i).within(() => {
        cy.get("table").as("token-list-table");

        // header
        cy.get("@token-list-table")
          .get("thead th")
          .each((el, idx) => {
            expect(el.text()).to.eql(tokensTableHeaders[idx]);
          });

        // body
        cy.get("@token-list-table")
          .get("tbody")
          .within(() => {
            cy.get("tr").each((el, idx) => {
              cy.wrap({ el, idx }).then((obj) => {
                const token = allUserTokens[obj.idx];

                if (token) {
                  cy.wrap(obj.el).within(() => {
                    cy.get("td").each((td, cellIdx) => {
                      cy.wrap({ td, token, idx: cellIdx }).then((cell) => {
                        const prop = tokensTableDataProps[cell.idx];
                        if (prop === "expires_at") {
                          expect(cell.td.text()).to.match(
                            // 'in 1 day' or '2 days ago'
                            /(in)? (\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+( ago)?/i
                          );
                        } else if (prop === "is_expired") {
                          const statusText = cell.token[prop]
                            ? /expired/i
                            : /live/i;
                          expect(cell.td.text()).to.match(statusText);
                        } else if (prop === "actions") {
                          const disabledCheck = cell.token.is_expired
                            ? "be.disabled"
                            : "not.be.disabled";
                          cy.wrap(cell.td)
                            .contains("button", /edit lifespan/i)
                            .should(disabledCheck);
                        } else {
                          expect(cell.td.text()).to.eql(`${cell.token[prop]}`);
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

    it("renders user's tokens' summary when row is clicked with no project selected", () => {
      cy.viewport(1080, 750);
      cy.wait(100);
      cy.get(".bg-card tbody tr").each((el, idx) => {
        cy.wrap({ el, idx }).then((obj) => {
          const token = allUserTokens[obj.idx];

          if (token) {
            cy.wrap(obj.el).realClick();

            cy.contains("#token-summary h3", token.title).should("be.visible");

            cy.contains("#token-summary div", /project/i).within(() => {
              cy.contains(token.project_name).should("be.visible");
            });

            cy.contains("#token-summary div", /status/i).within(() => {
              const statusText = token.is_expired ? /expired/i : /live/i;
              cy.contains(statusText).should("be.visible");
            });

            cy.contains("#token-summary div", /expires/i).within(() => {
              cy.contains(
                /(in)? (\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+( ago)?/i
              ).should("be.visible");
            });

            cy.contains("#token-summary div", /project external id/i).within(
              () => {
                cy.contains(token.project_ext_id).should("be.visible");
              }
            );
          }
        });
      });
    });

    it("renders the list of user's tokens in selected project", () => {
      cy.viewport(1080, 750);

      for (const project of userProjects) {
        cy.wrap(project).then((project) => {
          cy.contains('[data-testid="topbar"] button', /project:/i).click();
          cy.contains('#project-selector [role="option"]', project.name, {
            timeout: 500,
          }).click();

          const tokensForProject = allUserTokens.filter(
            (v) => v.project_ext_id === project.ext_id
          );
          cy.wrap({ tokens: tokensForProject, project }).then((params) => {
            cy.contains(
              ".bg-card",
              new RegExp(`api tokens for ${params.project.name}`, "i")
            ).within(() => {
              cy.get("table").as("token-list-table");

              // header
              cy.get("@token-list-table")
                .get("thead th")
                .each((el, idx) => {
                  expect(el.text()).to.eql(tokensTableHeaders[idx]);
                });

              // body
              cy.get("@token-list-table")
                .get("tbody")
                .within(() => {
                  cy.get("tr").each((el, idx) => {
                    cy.wrap({ el, idx }).then((obj) => {
                      const token = params.tokens[obj.idx];

                      if (token) {
                        cy.wrap(obj.el).within(() => {
                          cy.get("td").each((td, cellIdx) => {
                            cy.wrap({ td, token, idx: cellIdx }).then(
                              (cell) => {
                                const prop = tokensTableDataProps[cell.idx];
                                if (prop === "expires_at") {
                                  expect(cell.td.text()).to.match(
                                    // 'in 1 day' or '2 days ago'
                                    /(in)? (\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+( ago)?/i
                                  );
                                } else if (prop === "is_expired") {
                                  const statusText = cell.token[prop]
                                    ? /expired/i
                                    : /live/i;
                                  expect(cell.td.text()).to.match(statusText);
                                } else if (prop === "actions") {
                                  const disabledCheck = cell.token.is_expired
                                    ? "be.disabled"
                                    : "not.be.disabled";
                                  cy.wrap(cell.td)
                                    .contains("button", /edit lifespan/i)
                                    .should(disabledCheck);
                                } else {
                                  expect(cell.td.text()).to.eql(
                                    `${cell.token[prop]}`
                                  );
                                }
                              }
                            );
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

    it("renders user's tokens' summary when row is clicked with project selected", () => {
      cy.viewport(1080, 750);

      for (const project of userProjects) {
        cy.wrap(project).then((project) => {
          // click on project
          cy.contains('[data-testid="topbar"] button', /project:/i).click();
          cy.contains('#project-selector [role="option"]', project.name, {
            timeout: 500,
          }).click();

          const tokensForProject = allUserTokens.filter(
            (v) => v.project_ext_id === project.ext_id
          );
          cy.wrap({ tokens: tokensForProject, project }).then((params) => {
            cy.get(".bg-card tbody tr").each((el, idx) => {
              cy.wrap({ el, idx }).then((obj) => {
                const token = params.tokens[obj.idx];

                if (token) {
                  // click on row
                  cy.wrap(el).click();

                  // token summary is displayed accordingly
                  cy.get("#token-summary").within(() => {
                    cy.contains("h3", token.title).should("be.visible");

                    cy.contains("div", /project/i).within(() => {
                      cy.contains(token.project_name).should("be.visible");
                    });

                    cy.contains("div", /status/i).within(() => {
                      const statusText = token.is_expired
                        ? /expired/i
                        : /live/i;
                      cy.contains(statusText).should("be.visible");
                    });

                    cy.contains("div", /expires/i).within(() => {
                      cy.contains(
                        /(in)? (\d+ (seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?),?)+( ago)?/i
                      ).should("be.visible");
                    });

                    cy.contains("div", /project external id/i).within(() => {
                      cy.contains(token.project_ext_id).should("be.visible");
                    });
                  });
                }
              });
            });
          });
        });
      }
    });

    it("hides user's tokens' summary when project is changed", () => {
      cy.viewport(1080, 750);

      for (const project of userProjects) {
        cy.wrap(project).then((project) => {
          // click on project
          cy.contains('[data-testid="topbar"] button', /project:/i).click();
          cy.contains('#project-selector [role="option"]', project.name, {
            timeout: 500,
          }).click();

          // token summary is hidden
          cy.get("#token-summary").should("not.exist");

          cy.wrap({ project }).then(({ project }) => {
            const tokensForProject = allUserTokens.filter(
              (v) => v.project_ext_id === project.ext_id
            );
            if (tokensForProject[0]) {
              // click on the first row
              cy.get(".bg-card tbody tr").first().click();

              // token summary is displayed
              cy.get("#token-summary").should("be.visible");
            }
          });
        });
      }
    });

    it("generation of new token appends token to list", () => {
      cy.viewport(1080, 750);

      cy.get('[data-testid="top-banner"] [aria-label="RefreshCcw"]').as(
        "newTokenBtn"
      );

      for (const project of userProjects.slice(0, 1)) {
        cy.wrap(project).then((project) => {
          cy.contains('[data-testid="topbar"] button', /project:/i).click();
          cy.contains('#project-selector [role="option"]', project.name, {
            timeout: 500,
          }).click();

          cy.wrap({ project }).then(({ project }) => {
            const tokenNameRegex = new RegExp(`${project.ext_id}-(\\d+)`, "i");

            cy.get("@newTokenBtn")
              .click()
              .then(() => {
                cy.contains("table tbody td", tokenNameRegex)
                  .last()
                  .then((el) => {
                    const matches = tokenNameRegex.exec(el.text()) ?? [];
                    const tokenTimestamp = matches[1];
                    expect(parseFloat(tokenTimestamp)).to.gt(
                      new Date().getTime() - 100
                    );
                  });
              });
          });
        });
      }
    });

    it("deleting of token removes token from list and summary", () => {
      cy.viewport(1080, 750);

      for (const token of allUserTokens) {
        cy.wrap(token).then((token) => {
          cy.contains(".bg-card tbody tr", token.title).click();
          cy.contains("#token-summary h3", token.title).should("be.visible");

          cy.contains(".bg-card tbody td", token.title).should("be.visible");

          cy.contains("#token-summary button", /delete/i).realClick();

          cy.contains(
            "#delete-token-dialog button",
            /I want to delete this token/i
          ).click();

          cy.get("#delete-token-dialog").should("not.exist");
          cy.contains(".bg-card tbody td", token.title).should("not.exist");
          cy.get("#token-summary").should("not.exist");
        });
      }
    });

    it("More than 10 tokens activates the pagination button on the table", () => {
      cy.viewport(1080, 750);

      cy.get('[data-testid="top-banner"] [aria-label="RefreshCcw"]').as(
        "newTokenBtn"
      );

      cy.get('.bg-card [aria-label="ChevronRight"]').as("newPageBtn");

      for (const project of userProjects.slice(0, 1)) {
        cy.wrap(project).then((project) => {
          cy.contains('[data-testid="topbar"] button', /project:/i).click();
          cy.contains('#project-selector [role="option"]', project.name, {
            timeout: 500,
          }).click();

          cy.wrap({ project }).then(({ project }) => {
            const projectsTokens = allUserTokens.filter(
              (v) => v.project_ext_id === project.ext_id
            );
            if (projectsTokens.length < 10) {
              cy.get("@newPageBtn").should("have.attr", "disabled");
            }

            for (let index = projectsTokens.length; index <= 10; index++) {
              cy.get("@newTokenBtn").click();
            }

            cy.get("@newPageBtn").should("not.have.attr", "disabled");
          });
        });
      }
    });

    //     it("updating the lifespan of the selected token updates its value in the table and summary", () => {
    //   cy.viewport(1080, 750);

    //   for (const token of allUserTokens) {
    //     cy.wrap(token).then((token) => {
    //       cy.contains(".bg-card tbody tr", token.title).click();

    //       cy.contains(".bg-card tbody tr button", /edit lifespan/).click();
    //       cy.contains("#token-summary h3", token.title).should("be.visible");
    //       cy.contains("#token-summary h3", token.title).should("be.visible");

    //       cy.contains(".bg-card tbody td", token.title).should("be.visible");

    //       cy.contains("#token-summary button", /delete/i).realClick();

    //       cy.contains(
    //         "#delete-token-dialog button",
    //         /I want to delete this token/i
    //       ).click();

    //       cy.get("#delete-token-dialog").should("not.exist");
    //       cy.contains(".bg-card tbody td", token.title).should("not.exist");
    //       cy.get("#token-summary").should("not.exist");
    //     });
    //   }
    // });
  });
});
