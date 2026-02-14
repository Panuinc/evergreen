"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input } from "@heroui/react";
import Loading from "@/components/Loading";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Quote } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error(
            <div className="flex flex-col gap-1">
              <span>Invalid email or password</span>
              <span className="text-xs text-gray-400">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-default underline">
                  Sign Up
                </Link>
              </span>
            </div>,
          );
        } else {
          toast.error(error.message || "Authentication failed");
        }
        setIsLoading(false);
        return;
      }

      window.location.href = "/overview/dashboard";
    } catch (err) {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (loading || user) {
    return <Loading />;
  }

  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="flex flex-col items-center justify-center w-full xl:w-4/12 h-full p-2 gap-2 border-r-1 border-default">
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
              color="default"
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

        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-default underline">
            Sign Up
          </Link>
        </div>
      </div>
      <div className="xl:flex hidden flex-col items-center justify-center w-full xl:w-8/12 h-full p-2 gap-2 border-l-1 border-default">
        <div className="flex items-center justify-start w-6/12 h-fit p-2 gap-2">
          <Quote className="text-default" />
        </div>
        <div className="flex items-center justify-center w-6/12 h-fit p-2 gap-2 text-[20px] font-semibold">
          EverGreen Internal makes managing company operations effortless — from
          sales and warehousing to production, everything in one place.
        </div>
        <div className="flex items-center justify-end w-6/12 h-fit p-2 gap-2">
          <Quote className="text-default rotate-180" />
        </div>
        <div className="flex items-center justify-center w-full h-fit p-2 gap-2">
          <Image
            src="/images/index.png"
            width={200}
            height={200}
            alt="illustration"
          />
        </div>
      </div>
    </div>
  );
}
