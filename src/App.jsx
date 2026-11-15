import { useOutletContext } from "react-router-dom";
import Library from "./components/Library";

/**
 * The index page ("/"). It is a child of the AuthGate layout route, so it only
 * renders for a signed-in user and reads the user / sign-out helper from the
 * outlet context rather than calling `useAuth` again.
 */
function App() {
  const { user, signOut } = useOutletContext();

  return <Library user={user} onSignOut={signOut} />;
}

export default App;
