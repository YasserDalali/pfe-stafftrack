import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import supabase from '../database/supabase-client';
import AnimatedComponent from '../components/AnimatedComponent';

const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('name, weekly_work_hours, monthly_salary');
  if (error) throw error;
  return data;
};

const WeeklyWorkHoursVsSalary = () => {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    fetchEmployees().then((records) => {
      const points = records
        .filter(e => e.weekly_work_hours != null && e.monthly_salary != null)
        .map(e => ({ x: Number(e.weekly_work_hours), y: Number(e.monthly_salary), name: e.name }));
      setSeries([{ name: 'Employees', data: points }]);
    });
  }, []);

  const options = {
    chart: { type: 'scatter', height: 350, zoom: { enabled: true, type: 'xy' } },
    xaxis: { title: { text: 'Weekly Work Hours' } },
    yaxis: { title: { text: 'Monthly Salary' } },
    dataLabels: { enabled: false },
    colors: ['#6366f1'],
    grid: { strokeDashArray: 5, borderColor: '#e5e7eb' },
    tooltip: {
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const d = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        return `<div style='padding:8px'><b>${d.name}</b><br/>Hours: ${d.x}<br/>Salary: $${d.y}</div>`;
      }
    }
  };

  return (
    <AnimatedComponent delay={0.1} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <ReactApexChart options={options} series={series} type="scatter" height={350} />
    </AnimatedComponent>
  );
};

export default WeeklyWorkHoursVsSalary; 