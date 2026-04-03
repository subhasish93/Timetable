import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import {
    PlusCircle,
    Building2,
    RefreshCw,
    AlertCircle,
    X
} from "lucide-react";

function Department() {
    const [departments, setDepartments] = useState([]);
    const [name, setName] = useState("");
    const [sections, setSections] = useState([]);
    const [newSection, setNewSection] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

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

    const addSection = () => {
        const trimmed = newSection.trim();
        if (trimmed && !sections.includes(trimmed)) {
            setSections([...sections, trimmed]);
            setNewSection("");
        }
    };

    const removeSection = (section) => {
        setSections(sections.filter(s => s !== section));
    };

    const handleSectionKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSection();
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Please enter a department name");
            return;
        }

        if (sections.length === 0) {
            toast.error("Please add at least one section");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                name: name.trim(),
                sections: sections.join(",")
            };
            await api.post("/department", payload);

            toast.success("Department created successfully");
            setName("");
            setSections([]);
            setNewSection("");
            await fetchDepartments();
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

                <div className="mb-10 rounded-xl border bg-white shadow-sm">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Add New Department
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g. Computer Science, Electronics, Civil..."
                                    disabled={submitting}
                                    className="w-full max-w-xl rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sections <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {sections.map((section) => (
                                        <span
                                            key={section}
                                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                                        >
                                            {section}
                                            <button
                                                onClick={() => removeSection(section)}
                                                disabled={submitting}
                                                className="ml-1 hover:text-blue-600"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2 max-w-xl">
                                    <input
                                        type="text"
                                        value={newSection}
                                        onChange={(e) => setNewSection(e.target.value)}
                                        onKeyDown={handleSectionKeyDown}
                                        placeholder="e.g. A, B, C (press Enter to add)"
                                        disabled={submitting}
                                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                    />
                                    <button
                                        onClick={addSection}
                                        disabled={submitting || !newSection.trim()}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                        Add Section
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Add sections like A, B, C for different groups in this department
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleCreate}
                                disabled={submitting || !name.trim() || loading}
                                className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Sections
                                        </th>
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
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {dept.sections ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {dept.sections.split(",").map((section, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                                                            >
                                                                {section.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
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
