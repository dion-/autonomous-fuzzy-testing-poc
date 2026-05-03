import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Step3 } from "./Step3";

describe("Step3", () => {
  it("renders checkboxes and calls onChange", async () => {
    const onChange = vi.fn();
    render(
      <Step3
        data={{ newsletter: false, giftWrap: false, deliveryInstructions: "", promoCode: "" }}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: /subscribe to newsletter/i }));
    expect(onChange).toHaveBeenLastCalledWith("newsletter", true);

    await userEvent.click(screen.getByRole("checkbox", { name: /add gift wrap/i }));
    expect(onChange).toHaveBeenLastCalledWith("giftWrap", true);
  });

  it("renders textarea and calls onChange", () => {
    const onChange = vi.fn();
    render(
      <Step3
        data={{ newsletter: false, giftWrap: false, deliveryInstructions: "", promoCode: "" }}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Delivery Instructions"), {
      target: { value: "Ring bell" },
    });
    expect(onChange).toHaveBeenLastCalledWith("deliveryInstructions", "Ring bell");
  });

  it("renders promo code input and shows discount for valid code", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Step3
        data={{ newsletter: false, giftWrap: false, deliveryInstructions: "", promoCode: "" }}
        onChange={onChange}
      />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Promo Code"), { target: { value: "SAVE10" } });
    expect(onChange).toHaveBeenLastCalledWith("promoCode", "SAVE10");

    rerender(
      <Step3
        data={{ newsletter: false, giftWrap: false, deliveryInstructions: "", promoCode: "SAVE10" }}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("10% discount applied");
  });

  it("shows character counter for delivery instructions", () => {
    const onChange = vi.fn();
    render(
      <Step3
        data={{ newsletter: false, giftWrap: false, deliveryInstructions: "", promoCode: "" }}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("0 / 200 characters")).toBeInTheDocument();
  });

  it("updates character counter as text is entered", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Step3
        data={{ newsletter: false, giftWrap: false, deliveryInstructions: "", promoCode: "" }}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Delivery Instructions"), {
      target: { value: "Ring bell" },
    });
    expect(onChange).toHaveBeenLastCalledWith("deliveryInstructions", "Ring bell");

    rerender(
      <Step3
        data={{
          newsletter: false,
          giftWrap: false,
          deliveryInstructions: "Ring bell",
          promoCode: "",
        }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("9 / 200 characters")).toBeInTheDocument();
  });

  it("turns character counter red when limit is reached", () => {
    const onChange = vi.fn();
    render(
      <Step3
        data={{
          newsletter: false,
          giftWrap: false,
          deliveryInstructions: "a".repeat(200),
          promoCode: "",
        }}
        onChange={onChange}
      />,
    );

    const counter = screen.getByText("200 / 200 characters");
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveClass("text-red-500");
  });

  it("renders a clear button that resets the promo code", () => {
    const onChange = vi.fn();
    render(
      <Step3
        data={{
          newsletter: false,
          giftWrap: false,
          deliveryInstructions: "",
          promoCode: "SAVE10",
        }}
        onChange={onChange}
      />,
    );

    const clearBtn = screen.getByRole("button", { name: /clear/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenLastCalledWith("promoCode", "");
  });
});
