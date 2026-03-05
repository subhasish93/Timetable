// src/components/layout/AdminLayout.jsx
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Calendar, Users, BookOpen, Clock, GraduationCap, Building } from 'lucide-react';
import Organization from '../../pages/Organization';

const menuItems = [
    { to: "/timetable", label: "Timetable", icon: Calendar },
    { to: "/teachers", label: "Teachers", icon: Users },
    { to: "/subjects", label: "Subjects", icon: BookOpen },
    { to: "/assignments", label: "Assignments", icon: GraduationCap },
    { to: "/time-slots", label: "Time Slots", icon: Clock },
    //{ to: "/management", label: "Management", icon: Building }, 
    { to: "/organization", label: "Organization", icon: Building },
];

export default function AdminLayout() {
    const location = useLocation();

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r shadow-sm flex-shrink-0">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-blue-700">Timetable Admin</h1>
                </div>
                <nav className="mt-2">
                    {menuItems.map(item => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center px-6 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors ${
                                location.pathname === item.to
                                    ? 'bg-blue-50 border-r-4 border-blue-600 text-blue-700 font-medium'
                                    : ''
                            }`}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main content area */}
            <main className="flex-1 p-6 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
