// @ts-ignore
import Quill from 'quill';
import { css, getRelativeRect } from '../utils';

// svg icons
import operationIcon1 from '../assets/icons/icon_operation_1.svg';
import operationIcon2 from '../assets/icons/icon_operation_2.svg';
import operationIcon3 from '../assets/icons/icon_operation_3.svg';
import operationIcon4 from '../assets/icons/icon_operation_4.svg';
import operationIcon5 from '../assets/icons/icon_operation_5.svg';
import operationIcon6 from '../assets/icons/icon_operation_6.svg';
import operationIcon7 from '../assets/icons/icon_operation_7.svg';
import operationIcon8 from '../assets/icons/icon_operation_8.svg';
import operationIcon9 from '../assets/icons/icon_operation_9.svg';

const MENU_MIN_HEIHGT = 150;
const MENU_WIDTH = 200;
const ERROR_LIMIT = 5;
const DEFAULT_CELL_COLORS = ['white', 'red', 'yellow', 'blue'];
const DEFAULT_COLOR_SUBTITLE = 'Background Colors';

const MENU_ITEMS_DEFAULT = {
  insertColumnRight: {
    text: 'Insert column right',
    iconSrc: operationIcon1,
    handler() {
      // @ts-ignore
      const tableContainer = Quill.find(this.table);

      let colIndex = getColToolCellIndexByBoundary(
        // @ts-ignore
        this.columnToolCells,
        // @ts-ignore
        this.boundary,
        (cellRect: any, boundary: any) => {
          return (
            Math.abs(cellRect.x + cellRect.width - boundary.x1) <= ERROR_LIMIT
          );
        },
        // @ts-ignore
        this.quill.root.parentNode,
      );

      const newColumn = tableContainer.insertColumn(
        // @ts-ignore
        this.boundary,
        colIndex,
        true,
        // @ts-ignore
        this.quill.root.parentNode,
      );
      // @ts-ignore
      this.tableColumnTool.updateToolCells();
      // @ts-ignore
      this.quill.update(Quill.sources.USER);
      // @ts-ignore
      this.quill.setSelection(
        // @ts-ignore
        this.quill.getIndex(newColumn[0]),
        0,
        Quill.sources.SILENT,
      );
      // @ts-ignore
      this.tableSelection.setSelection(
        newColumn[0].domNode.getBoundingClientRect(),
        newColumn[0].domNode.getBoundingClientRect(),
      );
    },
  },

  insertColumnLeft: {
    text: 'Insert column left',
    iconSrc: operationIcon2,
    handler() {
      // @ts-ignore
      const tableContainer = Quill.find(this.table);
      let colIndex = getColToolCellIndexByBoundary(
        // @ts-ignore
        this.columnToolCells,
        // @ts-ignore
        this.boundary,
        (cellRect: any, boundary: any) => {
          return Math.abs(cellRect.x - boundary.x) <= ERROR_LIMIT;
        },
        // @ts-ignore
        this.quill.root.parentNode,
      );

      const newColumn = tableContainer.insertColumn(
        // @ts-ignore
        this.boundary,
        colIndex,
        false,
        // @ts-ignore
        this.quill.root.parentNode,
      );
      // @ts-ignore
      this.tableColumnTool.updateToolCells();
      // @ts-ignore
      this.quill.update(Quill.sources.USER);
      // @ts-ignore
      this.quill.setSelection(
        // @ts-ignore
        this.quill.getIndex(newColumn[0]),
        0,
        Quill.sources.SILENT,
      );
      // @ts-ignore
      this.tableSelection.setSelection(
        newColumn[0].domNode.getBoundingClientRect(),
        newColumn[0].domNode.getBoundingClientRect(),
      );
    },
  },

  insertRowUp: {
    text: 'Insert row up',
    iconSrc: operationIcon3,
    handler() {
      // @ts-ignore
      const tableContainer = Quill.find(this.table);
      const affectedCells = tableContainer.insertRow(
        // @ts-ignore
        this.boundary,
        false,
        // @ts-ignore
        this.quill.root.parentNode,
      );
      // @ts-ignore
      this.quill.update(Quill.sources.USER);
      // @ts-ignore
      this.quill.setSelection(
        // @ts-ignore
        this.quill.getIndex(affectedCells[0]),
        0,
        Quill.sources.SILENT,
      );
      // @ts-ignore
      this.tableSelection.setSelection(
        affectedCells[0].domNode.getBoundingClientRect(),
        affectedCells[0].domNode.getBoundingClientRect(),
      );
    },
  },

  insertRowDown: {
    text: 'Insert row down',
    iconSrc: operationIcon4,
    handler() {
      // @ts-ignore
      const tableContainer = Quill.find(this.table);
      const affectedCells = tableContainer.insertRow(
        // @ts-ignore
        this.boundary,
        true,
        // @ts-ignore
        this.quill.root.parentNode,
      );
      // @ts-ignore
      this.quill.update(Quill.sources.USER);
      // @ts-ignore
      this.quill.setSelection(
        // @ts-ignore
        this.quill.getIndex(affectedCells[0]),
        0,
        Quill.sources.SILENT,
      );
      // @ts-ignore
      this.tableSelection.setSelection(
        affectedCells[0].domNode.getBoundingClientRect(),
        affectedCells[0].domNode.getBoundingClientRect(),
      );
    },
  },

  mergeCells: {
    text: 'Merge selected cells',
    iconSrc: operationIcon5,
    handler() {
      // @ts-ignore
      const tableContainer = Quill.find(this.table);
      // compute merged Cell rowspan, equal to length of selected rows
      const rowspan = tableContainer.rows().reduce((sum: any, row: any) => {
        let rowRect = getRelativeRect(
          row.domNode.getBoundingClientRect(),
          // @ts-ignore
          this.quill.root.parentNode,
        );
        if (
          // @ts-ignore
          rowRect.y > this.boundary.y - ERROR_LIMIT &&
          // @ts-ignore
          rowRect.y + rowRect.height <
            // @ts-ignore
            this.boundary.y + this.boundary.height + ERROR_LIMIT
        ) {
          sum += 1;
        }
        return sum;
      }, 0);

      // compute merged cell colspan, equal to length of selected cols
      // @ts-ignore
      const colspan = this.columnToolCells.reduce((sum, cell) => {
        let cellRect = getRelativeRect(
          cell.getBoundingClientRect(),
          // @ts-ignore
          this.quill.root.parentNode,
        );
        if (
          // @ts-ignore
          cellRect.x > this.boundary.x - ERROR_LIMIT &&
          // @ts-ignore
          cellRect.x + cellRect.width <
            // @ts-ignore
            this.boundary.x + this.boundary.width + ERROR_LIMIT
        ) {
          sum += 1;
        }
        return sum;
      }, 0);

      const mergedCell = tableContainer.mergeCells(
        // @ts-ignore
        this.boundary,
        // @ts-ignore
        this.selectedTds,
        rowspan,
        colspan,
        // @ts-ignore
        this.quill.root.parentNode,
      );
      // @ts-ignore
      this.quill.update(Quill.sources.USER);
      // @ts-ignore
      this.tableSelection.setSelection(
        mergedCell.domNode.getBoundingClientRect(),
        mergedCell.domNode.getBoundingClientRect(),
      );
    },
  },

  unmergeCells: {
    text: 'Unmerge cells',
    iconSrc: operationIcon6,
    handler() {
      // @ts-ignore
      const tableContainer = Quill.find(this.table);
      // @ts-ignore
      tableContainer.unmergeCells(this.selectedTds, this.quill.root.parentNode);
      // @ts-ignore
      this.quill.update(Quill.sources.USER);
      // @ts-ignore
      this.tableSelection.clearSelection();
    },
  },

  deleteColumn: {
    text: 'Delete selected columns',
    iconSrc: operationIcon7,
    handler() {
      // @ts-ignore
      const tableContainer = Quill.find(this.table);
      let colIndexes = getColToolCellIndexesByBoundary(
        // @ts-ignore
        this.columnToolCells,
        // @ts-ignore
        this.boundary,
        (cellRect: any, boundary: any) => {
          return (
            cellRect.x + ERROR_LIMIT > boundary.x &&
            cellRect.x + cellRect.width - ERROR_LIMIT < boundary.x1
          );
        },
        // @ts-ignore
        this.quill.root.parentNode,
      );

      let isDeleteTable = tableContainer.deleteColumns(
        // @ts-ignore
        this.boundary,
        colIndexes,
        // @ts-ignore
        this.quill.root.parentNode,
      );
      if (!isDeleteTable) {
        // @ts-ignore
        this.tableColumnTool.updateToolCells();
        // @ts-ignore
        this.quill.update(Quill.sources.USER);
        // @ts-ignore
        this.tableSelection.clearSelection();
      }
    },
  },

  deleteRow: {
    text: 'Delete selected rows',
    iconSrc: operationIcon8,
    handler() {
      // @ts-ignore
      const tableContainer = Quill.find(this.table);
      // @ts-ignore
      tableContainer.deleteRow(this.boundary, this.quill.root.parentNode);
      // @ts-ignore
      this.quill.update(Quill.sources.USER);
      // @ts-ignore
      this.tableSelection.clearSelection();
    },
  },

  deleteTable: {
    text: 'Delete table',
    iconSrc: operationIcon9,
    handler() {
      // @ts-ignore
      const betterTableModule = this.quill.getModule('better-table');
      // @ts-ignore
      const tableContainer = Quill.find(this.table);
      betterTableModule.hideTableTools();
      tableContainer.remove();
      // @ts-ignore
      this.quill.update(Quill.sources.USER);
    },
  },
};

export default class TableOperationMenu {
  constructor(params: any, quill: any, options: any) {
    const betterTableModule = quill.getModule('better-table');
    // @ts-ignore
    this.tableSelection = betterTableModule.tableSelection;
    // @ts-ignore
    this.table = params.table;
    // @ts-ignore
    this.quill = quill;
    // @ts-ignore
    this.options = options;
    // @ts-ignore
    this.menuItems = Object.assign({}, MENU_ITEMS_DEFAULT, options.items);
    // @ts-ignore
    this.tableColumnTool = betterTableModule.columnTool;
    // @ts-ignore
    this.boundary = this.tableSelection.boundary;
    // @ts-ignore
    this.selectedTds = this.tableSelection.selectedTds;
    // @ts-ignore
    this.destroyHandler = this.destroy.bind(this);
    // @ts-ignore
    this.columnToolCells = this.tableColumnTool.colToolCells();
    // @ts-ignore
    this.colorSubTitle =
      options.color && options.color.text
        ? options.color.text
        : DEFAULT_COLOR_SUBTITLE;
    // @ts-ignore
    this.cellColors =
      options.color && options.color.colors
        ? options.color.colors
        : DEFAULT_CELL_COLORS;

    this.menuInitial(params);
    this.mount();
    // @ts-ignore
    document.addEventListener('click', this.destroyHandler, false);
  }

  mount() {
    // @ts-ignore
    document.body.appendChild(this.domNode);
  }

  destroy() {
    // @ts-ignore
    this.domNode.remove();
    // @ts-ignore
    document.removeEventListener('click', this.destroyHandler, false);
    return null;
  }
  // @ts-ignore
  menuInitial({ table, left, top }) {
    // @ts-ignore
    this.domNode = document.createElement('div');
    // @ts-ignore
    this.domNode.classList.add('qlbt-operation-menu');
    // @ts-ignore
    css(this.domNode, {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      'min-height': `${MENU_MIN_HEIHGT}px`,
      width: `${MENU_WIDTH}px`,
    });
    // @ts-ignore
    for (let name in this.menuItems) {
      // @ts-ignore
      if (this.menuItems[name]) {
        // @ts-ignore
        this.domNode.appendChild(
          this.menuItemCreator(
            // @ts-ignore
            Object.assign({}, MENU_ITEMS_DEFAULT[name], this.menuItems[name]),
          ),
        );

        if (['insertRowDown', 'unmergeCells'].indexOf(name) > -1) {
          // @ts-ignore
          this.domNode.appendChild(dividingCreator());
        }
      }
    }

    // if colors option is false, disabled bg color
    // @ts-ignore
    if (this.options.color && this.options.color !== false) {
      // @ts-ignore
      this.domNode.appendChild(dividingCreator());
      // @ts-ignore
      this.domNode.appendChild(subTitleCreator(this.colorSubTitle));
      // @ts-ignore
      this.domNode.appendChild(this.colorsItemCreator(this.cellColors));
    }

    // create dividing line
    function dividingCreator() {
      const dividing = document.createElement('div');
      dividing.classList.add('qlbt-operation-menu-dividing');
      return dividing;
    }

    // create subtitle for menu
    function subTitleCreator(title: string) {
      const subTitle = document.createElement('div');
      subTitle.classList.add('qlbt-operation-menu-subtitle');
      subTitle.innerText = title;
      return subTitle;
    }
  }

  colorsItemCreator(colors: any) {
    const self = this;
    const node = document.createElement('div');
    node.classList.add('qlbt-operation-color-picker');
    // @ts-ignore
    colors.forEach((color) => {
      let colorBox = colorBoxCreator(color);
      node.appendChild(colorBox);
    });

    function colorBoxCreator(color: any) {
      const box = document.createElement('div');
      box.classList.add('qlbt-operation-color-picker-item');
      box.setAttribute('data-color', color);
      box.style.backgroundColor = color;

      box.addEventListener(
        'click',
        function () {
          // @ts-ignore
          const selectedTds = self.tableSelection.selectedTds;
          if (selectedTds && selectedTds.length > 0) {
            // @ts-ignore
            selectedTds.forEach((tableCell) => {
              tableCell.format('cell-bg', color);
            });
          }
        },
        false,
      );

      return box;
    }

    return node;
  }
  // @ts-ignore
  menuItemCreator({ text, iconSrc, handler }) {
    const node = document.createElement('div');
    node.classList.add('qlbt-operation-menu-item');

    const iconSpan = document.createElement('span');
    iconSpan.classList.add('qlbt-operation-menu-icon');
    iconSpan.innerHTML = `<img src=${iconSrc} />`;

    const textSpan = document.createElement('span');
    textSpan.classList.add('qlbt-operation-menu-text');
    textSpan.innerText = text;

    node.appendChild(iconSpan);
    node.appendChild(textSpan);
    node.addEventListener('click', handler.bind(this), false);
    return node;
  }
}
function getColToolCellIndexByBoundary(
  // @ts-ignore
  cells,
  // @ts-ignore
  boundary,
  // @ts-ignore
  conditionFn,
  // @ts-ignore
  container,
) {
  // @ts-ignore
  return cells.reduce((findIndex, cell) => {
    let cellRect = getRelativeRect(cell.getBoundingClientRect(), container);
    if (conditionFn(cellRect, boundary)) {
      findIndex = cells.indexOf(cell);
    }
    return findIndex;
  }, false);
}

function getColToolCellIndexesByBoundary(
  // @ts-ignore
  cells,
  // @ts-ignore
  boundary,
  // @ts-ignore
  conditionFn,
  // @ts-ignore
  container,
) {
  // @ts-ignore
  return cells.reduce((findIndexes, cell) => {
    let cellRect = getRelativeRect(cell.getBoundingClientRect(), container);
    if (conditionFn(cellRect, boundary)) {
      findIndexes.push(cells.indexOf(cell));
    }
    return findIndexes;
  }, []);
}
