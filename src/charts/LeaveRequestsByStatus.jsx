import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import supabase from '../database/supabase-client';
import AnimatedComponent from '../components/AnimatedComponent';

const fetchLeaves = async () => {
  const { data, error } = await supabase
    .from('leaves')
    .select('status');
  if (error) throw error;
  return data;
};

const groupByStatus = (records) => {
  const grouped = {};
  records.forEach(({ status }) => {
    if (!status) return;
    grouped[status] = (grouped[status] || 0) + 1;
  });
  return grouped;
};

const LeaveRequestsByStatus = () => {
  const [series, setSeries] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    fetchLeaves().then((records) => {
      const grouped = groupByStatus(records);
      setLabels(Object.keys(grouped));
      setSeries(Object.values(grouped));
    });
  }, []);

  const options = {
    chart: { type: 'pie' },
    labels,
    legend: { position: 'bottom' },
    colors: ['#6366f1', '#f59e0b', '#ef4444', '#10b981'],
    dataLabels: { enabled: true },
    tooltip: { y: { formatter: (v) => `${v} requests` } },
  };

  return (
    <AnimatedComponent delay={0.1} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <ReactApexChart options={options} series={series} type="pie" height={350} />
    </AnimatedComponent>
  );
};

export default LeaveRequestsByStatus; 