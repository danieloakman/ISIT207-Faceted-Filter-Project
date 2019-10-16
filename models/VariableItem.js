'use strict';

class VariableItem {
  constructor (keyTypes, fileLine) {
    const getNextPartOfLine = () => {
      if (!fileLine.length) return null;
      let cutIndex = fileLine.indexOf(',');
      if (cutIndex === -1) cutIndex = fileLine.length;
      const result = fileLine.substring(0, cutIndex);
      fileLine = fileLine.substring(cutIndex + 1);
      return result;
    };
    for (const {key, type} of keyTypes) {
      let value = getNextPartOfLine();
      if (!value) {
        this[key] = null;
        return;
      }
      switch (type) {
        case 'String':
          this[key] = value;
          break;
        case 'Description':
          while (!/^".+"$/.test(value)) {
            const str = getNextPartOfLine();
            if (!str) {
              this[key] = null;
              return;
            }
            value += ',' + str;
          }
          this[key] = value.substring(1, value.length - 1);
          break;
        case 'Number':
          this[key] = parseFloat(value);
          break;
      }
    }
  }
}
