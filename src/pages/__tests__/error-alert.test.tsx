import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { App } from "@/app";

describe("error-alert page", () => {
  it("renders on unexpected error on home screen", () => {
    render(<App />);
    // expect(screen.queryByText(`${percentFill}%`)).toBeInTheDocument();
  });
  /÷÷÷÷/;
  it("renders on unexpected error on devices screen", () => {});
  /÷÷÷÷/;
  it("renders on unexpected error on device-detail screen", () => {});
  /÷÷÷÷/;
  it("renders on unexpected error on login screen", () => {});
  /÷÷÷÷/;
});
