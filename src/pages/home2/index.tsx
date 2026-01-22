import dynamic from "next/dynamic";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import React from "react";
import HomeLayout from "../../layout/HomeLayout";
import withNextAuth from "@/utils/withNextAuth";

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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login-zitadel',
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
};

export default withNextAuth(Home2Page, { requireAuth: true });
