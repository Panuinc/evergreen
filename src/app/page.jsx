"use client";

import { Button, Input } from "@heroui/react";
import Image from "next/image";
import React from "react";

export default function page() {
  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="flex flex-col items-center justify-center w-full xl:w-4/12 h-full p-2 gap-2 border-r-1 border-default">
        <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 text-[16px] font-semibold">
          <Image
            src="/logo/logo-01.png"
            width={50}
            height={50}
            alt="true"
            className="border-1 border-default rounded-full"
          />
          Welcome back
        </div>
        <div className="flex items-center justify-start w-11/12 h-fit p-2 gap-2 font-semibold">
          Sign in to your account
        </div>
        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2">
          <Input
            name="username"
            type="text"
            label="Username"
            labelPlacement="outside"
            placeholder="Please enter your username"
            variant="bordered"
            size="md"
            radius="md"
            isRequired
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
            isRequired
          />
        </div>
        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2 text-center text-[12px]">
          <Button
            type="submit"
            color="default"
            variant="bordered"
            size="md"
            radius="md"
            className="w-full"
          >
            Sigin
          </Button>
        </div>
        <div className="flex items-center justify-center w-10/12 h-fit p-2 gap-2 text-center text-[12px]">
          By continuing, you agree to EverGreen&apos;s Terms of Service andๅ
          Privacy Policy.
        </div>
      </div>
      <div className="xl:flex hidden flex-col items-center justify-center w-full xl:w-8/12 h-full p-2 gap-2 border-l-1 border-default">
        <div className="flex items-center justify-start w-6/12 h-fit p-2 gap-2">
          <svg
            width="25"
            height="25"
            viewBox="0 0 45 36"
            fill="none"
            className="text-default rotate-360"
          >
            <path
              d="M13.415 36C9.48833 36 6.35 34.8267 4 32.48C1.33333 29.8133 0 26.2 0 21.64C0 17.72 1.17333 13.8 3.52 9.88C5.86667 5.64 9.33 2.34667 13.91 0L17.09 4.44C14.1033 6.14667 11.7567 8.33333 10.05 11C8.34333 13.6667 7.49 16.0133 7.49 18.04C7.49 18.68 7.56667 19.16 7.72 19.48C8.04 19.16 8.68 19 9.64 19C11.6667 19 13.415 19.72 14.885 21.16C16.355 22.6 17.09 24.44 17.09 26.68C17.09 29.24 16.275 31.32 14.645 32.92C13.335 34.84 13.415 36 13.415 36ZM38.415 36C34.4883 36 31.35 34.8267 29 32.48C26.3333 29.8133 25 26.2 25 21.64C25 17.72 26.1733 13.8 28.52 9.88C30.8667 5.64 34.33 2.34667 38.91 0L42.09 4.44C39.1033 6.14667 36.7567 8.33333 35.05 11C33.3433 13.6667 32.49 16.0133 32.49 18.04C32.49 18.68 32.5667 19.16 32.72 19.48C33.04 19.16 33.68 19 34.64 19C36.6667 19 38.415 19.72 39.885 21.16C41.355 22.6 42.09 24.44 42.09 26.68C42.09 29.24 41.275 31.32 39.645 32.92C38.335 34.84 38.415 36 38.415 36Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="flex items-center justify-center w-6/12 h-fit p-2 gap-2 text-[20px] font-semibold">
          EverGreen Internal makes managing company operations effortless — from
          sales and warehousing to production, everything in one place.
        </div>
        <div className="flex items-center justify-end w-6/12 h-fit p-2 gap-2">
          <svg
            width="25"
            height="25"
            viewBox="0 0 45 36"
            fill="none"
            className="text-default rotate-180"
          >
            <path
              d="M13.415 36C9.48833 36 6.35 34.8267 4 32.48C1.33333 29.8133 0 26.2 0 21.64C0 17.72 1.17333 13.8 3.52 9.88C5.86667 5.64 9.33 2.34667 13.91 0L17.09 4.44C14.1033 6.14667 11.7567 8.33333 10.05 11C8.34333 13.6667 7.49 16.0133 7.49 18.04C7.49 18.68 7.56667 19.16 7.72 19.48C8.04 19.16 8.68 19 9.64 19C11.6667 19 13.415 19.72 14.885 21.16C16.355 22.6 17.09 24.44 17.09 26.68C17.09 29.24 16.275 31.32 14.645 32.92C13.335 34.84 13.415 36 13.415 36ZM38.415 36C34.4883 36 31.35 34.8267 29 32.48C26.3333 29.8133 25 26.2 25 21.64C25 17.72 26.1733 13.8 28.52 9.88C30.8667 5.64 34.33 2.34667 38.91 0L42.09 4.44C39.1033 6.14667 36.7567 8.33333 35.05 11C33.3433 13.6667 32.49 16.0133 32.49 18.04C32.49 18.68 32.5667 19.16 32.72 19.48C33.04 19.16 33.68 19 34.64 19C36.6667 19 38.415 19.72 39.885 21.16C41.355 22.6 42.09 24.44 42.09 26.68C42.09 29.24 41.275 31.32 39.645 32.92C38.335 34.84 38.415 36 38.415 36Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="flex items-center justify-center w-full h-fit p-2 gap-2">
          <Image src="/images/index.png" width={200} height={200} alt="true" />
        </div>
      </div>
    </div>
  );
}
