import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AnimatedComponent from './AnimatedComponent';

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

// Helper function to generate random colors for different leave types
const leaveTypeColors = {
    'sick leave': 'bg-red-200 dark:bg-red-900/50 border-red-300 dark:border-red-700',
    'vacation': 'bg-blue-200 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700',
    'personal': 'bg-yellow-200 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700',
    'other': 'bg-purple-200 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700',
};
const getEventStyle = (event) => {
    const type = (event.leaveType || 'other').toLowerCase().trim();
    return leaveTypeColors[type] || leaveTypeColors['other'];
};

const LeaveCalendar = ({ absences }) => {
    // Transform absences data to calendar events format
    const events = absences.map(absence => {
        const start = new Date(absence.startDate);
        let end = new Date(absence.endDate);
        if (start.toDateString() === end.toDateString()) {
            // Single day event, do nothing
        } else {
            // Multi-day event, add 1 day to make end exclusive
            end = new Date(end);
            end.setDate(end.getDate() + 1);
        }
        return {
            id: absence.id,
            title: `${absence.employee} - ${absence.leaveType}`,
            start,
            end,
            leaveType: absence.leaveType,
            employee: absence.employee,
            status: absence.status,
        };
    });

    // Custom event component to style different leave types
    const EventComponent = ({ event }) => (
        <div className={`p-1 rounded-lg border ${getEventStyle(event)} overflow-hidden`}>
            <div className="text-xs font-medium truncate">{event.title}</div>
            <div className="text-xs opacity-75 truncate">
                {format(event.start, 'MMM d')} - {format(event.end, 'MMM d')}
            </div>
        </div>
    );

    return (
        <AnimatedComponent>
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Leave Calendar
                </h3>
                <div className="h-[600px]">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        components={{
                            event: EventComponent,
                        }}
                        className="dark:text-white"
                    />
                </div>
            </div>
        </AnimatedComponent>
    );
};

export default LeaveCalendar; 