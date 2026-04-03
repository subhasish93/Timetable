import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import {
    PlusCircle,
    GraduationCap,
    RefreshCw,
    AlertCircle,
    Users,
    BookOpen,
    Trash2
} from "lucide-react";

function SubjectAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    const [selectedDept, setSelectedDept] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [availableSections, setAvailableSections] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedTeacher, setSelectedTeacher] = useState("");

    const [deptLoading, setDeptLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchDepartments = async () => {
        setDeptLoading(true);
        try {
            const res = await api.get("/department");
            setDepartments(res.data || []);
        } catch (err) {
            console.error("Failed to fetch departments:", err);
            toast.error("Failed to load departments");
        } finally {
            setDeptLoading(false);
        }
    };

    const fetchExistingAssignments = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/subject-teacher-assignments");
            setAssignments(res.data || []);
        } catch (err) {
            console.error("Failed to fetch assignments:", err);
            toast.error("Failed to load assignments");
            setError("Could not load assignments.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjectsAndTeachers = async () => {
        if (!selectedDept || !selectedSection) {
            setSubjects([]);
            setTeachers([]);
            return;
        }

        try {
            const [subjectsRes, teachersRes] = await Promise.all([
                api.get("/subjects", { params: { department_id: selectedDept, section: selectedSection } }),
                api.get("/teachers", { params: { department_id: selectedDept, section: selectedSection } })
            ]);
            setSubjects(subjectsRes.data || []);
            setTeachers(teachersRes.data || []);
        } catch (err) {
            console.error("Failed to fetch subjects/teachers:", err);
            setSubjects([]);
            setTeachers([]);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchExistingAssignments();
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
        fetchSubjectsAndTeachers();
    }, [selectedDept, selectedSection]);

    const handleCreate = async () => {
        if (!selectedSubject) {
            toast.error("Please select a subject");
            return;
        }
        if (!selectedTeacher) {
            toast.error("Please select a teacher");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await api.post("/subject-teacher", {
                subject_id: parseInt(selectedSubject),
                teacher_id: parseInt(selectedTeacher)
            });

            toast.success("Assignment created successfully");
            setSelectedSubject("");
            setSelectedTeacher("");
            await fetchExistingAssignments();
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.detail || err.response?.data?.message || "Failed to create assignment";
            toast.error(message);
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this assignment?')) return;
        try {
            await api.delete(`/subject-teacher/${id}`);
            toast.success("Assignment deleted");
            fetchExistingAssignments();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            Subject-Teacher Assignments
                        </h1>
                    </div>

                    <button
                        onClick={fetchExistingAssignments}
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
                            Create New Assignment
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Assign a teacher to a specific subject for a department and section
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    Section <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    disabled={submitting || !selectedDept || availableSections.length === 0}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                >
                                    <option value="">{!selectedDept ? "Select Dept First" : availableSections.length === 0 ? "No Sections" : "Select Section"}</option>
                                    {availableSections.map((section) => (
                                        <option key={section} value={section}>
                                            Section {section}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    disabled={submitting || !selectedSection || subjects.length === 0}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                >
                                    <option value="">{!selectedSection ? "Select Section First" : subjects.length === 0 ? "No Subjects" : "Select Subject"}</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.subject_id} value={subject.subject_id}>
                                            {subject.name} (Sem {subject.semester})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teacher <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    disabled={submitting || !selectedSection || teachers.length === 0}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100"
                                >
                                    <option value="">{!selectedSection ? "Select Section First" : teachers.length === 0 ? "No Teachers" : "Select Teacher"}</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.teacher_id} value={teacher.teacher_id}>
                                            {teacher.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleCreate}
                                disabled={submitting || !selectedSubject || !selectedTeacher}
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
                                        Create Assignment
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
                            Created Assignments ({assignments.length})
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            These are the actual assignments created. Each row is one assignment.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="py-16 text-center text-gray-500">
                            No assignments found. Create your first assignment above.
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
                                            Subject
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Teacher
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Department
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Section
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Semester
                                        </th>
                                        <th className="px-6 py-3.5 text-center text-sm font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {assignments.map((assignment) => (
                                        <tr
                                            key={assignment.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {assignment.id}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-blue-500" />
                                                    {assignment.subject_name}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-green-500" />
                                                    {assignment.teacher_name}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {assignment.department_name || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    {assignment.section}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {assignment.semester}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => handleDelete(assignment.id)}
                                                    className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </button>
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

export default SubjectAssignments;
