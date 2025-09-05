import React, { useState } from "react";

interface UploadedFile {
  id: number;
  originalName: string;
  createdAt: string;
  answers?: Array<{ questionText: string; answer: string }>;
}

interface FileTableProps {
  files: UploadedFile[];
  isLoading: boolean;
  error: string | null;
  apiUrl: string;
  onFileUploaded: () => void;
}

export default function FileTable({
  files,
  isLoading,
  error,
  apiUrl,
  onFileUploaded,
}: FileTableProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [expandedFile, setExpandedFile] = useState<number | null>(null);

  // Helper function to render answer content
  const renderAnswer = (answer: string) => {
    // Check if answer starts with YES or NO (case insensitive)
    if (/^yes\b/i.test(answer)) {
      return (
        <div className="flex items-center">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span>Yes</span>
        </div>
      );
    } else if (/^no\b/i.test(answer)) {
      return (
        <div className="flex items-center">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span>No</span>
        </div>
      );
    }

    // If not YES/NO, just return the answer text
    return answer;
  };

  const toggleFileDetails = (fileId: number) => {
    if (expandedFile === fileId) {
      setExpandedFile(null);
    } else {
      setExpandedFile(fileId);
    }
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
      const res = await fetch(`${apiUrl}/tender/file`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      setUploadSuccess(true);
      setSelectedFile(null);
      // Notify parent component to refresh the file list
      onFileUploaded();
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

      {/* File list section */}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {isLoading ? (
        <div className="text-gray-600">Loading files...</div>
      ) : files.length === 0 ? (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
                <React.Fragment key={file.id}>
                  <tr className={expandedFile === file.id ? "bg-blue-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {file.originalName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.answers && file.answers.length > 0 && (
                        <button
                          onClick={() => toggleFileDetails(file.id)}
                          className="text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          {expandedFile === file.id
                            ? "Hide Answers"
                            : "Show Answers"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedFile === file.id &&
                    file.answers &&
                    file.answers.length > 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 bg-gray-50">
                          <div className="pl-4 border-l-2 border-blue-400">
                            <h4 className="text-sm font-semibold mb-2">
                              Answers:
                            </h4>
                            <ul className="space-y-3">
                              {file.answers.map((answer, index) => (
                                <li key={index} className="text-sm">
                                  <div className="font-medium text-gray-700">
                                    Q: {answer.questionText}
                                  </div>
                                  <div className="mt-1 text-gray-600">
                                    A:{" "}
                                    {typeof answer.answer === "string"
                                      ? renderAnswer(answer.answer)
                                      : answer.answer}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
