import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Shield, Plus, ChevronRight } from 'lucide-react';
import { superAdminGetStats, superAdminGetOrganisations, superAdminCreateOrganisation, superAdminCreateAdmin } from '../api/api';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState(null);
    const [organisations, setOrganisations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [orgForm, setOrgForm] = useState({ name: '', address: '' });
    const [adminForm, setAdminForm] = useState({ username: '', email: '' });
    const [createdAdmin, setCreatedAdmin] = useState(null);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, orgsRes] = await Promise.all([
                superAdminGetStats(),
                superAdminGetOrganisations()
            ]);
            setStats(statsRes.data);
            setOrganisations(orgsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrganisation = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await superAdminCreateOrganisation(orgForm);
            toast.success('Organisation created');
            setSelectedOrg(res.data);
            setShowOrgModal(false);
            setOrgForm({ name: '', address: '' });
            setShowAdminModal(true);
            loadData();
        } catch (err) {
        } finally {
            setSaving(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        if (!selectedOrg) return;
        setSaving(true);
        try {
            const res = await superAdminCreateAdmin(selectedOrg.id, adminForm.username, adminForm.email);
            setCreatedAdmin(res.data);
            toast.success('Admin created! Save the password shown below.');
            setShowAdminModal(false);
            setAdminForm({ username: '', email: '' });
            loadData();
        } catch (err) {
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage all organisations and administrators</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                    >
                        Logout
                    </button>
                    <button
                        onClick={() => setShowOrgModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" /> New Organisation
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.total_organisations || 0}</p>
                            <p className="text-sm text-gray-500">Organisations</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
                            <p className="text-sm text-gray-500">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.total_admins || 0}</p>
                            <p className="text-sm text-gray-500">Admins</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Organisations</h2>
                </div>
                <div className="divide-y">
                    {organisations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No organisations yet. Create your first one!
                        </div>
                    ) : (
                        organisations.map(org => {
                            const orgStats = stats?.organisations?.find(o => o.organisation_id === org.id);
                            return (
                                <div key={org.id} 
                                    onClick={() => navigate(`/super-admin/organisations/${org.id}`)}
                                    className="p-6 hover:bg-gray-50 transition cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{org.name}</h3>
                                            <p className="text-sm text-gray-500">Code: {org.code}</p>
                                            {org.address && <p className="text-sm text-gray-400 mt-1">{org.address}</p>}
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-center">
                                                <p className="text-lg font-semibold text-gray-900">{orgStats?.users || 0}</p>
                                                <p className="text-xs text-gray-500">Users</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-semibold text-gray-900">{orgStats?.departments || 0}</p>
                                                <p className="text-xs text-gray-500">Depts</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-semibold text-gray-900">{orgStats?.courses || 0}</p>
                                                <p className="text-xs text-gray-500">Courses</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {createdAdmin && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Created Successfully!</h2>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-amber-800 font-medium mb-2">IMPORTANT: Save this password now!</p>
                            <p className="text-2xl font-mono font-bold text-amber-900 break-all">{createdAdmin.password}</p>
                            <p className="text-xs text-amber-600 mt-2">This password will not be shown again.</p>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><span className="text-gray-500">Username:</span> <span className="font-medium">{createdAdmin.username}</span></p>
                            <p><span className="text-gray-500">Email:</span> <span className="font-medium">{createdAdmin.email}</span></p>
                            <p><span className="text-gray-500">Organisation:</span> <span className="font-medium">{createdAdmin.organisation_name}</span></p>
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

            {showOrgModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Organisation</h2>
                        <form onSubmit={handleCreateOrganisation} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Name</label>
                                <input
                                    type="text"
                                    value={orgForm.name}
                                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="e.g., ABC College"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
                                <input
                                    type="text"
                                    value={orgForm.address}
                                    onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="e.g., New Delhi"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowOrgModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Creating...' : 'Create & Add Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdminModal && selectedOrg && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Create Admin for {selectedOrg.name}</h2>
                        <p className="text-sm text-gray-500 mb-4">A password will be auto-generated for this admin.</p>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={adminForm.username}
                                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="e.g., admin@abc"
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
                                    placeholder="e.g., admin@abc.com"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => { setShowAdminModal(false); setSelectedOrg(null); }} className="px-4 py-2 border rounded-lg">Skip</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Creating...' : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
