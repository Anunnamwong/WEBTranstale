import dynamic from 'next/dynamic';
import React from 'react';

const HomeSidebar = dynamic(() => import('../components/sidebar/HomeSidebar'), {
  ssr: false,
});

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <HomeSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 mt-16 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default HomeLayout;
