import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import {
    PlusCircle,
    GraduationCap,
    RefreshCw,
    AlertCircle,
    BookOpen
} from "lucide-react";

function Courses() {
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [name, setName] = useState("");
    const [durationYears, setDurationYears] = useState("4");
    const [selectedDept, setSelectedDept] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchDepartments = async () => {
        try {
            const res = await api.get("/department");
            setDepartments(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCourses = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (selectedDept) params.department_id = selectedDept;
            
            const res = await api.get("/courses", { params });
            setCourses(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load courses");
            setError("Could not load courses. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [selectedDept]);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Please enter course name");
            return;
        }
        if (!selectedDept) {
            toast.error("Please select a department");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await api.post("/course", {
                name: name.trim(),
                duration_years: parseInt(durationYears),
                department_id: parseInt(selectedDept)
            });

            toast.success("Course created successfully");
            setName("");
            setDurationYears("4");
            await fetchCourses();
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.detail || err.response?.data?.message || "Failed to create course";
            toast.error(message);
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            Course Management
                        </h1>
                    </div>

                    <button
                        onClick={fetchCourses}
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
                            Add New Course
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Course code will be auto-generated. Sections are defined in the Department.
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Course Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. B.Tech Computer Science"
                                    disabled={submitting}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    disabled={submitting}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept.department_id} value={dept.department_id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Duration (Years)
                                </label>
                                <select
                                    value={durationYears}
                                    onChange={(e) => setDurationYears(e.target.value)}
                                    disabled={submitting}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                >
                                    {[1, 2, 3, 4, 5, 6].map((y) => (
                                        <option key={y} value={y}>{y} Year{y > 1 ? "s" : ""} ({y * 2} Semesters)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleCreate}
                                disabled={submitting || !name.trim() || !selectedDept || loading}
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
                                        Create Course
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

                <div className="mb-6 rounded-xl border bg-white shadow-sm p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Department
                            </label>
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            >
                                <option value="">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept.department_id} value={dept.department_id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            All Courses ({courses.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="py-16 text-center text-gray-500">
                            No courses found. Add your first course above.
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
                                            Course Name
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Code
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Department
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Duration
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Semesters
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {courses.map((course) => (
                                        <tr
                                            key={course.course_id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {course.course_id}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {course.name}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{course.code}</span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {course.department?.name || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {course.duration_years} Year{course.duration_years > 1 ? "s" : ""}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                1 - {course.duration_years * 2}
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

export default Courses;
