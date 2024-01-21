import { COLORS } from "./config.js";

class Game {
    field = null;
    input = null;
    constructor() {
        this.field = new Field(4,4);
        this.input = new Input(this.field, this.checkLose);
    }

    checkLose() {
        let empty = 0;
        for (let j = 0; j < this.field.h; j++) {
            for (let i = 0; i < this.field.w; i++) {
                empty += this.field.cells[j][i].value == 0;
            }
        }
        if (empty == 0) {
            console.log('LOSE');
            this.field = new Field(4, 4);
        }
    }
}

class Input {
    constructor(field, callback) {
        window.addEventListener("keydown", e => {
            switch (e.key) {
                case "ArrowLeft":
                    field.shiftLeft();
                    break;
                case "ArrowUp":
                    field.shiftUp();
                    break;
                case "ArrowRight":
                    field.shiftRight();
                    break;
                case "ArrowDown":
                    field.shiftDown();
                    break;
            }
        });
    }
}

class Animation {
    static anim(element, name) {
        element.classList.remove(name + "-end");       
        element.classList.add(name + "-start");
        setTimeout(() => {     
            element.classList.remove(name + "-start");       
            element.classList.add(name + "-end");
        }, 200);
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
        cell.update();
        Animation.new(wrapper);   

        if (cell.value != 0) 
        cell.set(cell.x, cell.y, cell.value);
    }
    
    remove(cell) {
        this.cells.removeChild(cell.block.parentElement);
    }
}

const CELLS = new DocumentField("movable");
const TEMPLATE = new DocumentField("template");

class Cell {
    block = null;
    value = 0;
    x = 0;
    y = 0;
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
    }

    set(x, y, value) {        
        this.value = value;
        let pow = Math.log2(Math.max(1, value));
    
        this.block.style.backgroundColor = COLORS[pow].bg;
        this.block.style.color = COLORS[pow].text;

        this.block.textContent = value;

        this.x = x;
        this.y = y;
    }

    update() {
        if (!this.block) return;
        let wrapper = this.block.parentElement;
        wrapper.style.setProperty('--x', this.x);
        wrapper.style.setProperty('--y', this.y);
    }
}

class Field {
    cells = [];
    w = 0;
    h = 0;
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
        this.fill();
    }

    fill() {
        for (let j = 0; j < this.h; j++) {
            for (let i = 0; i < this.w; i++) {
                if (Math.random() < 0.2 && this.cells[j][i].value == 0) {
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
                this.cells[j][i].update();
            }
        }
    }

    shift(w, h, cells) {
        for (let j = 0; j < h; j++) {
            for (let i = 0; i < w; i++) {
                let c2 = cells[j][i];
                if (cells[j][i].value != 0) {
                    let clearRow = true;
                    for (let k = 0; k < w; k++) {
                        let c1 = cells[j][k];
                        if (k == i) break;
                        let v1 = c1.value;
                        let v2 = c2.value;
                        if (v1 == 0 || (v1 == v2 && clearRow)) {
                            cells[j][k] = c2;
                            cells[j][k].set(k, j, v1 + v2);
                            if (v1 != 0) CELLS.remove(cells[j][i]);
                            cells[j][i] = new Cell(i, j, 0);
                            break;
                        }
                        clearRow = false;
                    }
                }
            }
        }
        // this.fill();
        return cells;
    }

    shiftLeft() {
        this.shift(this.w, this.h, this.cells);
        this.update();
        console.log(this.cells);
    }

    transpose(matrix) {
        let cells = []
        for (let i = matrix[0].length - 1; i >= 0; i--) {
            let row = [];
            for (let j = 0; j < matrix.length; j++) {
                row.push(matrix[j][i]);
            }
            cells.push(row);
        }
        return cells;
    }
   
    transposeReverse(matrix) {
        let cells = [];
        for (let i = 0; i < matrix[0].length; i++) {
            cells.push(Array(matrix.length));
        }
        for (let j = 0; j < matrix.length; j++) {
            for (let i = 0; i < matrix[0].length; i++) {
                cells[i][j] = matrix[j][i];
            }
        }
        return cells;
    }

    shiftUp() {
        let cells = this.transpose(this.cells);
        cells = this.shift(this.h, this.w, cells);

        this.cells = this.transposeReverse(cells);
        this.update();
        console.log(this.cells);

    }

    shiftRight() {
        this.shift(this.w, this.h, cells);
    }

    shiftDown() {
        this.shift(this.h, this.w, cells);
    }
}

let game = new Game();
