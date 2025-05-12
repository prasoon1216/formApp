import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
    const isLoginPage = location.pathname === "/login";

    useEffect(() => {
        // Keep login state in sync with localStorage
        setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
        navigate('/login');
    };

    const navbarData = [
        // Conditionally include "Login" only if not logged in and on login page
        ...(!isLoggedIn ? [{ id: 5, title: "Login", route: "/login" }] : []),
        ...(isLoggedIn ? [
            { id: 1, title: "Home", route: "/home" },
            { id: 3, title: "Contact", route: "/contact" },
            { id: 6, title: "Logout", route: "/logout" }
        ] : [])
    ];

    const handleNavigate = (route) => {
        if (route === '/logout') {
            handleLogout();
        } else {
            navigate(route);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Navbar (Fixed for All Pages) */}
            <div className="fixed top-0 left-0 w-full z-50 bg-gray-800 text-white shadow-lg">
                <div className="flex justify-between items-center p-6"> {/* Increased padding */}
                    <h1 className="text-3xl font-bold">Allied Medical Limited</h1>
                    <div className="text-white text-center py-2 font-semibold">
                    This platform is under development.
                </div>
                    <nav className="flex space-x-6">    
                        {navbarData?.map((item) => (
                            item.title === 'Login' ? (
                                <button
                                    onClick={() => handleNavigate(item?.route)}
                                    key={item?.id}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
                                    style={{ minWidth: 110 }}
                                >
                                    {item?.title}
                                </button>
                            ) : (
                                <p
                                    onClick={() => handleNavigate(item?.route)}
                                    key={item?.id}
                                    className="cursor-pointer hover:text-gray-400 transition text-lg font-semibold px-4 py-2"
                                >
                                    {item?.title}
                                </p>
                            )
                        ))}
                    </nav>
                </div>
            </div>
            { !isLoginPage && (
                <div className="pt-[60px]"> {/* Adjusted padding to match the exact header height */}
                </div>
            )}
        </div>
    );
};

export default Header;
