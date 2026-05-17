interface ResultScreenProps {
  status: "won" | "lost";
  score: number;
  maxCombo: number;
  hitCount: number;
  totalTiles: number;
  onReplay: () => void;
  onBack: () => void;
}

export function ResultScreen({
  status,
  score,
  maxCombo,
  hitCount,
  totalTiles,
  onReplay,
  onBack,
}: ResultScreenProps) {
  const accuracy =
    totalTiles > 0 ? Math.round((hitCount / totalTiles) * 100) : 0;

  return (
    <div className="result-screen">
      <h1>{status === "won" ? "Você venceu! 🎉" : "Game Over"}</h1>
      <dl>
        <dt>Pontos</dt>
        <dd>{score}</dd>
        <dt>Combo máximo</dt>
        <dd>{maxCombo}</dd>
        <dt>Acertos</dt>
        <dd>
          {hitCount}/{totalTiles} ({accuracy}%)
        </dd>
      </dl>
      <button onClick={onReplay}>Jogar de novo</button>
      <button onClick={onBack}>Voltar</button>
    </div>
  );
}
