export const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function getWinner(board) {
  for (const combination of WINNING_COMBINATIONS) {
    const [first, second, third] = combination;
    if (board[first] && board[first] === board[second] && board[first] === board[third]) {
      return { player: board[first], combination };
    }
  }

  return null;
}

export function getGameResult(board) {
  const winner = getWinner(board);
  if (winner) return { type: "win", ...winner };
  if (board.every(Boolean)) return { type: "draw" };
  return null;
}

function minimax(board, isMaximizing, depth) {
  const result = getGameResult(board);
  if (result?.type === "win") {
    return result.player === "O" ? 10 - depth : depth - 10;
  }
  if (result?.type === "draw") return 0;

  const availableMoves = board.reduce((moves, cell, index) => {
    if (!cell) moves.push(index);
    return moves;
  }, []);

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of availableMoves) {
      board[move] = "O";
      bestScore = Math.max(bestScore, minimax(board, false, depth + 1));
      board[move] = null;
    }
    return bestScore;
  }

  let bestScore = Infinity;
  for (const move of availableMoves) {
    board[move] = "X";
    bestScore = Math.min(bestScore, minimax(board, true, depth + 1));
    board[move] = null;
  }
  return bestScore;
}

function getBestMove(board) {
  let bestScore = -Infinity;
  let bestMoves = [];

  for (let index = 0; index < board.length; index += 1) {
    if (board[index]) continue;
    board[index] = "O";
    const score = minimax(board, false, 1);
    board[index] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [index];
    } else if (score === bestScore) {
      bestMoves.push(index);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

export function getComputerMove(board, difficulty) {
  const availableMoves = board.reduce((moves, cell, index) => {
    if (!cell) moves.push(index);
    return moves;
  }, []);

  if (availableMoves.length === 0) return null;
  if (difficulty === "easy") {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }
  if (difficulty === "medium" && Math.random() < 0.4) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }
  return getBestMove([...board]);
}
