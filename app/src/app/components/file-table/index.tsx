import React, { useCallback, useEffect, useState } from "react";

interface UploadedFile {
  id: number;
  originalName: string;
  createdAt: string;
}

interface FileTableProps {
  apiUrl: string;
}

export default function FileTable({ apiUrl }: FileTableProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchUploadedFiles = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`${apiUrl}/tender/files`);
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
  }, [apiUrl]);

  useEffect(() => {
    fetchUploadedFiles();
  }, [fetchUploadedFiles]);

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
      const res = await fetch(`${apiUrl}/tender/file`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Upload failed");
      }

      setUploadSuccess(true);
      setSelectedFile(null);
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
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Uploaded Files</h2>

      {/* File upload section */}
      <div className="flex flex-col gap-2 mb-6 p-4 border rounded-lg bg-gray-50">
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

      {loadError && <div className="text-red-600 mb-4">{loadError}</div>}
      {isLoading ? (
        <div className="text-gray-600">Loading files...</div>
      ) : uploadedFiles.length === 0 ? (
        <div className="text-gray-600">No files uploaded yet.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uploadedFiles.map((file) => (
                <tr key={file.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {file.originalName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
