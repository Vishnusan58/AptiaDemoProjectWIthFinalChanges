"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Home from "../chatbot/page";
import { useState } from "react";
import InsurancePlan from "@/components/InsurancePlan";

export default function LandingPage() {
  
  const [activateCB,setactivateCB] = useState(false);

  return (
    <div className="flex flex-col justify-center items-center bg-violet-50 text-black p-6">
      {/* Header */}
      <div className="absolute top-4 left-4 text-lg font-semibold text-violet-600">Hi Alex!</div>
      

      {/* Main Content */}
      <div className="bg-white shadow-xl rounded-xl p-8 text-center w-[80%]">
        <h1 className="text-2xl font-bold mb-4 text-violet-600">Health Plan Details</h1>
        <p className="text-lg"><strong>Employee ID:</strong> <span className="">EMP1000435</span></p>
        <p className="text-lg"><strong>Policy Holder Name:</strong> <span className="">Alex S.</span></p>
        <p className="text-lg"><strong>Beneficiaries:</strong> <span className="">Spouse, Kids</span></p>
        <p className="text-lg mb-5"><strong>Current Insurance Plan:</strong> <span className="">Horizon Blue</span></p>
        
        {/* {activateCB?<></>:<div className="mt-6">
          <p className="text-lg font-medium mb-4">Would you like any modifications or updates to your insurance policy?</p>
          <div className="flex justify-center gap-4">
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700" 
              onClick={() => {setactivateCB(true);}}
            >
              Yes
            </Button>
            <Button className="bg-gray-300 text-black hover:bg-gray-400 mb-5"
            onClick={() => {setactivateCB(false);}}>
              No
            </Button>
          </div>
        </div>} */}
        <Home/>
      </div>
    </div>
  );
}