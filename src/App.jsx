import AuthForm from "./components/AuthForm";
import Library from "./components/Library";
import { useAuth } from "./hooks/useAuth";

function App() {
  const {
    user,
    loading: authLoading,
    configured: authConfigured,
    signIn,
    signUp,
    signOut,
  } = useAuth();

  // When Supabase is configured, the sign-in screen is the first thing a
  // visitor sees and the library is not mounted until they authenticate.
  if (authConfigured && (authLoading || !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-blue-600">Gutenberg Books</h1>
          <p className="mt-2 text-gray-600">
            Sign in or create an account to browse and share books.
          </p>

          {authLoading ? (
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

  return <Library user={user} onSignOut={signOut} />;
}

export default App;
