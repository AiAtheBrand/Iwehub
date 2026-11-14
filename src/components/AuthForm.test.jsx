import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "./AuthForm";

describe("AuthForm", () => {
  it("signs in with the entered email and password", async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn().mockResolvedValue(undefined);
    const onSignUp = vi.fn();
    render(<AuthForm onSignIn={onSignIn} onSignUp={onSignUp} />);

    await user.type(screen.getByLabelText("Email"), "reader@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(onSignIn).toHaveBeenCalledWith("reader@example.com", "secret123");
    expect(onSignUp).not.toHaveBeenCalled();
  });

  it("signs up and shows a confirmation notice", async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    const onSignUp = vi.fn().mockResolvedValue(undefined);
    render(<AuthForm onSignIn={onSignIn} onSignUp={onSignUp} />);

    await user.click(screen.getByRole("button", { name: /need an account/i }));
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));

    expect(onSignUp).toHaveBeenCalledWith("new@example.com", "secret123");
    expect(await screen.findByRole("status")).toHaveTextContent(
      /check your email/i,
    );
  });

  it("shows an error when sign in fails", async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn().mockRejectedValue(new Error("Invalid login"));
    render(<AuthForm onSignIn={onSignIn} onSignUp={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "reader@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid login/i);
  });
});
