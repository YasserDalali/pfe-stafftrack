import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import supabase from '../database/supabase-client';
import AnimatedComponent from '../components/AnimatedComponent';

const fetchAttendanceData = async () => {
  const { data, error } = await supabase
    .from('attendance')
    .select('checkdate, status');
  if (error) throw error;
  return data;
};

const groupByDate = (records) => {
  const grouped = {};
  records.forEach(({ checkdate, status }) => {
    const date = new Date(checkdate).toLocaleDateString();
    if (!grouped[date]) grouped[date] = { present: 0, total: 0 };
    if (status === 'present') grouped[date].present += 1;
    grouped[date].total += 1;
  });
  return grouped;
};

const AttendanceRateOverTime = () => {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAttendanceData().then((records) => {
      const grouped = groupByDate(records);
      const dates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
      const rates = dates.map((date) =>
        grouped[date].total ? (grouped[date].present / grouped[date].total) * 100 : 0
      );
      setCategories(dates);
      setSeries([{ name: 'Attendance Rate', data: rates }]);
    });
  }, []);

  const options = {
    chart: { type: 'line', height: 350 },
    xaxis: { categories },
    yaxis: { min: 0, max: 100, labels: { formatter: (v) => `${Math.round(v)}%` } },
    stroke: { curve: 'smooth', width: 3 },
    dataLabels: { enabled: false },
    colors: ['#3b82f6'],
    grid: { strokeDashArray: 5, borderColor: '#e5e7eb' },
    tooltip: { y: { formatter: (v) => `${v.toFixed(1)}%` } },
  };

  return (
    <AnimatedComponent delay={0.1} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <ReactApexChart options={options} series={series} type="line" height={350} />
    </AnimatedComponent>
  );
};

export default AttendanceRateOverTime; 