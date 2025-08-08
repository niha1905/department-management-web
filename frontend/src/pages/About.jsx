
import React from 'react';
import { RocketLaunchIcon, ShieldCheckIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';

export default function About() {
  return (
    <div className="w-full">
      <PageHeader title="About" subtitle="Learn more about Grand Magnum AI Dashboard" />
      <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About Grand Magnum AI Dashboard</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Empowering businesses with intelligent insights and powerful analytics through our advanced AI dashboard.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <RocketLaunchIcon className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
          <p className="text-gray-600">
            Leveraging cutting-edge AI technology to provide real-time insights and analytics.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <ShieldCheckIcon className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Security</h3>
          <p className="text-gray-600">
            Enterprise-grade security ensuring your data is always protected and confidential.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <ChartBarIcon className="w-12 h-12 text-purple-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-gray-600">
            Comprehensive analytics tools to help you make data-driven decisions.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed">
          At Grand Magnum AI Dashboard, we're committed to transforming how businesses interact with their data. 
          Our platform combines powerful AI capabilities with intuitive design to deliver insights that drive growth 
          and innovation. We believe in making advanced analytics accessible to everyone, from small businesses to 
          large enterprises.
        </p>
      </div>
      </div>
    </div>
  );
}