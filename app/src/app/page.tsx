"use client";
import { useState, useEffect } from "react";
import FileTable from "./components/file-table";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface UploadedFile {
  id: number;
  originalName: string;
  createdAt: string;
}

export default function Home() {
  // Remove unused state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  console.log(API_URL);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setUploadError("Only PDF files are allowed.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadSuccess(false);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mimetype", selectedFile.type);
      const res = await fetch(`${API_URL}/tender/file`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      setUploadSuccess(true);
      // Refresh the file list after successful upload
      fetchUploadedFiles();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError("Unknown error");
      }
    } finally {
      setUploading(false);
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
      <div className="flex flex-col gap-2">
        <label htmlFor="file-upload" className="font-medium">
          Select file to upload:
        </label>
        <input
          id="file-upload"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="border rounded px-2 py-1"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 self-start mt-2 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
        {uploadError && <div className="text-red-600">{uploadError}</div>}
        {uploadSuccess && (
          <div className="text-green-600">File uploaded successfully!</div>
        )}
      </div>

      {/* Display uploaded files */}
      <FileTable
        files={uploadedFiles}
        isLoading={isLoading}
        error={loadError}
      />

      <button
        type="submit"
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 self-start"
      >
        Submit
      </button>
    </form>
  );
}
