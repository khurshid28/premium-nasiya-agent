import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import { UserProvider } from "contexts/UserContext";

const App = () => {
  // Simple token check (localStorage). If you later add a real auth layer,
  // replace with proper context/state.
  const isAuth = Boolean(typeof window !== "undefined" && localStorage.getItem("token"));

  return (
    <UserProvider>
      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        <Route path="agent/*" element={<AdminLayout />} />
        <Route path="/sign-in" element={<Navigate to="/auth/sign-in" replace />} />
        <Route
          path="/"
          element={isAuth ? <Navigate to="/agent" replace /> : <Navigate to="/auth/sign-in" replace />}
        />
      </Routes>
      {/* <ToastContainer onClose={() => setToastOpen(false)} /> */}
    </UserProvider>
  );
};

export default App;
