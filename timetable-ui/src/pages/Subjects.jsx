import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { getSubjects, createSubject, updateSubject, deleteSubject, getTerms, getCourses } from '../api/api';
import toast from 'react-hot-toast';

export default function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ academic_term_id: '', name: '', code: '', subject_type: 'MANDATORY', credits: 3, weekly_hours: 4 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [termsRes, coursesRes, subjectsRes] = await Promise.all([
                getTerms(),
                getCourses(),
                Promise.resolve({ data: [] })
            ]);

            const allSubjects = [];
            for (const term of termsRes.data) {
                try {
                    const subsRes = await getSubjects(term.id);
                    const course = coursesRes.data.find(c => c.id === term.course_id);
                    allSubjects.push(...subsRes.data.map(s => ({ 
                        ...s, 
                        term_number: term.term_number,
                        term_id: term.id,
                        course_name: course?.name || 'Unknown',
                        term_display: `Semester ${term.term_number} - ${course?.name || 'Unknown'}`
                    })));
                } catch (e) {}
            }
            
            setTerms(termsRes.data.map(t => {
                const course = coursesRes.data.find(c => c.id === t.course_id);
                return { ...t, course_name: course?.name || 'Unknown' };
            }));
            setSubjects(allSubjects);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { ...form };
            if (editingId) {
                await updateSubject(editingId, data);
                toast.success('Subject updated');
            } else {
                await createSubject(form.academic_term_id, data);
                toast.success('Subject created');
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) {
            // Error handled by interceptor
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({ academic_term_id: '', name: '', code: '', subject_type: 'MANDATORY', credits: 3, weekly_hours: 4 });
        setEditingId(null);
    };

    const handleEdit = (subject) => {
        setForm({
            academic_term_id: subject.term_id || subject.academic_term_id,
            name: subject.name,
            code: subject.code,
            subject_type: subject.subject_type,
            credits: subject.credits,
            weekly_hours: subject.weekly_hours
        });
        setEditingId(subject.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this subject?')) return;
        try {
            await deleteSubject(id);
            toast.success('Subject deleted');
            loadData();
        } catch (err) {
            // Error handled by interceptor
        }
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
                <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" /> Add Subject
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                    <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                                <p className="text-sm text-gray-500">Code: {subject.code}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${subject.subject_type === 'MANDATORY' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {subject.subject_type}
                            </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 mb-2">
                            <p className="text-xs text-gray-500">{subject.course_name} - Semester {subject.term_number}</p>
                            <p>Credits: {subject.credits}</p>
                            <p>Weekly Hours: {subject.weekly_hours}</p>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => handleEdit(subject)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(subject.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {subjects.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No subjects found. Create terms first, then add subjects.
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Subject</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Term (Course - Semester)</label>
                                <select 
                                    value={form.academic_term_id} 
                                    onChange={(e) => setForm({ ...form, academic_term_id: parseInt(e.target.value) })} 
                                    className="w-full px-4 py-2 border rounded-lg" 
                                    required
                                >
                                    <option value="">Select Term</option>
                                    {terms.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.course_name} - Semester {t.term_number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Mathematics" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                    <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., MATH101" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select value={form.subject_type} onChange={(e) => setForm({ ...form, subject_type: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                        <option value="MANDATORY">Mandatory</option>
                                        <option value="ELECTIVE">Elective</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                                    <input type="number" min="1" value={form.credits} onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Hours</label>
                                    <input type="number" min="1" value={form.weekly_hours} onChange={(e) => setForm({ ...form, weekly_hours: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
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
        </div>
    );
}
