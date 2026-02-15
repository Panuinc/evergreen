"use client";

import { Button, Input } from "@heroui/react";
import Loading from "@/components/ui/Loading";
import Image from "next/image";
import { useSignIn } from "@/hooks/use-signin";

export default function SignInPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    user,
    loading,
    handleSignIn,
  } = useSignIn();

  if (loading || user) {
    return <Loading />;
  }

  return (
    <>
      <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 text-[16px] font-semibold">
        <Image
          src="/logo/logo-01.png"
          width={50}
          height={50}
          alt="logo"
          className="border-1 border-default rounded-full"
        />
        Welcome back
      </div>
      <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 font-semibold">
        Sign in to your account
      </div>

      <div className="flex flex-col items-center w-full gap-2">
        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Input
            name="email"
            type="email"
            label="Email"
            labelPlacement="outside"
            placeholder="Please enter your email"
            variant="bordered"
            size="md"
            radius="md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Input
            name="password"
            type="password"
            label="Password"
            labelPlacement="outside"
            placeholder="Please enter your password"
            variant="bordered"
            size="md"
            radius="md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Button
            variant="bordered"
            size="md"
            radius="md"
            className="w-full"
            isLoading={isLoading}
            onPress={handleSignIn}
          >
            Sign In
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2 text-default-400">
        Contact your administrator for account access
      </div>
    </>
  );
}
