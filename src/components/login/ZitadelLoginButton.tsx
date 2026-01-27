import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React from 'react';
import toast from 'react-hot-toast';

const ZitadelLoginButton: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      await signIn('zitadel', {
        callbackUrl: '/home',
        redirect: true,
      });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: '/login-zitadel',
        redirect: true,
      });
      toast.success('ออกจากระบบสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
      console.error('Sign out error:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200">
          <h3 className="text-xl font-bold text-green-800 mb-4">ข้อมูลผู้ใช้</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-semibold text-gray-600">ชื่อ:</span>
              <p className="text-gray-800">{session.user?.name || 'ไม่ระบุ'}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-600">อีเมล:</span>
              <p className="text-gray-800">{session.user?.email || 'ไม่ระบุ'}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-600">User ID:</span>
              <p className="text-gray-800 font-mono text-sm">{session.user?.id || 'ไม่ระบุ'}</p>
            </div>
            {session.user?.image && (
              <div>
                <span className="text-sm font-semibold text-gray-600">รูปภาพ:</span>
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="mt-2 w-16 h-16 rounded-full"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Session Info:</h4>
          <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-40">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
        >
          ออกจากระบบ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200">
        <h3 className="text-xl font-bold text-green-800 mb-4 text-center">
          เข้าสู่ระบบด้วย Zitadel
        </h3>
        <p className="text-gray-600 text-center mb-6">
          ใช้บัญชี Zitadel เพื่อเข้าสู่ระบบ
        </p>
        <button
          onClick={handleSignIn}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold text-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          เข้าสู่ระบบด้วย Zitadel
        </button>
      </div>
    </div>
  );
};

export default ZitadelLoginButton;
