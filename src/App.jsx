import { useEffect, useRef, useState } from "react";
import { getComputerMove, getGameResult } from "./gameLogic.js";

const EMPTY_BOARD = Array(9).fill(null);

function Icon({ name, size = 18 }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "refresh") {
    return <svg {...shared}><path d="M20 7v5h-5" /><path d="M19.1 12a7.1 7.1 0 1 1-2-5L20 12" /></svg>;
  }
  if (name === "spark") {
    return <svg {...shared}><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></svg>;
  }
  return <svg {...shared}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
}

function ModeButton({ active, icon, title, description, onClick }) {
  return (
    <button
      className={`mode-option${active ? " selected" : ""}`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="mode-icon"><Icon name={icon} size={19} /></span>
      <span className="mode-copy">
        <span className="mode-title">{title}</span>
        <span className="mode-description">{description}</span>
      </span>
      <span className="mode-check" aria-hidden="true">{active ? "✓" : ""}</span>
    </button>
  );
}

function ScoreCard({ label, score, symbol, accent, caption }) {
  return (
    <div className={`score-card ${accent}`}>
      <div className="score-topline">
        <span className="score-symbol">{symbol}</span>
        <span className="score-label">{label}</span>
      </div>
      <div className="score-number">{score}</div>
      <div className="score-caption">{caption}</div>
    </div>
  );
}

function Board({ board, result, onCellClick, disabled }) {
  const line = result?.type === "win" ? result.combination : null;
  const lineStart = line ? getLinePoint(line[0]) : null;
  const lineEnd = line ? getLinePoint(line[2]) : null;

  return (
    <div className="board-wrap">
      <div className="board" role="group" aria-label="Tic Tac Toe board">
        {board.map((cell, index) => {
          const isWinningCell = Boolean(line?.includes(index));
          return (
            <button
              className={`board-cell${cell ? ` mark-${cell.toLowerCase()}` : ""}${isWinningCell ? " winning-cell" : ""}`}
              type="button"
              key={index}
              onClick={() => onCellClick(index)}
              disabled={Boolean(cell) || disabled}
              aria-label={`Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}${cell ? `, ${cell}` : ", empty"}`}
            >
              {cell && <span className="mark" key={`${index}-${cell}`}>{cell}</span>}
            </button>
          );
        })}
      </div>
      {lineStart && lineEnd && (
        <svg className="win-line" viewBox="0 0 300 300" aria-hidden="true">
          <line x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y} />
        </svg>
      )}
    </div>
  );
}

function getLinePoint(index) {
  return { x: (index % 3) * 100 + 50, y: Math.floor(index / 3) * 100 + 50 };
}

function App() {
  const [mode, setMode] = useState("computer");
  const [difficulty, setDifficulty] = useState("hard");
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [round, setRound] = useState(1);
  const [isThinking, setIsThinking] = useState(false);
  const aiTimer = useRef(null);
  const isComputerTurn = mode === "computer" && currentPlayer === "O" && !result;

  function resetRound(startNextRound = false) {
    if (aiTimer.current) window.clearTimeout(aiTimer.current);
    setBoard([...EMPTY_BOARD]);
    setCurrentPlayer("X");
    setResult(null);
    setIsThinking(false);
    if (startNextRound) setRound((previousRound) => previousRound + 1);
  }

  function updateMode(nextMode) {
    if (nextMode === mode) return;
    if (aiTimer.current) window.clearTimeout(aiTimer.current);
    setMode(nextMode);
    setBoard([...EMPTY_BOARD]);
    setCurrentPlayer("X");
    setResult(null);
    setIsThinking(false);
    setRound((previousRound) => previousRound + 1);
  }

  function makeMove(index, fromComputer = false) {
    if (board[index] || result || (isThinking && !fromComputer) || (isComputerTurn && !fromComputer)) return;

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    const nextResult = getGameResult(nextBoard);
    setBoard(nextBoard);
    setResult(nextResult);

    if (nextResult?.type === "win") {
      setScores((previousScores) => ({
        ...previousScores,
        [nextResult.player]: previousScores[nextResult.player] + 1,
      }));
    } else if (nextResult?.type === "draw") {
      setScores((previousScores) => ({ ...previousScores, draws: previousScores.draws + 1 }));
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  }

  useEffect(() => {
    if (!isComputerTurn || isThinking) return undefined;

    setIsThinking(true);
    aiTimer.current = window.setTimeout(() => {
      const move = getComputerMove(board, difficulty);
      if (move !== null) makeMove(move, true);
      setIsThinking(false);
    }, 650);

    return () => {
      if (aiTimer.current) window.clearTimeout(aiTimer.current);
    };
  }, [board, difficulty, isComputerTurn]);

  useEffect(() => () => {
    if (aiTimer.current) window.clearTimeout(aiTimer.current);
  }, []);

  function resetScores() {
    if (window.confirm("Reset all scores? This cannot be undone.")) {
      setScores({ X: 0, O: 0, draws: 0 });
      resetRound(true);
    }
  }

  const status = result?.type === "win"
    ? (result.player === "X"
      ? "Player X wins!"
      : mode === "computer" ? "Computer wins!" : "Player O wins!")
    : result?.type === "draw"
      ? "It's a draw!"
      : isThinking
        ? "Computer is thinking..."
        : mode === "computer" && currentPlayer === "X"
          ? "Your turn"
          : mode === "computer"
            ? "Computer's turn"
            : `Player ${currentPlayer}'s turn`;

  const statusClass = result?.type === "win"
    ? `status-${result.player.toLowerCase()}`
    : result?.type === "draw" ? "status-draw" : currentPlayer === "O" ? "status-o" : "status-x";

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="page-content">
        <header className="topbar">
          <a className="brand" href="#" aria-label="Tic Tac Toe home">
            <span className="brand-mark"><span>X</span><span>O</span></span>
            <span className="brand-name">nine<span>.</span></span>
          </a>
          <div className="topbar-note"><span className="live-dot" /> A little friendly competition</div>
        </header>

        <section className="intro">
          <div className="eyebrow"><span /> THE CLASSIC, REIMAGINED</div>
          <h1>Make your <span>move.</span></h1>
          <p>Three in a row. One very satisfying victory.</p>
        </section>

        <div className="game-layout">
          <aside className="sidebar">
            <section className="panel mode-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">SETUP</span>
                  <h2>Choose your game</h2>
                </div>
                <span className="heading-spark"><Icon name="spark" size={18} /></span>
              </div>
              <div className="mode-list">
                <ModeButton
                  active={mode === "computer"}
                  icon="spark"
                  title="Vs. Computer"
                  description="Take on the machine"
                  onClick={() => updateMode("computer")}
                />
                <ModeButton
                  active={mode === "players"}
                  icon="add"
                  title="Two Players"
                  description="Good old head-to-head"
                  onClick={() => updateMode("players")}
                />
              </div>
              {mode === "computer" && (
                <div className="difficulty">
                  <div className="difficulty-heading">
                    <span>DIFFICULTY</span>
                    <span className="difficulty-current">{difficulty}</span>
                  </div>
                  <div className="difficulty-options" role="group" aria-label="AI difficulty">
                    {["easy", "medium", "hard"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={difficulty === level ? "active" : ""}
                        aria-pressed={difficulty === level}
                        onClick={() => setDifficulty(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="difficulty-hint">
                    {difficulty === "hard"
                      ? "Unbeatable. Can you force a draw?"
                      : difficulty === "medium"
                        ? "A worthy opponent, with a few openings."
                        : "A relaxed warm-up. You've got this."}
                  </p>
                </div>
              )}
            </section>

            <section className="panel scoreboard-panel">
              <div className="panel-heading score-heading">
                <div>
                  <span className="section-kicker">YOUR SESSION</span>
                  <h2>Scoreboard</h2>
                </div>
                <span className="round-number">ROUND {String(round).padStart(2, "0")}</span>
              </div>
              <div className="score-grid">
                <ScoreCard label="PLAYER X" score={scores.X} symbol="X" accent="score-x" caption={mode === "computer" ? "You" : "Player 1"} />
                <ScoreCard label="PLAYER O" score={scores.O} symbol="O" accent="score-o" caption={mode === "computer" ? "Computer" : "Player 2"} />
              </div>
              <div className="draw-row">
                <span className="draw-label"><span className="draw-dot" /> Draws</span>
                <span className="draw-score">{scores.draws}</span>
              </div>
              <button className="reset-scores" type="button" onClick={resetScores}>
                <Icon name="refresh" size={15} /> Reset scores
              </button>
            </section>

            <div className="tip-card">
              <span className="tip-icon"><Icon name="spark" size={16} /></span>
              <p><strong>Quick tip</strong> — The center square is a pretty great place to start.</p>
            </div>
          </aside>

          <section className="game-panel panel" aria-label="Game">
            <div className="game-panel-top">
              <div className={`game-status ${statusClass}`} aria-live="polite">
                <span className={`status-indicator${isThinking ? " thinking" : ""}`} />
                <span>{status}</span>
              </div>
              <div className="turn-badge">
                <span className="turn-label">TURN</span>
                <span className={`turn-symbol ${currentPlayer === "O" ? "o" : "x"}`}>{currentPlayer}</span>
              </div>
            </div>

            <div className="board-container">
              <Board
                board={board}
                result={result}
                onCellClick={makeMove}
                disabled={Boolean(result) || isThinking || isComputerTurn}
              />
            </div>

            <div className="game-panel-bottom">
              <span className="board-hint">
                {result ? "Ready when you are for another round" : "Pick an open square to play"}
              </span>
              <div className="game-actions">
                <button className="button-secondary" type="button" onClick={resetRound}>
                  <Icon name="refresh" size={16} /> Restart
                </button>
                <button className="button-primary" type="button" onClick={() => resetRound(true)}>
                  <Icon name="add" size={17} /> New game
                </button>
              </div>
            </div>
          </section>
        </div>
        <footer className="footer"><span>MADE FOR THE LOVE OF THE GAME</span><span>3 × 3 · INFINITE REMATCHES</span></footer>
      </div>
    </main>
  );
}

export default App;
