/// <reference types="cypress" />

import users from "../fixtures/users.json";
// import authProviders from "../fixtures/auth-providers.json";

// const supportedDomains = authProviders.map((v) => v.email_domain);

[...users].forEach((user) => {
  describe(`dashboard-layout for ${user.name}`, () => {
    beforeEach(async () => {
      // add fresh cookie to document to login
      // document.cookie = await createCookieHeader(user, 600_000);
    });

    it("renders the sidebar in desktop mode", async () => {
      // render(<App routerConstructor={createMemoryRouter} />);
      // const sidebar = await screen.findByTestId("sidebar");
      // expect(sidebar).toBeInTheDocument();
      // // logo
      // expect(within(sidebar).getByText("WACQT")).toBeInTheDocument();
      // expect(
      //   within(sidebar).getByText("Wallenberg Centre for Quantum Technology")
      // ).toBeInTheDocument();
      // // links
      // expect(
      //   within(sidebar).getByRole("link", { name: /dashboard/i })
      // ).toBeInTheDocument();
      // expect(
      //   within(sidebar).getByRole("link", { name: /devices/i })
      // ).toBeInTheDocument();
      // // collapse-button
      // expect(
      //   within(sidebar).getByLabelText("PanelLeftClose")
      // ).toBeInTheDocument();
    });

    it("renders the collapsed sidebar when collapse button is pressed", async () => {});
    it("renders the topbar in desktop mode", async () => {});
    it("renders the topbanner in desktop mode", async () => {});
    it("renders the mobile menu in mobile mode", async () => {});
    it("logout button logs current user out", async () => {});
    it("current project can be selected from list of projects", async () => {});
    it("generates new api token on token-refresh button click", async () => {});
    it("copies current api token on token-copy button click", async () => {});
  });
});
