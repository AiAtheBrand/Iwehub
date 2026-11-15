import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import AuthGate from "../components/AuthGate";
import BookDetails from "../components/BookDetails";
import LibraryBookDetails from "../components/LibraryBookDetails";

// Every route is a child of the AuthGate layout route, so all of them are
// behind the sign-in wall.
const router = createBrowserRouter([
  {
    element: <AuthGate />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/books/:id",
        element: <BookDetails />,
      },
      {
        path: "/library/:id",
        element: <LibraryBookDetails />,
      },
    ],
  },
]);

export default router;
