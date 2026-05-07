import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { getFaculties, createFaculty, updateFaculty, deleteFaculty, getDepartments, getTerms, getCourses, getSubjects, getSections, getBatches, getFacultyAssignments, createFacultyAssignment, deleteFacultyAssignment } from '../api/api';
import toast from 'react-hot-toast';

export default function Faculty() {
    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [terms, setTerms] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [batches, setBatches] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        name: '', employee_code: '', email: '', phone: '', specialization: '', max_weekly_hours: 20, department_id: ''
    });
    const [saving, setSaving] = useState(false);
    const [expandedFacultyId, setExpandedFacultyId] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignFacultyId, setAssignFacultyId] = useState(null);
    const [assignForm, setAssignForm] = useState({ subject_id: '', section_id: '', batch_id: '' });
    const [assignSaving, setAssignSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [facultiesRes, deptsRes, coursesRes, termsRes, assignRes] = await Promise.all([
                getFaculties(),
                getDepartments(),
                getCourses(),
                getTerms(),
                getFacultyAssignments()
            ]);
            setFaculties(facultiesRes.data);
            setDepartments(deptsRes.data);
            setCourses(coursesRes.data);
            setTerms(termsRes.data);
            setAssignments(assignRes.data);

            const allSubjects = [];
            const allSections = [];
            const allBatches = [];
            for (const term of termsRes.data) {
                try {
                    const [subsRes, secsRes, batsRes] = await Promise.all([
                        getSubjects(term.id),
                        getSections(term.id),
                        getBatches(term.id)
                    ]);
                    allSubjects.push(...subsRes.data.map(s => ({ ...s, term_id: term.id })));
                    allSections.push(...secsRes.data.map(s => ({ ...s, term_id: term.id })));
                    allBatches.push(...batsRes.data.map(b => ({ ...b, term_id: term.id })));
                } catch (e) {}
            }
            setSubjects(allSubjects);
            setSections(allSections);
            setBatches(allBatches);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const subjectDepartmentMap = useMemo(() => {
        const map = {};
        for (const subject of subjects) {
            const term = terms.find(t => t.id === subject.term_id);
            if (term) {
                const course = courses.find(c => c.id === term.course_id);
                if (course) {
                    map[subject.id] = course.department_id;
                }
            }
        }
        return map;
    }, [subjects, terms, courses]);

    const getFacultyAssignments_ = (facultyId) => {
        return assignments.filter(a => a.faculty_id === facultyId && a.is_active);
    };

    const getSubjectName = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? `${subject.name} (${subject.code})` : 'Unknown';
    };

    const getSubject = (subjectId) => {
        return subjects.find(s => s.id === subjectId);
    };

    const getSectionName = (sectionId) => {
        if (!sectionId) return null;
        const section = sections.find(s => s.id === sectionId);
        return section?.name || 'Unknown';
    };

    const getBatchName = (batchId) => {
        if (!batchId) return null;
        const batch = batches.find(b => b.id === batchId);
        return batch?.name || 'Unknown';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = {
                ...form,
                department_id: parseInt(form.department_id),
                max_weekly_hours: parseInt(form.max_weekly_hours)
            };
            if (editingId) {
                await updateFaculty(editingId, data);
                toast.success('Faculty updated');
            } else {
                await createFaculty(data);
                toast.success('Faculty created');
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) {
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', employee_code: '', email: '', phone: '', specialization: '', max_weekly_hours: 20, department_id: '' });
        setEditingId(null);
    };

    const handleEdit = (faculty) => {
        setForm({
            name: faculty.name,
            employee_code: faculty.employee_code,
            email: faculty.email || '',
            phone: faculty.phone || '',
            specialization: faculty.specialization || '',
            max_weekly_hours: faculty.max_weekly_hours,
            department_id: faculty.department_id
        });
        setEditingId(faculty.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this faculty?')) return;
        try {
            await deleteFaculty(id);
            toast.success('Faculty deleted');
            loadData();
        } catch (err) {
        }
    };

    const refreshAssignments = async () => {
        try {
            const res = await getFacultyAssignments();
            setAssignments(res.data);
        } catch (e) {}
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!assignForm.subject_id) return;
        setAssignSaving(true);
        try {
            const data = {
                faculty_id: assignFacultyId,
                subject_id: parseInt(assignForm.subject_id),
                section_id: assignForm.section_id ? parseInt(assignForm.section_id) : null,
                batch_id: assignForm.batch_id ? parseInt(assignForm.batch_id) : null
            };
            await createFacultyAssignment(data);
            toast.success('Subject assigned');
            setShowAssignModal(false);
            setAssignForm({ subject_id: '', section_id: '', batch_id: '' });
            await refreshAssignments();
        } catch (err) {
        } finally {
            setAssignSaving(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId) => {
        if (!confirm('Remove this assignment?')) return;
        try {
            await deleteFacultyAssignment(assignmentId);
            toast.success('Assignment removed');
            await refreshAssignments();
        } catch (err) {
        }
    };

    const openAssignModal = (facultyId) => {
        setAssignFacultyId(facultyId);
        setAssignForm({ subject_id: '', section_id: '', batch_id: '' });
        setShowAssignModal(true);
    };

    const handleAssignSubjectChange = (e) => {
        const subjectId = e.target.value;
        const subject = getSubject(parseInt(subjectId));
        setAssignForm({
            subject_id: subjectId,
            section_id: '',
            batch_id: ''
        });
    };

    const selectedAssignSubject = useMemo(() => {
        if (!assignForm.subject_id) return null;
        return getSubject(parseInt(assignForm.subject_id));
    }, [assignForm.subject_id, subjects]);

    const assignSubjectType = selectedAssignSubject?.subject_type;

    const availableSections = useMemo(() => {
        if (!selectedAssignSubject) return [];
        return sections.filter(s => s.academic_term_id === selectedAssignSubject.academic_term_id);
    }, [selectedAssignSubject, sections]);

    const availableBatches = useMemo(() => {
        if (!selectedAssignSubject) return [];
        return batches.filter(b => b.academic_term_id === selectedAssignSubject.academic_term_id && b.subject_id === selectedAssignSubject.id);
    }, [selectedAssignSubject, batches]);

    const toggleExpand = (facultyId) => {
        setExpandedFacultyId(expandedFacultyId === facultyId ? null : facultyId);
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
                <h1 className="text-2xl font-bold text-gray-900">Faculties</h1>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" /> Add Faculty
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {faculties.map((faculty) => {
                    const facultyAssignments = getFacultyAssignments_(faculty.id);
                    const isExpanded = expandedFacultyId === faculty.id;
                    return (
                        <div key={faculty.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{faculty.name}</h3>
                                    <p className="text-sm text-gray-500">Code: {faculty.employee_code}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${faculty.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {faculty.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600 mb-3">
                                {faculty.email && <p>Email: {faculty.email}</p>}
                                {faculty.specialization && <p>Specialization: {faculty.specialization}</p>}
                                <p>Max Hours/Week: {faculty.max_weekly_hours}h</p>
                            </div>

                            <button
                                onClick={() => toggleExpand(faculty.id)}
                                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 mb-2 w-full text-left"
                            >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                <BookOpen className="w-3.5 h-3.5" />
                                Assigned Subjects ({facultyAssignments.length})
                            </button>

                            {isExpanded && (
                                <div className="space-y-1.5 mb-3 pl-5 border-l-2 border-blue-100">
                                    {facultyAssignments.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No subjects assigned</p>
                                    ) : (
                                        facultyAssignments.map(a => (
                                            <div key={a.id} className="flex items-center justify-between group">
                                                <span className="text-sm text-gray-700">
                                                    {getSubjectName(a.subject_id)}
                                                    {a.section_id && <span className="text-xs text-gray-400"> (Section: {getSectionName(a.section_id)})</span>}
                                                    {a.batch_id && <span className="text-xs text-gray-400"> (Batch: {getBatchName(a.batch_id)})</span>}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveAssignment(a.id)}
                                                    className="p-0.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                    <button
                                        onClick={() => openAssignModal(faculty.id)}
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                                    >
                                        <Plus className="w-3 h-3" /> Assign Subject
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1 border-t border-gray-50">
                                <button onClick={() => handleEdit(faculty)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(faculty.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {faculties.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">No faculties found</div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Faculty</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                                    <input type="text" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                                    <input type="text" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Weekly Hours</label>
                                    <input type="number" min="1" max="40" value={form.max_weekly_hours} onChange={(e) => setForm({ ...form, max_weekly_hours: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Assign Subject</h2>
                            <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                                <p className="px-4 py-2 bg-gray-50 border rounded-lg text-gray-700">
                                    {faculties.find(f => f.id === assignFacultyId)?.name || 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select
                                    value={assignForm.subject_id}
                                    onChange={handleAssignSubjectChange}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjects
                                        .filter(s => subjectDepartmentMap[s.id] === faculties.find(f => f.id === assignFacultyId)?.department_id)
                                        .map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.code}) - {s.subject_type === 'MANDATORY' ? 'Mandatory' : 'Elective'}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            {assignSubjectType === 'MANDATORY' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                    <select
                                        value={assignForm.section_id}
                                        onChange={(e) => setAssignForm({ ...assignForm, section_id: e.target.value, batch_id: '' })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    >
                                        <option value="">Select Section</option>
                                        {availableSections.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {assignSubjectType === 'ELECTIVE' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                                    <select
                                        value={assignForm.batch_id}
                                        onChange={(e) => setAssignForm({ ...assignForm, batch_id: e.target.value, section_id: '' })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    >
                                        <option value="">Select Batch</option>
                                        {availableBatches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={assignSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {assignSaving ? 'Saving...' : 'Assign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
