import React from "react";
import { render, screen } from "@testing-library/react";

// Mock HeroUI Spinner
jest.mock("@heroui/react", () => ({
  Spinner: () => <div data-testid="spinner" role="progressbar" />,
}));

import Loading from "@/components/ui/Loading";

describe("Loading", () => {
  it("renders a spinner", () => {
    render(<Loading />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("renders a centered full-screen container", () => {
    const { container } = render(<Loading />);
    const wrapper = container.firstChild;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("items-center");
    expect(wrapper.className).toContain("justify-center");
    expect(wrapper.className).toContain("h-screen");
  });
});
