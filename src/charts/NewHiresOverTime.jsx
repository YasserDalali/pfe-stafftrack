import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import supabase from '../database/supabase-client';
import AnimatedComponent from '../components/AnimatedComponent';

const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('hire_date');
  if (error) throw error;
  return data;
};

const groupByHireDate = (records) => {
  const grouped = {};
  records.forEach(({ hire_date }) => {
    if (!hire_date) return;
    const date = new Date(hire_date).toLocaleDateString();
    grouped[date] = (grouped[date] || 0) + 1;
  });
  return grouped;
};

const NewHiresOverTime = () => {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchEmployees().then((records) => {
      const grouped = groupByHireDate(records);
      const dates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
      const hires = dates.map((date) => grouped[date]);
      setCategories(dates);
      setSeries([{ name: 'New Hires', data: hires }]);
    });
  }, []);

  const options = {
    chart: { type: 'line', height: 350 },
    xaxis: { categories },
    yaxis: { min: 0, labels: { formatter: (v) => `${v}` } },
    stroke: { curve: 'smooth', width: 3 },
    dataLabels: { enabled: false },
    colors: ['#10b981'],
    grid: { strokeDashArray: 5, borderColor: '#e5e7eb' },
    tooltip: { y: { formatter: (v) => `${v} hires` } },
  };

  return (
    <AnimatedComponent delay={0.1} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <ReactApexChart options={options} series={series} type="line" height={350} />
    </AnimatedComponent>
  );
};

export default NewHiresOverTime; 