import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import React from 'react';
import dynamic from 'next/dynamic';

const DynamicZitadelLoginButton = dynamic(
  () => import('@/components/login/ZitadelLoginButton'),
  { ssr: false }
);

interface LoginZitadelProps {
  session: any;
  nextAuthUrl: string;
  zitadelIssuer: string;
}

const LoginZitadel: React.FC<LoginZitadelProps> = ({ nextAuthUrl, zitadelIssuer }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-green-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-green-200">
          <h1 className="text-3xl font-bold text-center text-green-800 mb-2">
            ทดสอบ Login Zitadel
          </h1>
          <p className="text-center text-gray-600 mb-8">
            ใช้ NextAuth.js กับ Zitadel Provider
          </p>
          <DynamicZitadelLoginButton />
        </div>

        <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            ข้อมูลการตั้งค่า
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold text-gray-600">Issuer:</span>
              <p className="text-gray-800 font-mono break-all">
                {zitadelIssuer}
              </p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">NextAuth URL:</span>
              <p className="text-gray-800 font-mono break-all">
                {nextAuthUrl}
              </p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Status:</span>
              <p className="text-green-600">NextAuth.js configured</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // Redirect to home if already logged in
  if (session) {
    return {
      redirect: {
        destination: '/home',
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      zitadelIssuer: process.env.ZITADEL_ISSUER || 'https://webtalk.one',
    },
  };
};

export default LoginZitadel;
