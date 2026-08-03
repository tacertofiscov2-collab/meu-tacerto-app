/**
 * Renders the TaCerto! wordmark following the brand rule:
 * "Ta" in dark gray + "Certo!" in green. Never one color only.
 */
export default function Brand({ className = "" }) {
  return (
    <span className={`font-bold ${className}`}>
      Ta<span className="text-green-600">Certo!</span>
    </span>
  );
}





