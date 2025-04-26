import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import supabase from '../database/supabase-client';
import AnimatedComponent from '../components/AnimatedComponent';

const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('leave_balance');
  if (error) throw error;
  return data;
};

const binLeaveBalances = (records, binSize = 5) => {
  const bins = {};
  records.forEach(({ leave_balance }) => {
    if (leave_balance == null) return;
    const bin = Math.floor(Number(leave_balance) / binSize) * binSize;
    const label = `${bin}-${bin + binSize - 1}`;
    bins[label] = (bins[label] || 0) + 1;
  });
  return bins;
};

const LeaveBalanceDistribution = () => {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchEmployees().then((records) => {
      const bins = binLeaveBalances(records);
      const labels = Object.keys(bins).sort((a, b) => {
        const aStart = parseInt(a.split('-')[0], 10);
        const bStart = parseInt(b.split('-')[0], 10);
        return aStart - bStart;
      });
      setCategories(labels);
      setSeries([{ name: 'Employees', data: labels.map(l => bins[l]) }]);
    });
  }, []);

  const options = {
    chart: { type: 'bar', height: 350 },
    xaxis: { categories, title: { text: 'Leave Balance' } },
    yaxis: { min: 0, labels: { formatter: (v) => `${v}` } },
    plotOptions: { bar: { borderRadius: 4, horizontal: false } },
    dataLabels: { enabled: false },
    colors: ['#6366f1'],
    grid: { strokeDashArray: 5, borderColor: '#e5e7eb' },
    tooltip: { y: { formatter: (v) => `${v} employees` } },
  };

  return (
    <AnimatedComponent delay={0.1} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <ReactApexChart options={options} series={series} type="bar" height={350} />
    </AnimatedComponent>
  );
};

export default LeaveBalanceDistribution; 