/* ---------- DOM ---------- */
const selectBox  = document.querySelector('.select-box');
const playBoard  = document.querySelector('.play-board');
const cells      = [...document.querySelectorAll('[data-cell]')];
const playersBar = document.querySelector('.players');
const resultBox  = document.querySelector('.result-box');
const wonText    = resultBox.querySelector('.won-text');
const slider = document.querySelector('.players .slider');

/* ---------- Константы ---------- */
const ICON = { X: 'fas fa-times', O: 'far fa-circle' };
const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

/* ---------- Состояние партии ---------- */
let board, human, bot, running;

/* ---------- Вспомогательные ---------- */
const winner = (b,s) => WINS.some(w => w.every(i => b[i] === s));
const empty  = b => b.reduce((a,_,i)=> b[i]===''? a.concat(i):a,[]);

function updateTurnIndicator(next){
  /* .active = сейчас ход O (ползунок вправо) */
  playersBar.classList.toggle('active', next === 'O');
}

function score(b,d){
  if (winner(b,bot))   return 10 - d;
  if (winner(b,human)) return d - 10;
  return 0;
}

// функция помогает установить ползунок в новое значение без перехода
function setInitialIndicator(isO){
  /* 1. временно убираем переход */
  slider.style.transition = 'none';

  /* 2. ставим нужный класс */
  playersBar.className = isO ? 'players active player' : 'players';

  /* 3. вернём transition после того,
        как браузер нарисует новое положение   */
  requestAnimationFrame(() => {
    slider.style.transition = '';   // пустая строка = вернуться к CSS
  });
}

/* ---------- Минимакс ---------- */
function minimax(b, turn, d = 0){
  if (winner(b,bot) || winner(b,human) || !b.includes(''))
    return { score: score(b,d) };

  let best = { score: turn===bot ? -Infinity : Infinity };

  for (const i of empty(b)){
    b[i] = turn;
    const { score } = minimax(b, turn===bot? human: bot, d+1);
    b[i] = '';

    const better = turn===bot ? score > best.score : score < best.score;
    if (better) best = { score, move: i };
  }
  return best;
}

/* ---------- Ходы ---------- */
function place(idx, sign, animate = true){
  board[idx] = sign;
  const cell = cells[idx];
  cell.style.pointerEvents = 'none';

  const icon = document.createElement('i');
  icon.className = ICON[sign];
  if (animate){
    icon.style.transform  = 'scale(0)';
    icon.style.transition = 'transform .25s ease';
    requestAnimationFrame(()=> icon.style.transform = 'scale(1)');
  }
  cell.appendChild(icon);

  updateTurnIndicator(sign === 'X' ? 'O' : 'X');
}

function botMove(){
  if (!running) return;
  const { move } = minimax([...board], bot);
  const delay = Math.floor(Math.random()*800) + 200; // 200‑1000 мс
  setTimeout(()=>{
    place(move, bot);
    checkGame();
  }, delay);
}

function playerMove(e){
  if (!running) return;
  const idx = +e.currentTarget.dataset.cell;
  if (board[idx] !== '') return;
  place(idx, human);
  checkGame();
  if (running) botMove();
}

/* ---------- Конец партии ---------- */
function showResult(type, sign = ''){
  running = false;
  wonText.textContent =
    type === 'draw'
      ? 'Ничья!'
      : `${sign === 'X' ? 'Крестики' : 'Нолики'} победили!`;
  setTimeout(() => {
    playBoard.classList.remove('show');
    resultBox.classList.add('show');
  }, 600);
}

function checkGame(){
  if (winner(board,human)) showResult('win', human);
  else if (winner(board,bot)) showResult('win', bot);
  else if (!board.includes('')) showResult('draw');
}

/* ---------- Запуск партии ---------- */
function startGame(humanSign){
  board   = Array(9).fill('');
  human   = humanSign;
  bot     = human === 'X' ? 'O' : 'X';
  running = true;

  cells.forEach(c=>{
    c.innerHTML = '';
    c.style.pointerEvents = 'auto';
  });

  /* Индикатор ставим на того, кто ХОДИТ СЕЙЧАС — это человек */
  updateTurnIndicator(human);

  /* Бот НЕ делает стартовый ход — ждёт, пока сыграет человек */
}

/* ---------- UI ---------- */
window.addEventListener('load', () => {
    /* --- игрок выбирает X --- */
    document.querySelector('.playerX').addEventListener('click', () => {
        setInitialIndicator(false);            // сразу левое положение
        selectBox.classList.add('hide');
        playBoard.classList.add('show');
        startGame('X');
    });

    /* --- игрок выбирает O --- */
    document.querySelector('.playerO').addEventListener('click', () => {
        setInitialIndicator(true);             // сразу правое положение
        selectBox.classList.add('hide');
        playBoard.classList.add('show');
        startGame('O');
    });

    cells.forEach(c => c.addEventListener('click', playerMove));
    document.querySelector('.result-box button')
        .addEventListener('click', () => location.reload());
});
