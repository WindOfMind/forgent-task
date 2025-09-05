import { useState, useEffect, useCallback } from "react";

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
}

export default function QuestionPanel({ apiUrl }: QuestionPanelProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleQuestionDetails = (questionId: number) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(questionId);
    }
  };

  const fetchQuestions = useCallback(async () => {
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
  }, [apiUrl]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch(`${apiUrl}/tender/submit`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setSubmitSuccess(true);
      // Refresh questions after successful submission
      fetchQuestions();
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

  // Use the refreshTrigger prop to trigger refreshes
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
              <div className="text-green-600">
                Question deleted successfully!
              </div>
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
                            ? q.answer.answer
                            : null}
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
