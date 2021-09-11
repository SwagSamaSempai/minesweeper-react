import React from 'react';
import Cell from './cell';

const _und = require('underscore');
const utils = require('./utils');

const statuses = {
    '-1': "There are pieces of you everywhere. :(",
    '0': "Continue carefully.",
    '1': "Congratulations on staying alive! :)"
};


export default class Grid extends React.Component {
    state = {
        board_data: this.initBoardData(),
        game_status: 0,
        to_reveal: this.props.grid_height * this.props.grid_width - this.props.mines,
        flagged: 0,
    };

    render() {
        const min_width = this.props.grid_width * 45;
        return (
            <div>
                <div className="game-info" style={{'min-width': min_width}}>
                    <span className="status">{statuses[this.state.game_status]}</span>
                    <span>Mines: {this.props.mines}</span>
                    <span>Flagged: {this.state.flagged}</span>
                </div>
                {this.renderBoard(this.state.board_data)}
            </div>
        );
    }

    initBoardData() {
        let data = this.createEmptyArray();
        let cell_row, cell_col;
        const bombs = _und.sample(Array.from({length: (this.props.grid_height * this.props.grid_width)}, (_, i) => i++), this.props.mines);
        for (let index of bombs) {
            cell_row = index / this.props.grid_width >> 0;
            cell_col = index % this.props.grid_width;
            data[cell_row][cell_col].mine = true;
            for (let [row, col] of this.getNeighbors(cell_row, cell_col)) {
                ++data[row][col].value;
            }
        }
        return data;
    }

    createEmptyArray() {
        let data = [];
        for (let row = 0; row < this.props.grid_height; ++row) {
            data.push([]);
            for (let col = 0; col < this.props.grid_width; ++col) {
                data[row][col] = {
                    row: row,
                    col: col,
                    mine: false,
                    value: 0,
                    revealed: false,
                    flagged: false,
                };
            }
        }
        return data;
    }

    getNeighbors(cell_row, cell_col) {
        const neighbours = [];
        for (let row of utils.getIndices(cell_row, this.props.grid_height)) {
            for (let col of utils.getIndices(cell_col, this.props.grid_width)) {
                if (row !== cell_row || col !== cell_col) {
                    neighbours.push([row, col]);
                }
            }
        }
        return neighbours;
    }

    revealEmpty(cell_row, cell_col, data) {
        const cell = data[cell_row][cell_col];
        if (cell.flagged) {
            cell.flagged = false;
            this.setState({flagged: this.state.flagged - 1})
        }
        cell.revealed = true;
        this.setState({to_reveal: this.state.to_reveal - 1});
        if (!this.state.to_reveal) {
            return data;
        }
        if (!cell.mine && !cell.value) {
            for (let [row, col] of this.getNeighbors(cell_row, cell_col)) {
                if (!data[row][col].revealed) {
                    data = this.revealEmpty(row, col, data);
                }
            }
        }
        return data;
    }

    handleCellClick(row, col) {
        let data = this.state.board_data;
        const cell = data[row][col];
        if (cell.revealed || cell.flagged) {
            return null;
        }
        if (cell.mine) {
            this.setState({game_status: -1});
            data = this.revealAll(data);
        } else {
            data = this.revealEmpty(row, col, data);
            if (!this.state.to_reveal) {
                this.setState({gameStatus: 1});
                data = this.revealAll(data);
            }
        }
        this.setState({board_data: data});
    }

    revealAll(data) {
        for (let row of data) {
            for (let cell of row) {
                cell.revealed = true;
            }
        }
        return data;
    }

    handleContextMenu(ev, row, col) {
        ev.preventDefault();
        let data = this.state.board_data;
        let cell = data[row][col];
        let flagged = this.state.flagged;
        if (cell.revealed) {
            return;
        }
        if (cell.flagged) {
            cell.flagged = false;
            --flagged;
        } else {
            cell.flagged = true;
            ++flagged;
        }
        this.setState({
            board_data: data,
            flagged: flagged,
        });
    }

    renderBoard(data) {
        const grid = [];
        for (let row of data) {
            const temp_row = [];
            for (let cell of row) {
                temp_row.push(
                    <td>
                        <Cell key={cell.row * row.length + cell.col}
                              cell={cell}
                              onClick={() => this.handleCellClick(cell.row, cell.col)}
                              onRightClick={(ev) => this.handleContextMenu(ev, cell.row, cell.col)}/>
                    </td>
                );
            }
            grid.push(<tr>{temp_row}</tr>)
        }
        return <table className="grid">{grid}</table>;
    }
}