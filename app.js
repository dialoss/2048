import { COLORS } from "./config.js";
import "./events.js";

const TRANSITION = 200;

class DocumentElement {
    value = 0;
    text = '';
    el = null;
    constructor(selector, value) {
        this.el = document.querySelector(selector);
        this.value = value;
    }

    set(text, value) {
        this.value = value;
        this.el.innerText = text;
    }
}

class Game {
    field = null;
    input = null;
    score = new DocumentElement('.score', 0);
    constructor() {
        this.field = new Field(4, 4);
        this.update();

        document.querySelector('.again').addEventListener('click', e => {
            this.reset();
            this.field.fill(0.2);
            this.update();
        });

        let t = null;
        const inputTimeout = () => {
            if (t) return false;
            t = setTimeout(() => {
                clearTimeout(t);
                t = null;
            }, 100);
            return true;
        }
        document.addEventListener('swiped', e => {
            if (!inputTimeout()) return;
            this.field.shift(e.detail.dir);
        });

        window.addEventListener("keydown", e => {
            if (!inputTimeout()) return;
            switch (e.key) {
                case "ArrowLeft":
                    this.field.shift('left');
                    break;
                case "ArrowUp":
                    this.field.shift('up');
                    break;
                case "ArrowRight":
                    this.field.shift('right');
                    break;
                case "ArrowDown":
                    this.field.shift('down');
                    break;
            }
            this.update();
        });
    }

    reset() {
        this.score.set('Рекорд 0', 0)
        
        for (let j = 0; j < this.field.h; j++) {
            for (let i = 0; i < this.field.w; i++) {
                this.field.cells[j][i].value = 0;
                CELLS.remove(this.field.cells[j][i]);
            }
        }
        this.field.update();
    }

    update() {
        let empty = 0;
        let all = 0;
        for (let j = 0; j < this.field.h; j++) {
            for (let i = 0; i < this.field.w; i++) {
                let v = this.field.cells[j][i].value;
                empty += v == 0;
                all += v;
            }
        }
        this.score.set('Рекорд ' + all, all);
        if (empty == 0) {
            this.reset();
            this.score.set('Проиграл', 0);
        }
        console.log(this.field.cells)
    }
}

class Animation {
    static anim(element, name) {
        element.classList.remove(name + "-end");
        element.classList.add(name + "-start");
        setTimeout(() => {
            element.classList.remove(name + "-start");
            element.classList.add(name + "-end");
        }, TRANSITION);
    }

    static new(element) {
        Animation.anim(element, "new");
    }
}

class DocumentField {
    cells = null;
    constructor(type) {
        this.cells = document.querySelector(".cells-" + type);
    }

    add(cell) {
        let block = document.createElement("div");
        block.classList.add('cell');

        let wrapper = document.createElement('div');
        wrapper.classList.add("cell-wrapper");
        wrapper.appendChild(block);
        this.cells.appendChild(wrapper);
        cell.block = block;
        Animation.new(wrapper);

        if (cell.value != 0)
            cell.updateValue();
    }

    remove(cell) {
        if (!cell.block) return;
        this.cells.removeChild(cell.block.parentElement);
    }
}

const CELLS = new DocumentField("movable");
const TEMPLATE = new DocumentField("template");

class Cell {
    block = null;
    value = 0;
    merged = false;
    x = 0;
    y = 0;
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
    }

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
        if (!this.block) return;
        let wrapper = this.block.parentElement;
        wrapper.style.setProperty('--x', x);
        wrapper.style.setProperty('--y', y);
        this.merged = false;
    }

    updateValue() {
        let pow = Math.log2(Math.max(1, this.value));

        this.block.style.backgroundColor = COLORS[pow].bg;
        this.block.style.color = COLORS[pow].text;
        this.block.textContent = this.value;
    }

    static copy(cell) {
        let c = new Cell(cell.x, cell.y, cell.value);
        c.block = cell.block;
        return c;
    }
}

class Field {
    cells = [];
    w = 0;
    h = 0;
    hasMerged = false;
    constructor(w, h) {
        document.querySelector(".field-wrapper").style.setProperty('--w', w);
        document.querySelector(".field-wrapper").style.setProperty('--h', h);

        this.w = w;
        this.h = h;
        for (let j = 0; j < h; j++) {
            let row = [];
            for (let i = 0; i < w; i++) {
                row.push(new Cell(i, j, 0));
                TEMPLATE.add(new Cell(i, j, 0));
            }
            this.cells.push(row);
        }
        this.fill(0.2);
        this.update();
    }

    fill(density) {
        for (let j = 0; j < this.h; j++) {
            for (let i = 0; i < this.w; i++) {
                if (Math.random() < density && this.cells[j][i].value == 0) {
                    let pow = 1;
                    if (Math.random() > 0.7) {
                        pow = 2;
                    }
                    let cell = new Cell(i, j, Math.pow(2, pow));
                    this.cells[j][i] = cell;
                    CELLS.add(cell);
                }
            }
        }
    }

    update() {
        for (let j = 0; j < this.h; j++) {
            for (let i = 0; i < this.w; i++) {
                this.cells[j][i].updatePosition(i, j);
            }
        }
    }

    shift(dir) {
        switch (dir) {
            case 'left': this.shiftLeft(); break;
            case 'right': this.shiftRight(); break;
            case 'up': this.shiftUp(); break;
            case 'down': this.shiftDown(); break;
        }
        // if (this.hasMerged) 
        this.fill(0.1);
        this.update();
        this.hasMerged = false;
    }

    shiftHorizontally(cells, dir) {
        let start = dir == 1 ? 0 : cells[0].length - 1;
        for (let j = 0; j < cells.length; j++) {
            let i = start;
            while (i >= 0 && i < cells[0].length) {
                let cMove = cells[j][i];
                if (cMove.value != 0) {
                    let k = start;
                    while (k >= 0 && k < cells[0].length) {
                        if (k == i) break;
                        let cTo = cells[j][k];
                        let v1 = cTo.value;
                        let v2 = cMove.value;
                        let clearRow = true;
                        for (let p = Math.min(k, i) + 1; p < Math.max(k, i); p++) {
                            if (cells[j][p].value != 0) {
                                clearRow = false;
                                break;
                            }
                        }
                        if ((v1 == 0 || (v1 == v2)) && !cTo.merged && clearRow) {
                            cells[j][k] = Cell.copy(cMove);
                            cells[j][k].value = v1 + v2;
       
                            if (v1 != 0) {
                                cells[j][k].merged = true;
                                this.hasMerged = true;
                                Animation.new(cells[j][k].block.parentElement);
                                setTimeout(() => {
                                    cells[j][k].updateValue();
                                }, 100);
                                setTimeout(() => {
                                    CELLS.remove(cTo);
                                }, TRANSITION);
                            }
                            cells[j][i] = new Cell(i, j, 0);
                            break;
                        }
                        k += dir;
                    }
                }
                i += dir;
            }
        }
        return cells;
    }

    shiftLeft() {
        this.cells = this.shiftHorizontally(this.cells, 1);
    }

    shiftRight() {
        this.cells = this.shiftHorizontally(this.cells, -1);
    }
   
    shiftVertically(dir) {
        let w = this.cells[0].length;
        let h = this.cells.length;

        let matrix = fillMatrix(h, w);
        for (let i = w - 1; i >= 0; i--) {
            for (let j = 0; j < h; j++) {
                matrix[w - i - 1][j] = this.cells[j][i];
            }
        }

        matrix = this.shiftHorizontally(matrix, dir);
        for (let i = w - 1; i >= 0; i--) {
            for (let j = 0; j < h; j++) {
                this.cells[j][i] = matrix[w - i - 1][j];
            }
        }
    }

    shiftUp() {
        this.shiftVertically(1);        
    }

    shiftDown() {
        this.shiftVertically(-1);        
    }
}

const fillMatrix = (w, h) => Array(h).fill().map(a =>
    Array(w).fill(0));

let game = new Game();
