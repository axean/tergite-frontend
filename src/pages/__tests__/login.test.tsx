import { App } from "@/app";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createMemoryRouter } from "react-router-dom";

const unauthorizedEmailAddresses = ["wrong.domain@domain.com"];
const invalidFormatEmailAddresses = [
  "john",
  "1",
  "john.com",
  "http://example.com",
];
const validEmailAddresses = [
  "john.doe@example.com",
  "david.doe@example.com",
  "jane.doe@example.com",
  "paul.doe@example.com",
  "julie.doe@example.com",
];

describe("login-page", () => {
  it("renders correctly", async () => {
    render(<App routerConstructor={createMemoryRouter} />);

    expect(await screen.findByText("WACQT")).toBeInTheDocument();
    expect(
      screen.getByText("Wallenberg Centre for Quantum Technology")
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Email address:")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /sign in/i,
      })
    ).toBeInTheDocument();
  });

  unauthorizedEmailAddresses.forEach((email) =>
    it(`renders error message for '${email}' since email domain is not permitted`, async () => {
      const user = userEvent.setup();
      const errorMsgRegex = /unauthorized/i;

      render(<App routerConstructor={createMemoryRouter} />);

      const emailInput = await screen.findByPlaceholderText("Email address:");
      expect(screen.queryByText(errorMsgRegex)).not.toBeInTheDocument();

      await user.type(emailInput, email);
      await user.click(
        screen.getByRole("button", {
          name: /sign in/i,
        })
      );

      expect(await screen.findByText(errorMsgRegex)).toBeInTheDocument();
    })
  );

  invalidFormatEmailAddresses.forEach((email) =>
    it(`renders error message for '${email}' since email is of wrong format`, async () => {
      const user = userEvent.setup();
      const errorMsgRegex = /invalid email; expected xxx@bxxxx.xxx/;

      render(<App routerConstructor={createMemoryRouter} />);

      const emailInput = await screen.findByPlaceholderText("Email address:");
      expect(screen.queryByText(errorMsgRegex)).not.toBeInTheDocument();

      await user.type(emailInput, email);
      await user.click(
        screen.getByRole("button", {
          name: /sign in/i,
        })
      );

      expect(await screen.findByText(errorMsgRegex)).toBeInTheDocument();
    })
  );

  validEmailAddresses.forEach((email) =>
    it(`redirects to the home page of the dashboard for that useremail '${email}'`, async () => {
      const user = userEvent.setup();

      render(<App routerConstructor={createMemoryRouter} />);

      const emailInput = await screen.findByPlaceholderText("Email address:");

      await user.type(emailInput, email);
      await user.click(
        screen.getByRole("button", {
          name: /sign in/i,
        })
      );

      expect(window.location.href).toBe("http://localhost:3000/");
    })
  );
});
