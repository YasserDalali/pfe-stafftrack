import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import supabase from '../database/supabase-client';
import AnimatedComponent from '../components/AnimatedComponent';

const fetchLeaves = async () => {
  const { data, error } = await supabase
    .from('leaves')
    .select('type');
  if (error) throw error;
  return data;
};

const groupByType = (records) => {
  const grouped = {};
  records.forEach(({ type }) => {
    if (!type) return;
    grouped[type] = (grouped[type] || 0) + 1;
  });
  return grouped;
};

const LeavesTakenByType = () => {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchLeaves().then((records) => {
      const grouped = groupByType(records);
      setCategories(Object.keys(grouped));
      setSeries([{ name: 'Leaves', data: Object.values(grouped) }]);
    });
  }, []);

  const options = {
    chart: { type: 'bar', height: 350 },
    xaxis: { categories },
    yaxis: { min: 0, labels: { formatter: (v) => `${v}` } },
    plotOptions: { bar: { borderRadius: 4, horizontal: false } },
    dataLabels: { enabled: false },
    colors: ['#3b82f6'],
    grid: { strokeDashArray: 5, borderColor: '#e5e7eb' },
    tooltip: { y: { formatter: (v) => `${v} leaves` } },
  };

  return (
    <AnimatedComponent delay={0.1} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <ReactApexChart options={options} series={series} type="bar" height={350} />
    </AnimatedComponent>
  );
};

export default LeavesTakenByType; 