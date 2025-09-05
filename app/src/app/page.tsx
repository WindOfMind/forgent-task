"use client";

import FileTable from "./components/file-table";
import QuestionPanel from "./components/question-panel";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow flex flex-col gap-6">
      <FileTable apiUrl={API_URL} />

      <QuestionPanel apiUrl={API_URL} />
    </div>
  );
}
