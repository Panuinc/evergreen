"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input } from "@heroui/react";
import Loading from "@/components/ui/Loading";
import Image from "next/image";

import { toast } from "sonner";
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
          toast.error("Invalid email or password");
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

      <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2 text-default-400">
        Contact your administrator for account access
      </div>
    </>
  );
}
