// src/components/layout/AdminLayout.jsx
import { useEffect, useMemo } from 'react';
import {
    Link,
    Outlet,
    useLocation,
    useNavigate,
    NavLink
} from 'react-router-dom';
import {
    Calendar,
    Users,
    BookOpen,
    Clock,
    GraduationCap,
    Building,
    LogOut,
    LayoutDashboard,
    ChevronRight,
    Layers
} from 'lucide-react';
import { jwtDecode } from "jwt-decode";

const BASE_MENU = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/timetable", label: "Timetable", icon: Calendar },
    { to: "/department", label: "Departments", icon: Layers },
    { to: "/teachers", label: "Teachers", icon: Users },
    { to: "/subjects", label: "Subjects", icon: BookOpen },
    { to: "/assignments", label: "Assignments", icon: GraduationCap },
    { to: "/time-slots", label: "Time Slots", icon: Clock },
];

const SUPER_ADMIN_EXTRA = [
    { to: "/organization", label: "Organization", icon: Building },
];

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const role = useMemo(() => {
        if (!token) return null;
        try {
            const decoded = jwtDecode(token);
            return decoded?.role || null;
        } catch (err) {
            console.warn("Invalid JWT token", err);
            return null;
        }
    }, [token]);

    const isSuperAdmin = role === "super_admin";

    // Build final menu once
    const menuItems = useMemo(() => {
        return [
            ...BASE_MENU,
            ...(isSuperAdmin ? SUPER_ADMIN_EXTRA : [])
        ];
    }, [isSuperAdmin]);

    // Auto-redirect if no token or invalid role
    useEffect(() => {
        if (!token || !role) {
            navigate("/login", { replace: true });
        }
    }, [token, role, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="hidden md:flex md:w-72 lg:w-80 flex-col bg-white border-r border-gray-200 shadow-sm">

                {/* Logo / Brand */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-lg">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Timetable</h1>
                            <p className="text-xs text-gray-500">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 overflow-y-auto">
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `group flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                                <span>{item.label}</span>
                                <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile top bar (optional - can be improved later) */}
            <div className="md:hidden bg-white border-b shadow-sm p-4 flex items-center justify-between">
                <div className="font-semibold text-lg">Admin Panel</div>
                {/* You can add mobile menu toggle here later */}
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50">
                <div className="p-5 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}