import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import supabase from '../database/supabase-client';
import AnimatedComponent from '../components/AnimatedComponent';

const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('departement, satisfaction_rate');
  if (error) throw error;
  return data;
};

const groupByDepartment = (records) => {
  const grouped = {};
  records.forEach(({ departement, satisfaction_rate }) => {
    if (!departement || satisfaction_rate == null) return;
    if (!grouped[departement]) grouped[departement] = [];
    grouped[departement].push(Number(satisfaction_rate));
  });
  return grouped;
};

const EmployeeSatisfactionByDepartement = () => {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchEmployees().then((records) => {
      const grouped = groupByDepartment(records);
      const depts = Object.keys(grouped);
      const averages = depts.map((dept) => {
        const arr = grouped[dept];
        return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      });
      setCategories(depts);
      setSeries([{ name: 'Satisfaction', data: averages }]);
    });
  }, []);

  const options = {
    chart: { type: 'bar', height: 350 },
    xaxis: { categories },
    yaxis: { min: 0, max: 100, labels: { formatter: (v) => `${Math.round(v)}%` } },
    plotOptions: { bar: { borderRadius: 4, horizontal: false } },
    dataLabels: { enabled: false },
    colors: ['#10b981'],
    grid: { strokeDashArray: 5, borderColor: '#e5e7eb' },
    tooltip: { y: { formatter: (v) => `${v.toFixed(1)}%` } },
  };

  return (
    <AnimatedComponent delay={0.1} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <ReactApexChart options={options} series={series} type="bar" height={350} />
    </AnimatedComponent>
  );
};

export default EmployeeSatisfactionByDepartement; 