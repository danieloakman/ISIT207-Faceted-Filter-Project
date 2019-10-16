'use strict';

(async () => {
  if (env.CLEAR_ALL_STORAGE_ON_LOAD) {
    localStorage.clear();
    sessionStorage.clear();
  }

  // Read csv server file, create keyTypes & items:
  {
    const fileStr = await readFile(env.SERVER_CSV_FILE_PATH);
    const fileLines = fileStr
      .replace(/\r/g, '')
      .split('\n')
      .filter(line => line);
    const keys = fileLines.shift().split(',');
    const types = fileLines.shift().split(',');
    const keyTypes = [];
    keys.forEach((key, i) => keyTypes.push({key, type: types[i]}));
    const items = fileLines
      .map(fileLine => new VariableItem(keyTypes, fileLine))
      .filter(item => {
        // Every key in each item must not be null
        const passed = Object.keys(item).every(key => item[key] !== null);
        if (!passed)
          console.error(`Did not insert item: ${JSON.stringify(item)}`);
        return passed;
      });

    // Store keyTypeArr and itemArr in session storage:
    sessionSet(env.STORAGE_KEY_TYPES_KEY, keyTypes);
    sessionSet(env.STORAGE_ITEMS_KEY, items);
  }

  loadTable();
  loadSidebar();
  updateFilterStorageText();
})();
