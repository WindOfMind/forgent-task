import { useState, useEffect } from "react";

interface Question {
  id: number;
  text: string;
  createdAt: string;
  answer?: {
    answer: string;
    createdAt: string;
  };
}

interface QuestionPanelProps {
  apiUrl: string;
  refreshTrigger?: number; // A value that changes to trigger a refresh
}

export default function QuestionPanel({
  apiUrl,
  refreshTrigger,
}: QuestionPanelProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

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

  const toggleQuestionDetails = (questionId: number) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(questionId);
    }
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/tender/questions`);
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      const data = await response.json();
      setQuestions(data.questions ?? []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error loading questions");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;

    setIsAdding(true);
    setError(null);
    setAddSuccess(false);
    setDeleteSuccess(false);

    try {
      const response = await fetch(`${apiUrl}/tender/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: newQuestion }),
      });

      if (!response.ok) {
        throw new Error("Failed to add question");
      }

      setAddSuccess(true);
      setNewQuestion("");
      fetchQuestions(); // Refresh the questions list
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error adding question");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const deleteQuestion = async (id: number) => {
    setIsDeleting(id);
    setError(null);
    setDeleteSuccess(false);
    setAddSuccess(false);

    try {
      const response = await fetch(`${apiUrl}/tender/question/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete question");
      }

      setDeleteSuccess(true);
      fetchQuestions(); // Refresh the questions list
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error deleting question");
      }
    } finally {
      setIsDeleting(null);
    }
  };

  // Use the refreshTrigger prop to trigger refreshes
  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  return (
    <div className="mt-8 flex flex-col gap-4">
      <h2 className="text-xl font-bold">Questions</h2>

      <div className="flex flex-col gap-2 p-4 border rounded bg-gray-50">
        <label htmlFor="new-question" className="font-medium">
          Add a new question:
        </label>
        <textarea
          id="new-question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Type your question here..."
          rows={3}
          className="border rounded p-2 w-full"
        />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={addQuestion}
            disabled={!newQuestion.trim() || isAdding}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add Question"}
          </button>
          {error && <div className="text-red-600">{error}</div>}
          {addSuccess && (
            <div className="text-green-600">Question added successfully!</div>
          )}
          {deleteSuccess && (
            <div className="text-green-600">Question deleted successfully!</div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">All Questions</h3>
        {isLoading ? (
          <div className="text-gray-600">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-gray-600">No questions yet.</div>
        ) : (
          <ul className="border rounded divide-y">
            {questions.map((q) => (
              <li key={q.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="mb-1">{q.text}</p>
                    <span className="text-sm text-gray-500">
                      Asked on {new Date(q.createdAt).toLocaleString()}
                    </span>
                    {q.answer && (
                      <button
                        onClick={() => toggleQuestionDetails(q.id)}
                        className="ml-4 text-blue-600 hover:text-blue-800 focus:outline-none text-sm"
                      >
                        {expandedQuestion === q.id
                          ? "Hide Answer"
                          : "Show Answer"}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteQuestion(q.id)}
                    disabled={isDeleting === q.id}
                    className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex-shrink-0"
                    title="Delete question"
                  >
                    {isDeleting === q.id ? "Deleting..." : "Delete"}
                  </button>
                </div>

                {expandedQuestion === q.id && q.answer && (
                  <div className="mt-4 pl-4 border-l-2 border-blue-400">
                    <h4 className="text-sm font-semibold mb-2">Answer:</h4>
                    <div className="text-sm">
                      <div className="mt-1 text-gray-600">
                        {typeof q.answer.answer === "string"
                          ? renderAnswer(q.answer.answer)
                          : q.answer.answer}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Answered on{" "}
                        {new Date(q.answer.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
