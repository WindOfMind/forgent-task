import React from "react";

interface UploadedFile {
  id: number;
  originalName: string;
  createdAt: string;
}

interface FileTableProps {
  files: UploadedFile[];
  isLoading: boolean;
  error: string | null;
}

export default function FileTable({ files, isLoading, error }: FileTableProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Uploaded Files</h2>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
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
