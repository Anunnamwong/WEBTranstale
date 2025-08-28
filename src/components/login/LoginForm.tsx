import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { login } from '@/services/loginService';

type FormInputs = {
  username: string;
  password_hash: string;
};

type User = {
  role: string;
};

type LoginError = {
  response?: {
    data?: {
      message: string;
    };
  };
};

const LoginForm = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>();

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data: { user: User }) => {
      toast.dismiss();
      toast.success('login success');
      sessionStorage.setItem('userData', JSON.stringify(data.user));
      if (data.user.role === 'user') {
        router.replace('/user');
      } else if (data.user.role === 'admin') {
        router.replace('/admin');
      }
    },
    onError: (error: LoginError) => {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'login failed');
    },
  });

  const onSubmit = handleSubmit((data) => {
    toast.loading('logging in...');
    loginMutation.mutate(data);
  });

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center 
      bg-gradient-to-b from-green-50 to-green-100 px-4 py-8"
    >
      <div
        className="bg-white
        p-6 sm:p-10 rounded-3xl
        shadow-lg
        border border-green-200 
        w-full max-w-[440px]
        relative
        hover:shadow-xl
        transition-all duration-500"
      >
        {/* Logo Container */}
        <div
          className="relative mb-6 sm:mb-10 
          bg-gradient-to-r from-green-50 to-green-100
          rounded-2xl overflow-hidden
          border border-green-200
          group
          transition-all duration-500 ease-in-out
          transform hover:scale-[1.02]"
        >
          <Image
            src="/image/logo3.png"
            width={300}
            height={100}
            alt="Bean Sprout Shop Logo"
            quality={100}
            priority
            className="w-full h-auto relative z-10
              transition-all duration-300
              group-hover:brightness-110"
          />
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-10 text-center text-green-800">
          เข้าสู่ระบบ
        </h2>

        <form className="space-y-6" onSubmit={onSubmit}>
          {/* Username Input */}
          <div>
            <label className="block text-sm font-semibold text-green-700 mb-2">
              ชื่อผู้ใช้
            </label>
            <div className="relative">
              <input
                {...register('username', { required: 'กรุณากรอกชื่อผู้ใช้' })}
                type="text"
                className="pl-12 pr-4 py-3.5 w-full rounded-xl
                  bg-white border-2 border-green-200
                  text-gray-800 placeholder-gray-400
                  focus:border-green-500 focus:ring-2 focus:ring-green-200 
                  transition-all duration-300
                  hover:border-green-300"
                placeholder="กรอกชื่อผู้ใช้"
              />
              <span className="absolute left-4 top-4 text-green-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </span>
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-green-700 mb-2">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                {...register('password_hash', { required: 'กรุณากรอกรหัสผ่าน' })}
                type={showPassword ? 'text' : 'password'}
                className="pl-12 pr-12 py-3.5 w-full rounded-xl
                  bg-white border-2 border-green-200
                  text-gray-800 placeholder-gray-400
                  focus:border-green-500 focus:ring-2 focus:ring-green-200 
                  transition-all duration-300
                  hover:border-green-300"
                placeholder="กรอกรหัสผ่าน"
              />
              <span className="absolute left-4 top-4 text-green-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-green-700 hover:text-green-500 transition-colors duration-200"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password_hash && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password_hash.message}
              </p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3.5 rounded-xl
              relative overflow-hidden group
              text-white font-semibold text-lg
              bg-gradient-to-r from-green-600 to-green-500
              hover:from-green-500 hover:to-green-400
              shadow-md
              hover:shadow-lg
              transform hover:scale-[1.02]
              disabled:opacity-70 
              transition-all duration-300
              flex items-center justify-center"
          >
            {loginMutation.isPending ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="relative">กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span className="relative">เข้าสู่ระบบ</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
