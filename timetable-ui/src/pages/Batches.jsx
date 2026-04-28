import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { getBatches, createBatch, updateBatch, deleteBatch, getSubjects, getTerms, getCourses } from '../api/api';
import toast from 'react-hot-toast';

export default function Batches() {
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [electives, setElectives] = useState([]);
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ term_id: '', subject_id: '', name: '', max_capacity: 30 });
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

            const termsWithCourse = termsRes.data.map(t => {
                const course = coursesRes.data.find(c => c.id === t.course_id);
                return { ...t, course_name: course?.name || 'Unknown' };
            });
            setTerms(termsWithCourse);

            const allSubjects = [];
            const allElectives = [];
            for (const term of termsRes.data) {
                try {
                    const subsRes = await getSubjects(term.id);
                    const course = coursesRes.data.find(c => c.id === term.course_id);
                    subsRes.data.forEach(s => {
                        allSubjects.push({ ...s, term_id: term.id, course_name: course?.name, term_number: term.term_number });
                        if (s.subject_type === 'ELECTIVE') {
                            allElectives.push({ ...s, term_id: term.id, course_name: course?.name, term_number: term.term_number });
                        }
                    });
                } catch (e) {}
            }
            setSubjects(allSubjects);
            setElectives(allElectives);

            const allBatches = [];
            for (const term of termsRes.data) {
                try {
                    const batchesRes = await getBatches(term.id);
                    const course = coursesRes.data.find(c => c.id === term.course_id);
                    batchesRes.data.forEach(b => {
                        const subject = allSubjects.find(s => s.id === b.subject_id);
                        allBatches.push({ 
                            ...b, 
                            term_number: term.term_number,
                            course_name: course?.name || 'Unknown',
                            term_id: term.id,
                            display_name: `Semester ${term.term_number} - ${course?.name || 'Unknown'}`
                        });
                    });
                } catch (e) {}
            }
            setBatches(allBatches);
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
            const data = { 
                subject_id: parseInt(form.subject_id), 
                name: form.name, 
                max_capacity: parseInt(form.max_capacity) 
            };
            if (editingId) {
                await updateBatch(editingId, data);
                toast.success('Batch updated');
            } else {
                await createBatch(form.term_id, data);
                toast.success('Batch created');
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
        setForm({ term_id: '', subject_id: '', name: '', max_capacity: 30 });
        setEditingId(null);
    };

    const handleEdit = (batch) => {
        const subject = subjects.find(s => s.id === batch.subject_id);
        setForm({
            term_id: batch.term_id,
            subject_id: batch.subject_id,
            name: batch.name,
            max_capacity: batch.max_capacity
        });
        setEditingId(batch.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this batch?')) return;
        try {
            await deleteBatch(id);
            toast.success('Batch deleted');
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Elective Batches</h1>
                    <p className="text-sm text-gray-500 mt-1">Create groups for elective subjects</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" /> Add Batch
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elective Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {batches.map((batch) => {
                            const subject = subjects.find(s => s.id === batch.subject_id);
                            return (
                                <tr key={batch.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-900">{batch.display_name}</td>
                                    <td className="px-6 py-4 text-gray-900">{subject?.name || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">Batch {batch.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{batch.max_capacity} students</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${batch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {batch.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEdit(batch)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(batch.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg ml-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {batches.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    No batches found. Create elective subjects first, then add batches.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Batch</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                <select 
                                    value={form.term_id} 
                                    onChange={(e) => setForm({ ...form, term_id: parseInt(e.target.value), subject_id: '' })} 
                                    className="w-full px-4 py-2 border rounded-lg" 
                                    required
                                    disabled={editingId}
                                >
                                    <option value="">Select Semester</option>
                                    {terms.map(t => (
                                        <option key={t.id} value={t.id}>
                                            Semester {t.term_number} - {t.course_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Elective Subject</label>
                                <select 
                                    value={form.subject_id} 
                                    onChange={(e) => setForm({ ...form, subject_id: parseInt(e.target.value) })} 
                                    className="w-full px-4 py-2 border rounded-lg" 
                                    required
                                    disabled={editingId}
                                >
                                    <option value="">Select Elective</option>
                                    {electives.filter(e => e.term_id === form.term_id).map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code})
                                        </option>
                                    ))}
                                </select>
                                {electives.filter(e => e.term_id === form.term_id).length === 0 && form.term_id && (
                                    <p className="text-xs text-orange-500 mt-1">No elective subjects in this semester. Create one first.</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                                    <select 
                                        value={form.name} 
                                        onChange={(e) => setForm({ ...form, name: e.target.value })} 
                                        className="w-full px-4 py-2 border rounded-lg" 
                                        required
                                    >
                                        <option value="">Select</option>
                                        {['1', '2', '3', '4', 'A', 'B', 'C'].map(n => (
                                            <option key={n} value={n}>Batch {n}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={form.max_capacity} 
                                        onChange={(e) => setForm({ ...form, max_capacity: e.target.value })} 
                                        className="w-full px-4 py-2 border rounded-lg" 
                                    />
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
