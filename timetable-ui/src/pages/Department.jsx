import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import {
    PlusCircle,
    Building2,
    RefreshCw,
    AlertCircle
} from "lucide-react"; // ← recommended icon library

function Department() {
    const [departments, setDepartments] = useState([]);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Load departments
    const fetchDepartments = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/department");
            setDepartments(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load departments");
            setError("Could not load departments. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    // Create department
    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Please enter a department name");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await api.post("/department", { name: name.trim() });

            toast.success("Department created successfully");
            setName("");
            await fetchDepartments(); // refresh list
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || "Failed to create department";
            toast.error(message);
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !submitting && name.trim()) {
            handleCreate();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            Department Management
                        </h1>
                    </div>

                    <button
                        onClick={fetchDepartments}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {/* Add Department Card */}
                <div className="mb-10 rounded-xl border bg-white shadow-sm">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Add New Department
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g. Human Resources, Engineering, Sales..."
                                disabled={submitting}
                                className={`
                  flex-1 rounded-lg border border-gray-300 px-4 py-2.5 
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                  outline-none transition-all disabled:bg-gray-100
                `}
                            />

                            <button
                                onClick={handleCreate}
                                disabled={submitting || !name.trim() || loading}
                                className={`
                  flex items-center justify-center gap-2 whitespace-nowrap
                  rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white
                  shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 
                  focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 
                  disabled:cursor-not-allowed transition-colors min-w-[140px]
                `}
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="h-4 w-4" />
                                        Create Department
                                    </>
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Departments List */}
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            All Departments ({departments.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : departments.length === 0 ? (
                        <div className="py-16 text-center text-gray-500">
                            No departments found. Create your first department above.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            ID
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Department Name
                                        </th>
                                        {/* You can add more columns later: created_at, head, etc. */}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {departments.map((dept) => (
                                        <tr
                                            key={dept.department_id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {dept.department_id}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {dept.name}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default Department;