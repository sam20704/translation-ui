// app/components/SuggestionsTable.tsx
import type { Correction } from '@/hooks/usePdfReview';

interface SuggestionsTableProps {
  suggestions: Correction[];
}

export function SuggestionsTable({ suggestions }: SuggestionsTableProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <section className="w-full mt-8 bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">3. AI-Powered Suggestions</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left font-semibold text-gray-700">Identified Phrase (Mistake)</th>
              <th className="border p-3 text-left font-semibold text-gray-700">Suggested Correction</th>
              <th className="border p-3 text-left font-semibold text-gray-700">Reason</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border p-3 text-red-600 font-mono text-sm bg-red-50">{item.originalPhrase}</td>
                <td className="border p-3 text-green-700 font-mono text-sm bg-green-50">{item.correction}</td>
                <td className="border p-3 text-gray-800 text-sm">{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}