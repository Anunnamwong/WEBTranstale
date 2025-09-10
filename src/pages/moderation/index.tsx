import dynamic from "next/dynamic";
import React from "react";
import HomeLayout from "../../layout/HomeLayout";

const DynamicModeration = dynamic(
  () => import("@/components/moderation/index"),
  { ssr: false }
);

const ModerationPage = () => {
  return (
    <HomeLayout>
      <DynamicModeration />
    </HomeLayout>
  );
};

export default ModerationPage;
