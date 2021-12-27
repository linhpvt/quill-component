import Quill from 'quill';
import TableColumnTool from './modules/table-column-tool';
import TableSelection from './modules/table-selection';
import TableOperationMenu from './modules/table-operation-menu';
import './assets/quill-better-table.scss';

// import table node matchers
import {
  matchTableCell,
  matchTableHeader,
  matchTable,
} from './utils/node-matchers';

import { getEventComposedPath } from './utils/index';
import {
  TableCol,
  TableColGroup,
  TableCellLine,
  TableCell,
  TableRow,
  TableBody,
  TableContainer,
  TableViewWrapper,
  rowId,
  cellId,
} from './formats/table';

const Module = Quill.import('core/module');
const Delta = Quill.import('delta');

class BetterTable extends Module {
  static register() {
    Quill.register(TableCol, true);
    Quill.register(TableColGroup, true);
    Quill.register(TableCellLine, true);
    Quill.register(TableCell, true);
    Quill.register(TableRow, true);
    Quill.register(TableBody, true);
    Quill.register(TableContainer, true);
    Quill.register(TableViewWrapper, true);
    Quill.register(TableViewWrapper, true);
    // register customized Header，overwriting quill built-in Header
    // Quill.register('formats/header', Header, true);
  }

  constructor(quill: any, options: any) {
    super(quill, options);

    // handle click on quill-better-table
    this.quill.root.addEventListener(
      'click',
      (evt: Event) => {
        // bugfix: evt.path is undefined in Safari, FF, Micro Edge
        const path = getEventComposedPath(evt);

        if (!path || path.length <= 0) return;

        const tableNode = path.filter((node: any) => {
          return (
            node.tagName &&
            node.tagName.toUpperCase() === 'TABLE' &&
            node.classList.contains('quill-better-table')
          );
        })[0];

        if (tableNode) {
          // current table clicked
          if (this.table === tableNode) return;
          // other table clicked
          if (this.table) this.hideTableTools();
          this.showTableTools(tableNode, quill, options);
        } else if (this.table) {
          // other clicked
          this.hideTableTools();
        }
      },
      false,
    );

    // handle right click on quill-better-table
    this.quill.root.addEventListener(
      'contextmenu',
      (evt: any) => {
        if (!this.table) return true;
        evt.preventDefault();

        // bugfix: evt.path is undefined in Safari, FF, Micro Edge
        const path = getEventComposedPath(evt);
        if (!path || path.length <= 0) return;

        const tableNode = path.filter((node: any) => {
          return (
            node.tagName &&
            node.tagName.toUpperCase() === 'TABLE' &&
            node.classList.contains('quill-better-table')
          );
        })[0];

        const rowNode = path.filter((node: any) => {
          return (
            node.tagName &&
            node.tagName.toUpperCase() === 'TR' &&
            node.getAttribute('data-row')
          );
        })[0];

        const cellNode = path.filter((node: any) => {
          return (
            node.tagName &&
            node.tagName.toUpperCase() === 'TD' &&
            node.getAttribute('data-row')
          );
        })[0];

        let isTargetCellSelected = this.tableSelection.selectedTds
          .map((tableCell: any) => tableCell.domNode)
          .includes(cellNode);

        if (
          this.tableSelection.selectedTds.length <= 0 ||
          !isTargetCellSelected
        ) {
          this.tableSelection.setSelection(
            cellNode.getBoundingClientRect(),
            cellNode.getBoundingClientRect(),
          );
        }

        if (this.tableOperationMenu)
          this.tableOperationMenu = this.tableOperationMenu.destroy();

        if (tableNode) {
          this.tableOperationMenu = new TableOperationMenu(
            {
              table: tableNode,
              row: rowNode,
              cell: cellNode,
              left: evt.pageX,
              top: evt.pageY,
            },
            quill,
            options.operationMenu,
          );
        }
      },
      false,
    );

    // add keyboard binding：Backspace
    // prevent user hits backspace to delete table cell
    const KeyBoard = quill.getModule('keyboard');
    quill.keyboard.addBinding(
      { key: 'Backspace' },
      {},
      function (range: any, context: any) {
        // @ts-ignore
        if (range.index === 0 || this.quill.getLength() <= 1) return true;
        // @ts-ignore
        const [line] = this.quill.getLine(range.index);
        if (context.offset === 0) {
          // @ts-ignore
          const [prev] = this.quill.getLine(range.index - 1);
          if (prev != null) {
            if (
              prev.statics.blotName === 'table-cell-line' &&
              line.statics.blotName !== 'table-cell-line'
            )
              return false;
          }
        }
        return true;
      },
    );
    // since only one matched bindings callback will excute.
    // expected my binding callback excute first
    // I changed the order of binding callbacks
    let thisBinding = quill.keyboard.bindings['Backspace'].pop();
    quill.keyboard.bindings['Backspace'].splice(0, 1, thisBinding);

    // add Matchers to match and render quill-better-table for initialization
    // or pasting
    quill.clipboard.addMatcher('td', matchTableCell);
    quill.clipboard.addMatcher('th', matchTableHeader);
    quill.clipboard.addMatcher('table', matchTable);
    // quill.clipboard.addMatcher('h1, h2, h3, h4, h5, h6', matchHeader)

    // remove matcher for tr tag
    quill.clipboard.matchers = quill.clipboard.matchers.filter(
      (matcher: string[]) => {
        return matcher[0] !== 'tr';
      },
    );
  }

  getTable(range = this.quill.getSelection()) {
    if (range == null) return [null, null, null, -1];
    const [cellLine, offset] = this.quill.getLine(range.index);
    if (
      cellLine == null ||
      cellLine.statics.blotName !== TableCellLine.blotName
    ) {
      return [null, null, null, -1];
    }
    const cell = cellLine.tableCell();
    const row = cell.row();
    const table = row.table();
    return [table, row, cell, offset];
  }

  insertTable(rows: any, columns: any) {
    const range = this.quill.getSelection(true);
    if (range == null) return;
    let currentBlot = this.quill.getLeaf(range.index)[0];
    let delta = new Delta().retain(range.index);

    if (isInTableCell(currentBlot)) {
      console.warn(`Can not insert table into a table cell.`);
      return;
    }

    delta.insert('\n');
    // insert table column
    delta = new Array(columns).fill('\n').reduce((memo, text) => {
      memo.insert(text, { 'table-col': true });
      return memo;
    }, delta);
    // insert table cell line with empty line
    delta = new Array(rows).fill(0).reduce((memo) => {
      let tableRowId = rowId();
      return new Array(columns).fill('\n').reduce((memo, text) => {
        memo.insert(text, {
          'table-cell-line': { row: tableRowId, cell: cellId() },
        });
        return memo;
      }, memo);
    }, delta);

    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(range.index + columns + 1, Quill.sources.API);
  }

  showTableTools(table: any, quill: any, options: any) {
    this.table = table;
    this.columnTool = new TableColumnTool(table, quill, options);
    this.tableSelection = new TableSelection(table, quill, options);
  }

  hideTableTools() {
    this.columnTool && this.columnTool.destroy();
    this.tableSelection && this.tableSelection.destroy();
    this.tableOperationMenu && this.tableOperationMenu.destroy();
    this.columnTool = null;
    this.tableSelection = null;
    this.tableOperationMenu = null;
    this.table = null;
  }
}

BetterTable.keyboardBindings = {
  'table-cell-line backspace': {
    key: 'Backspace',
    format: ['table-cell-line'],
    collapsed: true,
    offset: 0,
    handler(range: any, context: any) {
      // @ts-ignore
      const [line, offset] = this.quill.getLine(range.index);
      if (!line.prev || line.prev.statics.blotName !== 'table-cell-line') {
        return false;
      }
      return true;
    },
  },

  'table-cell-line delete': {
    key: 'Delete',
    format: ['table-cell-line'],
    collapsed: true,
    suffix: /^$/,
    handler() {},
  },

  'table-cell-line enter': {
    key: 'Enter',
    shiftKey: null,
    format: ['table-cell-line'],
    handler(range: any, context: any) {
      // bugfix: a unexpected new line inserted when user compositionend with hitting Enter
      // @ts-ignore
      if (this.quill.selection && this.quill.selection.composing) return;
      // @ts-ignore
      const Scope = Quill.imports.parchment.Scope;
      if (range.length > 0) {
        // @ts-ignore
        this.quill.scroll.deleteAt(range.index, range.length); // So we do not trigger text-change
      }
      const lineFormats = Object.keys(context.format).reduce(
        (formats, format) => {
          if (
            // @ts-ignore
            this.quill.scroll.query(format, Scope.BLOCK) &&
            !Array.isArray(context.format[format])
          ) {
            // @ts-ignore
            formats[format] = context.format[format];
          }
          return formats;
        },
        {},
      );
      // insert new cellLine with lineFormats
      // @ts-ignore
      this.quill.insertText(
        range.index,
        '\n',
        // @ts-ignore
        lineFormats['table-cell-line'],
        Quill.sources.USER,
      );
      // Earlier scroll.deleteAt might have messed up our selection,
      // so insertText's built in selection preservation is not reliable
      // @ts-ignore
      this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
      // @ts-ignore
      this.quill.focus();
      Object.keys(context.format).forEach((name) => {
        // @ts-ignore
        if (lineFormats[name] != null) return;
        if (Array.isArray(context.format[name])) return;
        if (name === 'link') return;
        // @ts-ignore
        this.quill.format(name, context.format[name], Quill.sources.USER);
      });
    },
  },

  'table-cell-line up': makeTableArrowHandler(true),
  'table-cell-line down': makeTableArrowHandler(false),
  'down-to-table': {
    key: 'ArrowDown',
    collapsed: true,
    handler(range: any, context: any) {
      const target = context.line.next;
      if (target && target.statics.blotName === 'table-view') {
        const targetCell = target.table().rows()[0].children.head;
        const targetLine = targetCell.children.head;
        // @ts-ignore
        this.quill.setSelection(
          // @ts-ignore
          targetLine.offset(this.quill.scroll),
          0,
          Quill.sources.USER,
        );

        return false;
      }
      return true;
    },
  },
  'up-to-table': {
    key: 'ArrowUp',
    collapsed: true,
    handler(range: any, context: any) {
      const target = context.line.prev;
      if (target && target.statics.blotName === 'table-view') {
        const rows = target.table().rows();
        const targetCell = rows[rows.length - 1].children.head;
        const targetLine = targetCell.children.head;

        // @ts-ignore
        this.quill.setSelection(
          // @ts-ignore
          targetLine.offset(this.quill.scroll),
          0,
          Quill.sources.USER,
        );

        return false;
      }
      return true;
    },
  },
};

function makeTableArrowHandler(up: any) {
  return {
    key: up ? 'ArrowUp' : 'ArrowDown',
    collapsed: true,
    format: ['table-cell-line'],
    handler(range: any, context: any) {
      // TODO move to table module
      const key = up ? 'prev' : 'next';
      const targetLine = context.line[key];
      if (targetLine != null) return true;

      const cell = context.line.parent;
      const targetRow = cell.parent[key];

      if (targetRow != null && targetRow.statics.blotName === 'table-row') {
        let targetCell = targetRow.children.head;
        let totalColspanOfTargetCell = parseInt(
          targetCell.formats()['colspan'],
          10,
        );
        let cur = cell;
        let totalColspanOfCur = parseInt(cur.formats()['colspan'], 10);

        // get targetCell above current cell depends on colspan
        while (cur.prev != null) {
          cur = cur.prev;
          totalColspanOfCur += parseInt(cur.formats()['colspan'], 10);
        }

        while (
          targetCell.next != null &&
          totalColspanOfTargetCell < totalColspanOfCur
        ) {
          targetCell = targetCell.next;
          totalColspanOfTargetCell += parseInt(
            targetCell.formats()['colspan'],
            10,
          );
        }

        // @ts-ignore
        const index = targetCell.offset(this.quill.scroll);
        // @ts-ignore
        this.quill.setSelection(index, 0, Quill.sources.USER);
      } else {
        const targetLine = cell.table().parent[key];
        if (targetLine != null) {
          if (up) {
            // @ts-ignore
            this.quill.setSelection(
              // @ts-ignore
              targetLine.offset(this.quill.scroll) + targetLine.length() - 1,
              0,
              Quill.sources.USER,
            );
          } else {
            // @ts-ignore
            this.quill.setSelection(
              // @ts-ignore
              targetLine.offset(this.quill.scroll),
              0,
              Quill.sources.USER,
            );
          }
        }
      }
      return false;
    },
  };
}

function isTableCell(blot: any) {
  return blot.statics.blotName === TableCell.blotName;
}
// @ts-ignore
function isInTableCell(current: any) {
  return current && current.parent
    ? isTableCell(current.parent)
      ? true
      : isInTableCell(current.parent)
    : false;
}

export default BetterTable;
