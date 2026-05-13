// src/components/Login.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await axios.post("http://127.0.0.1:8000/login", {
                username,
                password,
            });

            localStorage.setItem("token", res.data.access_token);
            
            const token = res.data.access_token;
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload.role;
            localStorage.setItem("role", role);
            
            if (role === "super_admin") {
                navigate("/super-admin");
            } else {
                navigate("/timetable");
            }
        } catch (err) {
            setError(
                err.response?.data?.detail || "Invalid username or password"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
                        <h2 className="text-3xl font-bold text-white">Admin Portal</h2>
                        <p className="mt-2 text-indigo-100 text-sm">
                            Sign in to manage timetable
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Username */}
                            <div>
                                <label
                                    htmlFor="username"
                                    className="block text-sm font-medium text-gray-700 mb-1.5"
                                >
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200"
                                    required
                                    autoFocus
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 mb-1.5"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200"
                                    required
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                  w-full py-3.5 px-4 rounded-lg font-medium text-white 
                  transition-all duration-200 shadow-md
                  ${loading
                                        ? "bg-indigo-400 cursor-not-allowed"
                                        : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
                                    }
                `}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Signing in...
                                    </div>
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </div>

                        <div className="mt-6 border-t border-gray-100 pt-6 text-center">
                            <a
                                href="/student-timetable"
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Student Timetable View
                            </a>
                        </div>
                    </form>
                </div>

                {/* Subtle branding / copyright */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Timetable Admin
                </p>
            </div>
        </div>
    );
}