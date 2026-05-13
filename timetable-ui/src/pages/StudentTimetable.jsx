import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getStudentTimetable } from '../api/api';

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function fmtDate(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDisplay(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

export default function StudentTimetable() {
  const [studentId, setStudentId] = useState('');
  const [submittedId, setSubmittedId] = useState('');
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [slotsByDay, setSlotsByDay] = useState({});
  const [loading, setLoading] = useState(false);

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchTimetable = (id, monday) => {
    if (!id) return;
    setLoading(true);
    const dates = DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
    Promise.all(
      dates.map(d =>
        getStudentTimetable(id, fmtDate(d))
          .then(r => ({ date: fmtDate(d), slots: r.data }))
          .catch(() => ({ date: fmtDate(d), slots: [] }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { map[r.date] = r.slots; });
      setSlotsByDay(map);
      setLoading(false);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId.trim()) return;
    setSubmittedId(studentId.trim());
    fetchTimetable(studentId.trim(), weekStart);
  };

  const changeWeek = (dir) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7 * dir);
    setWeekStart(d);
    if (submittedId) fetchTimetable(submittedId, d);
  };

  const dayLabel = (day) => day.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="Enter your student ID"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
              />
            </div>
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <Search className="w-4 h-4" /> View
            </button>
          </div>
        </div>

        {submittedId && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => changeWeek(-1)} className="p-2 border rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-700">
                {fmtDisplay(weekDates[0])} – {fmtDisplay(weekDates[5])} {weekDates[5].getFullYear()}
              </span>
              <button onClick={() => changeWeek(1)} className="p-2 border rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
                Loading timetable...
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
                <div className="grid grid-cols-6 min-w-[600px] divide-x divide-gray-200">
                  {DAYS.map((day, i) => {
                    const dateStr = fmtDate(weekDates[i]);
                    const daySlots = (slotsByDay[dateStr] || []).sort(
                      (a, b) => (a.start_time || '').localeCompare(b.start_time || '')
                    );
                    return (
                      <div key={day}>
                        <div className="bg-gray-50 px-2 py-3 text-center border-b border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase">{dayLabel(day)}</div>
                          <div className="text-lg font-bold text-gray-900">{weekDates[i].getDate()}</div>
                          <div className="text-xs text-gray-400">{MONTHS[weekDates[i].getMonth()]}</div>
                        </div>
                        <div className="p-1.5 space-y-1.5 min-h-[200px]">
                          {daySlots.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-6">—</p>
                          )}
                          {daySlots.map(slot => (
                            <div key={slot.id} className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                              <div className="text-xs font-semibold text-blue-800 leading-tight">{slot.subject_name || slot.subject_code}</div>
                              <div className="text-[11px] text-gray-500 mt-0.5">{slot.start_time?.slice(0, 5)}–{slot.end_time?.slice(0, 5)}</div>
                              <div className="text-[11px] text-gray-500">{slot.faculty_name || ''}</div>
                              {slot.room_name && <div className="text-[11px] text-gray-400">{slot.room_name}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {!submittedId && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Enter your student ID and click View to see your timetable.</p>
          </div>
        )}
      </div>
    </div>
  );
}
