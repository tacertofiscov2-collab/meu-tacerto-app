export function TaCertoLogo({ subtitle = "Educação fiscal para seu MEI", size = "text-3xl" }: { subtitle?: string; size?: string }) {
  return (
    <div className="text-center mb-8">
      <h1 className={`${size} font-bold text-gray-800`}>
        Ta<span className="text-green-600">Certo!</span>
      </h1>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-4 text-green-600 hover:text-green-700 transition-colors"
      aria-label="Voltar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
