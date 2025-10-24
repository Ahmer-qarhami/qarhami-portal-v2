import { useState } from "react";
import { Link } from "react-router-dom";
import { isAuthenticated } from "../api/Auth";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <nav className="bg-indigo-600 shadow-lg shadow-gray-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex justify-between items-center w-full">
            {/* Logo Section */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-white text-2xl font-bold">
                <img
                  src="./img/logoIcon.png"
                  alt="Logo"
                  className="w-10 h-10"
                />
              </Link>
            </div>

            {/* Navigation Links */}
            {isAuthenticated() && (
              <div className="ml-auto">
                <div className="hidden md:flex space-x-4">
                  {/* <Link
                    to="/home"
                    className="text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Home
                  </Link> */}
                  {/* Add more navigation links here */}
                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut} // Replace this with your actual sign-out handler
                    className="text-white hover:bg-red-400 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          {isAuthenticated() && (
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={toggleMenu}
                className="bg-indigo-500 inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-700 focus:outline-none"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={
                      isOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* <Link
              to="/home"
              className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700"
            >
              Home
            </Link> */}
            <button
              onClick={handleSignOut} // Replace this with your actual sign-out handler
              className="text-white hover:bg-red-400 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
