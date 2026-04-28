import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
    try {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token) {
            return <Navigate to="/login" replace />;
        }

        if (allowedRoles && !allowedRoles.includes(role)) {
            if (role === "super_admin") {
                return <Navigate to="/super-admin" replace />;
            }
            return <Navigate to="/timetable" replace />;
        }

        return children;
    } catch (error) {
        console.error("ProtectedRoute error:", error);
        return <Navigate to="/login" replace />;
    }
}

export default ProtectedRoute;