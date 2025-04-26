import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import supabase from '../database/supabase-client';
import AnimatedComponent from '../components/AnimatedComponent';

const fetchAttendanceData = async () => {
  const { data, error } = await supabase
    .from('attendance')
    .select('checkdate, lateness');
  if (error) throw error;
  return data;
};

const groupLatenessByDate = (records) => {
  const grouped = {};
  records.forEach(({ checkdate, lateness }) => {
    if (!lateness) return;
    const date = new Date(checkdate).toLocaleDateString();
    const [h, m, s] = lateness.split(':').map(Number);
    const minutes = (h || 0) * 60 + (m || 0) + (s || 0) / 60;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(minutes);
  });
  return grouped;
};

const AverageLatenessOverTime = () => {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchAttendanceData().then((records) => {
      const grouped = groupLatenessByDate(records);
      const dates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
      const averages = dates.map((date) => {
        const arr = grouped[date];
        return arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      });
      setCategories(dates);
      setSeries([{ name: 'Avg Lateness (min)', data: averages }]);
    });
  }, []);

  const options = {
    chart: { type: 'line', height: 350 },
    xaxis: { categories },
    yaxis: { min: 0, labels: { formatter: (v) => `${Math.round(v)}m` } },
    stroke: { curve: 'smooth', width: 3 },
    dataLabels: { enabled: false },
    colors: ['#f59e0b'],
    grid: { strokeDashArray: 5, borderColor: '#e5e7eb' },
    tooltip: { y: { formatter: (v) => `${v.toFixed(1)} min` } },
  };

  return (
    <AnimatedComponent delay={0.1} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <ReactApexChart options={options} series={series} type="line" height={350} />
    </AnimatedComponent>
  );
};

export default AverageLatenessOverTime; 