import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import supabase from '../database/supabase-client';
import AnimatedComponent from '../components/AnimatedComponent';

const fetchAbsences = async () => {
  const { data, error } = await supabase
    .from('attendance')
    .select('employee_id, status');
  if (error) throw error;
  return data;
};

const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name');
  if (error) throw error;
  return data;
};

const TopAbsentees = () => {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([fetchAbsences(), fetchEmployees()]).then(([attendance, employees]) => {
      const absences = {};
      attendance.forEach(({ employee_id, status }) => {
        if (status === 'absent') absences[employee_id] = (absences[employee_id] || 0) + 1;
      });
      const sorted = Object.entries(absences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      const idToName = Object.fromEntries(employees.map(e => [e.id, e.name]));
      setCategories(sorted.map(([id]) => idToName[id] || `ID ${id}`));
      setSeries([{ name: 'Absences', data: sorted.map(([, count]) => count) }]);
    });
  }, []);

  const options = {
    chart: { type: 'bar', height: 350 },
    xaxis: { categories },
    yaxis: { min: 0, labels: { formatter: (v) => `${v}` } },
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
    dataLabels: { enabled: false },
    colors: ['#ef4444'],
    grid: { strokeDashArray: 5, borderColor: '#e5e7eb' },
    tooltip: { y: { formatter: (v) => `${v} absences` } },
  };

  return (
    <AnimatedComponent delay={0.1} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <ReactApexChart options={options} series={series} type="bar" height={350} />
    </AnimatedComponent>
  );
};

export default TopAbsentees; 