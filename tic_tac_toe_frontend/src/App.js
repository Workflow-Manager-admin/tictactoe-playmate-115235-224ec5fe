import React, { useState, useEffect } from "react";
import "./App.css";

// THEME COLORS (can be overridden in App.css if desired)
const COLORS = {
  accent: "#ffd600",
  primary: "#1a73e8",
  secondary: "#e8eaf6",
  boardBorder: "#e0e0e0",
  x: "#1a73e8", // primary
  o: "#ffd600", // accent
  lightBg: "#fff",
  shadow: "rgba(26,115,232,0.08)",
};

// ----- Utility functions -----

// PUBLIC_INTERFACE
function calculateWinner(squares) {
  /** Returns 'X', 'O', or null if no winner yet */
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];
  for (let [a, b, c] of lines) {
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return squares[a];
    }
  }
  return null;
}

// PUBLIC_INTERFACE
function getAvailableMoves(squares) {
  return squares
    .map((item, idx) => (item ? null : idx))
    .filter((v) => v !== null);
}

// --- Simple AI ---

// PUBLIC_INTERFACE
function aiMove(squares, aiSymbol, humanSymbol) {
  /**
   * Simple AI: Try to win, block human immediate win, else random.
   * Returns move index (0..8)
   */
  const available = getAvailableMoves(squares);
  // 1. Win if possible
  for (let idx of available) {
    const copy = [...squares];
    copy[idx] = aiSymbol;
    if (calculateWinner(copy) === aiSymbol) return idx;
  }
  // 2. Block if human can win
  for (let idx of available) {
    const copy = [...squares];
    copy[idx] = humanSymbol;
    if (calculateWinner(copy) === humanSymbol) return idx;
  }
  // 3. Take center if available
  if (squares[4] === null) return 4;
  // 4. Random move
  return available[Math.floor(Math.random() * available.length)];
}

// -------- UI Components --------

/**
 * Square (Cell) Component
 */
function Square({ value, onClick, highlight }) {
  let color = value === "X" ? COLORS.x : COLORS.o;
  return (
    <button
      className="ttt-square"
      style={{
        color: value ? color : COLORS.primary,
        background: highlight
          ? COLORS.secondary
          : "var(--bg-primary, #fff)",
        border: "1.5px solid " + COLORS.boardBorder,
        boxShadow: highlight ? `0 0 8px 1px ${COLORS.accent}` : "none",
        transition: "box-shadow 0.18s",
      }}
      onClick={onClick}
      disabled={!!value}
      aria-label={value ? `Cell: ${value}` : `Empty cell`}
    >
      {value}
    </button>
  );
}

/**
 * Game Board: Stateless 3x3 grid
 */
function Board({ squares, onSquareClick, highlightIndexes }) {
  return (
    <div className="ttt-board">
      {[0, 1, 2].map((row) => (
        <div className="ttt-row" key={row}>
          {[0, 1, 2].map((col) => {
            const idx = row * 3 + col;
            return (
              <Square
                key={idx}
                value={squares[idx]}
                onClick={() => onSquareClick(idx)}
                highlight={highlightIndexes.includes(idx)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Game Status / Message Bar
 */
function StatusDisplay({ status, winner, nextPlayer, isDraw, mode, symbol }) {
  let msg = status;
  if (winner) msg = `🎉 ${winner} wins!`;
  else if (isDraw) msg = "It's a draw! 🤝";
  else if (status)
    msg =
      mode === "pve" && nextPlayer !== symbol
        ? "AI is thinking..."
        : `Next move: ${nextPlayer}`;

  return (
    <div
      className="ttt-status"
      style={{
        color: winner
          ? COLORS.accent
          : isDraw
          ? COLORS.primary
          : COLORS.primary,
        fontWeight: "600",
        fontSize: "1.1rem",
        letterSpacing: "0.04em",
        minHeight: "38px",
        margin: "10px 0 0 0",
      }}
      role="status"
      aria-live="polite"
    >
      {msg}
    </div>
  );
}

/**
 * Control Panel: for switching modes, reset etc.
 */
function ControlPanel({
  mode,
  setMode,
  humanSymbol,
  setHumanSymbol,
  onRestart,
  gameActive,
}) {
  return (
    <div className="ttt-controls">
      <div className="ttt-group">
        <span className="ttt-label">Mode:</span>
        <button
          className={`ttt-btn${mode === "pvp" ? " active" : ""}`}
          onClick={() => setMode("pvp")}
          tabIndex={0}
        >
          Player vs Player
        </button>
        <button
          className={`ttt-btn${mode === "pve" ? " active" : ""}`}
          onClick={() => setMode("pve")}
          tabIndex={0}
        >
          Player vs AI
        </button>
      </div>
      {mode === "pve" && (
        <div className="ttt-group">
          <span className="ttt-label">You play as:</span>
          <button
            className={`ttt-btn${humanSymbol === "X" ? " active" : ""}`}
            onClick={() => setHumanSymbol("X")}
            tabIndex={0}
          >
            X
          </button>
          <button
            className={`ttt-btn${humanSymbol === "O" ? " active" : ""}`}
            onClick={() => setHumanSymbol("O")}
            tabIndex={0}
          >
            O
          </button>
        </div>
      )}
      <div className="ttt-group">
        <button
          className="ttt-btn ttt-restart"
          onClick={onRestart}
          tabIndex={0}
          disabled={!gameActive}
        >
          ⟳ Restart
        </button>
      </div>
    </div>
  );
}

// -------- Main Game Logic --------

/**
 * Main Application - Tic Tac Toe Game
 */
// PUBLIC_INTERFACE
function App() {
  // THEME: always light theme per spec.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Game state
  const [mode, setMode] = useState("pvp"); // 'pvp' or 'pve'
  const [humanSymbol, setHumanSymbol] = useState("X"); // Only in PvE
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [status, setStatus] = useState("");
  const [pendingAIMove, setPendingAIMove] = useState(false);
  const [highlight, setHighlight] = useState([]);

  // Derived values
  const winner = calculateWinner(board);
  const draw = !winner && board.every(Boolean);
  const nextPlayer = xIsNext ? "X" : "O";
  const aiSymbol = humanSymbol === "X" ? "O" : "X";
  const isHumanTurn = mode === "pvp" || nextPlayer === humanSymbol;

  // Find highlight indexes for winner
  useEffect(() => {
    if (winner) {
      // Find the winning line
      const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];
      for (let line of lines) {
        const [a, b, c] = line;
        if (
          board[a] &&
          board[a] === board[b] &&
          board[a] === board[c]
        ) {
          setHighlight(line);
          return;
        }
      }
    } else {
      setHighlight([]);
    }
  }, [board, winner]);

  // Handle AI move (async effect)
  useEffect(() => {
    if (
      mode === "pve" &&
      !winner &&
      !draw &&
      !isHumanTurn &&
      !pendingAIMove
    ) {
      setPendingAIMove(true);
      // Simulate thinking delay for realism
      setTimeout(() => {
        const idx = aiMove(board, aiSymbol, humanSymbol);
        handleMove(idx);
        setPendingAIMove(false);
      }, 600);
    }
    // eslint-disable-next-line
  }, [board, mode, winner, draw, isHumanTurn, aiSymbol, humanSymbol, pendingAIMove]);

  // Handle board square click
  const handleMove = (idx) => {
    if (board[idx] || winner || draw || (mode === "pve" && !isHumanTurn))
      return;
    const nextBoard = board.slice();
    nextBoard[idx] = nextPlayer;
    setBoard(nextBoard);
    setXIsNext(!xIsNext);
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setHighlight([]);
    setStatus("");
    setPendingAIMove(false);
  };

  // When mode/symbol changes, reset
  useEffect(() => {
    resetGame();
    // eslint-disable-next-line
  }, [mode, humanSymbol]);

  // Status message
  useEffect(() => {
    if (winner) setStatus(`${winner} wins!`);
    else if (draw) setStatus("Draw.");
    else if (mode === "pve" && !isHumanTurn) setStatus("AI is thinking...");
    else setStatus("");
    // eslint-disable-next-line
  }, [winner, draw, mode, isHumanTurn]);

  // -- RENDER
  return (
    <div
      className="App"
      style={{
        background: COLORS.lightBg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <main className="ttt-main">
        <h1 className="ttt-title" style={{ color: COLORS.primary }}>
          Tic Tac Toe
        </h1>
        <Board
          squares={board}
          onSquareClick={handleMove}
          highlightIndexes={highlight}
        />
        <StatusDisplay
          status={status}
          winner={winner}
          nextPlayer={nextPlayer}
          isDraw={draw}
          mode={mode}
          symbol={humanSymbol}
        />
        <ControlPanel
          mode={mode}
          setMode={setMode}
          humanSymbol={humanSymbol}
          setHumanSymbol={setHumanSymbol}
          onRestart={resetGame}
          gameActive={winner || draw ? false : true}
        />
        <footer className="ttt-footer">
          <span style={{ color: "#aaa", fontSize: "0.9em" }}>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: COLORS.primary,
                textDecoration: "none",
                fontWeight: "bold",
                marginRight: "8px",
              }}
              tabIndex={-1}
            >
              React Minimal TicTacToe
            </a>
            &nbsp;|&nbsp; Modern, minimal, light UI
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
