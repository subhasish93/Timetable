// src/pages/TimetableManager.jsx

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
    Calendar,
    BookOpen,
    Trash2,
    Pencil,
} from 'lucide-react';
import {
    getSections,
    getTimeSlots,
    getSubjectTeachers,
    getSectionTimetable,
    createTimetable,
    deleteTimetable,
    updateTimetable,
} from '../api/api'; 

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableManager() {
    const [sections, setSections] = useState([]);
    const [slots, setSlots] = useState([]);
    const [subjectTeachers, setSubjectTeachers] = useState([]);

    const [selectedSection, setSelectedSection] = useState(null);
    const [timetable, setTimetable] = useState([]);

    // ── Edit mode state ───────────────────────────────────────
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        section_id: 0,
        subject_teacher_id: 0,
        slot_id: 0,
        room_no: '',
    });

    useEffect(() => {
        Promise.all([
            getSections().then(r => setSections(r.data)),
            getTimeSlots().then(r => setSlots(r.data)),
            getSubjectTeachers().then(r => setSubjectTeachers(r.data)),
        ]).catch(() => toast.error('Failed to load initial data'));
    }, []);

    useEffect(() => {
        if (selectedSection) {
            getSectionTimetable(selectedSection)
                .then(r => setTimetable(r.data))
                .catch(() => { });
            setForm(prev => ({ ...prev, section_id: selectedSection }));
        }
    }, [selectedSection]);

    // Reset form to "create" mode
    const resetForm = () => {
        setForm({
            section_id: selectedSection || 0,
            subject_teacher_id: 0,
            slot_id: 0,
            room_no: '',
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        if (!form.section_id || !form.subject_teacher_id || !form.slot_id || !form.room_no.trim()) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            if (isEditing) {
                // ── UPDATE ───────────────────────────────────────
                await updateTimetable(editingId, form);
                toast.success('Entry updated!');
            } else {
                // ── CREATE ───────────────────────────────────────
                await createTimetable(form);
                toast.success('Entry added!');
            }

            // Refresh timetable
            if (selectedSection) {
                const res = await getSectionTimetable(selectedSection);
                setTimetable(res.data);
            }

            resetForm();
        } catch (err) {
            // error handled by interceptor / axios
        }
    };

    const handleEdit = (entry) => {
        setIsEditing(true);
        setEditingId(entry.timetable_id);

        // Pre-fill form
        setForm({
            section_id: selectedSection,
            subject_teacher_id: entry.subject_teacher_id || 0,   // adjust if field name is different in response
            slot_id: entry.slot_id || 0,
            room_no: entry.room_no || '',
        });

        // Optional: scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;

        try {
            await deleteTimetable(id);
            toast.success('Deleted');
            setTimetable(prev => prev.filter(e => e.timetable_id !== id));
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

            {/* Form / Controls */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-semibold mb-4">
                    {isEditing ? 'Edit Timetable Entry' : 'Add New Entry'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Section – usually fixed when editing */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Section</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={selectedSection || ''}
                            onChange={e => setSelectedSection(Number(e.target.value) || null)}
                            disabled={isEditing} // prevent changing section while editing
                        >
                            <option value="">Select section to view</option>
                            {sections.map(s => (
                                <option key={s.section_id} value={s.section_id}>
                                    {s.name} ({s.course} - Sem {s.semester})
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
                        >
                            <option value={0}>Select assignment</option>
                            {subjectTeachers.map(st => (
                                <option key={st.subject_teacher_id} value={st.subject_teacher_id}>
                                    {st.subject_name} – {st.teacher_name}
                                </option>
                            ))}
                        </select>
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
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
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
                </div>
            </div>

            {/* Timetable Display */}
            {selectedSection && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Timetable for {sections.find(s => s.section_id === selectedSection)?.name || 'Selected section'}
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
                                    <th className="p-3 text-left">Room</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timetable.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No entries yet for this section
                                        </td>
                                    </tr>
                                ) : (
                                    timetable.map(entry => (
                                        <tr key={entry.timetable_id} className="border-t hover:bg-gray-50">
                                            <td className="p-3">{entry.day}</td>
                                            <td className="p-3">
                                                {entry.start_time?.slice(0, 5)} – {entry.end_time?.slice(0, 5)}
                                            </td>
                                            <td className="p-3">{entry.subject}</td>
                                            <td className="p-3">{entry.teacher}</td>
                                            <td className="p-3 font-medium">{entry.room_no}</td>
                                            <td className="p-3 text-center flex justify-center gap-3">
                                                <button
                                                    onClick={() => handleEdit(entry)}
                                                    className="text-green-600 hover:text-green-800"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry.timetable_id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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
                    Select a section above to view and manage its timetable
                </div>
            )}
        </div>
    );
}