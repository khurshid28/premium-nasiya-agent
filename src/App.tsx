import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "layouts/admin";
import DemoLayout from "layouts/demo";
import AuthLayout from "layouts/auth";
import { UserProvider } from "contexts/UserContext";
import { DemoProvider } from "contexts/DemoContext";

const App = () => {
  // Simple token check (localStorage). If you later add a real auth layer,
  // replace with proper context/state.
  const isAuth = Boolean(typeof window !== "undefined" && localStorage.getItem("token"));
  const isDemoRoute = window.location.pathname.startsWith('/demo');

  return (
    <UserProvider>
      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        <Route path="agent/*" element={isAuth ? <AdminLayout /> : <Navigate to="/auth/sign-in" replace />} />
        <Route path="demo/*" element={
          <DemoProvider>
            <DemoLayout />
          </DemoProvider>
        } />
        <Route path="/sign-in" element={<Navigate to="/auth/sign-in" replace />} />
        <Route
          path="/"
          element={isDemoRoute ? <Navigate to="/demo/dashboard" replace /> : isAuth ? <Navigate to="/agent" replace /> : <Navigate to="/auth/sign-in" replace />}
        />
      </Routes>
      {/* <ToastContainer onClose={() => setToastOpen(false)} /> */}
    </UserProvider>
  );
};

export default App;
