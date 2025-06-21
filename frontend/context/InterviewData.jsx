"use client"
import React, { createContext, useState, useContext } from "react";

const InterviewDataContext = createContext();

export function InterviewDataProvider({ children }) {
  const [interviewData, setInterviewData] = useState(null);

  return (
    <InterviewDataContext.Provider value={{ interviewData, setInterviewData }}>
      {children}
    </InterviewDataContext.Provider>
  );
}

export function useInterviewData() {
  return useContext(InterviewDataContext);
}