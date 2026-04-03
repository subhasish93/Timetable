import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import {
    PlusCircle,
    BookOpen,
    RefreshCw,
    AlertCircle,
    GraduationCap
} from "lucide-react";

function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [name, setName] = useState("");
    const [semester, setSemester] = useState("");
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [availableSections, setAvailableSections] = useState([]);
    const [deptLoading, setDeptLoading] = useState(true);
    const [courseLoading, setCourseLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchDepartments = async () => {
        setDeptLoading(true);
        try {
            console.log("Fetching departments...");
            const res = await api.get("/department");
            console.log("Departments response:", res.data);
            setDepartments(res.data || []);
        } catch (err) {
            console.error("Failed to fetch departments:", err);
            toast.error("Failed to load departments");
        } finally {
            setDeptLoading(false);
        }
    };

    const fetchCourses = async () => {
        setCourseLoading(true);
        try {
            const res = await api.get("/courses");
            setCourses(res.data || []);
        } catch (err) {
            console.error("Failed to fetch courses:", err);
        } finally {
            setCourseLoading(false);
        }
    };

    const fetchSubjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (selectedDept) params.department_id = selectedDept;
            if (selectedSection) params.section = selectedSection;
            
            const res = await api.get("/subjects", { params });
            setSubjects(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load subjects");
            setError("Could not load subjects. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedDept) {
            const dept = departments.find(d => d.department_id === parseInt(selectedDept));
            if (dept && dept.sections) {
                setAvailableSections(dept.sections.split(",").map(s => s.trim()));
            } else {
                setAvailableSections([]);
            }
            setSelectedSection("");
        } else {
            setAvailableSections([]);
        }
    }, [selectedDept, departments]);

    useEffect(() => {
        if (selectedDept) {
            const deptCourses = courses.filter(c => c.department_id === parseInt(selectedDept));
            setSelectedCourse("");
        }
    }, [selectedDept, courses]);

    useEffect(() => {
        fetchSubjects();
    }, [selectedDept, selectedSection]);

    const getFilteredCourses = () => {
        if (!selectedDept) return [];
        return courses.filter(c => c.department_id === parseInt(selectedDept));
    };

    const getMaxSemester = () => {
        const course = courses.find(c => c.course_id === parseInt(selectedCourse));
        return course ? course.duration_years * 2 : 8;
    };

    const getSemesters = () => {
        const max = getMaxSemester();
        return Array.from({ length: max }, (_, i) => i + 1);
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Please enter subject name");
            return;
        }
        if (!selectedCourse) {
            toast.error("Please select a course");
            return;
        }
        if (!semester) {
            toast.error("Please enter semester");
            return;
        }
        if (!selectedSection) {
            toast.error("Please select a section");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await api.post("/subject", {
                name: name.trim(),
                course_id: parseInt(selectedCourse),
                semester: parseInt(semester),
                section: selectedSection
            });

            toast.success("Subject created successfully");
            setName("");
            setSemester("");
            await fetchSubjects();
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.detail || err.response?.data?.message || "Failed to create subject";
            toast.error(message);
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !submitting && name.trim() && selectedCourse && semester && selectedSection) {
            handleCreate();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            Subject Management
                        </h1>
                    </div>

                    <button
                        onClick={fetchSubjects}
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
                            Add New Subject
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g. Mathematics"
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
                                    disabled={submitting || deptLoading}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                >
                                    <option value="">{deptLoading ? "Loading..." : "Select Department"}</option>
                                    {departments.map((dept) => (
                                        <option key={dept.department_id} value={dept.department_id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Course <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    disabled={submitting || !selectedDept || courseLoading}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                >
                                    <option value="">{courseLoading ? "Loading..." : (!selectedDept ? "Select Dept First" : "Select Course")}</option>
                                    {getFilteredCourses().map((course) => (
                                        <option key={course.course_id} value={course.course_id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Semester <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                    disabled={submitting || !selectedCourse}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                >
                                    <option value="">Select Semester</option>
                                    {getSemesters().map((s) => (
                                        <option key={s} value={s}>Semester {s}</option>
                                    ))}
                                </select>
                                {selectedCourse && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Max: Semester {getMaxSemester()}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Section <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    disabled={submitting || !selectedDept}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                >
                                    <option value="">Select Section</option>
                                    {availableSections.map((section) => (
                                        <option key={section} value={section}>
                                            {section}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <button
                                onClick={handleCreate}
                                disabled={submitting || !name.trim() || !selectedCourse || !semester || !selectedSection || loading}
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
                                        Add Subject
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Section
                            </label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedDept}
                                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none disabled:bg-gray-100"
                            >
                                <option value="">All Sections</option>
                                {availableSections.map((section) => (
                                    <option key={section} value={section}>
                                        {section}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            All Subjects ({subjects.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : subjects.length === 0 ? (
                        <div className="py-16 text-center text-gray-500">
                            No subjects found. Add your first subject above.
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
                                            Subject Name
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Course
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Semester
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Section
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {subjects.map((subject) => (
                                        <tr
                                            key={subject.subject_id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {subject.subject_id}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {subject.name}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {subject.course?.name || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {subject.semester}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    {subject.section}
                                                </span>
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

export default Subjects;
