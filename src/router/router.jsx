import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import BookDetails from "../components/BookDetails";
import LibraryBookDetails from "../components/LibraryBookDetails";

const router = createBrowserRouter([
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
]);

export default router;
