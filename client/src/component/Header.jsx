import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();

    const navbarData = [
        { id: 1, title: "Home", route: "/home" },
        { id: 3, title: "Contact", route: "/contact" }
    ];

    const handleNavigate = (route) => {
        navigate(route);
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
                            <p
                                onClick={() => handleNavigate(item?.route)}
                                key={item?.id}
                                className="cursor-pointer hover:text-gray-400 transition text-lg font-semibold px-4 py-2"
                            >
                                {item?.title}
                            </p>
                        ))}
                    </nav>
                </div>
            </div>
            <div className="pt-[60px]"> {/* Adjusted padding to match the exact header height */}
            </div>
        </div>
    );
};

export default Header;
