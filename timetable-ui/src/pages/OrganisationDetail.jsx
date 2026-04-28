import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Users, Shield, GraduationCap, BookOpen, Calendar, DoorOpen, ChevronLeft, Plus } from 'lucide-react';
import { superAdminGetOrganisation, superAdminCreateAdmin } from '../api/api';
import toast from 'react-hot-toast';

export default function OrganisationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [org, setOrg] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminForm, setAdminForm] = useState({ username: '', email: '' });
    const [saving, setSaving] = useState(false);
    const [createdAdmin, setCreatedAdmin] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [orgRes, statsRes] = await Promise.all([
                superAdminGetOrganisation(id),
                fetch(`http://localhost:8000/super-admin/stats`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }).then(r => r.json())
            ]);
            setOrg(orgRes.data);
            setStats(statsRes.organisations?.find(o => o.organisation_id === parseInt(id)));
        } catch (err) {
            console.error(err);
            toast.error('Failed to load organisation');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await superAdminCreateAdmin(id, adminForm.username, adminForm.email);
            setCreatedAdmin(res.data);
            toast.success('Admin created!');
            setShowAdminModal(false);
            setAdminForm({ username: '', email: '' });
            loadData();
        } catch (err) {
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!org) {
        return (
            <div className="p-6">
                <p className="text-gray-500">Organisation not found</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <button
                onClick={() => navigate('/super-admin')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ChevronLeft className="w-5 h-5" /> Back to Dashboard
            </button>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
                    </div>
                    <p className="text-gray-500 mt-1">Code: {org.code}</p>
                    {org.address && <p className="text-gray-400 mt-1">{org.address}</p>}
                </div>
                <button
                    onClick={() => setShowAdminModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" /> Add Admin
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.users || 0}</p>
                            <p className="text-sm text-gray-500">Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Building2 className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.departments || 0}</p>
                            <p className="text-sm text-gray-500">Departments</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.courses || 0}</p>
                            <p className="text-sm text-gray-500">Courses</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.terms || 0}</p>
                            <p className="text-sm text-gray-500">Terms</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-100 rounded-lg">
                            <Users className="w-6 h-6 text-pink-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.sections || 0}</p>
                            <p className="text-sm text-gray-500">Sections</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <DoorOpen className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.rooms || 0}</p>
                            <p className="text-sm text-gray-500">Rooms</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{org.is_active ? 'Active' : 'Inactive'}</p>
                            <p className="text-sm text-gray-500">Status</p>
                        </div>
                    </div>
                </div>
            </div>

            {showAdminModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Create Admin for {org.name}</h2>
                        <p className="text-sm text-gray-500 mb-4">A password will be auto-generated.</p>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={adminForm.username}
                                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={adminForm.email}
                                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAdminModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Creating...' : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {createdAdmin && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Created!</h2>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-amber-800 font-medium mb-2">Save this password now:</p>
                            <p className="text-2xl font-mono font-bold text-amber-900 break-all">{createdAdmin.password}</p>
                            <p className="text-xs text-amber-600 mt-2">Will not be shown again.</p>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><span className="text-gray-500">Username:</span> <span className="font-medium">{createdAdmin.username}</span></p>
                            <p><span className="text-gray-500">Email:</span> <span className="font-medium">{createdAdmin.email}</span></p>
                        </div>
                        <button
                            onClick={() => setCreatedAdmin(null)}
                            className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}