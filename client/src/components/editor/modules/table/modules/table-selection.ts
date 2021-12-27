import Quill from 'quill';
import { css, getRelativeRect } from '../utils';
import { TableCell } from '../formats/table';

const PRIMARY_COLOR = '#0589f3';
const LINE_POSITIONS = ['left', 'right', 'top', 'bottom'];
const ERROR_LIMIT = 2;

export default class TableSelection {
  // @ts-ignore
  constructor(table, quill, options) {
    // @ts-ignore
    if (!table) return null;
    // @ts-ignore
    this.table = table;
    // @ts-ignore
    this.quill = quill;
    // @ts-ignore
    this.options = options;
    // @ts-ignore
    this.boundary = {}; // params for selected square
    // @ts-ignore
    this.selectedTds = []; // array for selected table-cells
    // @ts-ignore
    this.dragging = false;
    // @ts-ignore
    this.selectingHandler = this.mouseDownHandler.bind(this);
    // @ts-ignore
    this.clearSelectionHandler = this.clearSelection.bind(this);

    this.helpLinesInitial();
    // @ts-ignore
    this.quill.root.addEventListener(
      'mousedown',
      // @ts-ignore
      this.selectingHandler,
      false,
    );
    // @ts-ignore
    this.quill.on('text-change', this.clearSelectionHandler);
  }

  helpLinesInitial() {
    // @ts-ignore
    let parent = this.quill.root.parentNode;
    LINE_POSITIONS.forEach((direction) => {
      // @ts-ignore
      this[direction] = document.createElement('div');
      // @ts-ignore
      this[direction].classList.add('qlbt-selection-line');
      // @ts-ignore
      this[direction].classList.add('qlbt-selection-line-' + direction);
      // @ts-ignore
      css(this[direction], {
        position: 'absolute',
        display: 'none',
        'background-color': PRIMARY_COLOR,
      });
      // @ts-ignore
      parent.appendChild(this[direction]);
    });
  }

  mouseDownHandler(e: any) {
    if (e.button !== 0 || !e.target.closest('.quill-better-table')) return;
    // @ts-ignore
    this.quill.root.addEventListener('mousemove', mouseMoveHandler, false);
    // @ts-ignore
    this.quill.root.addEventListener('mouseup', mouseUpHandler, false);

    const self = this;
    const startTd = e.target.closest('td[data-row]');
    const startTdRect = getRelativeRect(
      startTd.getBoundingClientRect(),
      // @ts-ignore
      this.quill.root.parentNode,
    );
    // @ts-ignore
    this.dragging = true;
    // @ts-ignore
    this.boundary = computeBoundaryFromRects(startTdRect, startTdRect);
    this.correctBoundary();
    // @ts-ignore
    this.selectedTds = this.computeSelectedTds();
    this.repositionHelpLines();

    function mouseMoveHandler(e: any) {
      if (e.button !== 0 || !e.target.closest('.quill-better-table')) return;
      const endTd = e.target.closest('td[data-row]');
      const endTdRect = getRelativeRect(
        endTd.getBoundingClientRect(),
        // @ts-ignore
        self.quill.root.parentNode,
      );
      // @ts-ignore
      self.boundary = computeBoundaryFromRects(startTdRect, endTdRect);
      self.correctBoundary();
      // @ts-ignore
      self.selectedTds = self.computeSelectedTds();
      self.repositionHelpLines();

      // avoid select text in multiple table-cell
      if (startTd !== endTd) {
        // @ts-ignore
        self.quill.blur();
      }
    }

    function mouseUpHandler(e: any) {
      // @ts-ignore
      self.quill.root.removeEventListener('mousemove', mouseMoveHandler, false);
      // @ts-ignore
      self.quill.root.removeEventListener('mouseup', mouseUpHandler, false);
      // @ts-ignore
      self.dragging = false;
    }
  }

  correctBoundary() {
    // @ts-ignore
    const tableContainer = Quill.find(this.table);
    const tableCells = tableContainer.descendants(TableCell);
    // @ts-ignore
    tableCells.forEach((tableCell) => {
      // @ts-ignore
      let { x, y, width, height } = getRelativeRect(
        tableCell.domNode.getBoundingClientRect(),
        // @ts-ignore
        this.quill.root.parentNode,
      );
      let isCellIntersected =
        // @ts-ignore
        ((x + ERROR_LIMIT >= this.boundary.x &&
          // @ts-ignore
          x + ERROR_LIMIT <= this.boundary.x1) ||
          // @ts-ignore
          (x - ERROR_LIMIT + width >= this.boundary.x &&
            // @ts-ignore
            x - ERROR_LIMIT + width <= this.boundary.x1)) &&
        // @ts-ignore
        ((y + ERROR_LIMIT >= this.boundary.y &&
          // @ts-ignore
          y + ERROR_LIMIT <= this.boundary.y1) ||
          // @ts-ignore
          (y - ERROR_LIMIT + height >= this.boundary.y &&
            // @ts-ignore
            y - ERROR_LIMIT + height <= this.boundary.y1));

      if (isCellIntersected) {
        // @ts-ignore
        this.boundary = computeBoundaryFromRects(this.boundary, {
          x,
          y,
          width,
          height,
        });
      }
    });
  }

  computeSelectedTds() {
    // @ts-ignore
    const tableContainer = Quill.find(this.table);
    const tableCells = tableContainer.descendants(TableCell);
    // @ts-ignore
    return tableCells.reduce((selectedCells, tableCell) => {
      // @ts-ignore
      let { x, y, width, height } = getRelativeRect(
        tableCell.domNode.getBoundingClientRect(),
        // @ts-ignore
        this.quill.root.parentNode,
      );
      let isCellIncluded =
        // @ts-ignore
        x + ERROR_LIMIT >= this.boundary.x &&
        // @ts-ignore
        x - ERROR_LIMIT + width <= this.boundary.x1 &&
        // @ts-ignore
        y + ERROR_LIMIT >= this.boundary.y &&
        // @ts-ignore
        y - ERROR_LIMIT + height <= this.boundary.y1;

      if (isCellIncluded) {
        selectedCells.push(tableCell);
      }

      return selectedCells;
    }, []);
  }

  repositionHelpLines() {
    // @ts-ignore
    const tableViewScrollLeft = this.table.parentNode.scrollLeft;
    // @ts-ignore
    css(this.left, {
      display: 'block',
      // @ts-ignore
      left: `${this.boundary.x - tableViewScrollLeft - 1}px`,
      // @ts-ignore
      top: `${this.boundary.y}px`,
      // @ts-ignore
      height: `${this.boundary.height + 1}px`,
      width: '1px',
    });
    // @ts-ignore
    css(this.right, {
      display: 'block',
      // @ts-ignore
      left: `${this.boundary.x1 - tableViewScrollLeft}px`,
      // @ts-ignore
      top: `${this.boundary.y}px`,
      // @ts-ignore
      height: `${this.boundary.height + 1}px`,
      width: '1px',
    });
    // @ts-ignore
    css(this.top, {
      display: 'block',
      // @ts-ignore
      left: `${this.boundary.x - 1 - tableViewScrollLeft}px`,
      // @ts-ignore
      top: `${this.boundary.y}px`,
      // @ts-ignore
      width: `${this.boundary.width + 1}px`,
      height: '1px',
    });
    // @ts-ignore
    css(this.bottom, {
      display: 'block',
      // @ts-ignore
      left: `${this.boundary.x - 1 - tableViewScrollLeft}px`,
      // @ts-ignore
      top: `${this.boundary.y1 + 1}px`,
      // @ts-ignore
      width: `${this.boundary.width + 1}px`,
      height: '1px',
    });
  }

  // based on selectedTds compute positions of help lines
  // It is useful when selectedTds are not changed
  refreshHelpLinesPosition() {
    const startRect = getRelativeRect(
      // @ts-ignore
      this.selectedTds[0].domNode.getBoundingClientRect(),
      // @ts-ignore
      this.quill.root.parentNode,
    );
    const endRect = getRelativeRect(
      // @ts-ignore
      this.selectedTds[
        // @ts-ignore
        this.selectedTds.length - 1
      ].domNode.getBoundingClientRect(),
      // @ts-ignore
      this.quill.root.parentNode,
    );
    // @ts-ignore
    this.boundary = computeBoundaryFromRects(startRect, endRect);
    this.repositionHelpLines();
  }

  destroy() {
    LINE_POSITIONS.forEach((direction) => {
      // @ts-ignore
      this[direction].remove();
      // @ts-ignore
      this[direction] = null;
    });
    // @ts-ignore
    this.quill.root.removeEventListener(
      'mousedown',
      // @ts-ignore
      this.selectingHandler,
      false,
    );
    // @ts-ignore
    this.quill.off('text-change', this.clearSelectionHandler);

    return null;
  }

  setSelection(startRect: any, endRect: any) {
    // @ts-ignore
    this.boundary = computeBoundaryFromRects(
      // @ts-ignore
      getRelativeRect(startRect, this.quill.root.parentNode),
      // @ts-ignore
      getRelativeRect(endRect, this.quill.root.parentNode),
    );
    this.correctBoundary();
    // @ts-ignore
    this.selectedTds = this.computeSelectedTds();
    this.repositionHelpLines();
  }

  clearSelection() {
    // @ts-ignore
    this.boundary = {};
    // @ts-ignore
    this.selectedTds = [];
    LINE_POSITIONS.forEach((direction) => {
      // @ts-ignore
      this[direction] &&
        // @ts-ignore
        css(this[direction], {
          display: 'none',
        });
    });
  }
}

function computeBoundaryFromRects(startRect: any, endRect: any) {
  let x = Math.min(
    startRect.x,
    endRect.x,
    startRect.x + startRect.width - 1,
    endRect.x + endRect.width - 1,
  );

  let x1 = Math.max(
    startRect.x,
    endRect.x,
    startRect.x + startRect.width - 1,
    endRect.x + endRect.width - 1,
  );

  let y = Math.min(
    startRect.y,
    endRect.y,
    startRect.y + startRect.height - 1,
    endRect.y + endRect.height - 1,
  );

  let y1 = Math.max(
    startRect.y,
    endRect.y,
    startRect.y + startRect.height - 1,
    endRect.y + endRect.height - 1,
  );

  let width = x1 - x;
  let height = y1 - y;

  return { x, x1, y, y1, width, height };
}
