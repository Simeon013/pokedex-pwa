import { createBrowserRouter, Navigate } from 'react-router';
import DetailPage from './pages/DetailPage';
import Layout from './pages/Layout';
import ListPage from './pages/ListPage';
import NotFoundPage from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/pokedex" replace /> },
      { path: 'pokedex', element: <ListPage /> },
      { path: 'pokemon/:id', element: <DetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' });
