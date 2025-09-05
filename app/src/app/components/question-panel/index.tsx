import { useState, useEffect } from "react";

interface Question {
  id: number;
  text: string;
  createdAt: string;
}

interface QuestionPanelProps {
  apiUrl: string;
}

export default function QuestionPanel({ apiUrl }: QuestionPanelProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // Fetch all questions
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

  // Add a new question
  const addQuestion = async () => {
    if (!newQuestion.trim()) return;

    setIsAdding(true);
    setError(null);
    setAddSuccess(false);

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

  // Load questions when component mounts
  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-8 flex flex-col gap-4">
      <h2 className="text-xl font-bold">Questions</h2>

      {/* Add new question form */}
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
        </div>
      </div>

      {/* Questions list */}
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
                <p className="mb-1">{q.text}</p>
                <span className="text-sm text-gray-500">
                  Asked on {new Date(q.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
