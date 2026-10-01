// src/Pages/registration/RegistrationWorkflow.jsx
import { useState } from "react";
import RegistrationForm from "./RegistrationForm";
import List from "../members/List"; // Adjust path to your List component

export default function RegistrationWorkflow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { id: "dashboard", label: "Dashboard" },
    { id: "form", label: "Registration Form" },
    { id: "list", label: "Registered Members" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Slide Navigation Header Bar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div>
          <span className="text-xs font-bold text-teal-700 tracking-wider uppercase">Private Members Group</span>
          <h1 className="text-[#102a43] text-lg font-extrabold m-0">Savings &amp; Loan Management System</h1>
        </div>

        {/* Slide Switcher Controls */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(index)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                currentSlide === index
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {index + 1}. {slide.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container for Active Slide */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 lg:p-8">
        
        {/* SLIDE 1: Registration Dashboard */}
        {currentSlide === 0 && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 pb-5 mb-6">
              <span className="text-teal-700 text-xs font-extrabold tracking-wider uppercase">Overview</span>
              <h2 className="text-[#102a43] text-3xl font-extrabold mt-1 mb-2">Registration Dashboard</h2>
              <p className="text-slate-500 text-sm">Monitor member onboarding, share allotments, and quick navigation metrics.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="p-6 border border-slate-200 rounded-xl bg-teal-50/50 shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Total Active Members</span>
                <strong className="text-teal-900 text-4xl font-black mt-2 block">24</strong>
              </div>
              <div className="p-6 border border-slate-200 rounded-xl bg-blue-50/50 shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Total Shares Allotted</span>
                <strong className="text-blue-900 text-4xl font-black mt-2 block">142</strong>
              </div>
              <div className="p-6 border border-slate-200 rounded-xl bg-emerald-50/50 shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Monthly Savings Pool</span>
                <strong className="text-emerald-900 text-4xl font-black mt-2 block">₹ 1,42,000</strong>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => setCurrentSlide(1)}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-sm transition"
              >
                + Start New Registration
              </button>
              <button
                onClick={() => setCurrentSlide(2)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-xl border border-slate-300 text-sm transition"
              >
                View Registered List →
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 2: Registration Form */}
        {currentSlide === 1 && (
          <div>
            <RegistrationForm />
          </div>
        )}

        {/* SLIDE 3: Registered Members List */}
        {currentSlide === 2 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2">
            <List />
          </div>
        )}

      </main>
    </div>
  );
}