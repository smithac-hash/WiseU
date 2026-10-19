import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar />
      <main className="max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
