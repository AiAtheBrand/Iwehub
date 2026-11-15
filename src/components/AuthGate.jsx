import { Outlet } from "react-router-dom";
import AuthForm from "./AuthForm";
import { useAuth } from "../hooks/useAuth";

/**
 * Layout route that puts every page behind the sign-in wall.
 *
 * While the Supabase session is being restored it shows a loading state; when
 * there is no session it shows the auth form. Only once a user is signed in
 * does it render the matched child route through <Outlet />, passing the user
 * and sign-out helper down as outlet context.
 *
 * When Supabase is not configured (e.g. a quick local run without .env) the
 * wall is skipped so the app is still usable.
 */
function AuthGate() {
  const { user, loading, configured, signIn, signUp, signOut } = useAuth();

  if (configured && (loading || !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-blue-600">Gutenberg Books</h1>
          <p className="mt-2 text-gray-600">
            Sign in or create an account to browse and share books.
          </p>

          {loading ? (
            <p className="mt-6 text-gray-600" role="status">
              Loading…
            </p>
          ) : (
            <AuthForm onSignIn={signIn} onSignUp={signUp} />
          )}
        </div>
      </div>
    );
  }

  return <Outlet context={{ user, signOut }} />;
}

export default AuthGate;
