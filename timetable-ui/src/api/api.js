import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        let errorMessage = 'Something went wrong';
        
        if (err.response?.data?.detail) {
            const detail = err.response.data.detail;
            if (typeof detail === 'string') {
                errorMessage = detail;
            } else if (detail?.message) {
                errorMessage = detail.message;
            } else if (Array.isArray(detail)) {
                errorMessage = detail.map(d => typeof d === 'string' ? d : d.loc?.join(' - ') || JSON.stringify(d)).join(', ');
            } else {
                errorMessage = JSON.stringify(detail);
            }
        } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        } else if (err.message) {
            errorMessage = err.message;
        }
        
        toast.error(errorMessage);
        return Promise.reject(err);
    }
);

// ================= AUTH =================
export const login = (data) => api.post('/login', data);
export const logout = () => localStorage.removeItem('token');

// ================= ORGANISATION =================
export const getOrganisations = () => api.get('/organisations');
export const createOrganisation = (data) => api.post('/organisations', data);
export const getOrganisation = (id) => api.get(`/organisations/${id}`);

// ================= DEPARTMENTS =================
export const getDepartments = () => api.get('/departments');
export const getDepartment = (id) => api.get(`/departments/${id}`);
export const createDepartment = (data) => api.post('/departments', data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);

// ================= COURSES =================
export const getCourses = (params) => api.get('/courses', { params });
export const getCourse = (id) => api.get(`/courses/${id}`);
export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);

// ================= ACADEMIC TERMS =================
export const getTerms = () => api.get('/terms');
export const getTermsByCourse = (courseId) => api.get(`/courses/${courseId}/terms`);
export const getTerm = (id) => api.get(`/terms/${id}`);
export const createTerm = (courseId, data) => api.post(`/courses/${courseId}/terms`, data);
export const updateTerm = (id, data) => api.put(`/terms/${id}`, data);
export const deleteTerm = (id) => api.delete(`/terms/${id}`);

// ================= SUBJECTS =================
export const getSubjects = (termId) => api.get(`/terms/${termId}/subjects`);
export const getSubject = (id) => api.get(`/subjects/${id}`);
export const createSubject = (termId, data) => api.post(`/terms/${termId}/subjects`, data);
export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);

// ================= SECTIONS =================
export const getSections = (termId) => api.get(`/terms/${termId}/sections`);
export const createSection = (termId, data) => api.post(`/terms/${termId}/sections`, data);
export const updateSection = (id, data) => api.put(`/sections/${id}`, data);
export const deleteSection = (id) => api.delete(`/sections/${id}`);

// ================= BATCHES =================
export const getBatches = (termId) => api.get(`/terms/${termId}/batches`);
export const createBatch = (termId, data) => api.post(`/terms/${termId}/batches`, data);
export const updateBatch = (id, data) => api.put(`/batches/${id}`, data);
export const deleteBatch = (id) => api.delete(`/batches/${id}`);

// ================= FACULTIES =================
export const getFaculties = (params) => api.get('/faculties', { params });
export const getFaculty = (id) => api.get(`/faculties/${id}`);
export const createFaculty = (data) => api.post('/faculties', data);
export const updateFaculty = (id, data) => api.put(`/faculties/${id}`, data);
export const deleteFaculty = (id) => api.delete(`/faculties/${id}`);

// ================= FACULTY ASSIGNMENTS =================
export const getFacultyAssignments = (params) => api.get('/faculty-assignments', { params });
export const createFacultyAssignment = (data) => api.post('/faculty-assignments', data);
export const deleteFacultyAssignment = (id) => api.delete(`/faculty-assignments/${id}`);

// ================= ROOMS =================
export const getRooms = (params) => api.get('/rooms', { params });
export const createRoom = (data) => api.post('/rooms', data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);

// ================= TIMETABLE SLOTS =================
export const getTimetableByTerm = (termId) => api.get(`/timetable/term/${termId}`);
export const getTimetableBySection = (sectionId) => api.get(`/timetable/section/${sectionId}`);
export const createTimetableSlot = (data) => api.post('/timetable/slots', data);
export const updateTimetableSlot = (id, data) => api.put(`/timetable/slots/${id}`, data);
export const deleteTimetableSlot = (id) => api.delete(`/timetable/slots/${id}`);
export const createBulkTimetable = (slots) => api.post('/timetable/bulk', slots);

// ================= DASHBOARD =================
export const getDashboardSummary = () => api.get('/dashboard/summary');

// ================= USERS =================
export const createUser = (data) => api.post('/users', data);
export const changePassword = (currentPassword, newPassword) => 
    api.post('/users/change-password', null, { 
        params: { current_password: currentPassword, new_password: newPassword } 
    });

// ================= SUPER ADMIN =================
export const superAdminGetOrganisations = () => api.get('/super-admin/organisations');
export const superAdminCreateOrganisation = (data) => api.post('/super-admin/organisations', data);
export const superAdminGetOrganisation = (id) => api.get(`/super-admin/organisations/${id}`);
export const superAdminCreateAdmin = (orgId, username, email) => 
    api.post(`/super-admin/organisations/${orgId}/admin`, null, { 
        params: { username, email } 
    });
export const superAdminGetUsers = () => api.get('/super-admin/users');
export const superAdminGetStats = () => api.get('/super-admin/stats');

// ================= STUDENT ENROLLMENT =================
export const getSectionEnrollments = (sectionId) => api.get(`/sections/${sectionId}/enrollments`);
export const bulkEnrollSection = (sectionId, studentIds) => 
    api.post(`/sections/${sectionId}/enroll/bulk`, { student_ids: studentIds });
export const uploadEnrollSection = (sectionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/sections/${sectionId}/enroll/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const getBatchEnrollments = (batchId) => api.get(`/batches/${batchId}/enrollments`);
export const bulkEnrollBatch = (batchId, studentIds) => 
    api.post(`/batches/${batchId}/enroll/bulk`, { student_ids: studentIds });
export const uploadEnrollBatch = (batchId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/batches/${batchId}/enroll/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const deleteEnrollment = (enrollmentId) => api.delete(`/enrollments/${enrollmentId}`);

// ================= STUDENT TIMETABLE =================
export const getStudentTimetable = (studentId, date) => 
    api.get(`/students/${studentId}/timetable`, { params: { date } });

export default api;
