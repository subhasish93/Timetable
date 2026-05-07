import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTimetableByTerm, createTimetableSlot, deleteTimetableSlot, getTerms, getFaculties, getRooms, getSubjects, getCourses, getDepartments, getFacultyAssignments } from '../api/api';
import toast from 'react-hot-toast';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function getMonday(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}`;
}

function toInputDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function addWeeks(dateStr, weeks) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + weeks * 7);
    return toInputDate(d);
}

export default function TimetableManager() {
    const [slots, setSlots] = useState([]);
    const [terms, setTerms] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedTermInfo, setSelectedTermInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        subject_id: '', faculty_id: '', section_id: null, batch_id: null, room_id: '', date: '', start_time: '09:00', end_time: '10:00'
    });
    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [subjectAssignments, setSubjectAssignments] = useState([]);
    const [subjectAssignmentsLoaded, setSubjectAssignmentsLoaded] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [termsRes, facultiesRes, roomsRes, coursesRes, deptsRes] = await Promise.all([
                getTerms(),
                getFaculties(),
                getRooms(),
                getCourses(),
                getDepartments()
            ]);

            const termsWithCourse = termsRes.data.map(t => {
                const course = coursesRes.data.find(c => c.id === t.course_id);
                const dept = course ? deptsRes.data.find(d => d.id === course.department_id) : null;
                return { ...t, course_name: course?.name || 'Unknown', department_id: course?.department_id, department_name: dept?.name };
            });

            setTerms(termsWithCourse);
            setFaculties(facultiesRes.data);
            setRooms(roomsRes.data);
            setDepartments(deptsRes.data);

            const allSubjects = [];
            for (const term of termsRes.data) {
                try {
                    const subsRes = await getSubjects(term.id);
                    allSubjects.push(...subsRes.data.map(s => ({ ...s, term_id: term.id })));
                } catch (e) {}
            }
            setSubjects(allSubjects);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadTimetable = async (termId) => {
        if (!termId) return;
        try {
            const res = await getTimetableByTerm(termId);
            setSlots(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const selectedSubject = useMemo(() => {
        return subjects.find(s => s.id === parseInt(form.subject_id));
    }, [subjects, form.subject_id]);

    const selectedSubjectDepartmentId = useMemo(() => {
        if (!selectedSubject || !selectedTermInfo) return null;
        return selectedTermInfo.department_id;
    }, [selectedSubject, selectedTermInfo]);

    const filteredFaculties = useMemo(() => {
        let result = faculties;
        if (selectedSubjectDepartmentId) {
            result = result.filter(f => f.department_id === selectedSubjectDepartmentId);
        }
        if (form.subject_id && subjectAssignmentsLoaded) {
            const assignedFacultyIds = new Set(subjectAssignments.map(a => a.faculty_id));
            result = result.filter(f => assignedFacultyIds.has(f.id));
        }
        return result;
    }, [faculties, selectedSubjectDepartmentId, form.subject_id, subjectAssignments, subjectAssignmentsLoaded]);

    const filteredRooms = useMemo(() => {
        if (!selectedSubjectDepartmentId) return rooms;
        return rooms.filter(r => r.department_id === selectedSubjectDepartmentId);
    }, [rooms, selectedSubjectDepartmentId]);

    const facultyOptions = useMemo(() => {
        const seen = new Set();
        return slots.filter(s => {
            if (seen.has(s.faculty_id)) return false;
            seen.add(s.faculty_id);
            return true;
        }).map(s => ({ id: s.faculty_id, name: s.faculty_name }));
    }, [slots]);

    const weekDates = useMemo(() => {
        if (!selectedDate) return [];
        const monday = getMonday(selectedDate);
        return DAYS.map((day, index) => {
            const d = new Date(monday);
            d.setDate(d.getDate() + index);
            return { dayOfWeek: day, date: d, label: `${day.slice(0, 3)} ${formatDate(d)}` };
        });
    }, [selectedDate]);

    const filteredSlots = useMemo(() => {
        if (!selectedFaculty) return slots;
        return slots.filter(s => s.faculty_id === parseInt(selectedFaculty));
    }, [slots, selectedFaculty]);

    const weekSlots = useMemo(() => {
        if (!weekDates.length) return [];
        const start = new Date(weekDates[0].date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(weekDates[6].date);
        end.setHours(23, 59, 59, 999);
        return filteredSlots.filter(s => {
            const d = new Date(s.date + 'T00:00:00');
            return d >= start && d <= end;
        });
    }, [filteredSlots, weekDates]);

    const handleTermChange = (e) => {
        const termId = e.target.value;
        setSelectedTerm(termId);
        const term = terms.find(t => t.id === parseInt(termId));
        setSelectedTermInfo(term);
        setForm({ ...form, academic_term_id: termId, subject_id: '', faculty_id: '', room_id: '' });
        setSelectedFaculty('');
        setSubjectAssignments([]);
        setSubjectAssignmentsLoaded(false);
        if (termId) {
            setSelectedDate(term.start_date);
            loadTimetable(termId);
        } else {
            setSelectedDate('');
            setSlots([]);
        }
    };

    const handleSubjectChange = async (e) => {
        const subjectId = e.target.value;
        setForm({ ...form, subject_id: subjectId, faculty_id: '', room_id: '' });
        setSubjectAssignmentsLoaded(false);
        if (subjectId) {
            try {
                const res = await getFacultyAssignments({ subject_id: subjectId });
                setSubjectAssignments(res.data);
            } catch (e) {
                setSubjectAssignments([]);
            }
            setSubjectAssignmentsLoaded(true);
        } else {
            setSubjectAssignments([]);
            setSubjectAssignmentsLoaded(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = {
                academic_term_id: parseInt(selectedTerm),
                subject_id: parseInt(form.subject_id),
                faculty_id: parseInt(form.faculty_id),
                section_id: form.section_id ? parseInt(form.section_id) : null,
                batch_id: form.batch_id ? parseInt(form.batch_id) : null,
                room_id: parseInt(form.room_id),
                date: form.date,
                start_time: form.start_time + ':00',
                end_time: form.end_time + ':00'
            };
            await createTimetableSlot(data);
            toast.success('Slot created');
            setShowModal(false);
            setForm({ subject_id: '', faculty_id: '', section_id: null, batch_id: null, room_id: '', date: '', start_time: '09:00', end_time: '10:00' });
            loadTimetable(selectedTerm);
        } catch (err) {
            // Error handled by interceptor
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this slot?')) return;
        try {
            await deleteTimetableSlot(id);
            toast.success('Slot deleted');
            loadTimetable(selectedTerm);
        } catch (err) {
            // Error handled by interceptor
        }
    };

    const getSlotsByDay = (dayIndex) => {
        const targetDate = weekDates[dayIndex]?.date;
        if (!targetDate) return [];
        return weekSlots.filter(s => {
            const d = new Date(s.date + 'T00:00:00');
            return d.getFullYear() === targetDate.getFullYear() &&
                   d.getMonth() === targetDate.getMonth() &&
                   d.getDate() === targetDate.getDate();
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
                    {selectedTermInfo && (
                        <p className="text-sm text-gray-500 mt-1">
                            {selectedTermInfo.course_name} - Semester {selectedTermInfo.term_number}
                        </p>
                    )}
                </div>
                <div className="flex gap-4">
                    <select 
                        value={selectedTerm} 
                        onChange={handleTermChange} 
                        className="px-4 py-2 border rounded-lg min-w-[200px]"
                    >
                        <option value="">Select Term</option>
                        {terms.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.course_name} - Semester {t.term_number}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedFaculty}
                        onChange={(e) => setSelectedFaculty(e.target.value)}
                        className="px-4 py-2 border rounded-lg min-w-[180px]"
                        disabled={!selectedTerm}
                    >
                        <option value="">All Faculties</option>
                        {facultyOptions.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                    {selectedTerm && (
                        <button
                            onClick={() => {
                                setForm({ subject_id: '', faculty_id: '', section_id: null, batch_id: null, room_id: '', date: selectedDate, start_time: '09:00', end_time: '10:00' });
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-5 h-5" /> Add Slot
                        </button>
                    )}
                </div>
            </div>

            {selectedTerm && selectedDate && (
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">Week:</span>
                    <input
                        type="date"
                        value={selectedDate}
                        min={selectedTermInfo?.start_date}
                        max={selectedTermInfo?.end_date}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                    />
                    <button
                        onClick={() => setSelectedDate(addWeeks(selectedDate, -1))}
                        className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-30"
                        disabled={new Date(selectedDate + 'T00:00:00') <= new Date(selectedTermInfo?.start_date + 'T00:00:00')}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}
                        className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-30"
                        disabled={new Date(selectedDate + 'T00:00:00') >= new Date(selectedTermInfo?.end_date + 'T00:00:00')}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500">
                        {weekDates.length > 0 && `${formatDate(weekDates[0].date)} ${weekDates[0].date.getFullYear()} – ${formatDate(weekDates[6].date)} ${weekDates[6].date.getFullYear()}`}
                    </span>
                </div>
            )}

            {selectedTerm ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-7 border-b">
                        {weekDates.map(wd => (
                            <div key={wd.dayOfWeek} className="px-4 py-3 text-center font-semibold text-gray-700 bg-gray-50 border-r last:border-r-0">
                                {wd.label}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 min-h-[400px]">
                        {weekDates.map((wd, idx) => (
                            <div key={wd.dayOfWeek} className="border-r last:border-r-0 p-2 space-y-2">
                                {getSlotsByDay(idx).map(slot => (
                                    <div key={slot.id} className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm">
                                        <div className="font-medium text-blue-900">{slot.subject_name}</div>
                                        <div className="text-blue-700">{slot.start_time?.slice(0,5)} - {slot.end_time?.slice(0,5)}</div>
                                        <div className="text-blue-600">{slot.faculty_name}</div>
                                        <div className="text-blue-500">{slot.room_name}</div>
                                        <button onClick={() => handleDelete(slot.id)} className="mt-1 text-red-600 hover:bg-red-100 p-1 rounded">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                    Select a term above to view its timetable
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Add Timetable Slot</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            if (!form.date) setForm(f => ({ ...f, date: selectedDate }));
                            handleSubmit(e);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select 
                                    value={form.subject_id} 
                                    onChange={handleSubjectChange} 
                                    className="w-full px-4 py-2 border rounded-lg" 
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.filter(s => s.academic_term_id === parseInt(selectedTerm)).map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Faculty {selectedSubjectDepartmentId && <span className="text-xs text-gray-500">(filtered by department)</span>}
                                </label>
                                <select 
                                    value={form.faculty_id} 
                                    onChange={(e) => setForm({ ...form, faculty_id: e.target.value })} 
                                    className="w-full px-4 py-2 border rounded-lg" 
                                    required
                                    disabled={!selectedSubjectDepartmentId || (form.subject_id && subjectAssignmentsLoaded && filteredFaculties.length === 0)}
                                >
                                    <option value="">
                                        {!selectedSubjectDepartmentId
                                            ? 'Select a subject first'
                                            : form.subject_id && subjectAssignmentsLoaded && filteredFaculties.length === 0
                                                ? 'No faculty assigned to this subject'
                                                : 'Select Faculty'}
                                    </option>
                                    {filteredFaculties.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Room {selectedSubjectDepartmentId && <span className="text-xs text-gray-500">(filtered by department)</span>}
                                </label>
                                <select 
                                    value={form.room_id} 
                                    onChange={(e) => setForm({ ...form, room_id: e.target.value })} 
                                    className="w-full px-4 py-2 border rounded-lg" 
                                    required
                                    disabled={!selectedSubjectDepartmentId}
                                >
                                    <option value="">{!selectedSubjectDepartmentId ? 'Select a subject first' : 'Select Room'}</option>
                                    {filteredRooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} (Capacity: {r.capacity})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={form.date || selectedDate}
                                    min={selectedTermInfo?.start_date}
                                    max={selectedTermInfo?.end_date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        value={form.start_time} 
                                        onChange={(e) => setForm({ ...form, start_time: e.target.value })} 
                                        className="w-full px-4 py-2 border rounded-lg" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input 
                                        type="time" 
                                        value={form.end_time} 
                                        onChange={(e) => setForm({ ...form, end_time: e.target.value })} 
                                        className="w-full px-4 py-2 border rounded-lg" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Creating...' : 'Create Slot'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
