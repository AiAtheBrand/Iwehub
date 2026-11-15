import { useState } from "react";

/**
 * Email + password sign in / sign up form.
 * `onSignIn` and `onSignUp` are async and reject with an Error on failure.
 */
function AuthForm({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const isSignIn = mode === "signin";

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);

    try {
      if (isSignIn) {
        await onSignIn(email.trim(), password);
      } else {
        await onSignUp(email.trim(), password);
        setNotice("Check your email to confirm your account, then sign in.");
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    setMode(isSignIn ? "signup" : "signin");
    setError(null);
    setNotice(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-3 rounded-lg border border-gray-200 bg-white p-6"
    >
      <h2 className="text-base font-semibold text-gray-900">
        {isSignIn ? "Sign in" : "Create an account"}
      </h2>

      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        aria-label="Email"
        required
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-900"
      />

      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        aria-label="Password"
        required
        minLength={6}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-900"
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error.message}
        </p>
      )}

      {notice && (
        <p role="status" className="text-sm text-green-700">
          {notice}
        </p>
      )}

      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-50"
        >
          {isSignIn ? "Sign in" : "Sign up"}
        </button>

        <button
          type="button"
          onClick={toggleMode}
          className="text-sm text-blue-900 hover:underline"
        >
          {isSignIn ? "Need an account?" : "Have an account?"}
        </button>
      </div>
    </form>
  );
}

export default AuthForm;
