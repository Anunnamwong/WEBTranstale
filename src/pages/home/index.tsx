import dynamic from "next/dynamic";
import React from "react";
import HomeLayout from "../../layout/HomeLayout";

const DynamicHomePage = dynamic(() => import("@/components/home/HomePage"));

const HomePage = () => {
  return (
    <HomeLayout>
      <DynamicHomePage />
    </HomeLayout>
  );
};

export default HomePage;
