"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@heroui/react";
import Loading from "@/components/Loading";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Quote } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/overview/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const result = await signUp(email, password);

    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
    }

    setIsLoading(false);
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
          Create Account
        </div>
        <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 font-semibold">
          Sign up for a new account
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center w-full gap-2"
        >
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
              isRequired
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
              placeholder="At least 6 characters"
              variant="bordered"
              size="md"
              radius="md"
              isRequired
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
            <Input
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              labelPlacement="outside"
              placeholder="Confirm your password"
              variant="bordered"
              size="md"
              radius="md"
              isRequired
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
            <Button
              type="submit"
              color="default"
              variant="bordered"
              size="md"
              radius="md"
              className="w-full"
              isLoading={isLoading}
            >
              Sign Up
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-default underline">
            Sign In
          </Link>
        </div>
      </div>
      <div className="xl:flex hidden flex-col items-center justify-center w-full xl:w-8/12 h-full p-2 gap-2 border-l-1 border-default">
        <div className="flex items-center justify-start w-6/12 h-fit p-2 gap-2">
          <Quote className="text-default" />
        </div>
        <div className="flex items-center justify-center w-6/12 h-fit p-2 gap-2 text-[20px] font-semibold">
          Join EverGreen Internal and start managing your company operations
          efficiently.
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
