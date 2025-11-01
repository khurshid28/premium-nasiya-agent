import React from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useUser } from "contexts/UserContext";
import { login as apiLogin } from "lib/api";

export default function SignIn(): JSX.Element {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const maxLen = 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear previous errors
    setLoginError(null);
    setPasswordError(null);
    setAuthError(null);

    // Validate login
    let hasError = false;
    
    if (!login || login.trim().length === 0) {
      setLoginError("Login maydoni to'ldirilishi shart");
      hasError = true;
    }
    
    // Validate password
    if (!password || password.trim().length === 0) {
      setPasswordError("Parol maydoni to'ldirilishi shart");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      hasError = true;
    }
    
    if (hasError) return;

    setIsLoading(true);

    try {
      // Real API call
      const response = await apiLogin(login.trim(), password.trim());
      
      // Check if user has ADMIN role
      if (response.user.role !== "ADMIN") {
        setAuthError("Kirish rad etildi. Faqat administratorlar tizimga kirishlari mumkin.");
        // Clear any stored data
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        return;
      }
      
      // Store token and user data
      localStorage.setItem("token", response.access_token);
      setUser({
        id: response.user.id,
        fullname: response.user.fullname,
        phone: response.user.phone,
        image: response.user.image,
        role: response.user.role,
      });
      
      // Navigate to admin default
      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Handle different error types
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setAuthError("Server bilan bog'lanib bo'lmadi. Internetingizni tekshiring yoki keyinroq urinib ko'ring.");
      } else if (err.status === 401) {
        // Unauthorized - wrong credentials
        // Backend'dan "Unauthorized" kelsa o'zbekchaga o'giramiz
        if (err.message && err.message.toLowerCase().includes('unauthorized')) {
          setAuthError("Login yoki parol noto'g'ri.");
        } else {
          setAuthError(err.message || "Login yoki parol noto'g'ri.");
        }
      } else if (err.status === 403) {
        // Forbidden - access denied
        setAuthError(err.message || "Kirish rad etildi. Sizda bu tizimga kirish huquqi yo'q.");
      } else if (err.status === 400) {
        // Bad request
        setAuthError(err.message || "Noto'g'ri ma'lumot kiritildi.");
      } else if (err.status === 404) {
        // Not found
        setAuthError("Login endpoint topilmadi. Iltimos, administrator bilan bog'laning.");
      } else if (err.status === 500 || err.status === 502 || err.status === 503) {
        // Server errors
        setAuthError("Server xatosi yuz berdi. Iltimos, keyinroq urinib ko'ring.");
      } else if (err.message) {
        // Show backend error message if available
        setAuthError(err.message);
      } else {
        setAuthError("Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[420px] flex-col items-center"
      >
        <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
          Tizimga kirish
        </h4>
        <p className="mb-6 ml-1 text-base text-gray-600">Login va parolingizni kiriting</p>

        <label className="mb-2 block w-full">
          <span className="text-sm font-medium text-gray-700">Login</span>
          <input
            className={`mt-1 w-full rounded-md px-3 py-2 outline-none border ${
              loginError
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            }`}
            value={login}
            onChange={(e) => {
              setLogin(e.target.value);
              if (loginError) setLoginError(null);
            }}
            maxLength={maxLen}
            id="login"
            name="login"
            type="text"
            placeholder="Loginingizni kiriting"
            autoComplete="username"
          />
          {loginError ? (
            <p className="mt-1 text-xs text-red-500">{loginError}</p>
          ) : null}
        </label>

        <label className="mb-4 block w-full relative">
          <span className="text-sm font-medium text-gray-700">Parol</span>
          <div className="mt-1 relative">
            <input
              className={`w-full rounded-md px-3 py-2 pr-10 outline-none border ${
                passwordError
                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              }`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value.slice(0, maxLen));
                if (passwordError) setPasswordError(null);
              }}
              maxLength={maxLen}
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Parolingizni kiriting"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
              aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {passwordError ? (
            <p className="mt-1 text-xs text-red-500">{passwordError}</p>
          ) : null}
        </label>
        {authError ? (
          <p className="mb-2 text-sm text-red-500">{authError}</p>
        ) : null}

        <button
          type="submit"
          disabled={!login || !password || isLoading}
          className={`linear mt-2 w-full rounded-xl py-[12px] text-base font-medium text-white transition duration-200 ${
            !login || !password || isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-brand-500 hover:bg-brand-600"
          }`}
        >
          {isLoading ? "Kirish..." : "Kirish"}
        </button>
      </form>
    </div>
  );
}
