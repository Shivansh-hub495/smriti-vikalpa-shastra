import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MobileNavigation from "@/components/MobileNavigation";
import ScrollToTop from "@/components/ScrollToTop";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <MobileNavigation
        title="Page Not Found"
        showBackButton={true}
        onBack={() => navigate('/')}
      />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">404</h1>
          <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
          <a href="/" className="text-purple-500 hover:text-purple-700 underline">
            Return to Home
          </a>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default NotFound;
