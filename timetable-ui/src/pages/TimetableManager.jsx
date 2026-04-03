// src/pages/TimetableManager.jsx

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
    Calendar,
    BookOpen,
    Trash2,
    Pencil,
    RefreshCw,
} from 'lucide-react';
import api, {
    getTimeSlots,
    getDeptSectionTimetable,
    createTimetable,
    deleteTimetable,
    updateTimetable,
} from '../api/api'; 

export default function TimetableManager() {
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [slots, setSlots] = useState([]);
    const [subjectTeachers, setSubjectTeachers] = useState([]);
    const [timetable, setTimetable] = useState([]);

    const [selectedDept, setSelectedDept] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [availableSections, setAvailableSections] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    
    const [deptLoading, setDeptLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        subject_teacher_id: 0,
        slot_id: 0,
        room_no: '',
    });

    useEffect(() => {
        setDeptLoading(true);
        Promise.all([
            getTimeSlots().then(r => setSlots(r.data)).catch(() => toast.error('Failed to load time slots')),
            api.get("/department").then(r => setDepartments(r.data || [])).catch(() => toast.error('Failed to load departments')),
            api.get("/courses").then(r => setCourses(r.data || [])).catch(() => toast.error('Failed to load courses')),
        ]).finally(() => setDeptLoading(false));
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
            setSelectedCourse("");
        } else {
            setAvailableSections([]);
            setSelectedSection("");
            setSelectedCourse("");
        }
    }, [selectedDept, departments]);

    useEffect(() => {
        if (selectedDept && selectedSection) {
            fetchSubjectTeachers();
            fetchTimetable();
        } else {
            setSubjectTeachers([]);
            setTimetable([]);
        }
    }, [selectedDept, selectedSection]);

    const fetchSubjectTeachers = async () => {
        if (!selectedDept || !selectedSection) {
            setSubjectTeachers([]);
            return;
        }
        try {
            const res = await api.get("/subject-teachers-for-timetable", { 
                params: { 
                    department_id: parseInt(selectedDept),
                    section: selectedSection 
                } 
            });
            console.log("Subject-Teacher Assignments for Timetable:", res.data);
            setSubjectTeachers(res.data || []);
        } catch (err) {
            console.error("Failed to fetch subject teachers:", err);
            setSubjectTeachers([]);
        }
    };

    const fetchTimetable = async () => {
        if (!selectedDept || !selectedSection) return;
        setLoading(true);
        try {
            const res = await getDeptSectionTimetable(parseInt(selectedDept), selectedSection);
            setTimetable(res.data || []);
        } catch (err) {
            console.error("Failed to fetch timetable:", err);
            setTimetable([]);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredCourses = () => {
        if (!selectedDept) return [];
        return courses.filter(c => c.department_id === parseInt(selectedDept));
    };

    const resetForm = () => {
        setForm({
            subject_teacher_id: 0,
            slot_id: 0,
            room_no: '',
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        if (!selectedDept || !selectedSection || !form.subject_teacher_id || !form.slot_id || !form.room_no.trim()) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            if (isEditing) {
                await updateTimetable(editingId, form);
                toast.success('Entry updated!');
            } else {
                await createTimetable({
                    department_id: parseInt(selectedDept),
                    section: selectedSection,
                    subject_teacher_id: form.subject_teacher_id,
                    slot_id: form.slot_id,
                    room_no: form.room_no.trim()
                });
                toast.success('Entry added!');
            }

            fetchTimetable();
            resetForm();
        } catch (err) {
            // error handled by interceptor
        }
    };

    const handleEdit = (entry) => {
        setIsEditing(true);
        setEditingId(entry.timetable_id);
        setForm({
            subject_teacher_id: entry.subject_teacher_id || 0,
            slot_id: entry.slot_id || 0,
            room_no: entry.room_no || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await deleteTimetable(id);
            toast.success('Deleted');
            fetchTimetable();
        } catch (err) {
            // handled elsewhere
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <Toaster position="top-right" />

            <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" /> Timetable Management
            </h1>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-semibold mb-4">
                    {isEditing ? 'Edit Timetable Entry' : 'Add New Entry'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Department</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={selectedDept}
                            onChange={e => setSelectedDept(e.target.value)}
                            disabled={deptLoading || isEditing}
                        >
                            <option value="">{deptLoading ? "Loading..." : "Select Department"}</option>
                            {departments.map(d => (
                                <option key={d.department_id} value={d.department_id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Section</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={selectedSection}
                            onChange={e => setSelectedSection(e.target.value)}
                            disabled={!selectedDept || isEditing}
                        >
                            <option value="">Select Section</option>
                            {availableSections.map(s => (
                                <option key={s} value={s}>
                                    Section {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Course</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={selectedCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                            disabled={!selectedSection || isEditing}
                        >
                            <option value="">Select Course</option>
                            {getFilteredCourses().map(c => (
                                <option key={c.course_id} value={c.course_id}>
                                    {c.name} ({c.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Subject + Teacher</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={form.subject_teacher_id}
                            onChange={e => setForm({ ...form, subject_teacher_id: Number(e.target.value) })}
                            disabled={!selectedSection}
                        >
                            <option value={0}>Select assignment</option>
                            {subjectTeachers.map(st => (
                                <option key={st.subject_teacher_id} value={st.subject_teacher_id}>
                                    {st.subject_name} – {st.teacher_name} ({st.course_name})
                                </option>
                            ))}
                        </select>
                        {selectedSection && subjectTeachers.length === 0 && (
                            <p className="text-xs text-orange-500 mt-1">
                                No assignments. Create in Assignments page.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Time Slot</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={form.slot_id}
                            onChange={e => setForm({ ...form, slot_id: Number(e.target.value) })}
                        >
                            <option value={0}>Select slot</option>
                            {slots.map(s => (
                                <option key={s.slot_id} value={s.slot_id}>
                                    {s.day} {s.start} – {s.end}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Room No</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="e.g. LT-204"
                            value={form.room_no}
                            onChange={e => setForm({ ...form, room_no: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedSection || !form.subject_teacher_id || !form.slot_id || !form.room_no.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isEditing ? 'Update Entry' : 'Add Entry'}
                    </button>

                    {isEditing && (
                        <button
                            onClick={resetForm}
                            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                    )}

                    {selectedSection && (
                        <button
                            onClick={fetchTimetable}
                            disabled={loading}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    )}
                </div>
            </div>

            {selectedSection && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Timetable for Section {selectedSection}
                            <span className="text-sm font-normal text-gray-500">
                                ({departments.find(d => d.department_id === parseInt(selectedDept))?.name})
                            </span>
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-left">Day</th>
                                    <th className="p-3 text-left">Time</th>
                                    <th className="p-3 text-left">Subject</th>
                                    <th className="p-3 text-left">Teacher</th>
                                    <th className="p-3 text-left">Course</th>
                                    <th className="p-3 text-left">Room</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                                        </td>
                                    </tr>
                                ) : timetable.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">
                                            No entries yet. Add entries above.
                                        </td>
                                    </tr>
                                ) : (
                                    timetable.map(entry => (
                                        <tr key={entry.timetable_id} className="border-t hover:bg-gray-50">
                                            <td className="p-3">{entry.day}</td>
                                            <td className="p-3">{entry.start_time?.slice(0, 5)} – {entry.end_time?.slice(0, 5)}</td>
                                            <td className="p-3">{entry.subject}</td>
                                            <td className="p-3">{entry.teacher}</td>
                                            <td className="p-3">{entry.course_name}</td>
                                            <td className="p-3 font-medium">{entry.room_no}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleEdit(entry)} className="text-green-600 hover:text-green-800 mr-3">Edit</button>
                                                <button onClick={() => handleDelete(entry.timetable_id)} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!selectedSection && (
                <div className="text-center py-12 text-gray-500">
                    Select Department and Section to manage timetable
                </div>
            )}
        </div>
    );
}
