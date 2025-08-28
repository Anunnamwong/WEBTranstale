import dynamic from "next/dynamic";
import React from "react";
import HomeLayout from "../../layout/HomeLayout";

const DynamicHomeLoadTest = dynamic(
  () => import("@/components/home/HomeLoadTest"),
  { ssr: false }
);

const Home2Page = () => {
  return (
    <HomeLayout>
      <DynamicHomeLoadTest />
    </HomeLayout>
  );
};

export default Home2Page;
