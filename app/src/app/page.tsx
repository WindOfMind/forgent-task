"use client";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Question {
  question: string;
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);

  console.log(API_URL);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow flex flex-col gap-6"
    >
      <button
        type="submit"
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 self-start"
      >
        Submit
      </button>
    </form>
  );
}
