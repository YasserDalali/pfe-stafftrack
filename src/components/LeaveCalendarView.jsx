import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns'; // Added addDays
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import supabase from '../database/supabase-client'; // Ensure this path is correct

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// --- Styling Function for Events ---
// Consider leave status as well if needed
const getEventStyle = (event) => {
  let className = 'p-1 rounded-lg border text-xs overflow-hidden shadow-sm ';
  
  // Base color by type
  switch (event.leaveType?.toLowerCase()) {
    case 'sick leave':
      className += 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-200';
      break;
    case 'vacation':
      className += 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-200';
      break;
    case 'personal':
      className += 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700/50 dark:text-yellow-200';
      break;
    default:
      className += 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700/50 dark:text-purple-200';
      break;
  }

  // Adjust style based on status (optional)
  if (event.status?.toLowerCase() === 'pending') {
    className += ' opacity-70 italic'; // Example: Make pending leaves slightly faded
  } else if (event.status?.toLowerCase() === 'rejected') {
    className += ' line-through opacity-50'; // Example: Strike through rejected leaves
  }

  return { className };
};


// --- Custom Event Component ---
const CustomEvent = ({ event }) => (
  <div title={`${event.employeeName} (${event.leaveType}) - ${event.status}`}>
    <div className="font-medium truncate">{event.employeeName || 'Employee'}</div>
    <div className="opacity-80 truncate">{event.leaveType}</div>
    {/* Optionally show status */}
    {/* <div className="text-xs opacity-60 capitalize">{event.status}</div> */}
  </div>
);


// --- Main Calendar Component ---
const LeaveCalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch leaves and related employee names
        // Adjust the query based on your actual table/column names
        const { data, error: fetchError } = await supabase
          .from('leaves')
          .select(`
            id,
            start_date,
            end_date,
            type,
            status,
            employee_id,
            employees ( name ) 
          `); // Join with employees table assuming FK is employee_id

        if (fetchError) throw fetchError;

        // Format data for react-big-calendar
        const formattedEvents = data.map(leave => {
          const startDate = new Date(leave.start_date);
          // react-big-calendar's end date is exclusive, so add 1 day if it's an all-day event
          const endDate = addDays(new Date(leave.end_date), 1); 

          return {
            id: leave.id,
            title: `${leave.employees?.name || 'N/A'} - ${leave.type}`, // Use joined name
            start: startDate,
            end: endDate,
            allDay: true, // Assuming leaves are typically whole days
            leaveType: leave.type,
            status: leave.status,
            employeeName: leave.employees?.name || 'N/A', // Store for custom component
            employeeId: leave.employee_id,
          };
        });

        setEvents(formattedEvents);

      } catch (err) {
        console.error("Error fetching leaves:", err);
        setError(err.message || 'Failed to fetch leave data.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []); // Fetch only on mount

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading Calendar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-200">
        <h3 className="text-lg font-semibold">Error Loading Calendar</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-4 md:p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Leave Calendar
      </h2>
      <div className="h-[600px] md:h-[700px] text-sm"> 
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          components={{
            event: CustomEvent, // Use our custom component
          }}
          eventPropGetter={getEventStyle} // Apply styles dynamically
          className="dark:text-white rbc-calendar" // Base dark mode text + helper class
          // Add specific dark mode overrides for calendar elements if needed
          // E.g., style header, toolbar, date cells using CSS targeting .rbc-calendar
          views={['month', 'week', 'day']} // Configure available views
        />
      </div>
       {/* Basic Legend */}
       <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
         <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-300 dark:bg-red-900/30 dark:border-red-700/50 mr-1.5"></span> Sick Leave</div>
         <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300 dark:bg-blue-900/30 dark:border-blue-700/50 mr-1.5"></span> Vacation</div>
         <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700/50 mr-1.5"></span> Personal</div>
         <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-100 border border-purple-300 dark:bg-purple-900/30 dark:border-purple-700/50 mr-1.5"></span> Other</div>
         <div className="flex items-center ml-4"><span className="opacity-70 italic mr-1.5">(Faded/Italic = Pending)</span></div>
          <div className="flex items-center ml-4"><span className="line-through opacity-50 mr-1.5">(Strikethrough = Rejected)</span></div>
       </div>
    </div>
  );
};

export default LeaveCalendarView; 