import type { Bool, Context, Solver, Z3Core } from 'z3-solver';

export function solverToSmtlib(Z3: Z3Core, solver: Solver) {
  const p = Array.from(solver.assertions().values());
  return Z3.benchmark_to_smtlib_string(
    solver.ctx.ptr,
    'logic_bingo',
    'QF_LIA',
    'unknown',
    '',
    p.map(x => x.ptr),
    p.at(-1)!.ptr,
  );
}

export function getBingoConstraint(ctx: Context, width: number, height: number, board: Bool[][]) {
  // Row constraints
  const constraints: Bool[] = [];
  for (let i = 0; i < height; i++)
    constraints.push(ctx.And(...board[i]!));

  // Column constraints
  for (let j = 0; j < width; j++) {
    const col = [];
    for (let i = 0; i < height; i++)
      col.push(board[i]![j]!);
    constraints.push(ctx.And(...col));
  }

  // Diagonal constraints if board is square
  if (width === height) {
    const mainDiag = [];
    const antiDiag = [];
    for (let i = 0; i < width; i++) {
      mainDiag.push(board[i]![i]!);
      antiDiag.push(board[i]![width - 1 - i]!);
    }
    constraints.push(ctx.And(...mainDiag), ctx.And(...antiDiag));
  }

  return ctx.Or(...constraints);
}
