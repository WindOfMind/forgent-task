"use client";
import { useState, useEffect } from "react";
import FileTable from "./components/file-table";
import QuestionPanel from "./components/question-panel";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface UploadedFile {
  id: number;
  originalName: string;
  createdAt: string;
}

export default function Home() {
  // File state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  console.log(API_URL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [questionRefreshTrigger, setQuestionRefreshTrigger] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch(`${API_URL}/tender/submit`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setSubmitSuccess(true);
      // Refresh questions after successful submission
      setQuestionRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Unknown error during submission");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to fetch uploaded files
  const fetchUploadedFiles = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`${API_URL}/tender/files`);
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = await response.json();

      setUploadedFiles(data.files ?? []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoadError(err.message);
      } else {
        setLoadError("Unknown error loading files");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch files when component mounts
  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow flex flex-col gap-6"
    >
      <QuestionPanel apiUrl={API_URL} refreshTrigger={questionRefreshTrigger} />

      <FileTable
        files={uploadedFiles}
        isLoading={isLoading}
        error={loadError}
        apiUrl={API_URL}
        onFileUploaded={fetchUploadedFiles}
      />

      <div className="flex flex-col gap-2 items-start">
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 self-start disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        {submitError && <div className="text-red-600 mt-2">{submitError}</div>}
        {submitSuccess && (
          <div className="text-green-600 mt-2">Successfully submitted!</div>
        )}
      </div>
    </form>
  );
}
