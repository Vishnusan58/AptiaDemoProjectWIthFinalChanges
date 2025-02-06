"use client";

import Home from "./chatbot/page";
import Image from "next/image";

export default function LandingPage() {
  
  return (
    <div className="flex flex-col justify-center items-center bg-violet-50 text-black p-6">
      {/* Header */}
      <div className="absolute top-4 left-4 text-xl font-bold text-violet-600">Hi Alex!</div>
      <div className="absolute top-4 right-4">
        <Image src="/images/logo1.png" alt="Company Logo" width={100} height={50} />
      </div>
      

      {/* Main Content */}
      <div className="bg-white shadow-xl rounded-xl p-8 text-center w-[80%]">
        <h1 className="text-2xl font-bold mb-4 text-violet-600">Aptia Answers</h1>
        <p className="text-lg"><strong>Employee ID:</strong> <span className="">EMP1000435</span></p>
        <p className="text-lg"><strong>Employee Name:</strong> <span className="">Alex S.</span></p>
        <p className="text-lg mb-5"><strong>Current Plan:</strong> <span className="">Horizon Platinum</span></p>
        <Home/>
      </div>
    </div>
  );
}