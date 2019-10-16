'use strict';

/**
 * Reads the file at filePath, then returns the content of the file as a string.
 * @param {String} filePath
 */
async function readFile (filePath) {
  if (!filePath)
  throw new Error('filePath is empty.');
  
  const request = new Request(filePath);
  return fetch(request)
    .then(file => {
      if (file.status === 200)
        return file.text();
      else
        throw new Error(`${file.status} - ${file.statusText}`);
    });
}

/**
 * Store an object in session storage. Automatically
 * stringifies the object before hand.
 * @param {String} key
 * @param {Object} object
 */
function sessionSet (key, object) {
  sessionStorage.setItem(key, JSON.stringify(object));
}

/**
 * Retrieve an object from session storage. Automatically
 * parses the object before hand.
 * @param {String} key
 */
function sessionGet (key) {
  return JSON.parse(sessionStorage.getItem(key));
}

/**
 * Store an object in local storage. Automatically
 * stringifies the object before hand.
 * @param {String} key
 * @param {Object} object
 */
function localSet (key, object) {
  localStorage.setItem(key, JSON.stringify(object));
}

/**
 * Retrieve an object from session storage. Automatically
 * parses the object before hand.
 * @param {String} key
 */
function localGet (key) {
  return JSON.parse(localStorage.getItem(key));
}

/**
 * Returns an object containing counts of each property in the array of items.
 * @param {VariableItem[]} items
 */
function groupBy (items) {
  if (!items) return null;
  let counts = {}; // will be a 2D map
  for (const item of items) {
    for (const key in item) {
      // init 1st layer key:
      if (!counts[key])
        counts[key] = {};

      // init count 2nd layer key:
      const value = item[key];
      if (!counts[key][value])
        counts[key][value] = 1;
      else
        counts[key][value]++;
    }
  }

  return counts;
}

/**
 * Loads the "mainView" div with a table that contains the items.
 * @param {VariableItem[]} items OPTIONAL. Pass in the items to display in the table.
 * If left undefined, defaults to using the full stored items array.
 */
function loadTable (items = sessionGet(env.STORAGE_ITEMS_KEY)) {
  const mainView = document.getElementById('mainView');
  const table = document.createElement('table');
  const keyTypes = sessionGet(env.STORAGE_KEY_TYPES_KEY);

  // Insert column headers:
  {
    const row = table.insertRow();
    row.id = 'tableHeaderRow';
    for (const {key} of keyTypes) {
      const cell = row.insertCell();
      cell.innerHTML = `<b>${key}:</b>`;
      cell.id = 'tableHeaderCell';
    }
  }

  // Insert row values:
  for (const item of items) {
    const row = table.insertRow();
    for (const key in item) {
      const cell = row.insertCell();
      cell.innerHTML = item[key];
      cell.id = 'tCell';
    }
  }

  mainView.innerHTML = '';
  mainView.appendChild(table);
}

/**
 * Loads the "sidebar" div with fieldsets that correspond to what is stored in keyTypes.
 * The fieldsets themselves appear in the order of which they appear in the keyTypes array.
 * @param {*} filteredItems OPTIONAL. Pass in a filtered array of items that is
 * displayed in the table. Is used for determining what to display in each fieldset
 * and the counts in a String keyType. If left undefined will use a the entire
 * items array in storage.
 */
function loadSidebar (filteredItems = null) {
  const keyTypes = sessionGet(env.STORAGE_KEY_TYPES_KEY);
  const items = sessionGet(env.STORAGE_ITEMS_KEY);
  const mappedItems = groupBy(items)
  const filteredMappedItems = groupBy(filteredItems);
  const sidebar = document.getElementById('sidebar');

  // Remove all fieldsets from sidebar:
  for (let i = 0; i < sidebar.children.length; i++) {
    const child = sidebar.children[i];
    if (child.tagName === 'FIELDSET') {
      sidebar.removeChild(child);
      i--;
    }
  }

  for (const {key, type} of keyTypes) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.innerHTML = key;
    fieldset.appendChild(legend);
    fieldset.id = `${key}-${type}`;
    
    switch (type) {
      case 'String':
        // Is just for displaying these checkboxes in a sorted order:
        const sortedMappedItemsByKey = Object.keys(mappedItems[key]).sort((aKey, bKey) => {
          // Sort by count descending, then alphabetically if count is equal:
          let aCount = mappedItems[key][aKey];
          let bCount = mappedItems[key][bKey];
          if (filteredMappedItems) {
            aCount = filteredMappedItems[key] && filteredMappedItems[key][aKey]
              ? filteredMappedItems[key][aKey]
              : 0;
            bCount = filteredMappedItems[key] && filteredMappedItems[key][bKey]
              ? filteredMappedItems[key][bKey]
              : 0;
          }
          const countDifference = bCount - aCount;
          if (countDifference === 0) return aKey > bKey;
          else return countDifference;
        });

        // Create checkboxes:
        for (const mappedKey of sortedMappedItemsByKey) {
          let count = mappedItems[key][mappedKey];
          if (filteredMappedItems)
            count = filteredMappedItems[key] && filteredMappedItems[key][mappedKey]
              ? filteredMappedItems[key][mappedKey]
              : 0;
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          const label = document.createElement('label');
          label.for = checkbox.id = `${mappedKey}Checkbox`;
          label.id = `${mappedKey}Label`;
          label.innerHTML = `${mappedKey} - <b>(${count})</b>`;
          fieldset.appendChild(checkbox);
          fieldset.appendChild(label);
          fieldset.appendChild(document.createElement('br'));
        }
        break;
      case 'Description':
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.id = `${key}TextInput`;
        textInput.className = 'textInput';
        textInput.placeholder = 'Enter key word(s)';
        fieldset.appendChild(textInput);
        break;
      case 'Number' :
        const upperBound = document.createElement('input');
        const lowerBound = document.createElement('input');
        lowerBound.type = upperBound.type = 'text';
        lowerBound.className = upperBound.className = 'textInput';
        upperBound.id = `${key}UpperBound`;
        lowerBound.id = `${key}LowerBound`;
        upperBound.placeholder = 'Upper bound';
        lowerBound.placeholder = 'Lower bound';
        fieldset.appendChild(upperBound);
        fieldset.appendChild(document.createElement('br'));
        fieldset.appendChild(lowerBound);
        break;
    }

    sidebar.appendChild(fieldset);
  }
}

/**
 * Filter the table in the "mainView" div, update the sidebar with new filtered fieldset values,
 * store new filter or bump previously new filter to first index.
 */
async function filterTable () {
  const keyTypes = sessionGet(env.STORAGE_KEY_TYPES_KEY);

  // Create filters:
  const filters = [];
  for (const {key, type} of keyTypes) {
    let filter = {key, type};
    const fieldset = document.getElementById(`${key}-${type}`);
    switch (type) {
      case 'String':
        filter.checked = [];
        for (const checkbox of fieldset.children) {
          if (checkbox.type === 'checkbox' && checkbox.checked) {
            filter.checked.push(checkbox.id.replace(/checkbox/i, ''));
            filters.push(filter);
          }
        }
        break;
      case 'Description':
        const keyWords = document.getElementById(`${key}TextInput`).value
          .trim()
          .replace(/,| {2,}/g, ' ') // replace any , or series of more than two spaces, with a single space
          .split(' ')
          .filter(v => v);
        if (keyWords.length) {
          filter.keyWords = keyWords;
          filters.push(filter);
        }
        break;
      case 'Number':
        let wasInvalidNumber = false;
        ['upperBound', 'lowerBound'].forEach(bound => {
          const textInput = document.getElementById(`${key}${bound.charAt(0).toUpperCase() + bound.substring(1)}`);
          const str = textInput.value.trim();
          const num = parseFloat(str);
          if (!isNaN(num)) {
            filter[bound] = num;
            filters.push(filter);
          } else if (str !== '') {
            wasInvalidNumber = true;
            const oldPlaceholder = textInput.placeholder;
            const oldClass = textInput.className;
            const oldStyle = textInput.style;
            textInput.placeholder = `Invalid number`;
            textInput.className += ' errorShaking';
            textInput.value = '';
            // Remove invalid textInput alert after it's clicked on:
            textInput.onclick = () => {
              textInput.placeholder = oldPlaceholder;
              textInput.className = oldClass;
              textInput.style = oldStyle;
              textInput.onclick = null;
            };
          }
        });
        // Stop and display error if an invalid input was used in a Number bound field.
        if (wasInvalidNumber)
          return;
        break;
    }
  }

  // Stop if no filters were used.
  if (!filters.length)
    return;
  
  const filterIndex = getFilterIndexAndLength().index;
  // Store filters in localStorage if the selected filter index is unselected ('-' is unselected):
  if (filterIndex === '-') {
    const storedFilters = localGet(env.STORAGE_FILTERS_KEY);
    if (!storedFilters || !storedFilters.length) {
      localSet(env.STORAGE_FILTERS_KEY, [filters]);
    } else {
      storedFilters.unshift(filters);
      while (storedFilters.length > env.MAX_STORED_FILTERS)
      storedFilters.pop();
      localSet(env.STORAGE_FILTERS_KEY, storedFilters);
    }
  } else { // A previous filter was selected:
    // Bump this previous filter to the first index
    const storedFilters = localGet(env.STORAGE_FILTERS_KEY);
    storedFilters.splice(filterIndex - 1, 1);
    storedFilters.unshift(filters);
    localSet(env.STORAGE_FILTERS_KEY, storedFilters);
  }
  
  // Create filteredItems:
  const filteredItems = sessionGet(env.STORAGE_ITEMS_KEY)
    .filter(item => {
      for (const filter of filters) {
        const itemValue = item[filter.key];
        switch (filter.type) {
          case 'String':
            if (!filter.checked.includes(itemValue)) {
              return false;
            }
            break;
          case 'Description':
            for (const keyWord of filter.keyWords) {
              if (!itemValue.toLowerCase().includes(keyWord.toLowerCase()))
                return false;
            }
            break;
          case 'Number':
            if (itemValue < filter.lowerBound || itemValue > filter.upperBound)
              return false;
            break;
        }
      }
      return true;
    });

  loadTable(filteredItems);
  loadSidebar(filteredItems);
  updateFilterStorageText(1);
  updateFilterValues(1);
}

/**
 * Resets table, sidebar and filter storage text to display their default statuses/values.
 */
function resetFilters () {
  loadTable();
  loadSidebar();
  updateFilterStorageText();
}

/**
 * Updates sidebar's filter values, as in checks checkboxes, fills in text inputs, etc,
 * with what the filter has, that is stored at filterIndex.
 * @param {Number} filterIndex
 */
function updateFilterValues (filterIndex) {
  if (!filterIndex)
    return;

  // Reset all input tags:
  for (const input of document.body.getElementsByTagName('input')) {
    if (input.type === 'text')
      input.value = '';
    else if (input.type === 'checkbox')
      input.checked = false;
  }

  const filters = localGet(env.STORAGE_FILTERS_KEY)[filterIndex - 1];
  for (const filter of filters) {
    switch (filter.type) {
      case 'String':
        filter.checked
          .forEach(key => {
            const checkbox = document.getElementById(`${key}Checkbox`)
            checkbox.checked = true;
            checkbox.className += ' pulse';
            setTimeout(() => {
              checkbox.className = checkbox.className.replace(/ *pulse/i, '');
            }, 1300);
          });
        break;
      case 'Description':
        const textInput = document.getElementById(`${filter.key}TextInput`)
        textInput.value = filter.keyWords.join(' ');
        textInput.className += ' pulse';
        setTimeout(() => {
          textInput.className = textInput.className.replace(/ *pulse/i, '');
        }, 1300);
        break;
      case 'Number':
        ['lowerBound', 'upperBound'].forEach(boundKey => {
          if (filter[boundKey]) {
            const bound = document
              .getElementById(`${filter.key}${boundKey.charAt(0).toUpperCase() + boundKey.substring(1)}`);
            bound.value = filter[boundKey];
            bound.className += ' pulse';
            setTimeout(() => {
              bound.className = bound.className.replace(/ *pulse/i, '');
            }, 1300);
          }
        });
        break;
    }
  }
}

/**
 * Retrieves the current index and length that is displayed at the top left corner of the screen.
 * Example: Load a previous filter: -/3. === { Index: "-", length: 3 }
 */
function getFilterIndexAndLength () {
  const filterStorageText = document.getElementById('filterStorageText');
  const str = filterStorageText.innerHTML;
  return {
    index: str.substring(0, str.indexOf('/')),
    length: parseFloat(str.substring(str.indexOf('/') + 1))
  };
}

/**
 * Creates an onclick function for each fieldset.
 * This function sets the filter storage index to unselected,
 * so any new edits can be saved as a new filter.
 * Once clicked on, it removes the created function, so it
 * only does this once.
 */
function listenForFilterEditing () {
  const fieldsets = document.body.getElementsByTagName('fieldset');
  for (const fieldset of fieldsets) {
    fieldset.onclick = () => {
      updateFilterStorageText();
      fieldset.onclick = null;
    }
  }
}

/**
 * Updates the text that is displayed at the top left corner of the screen.
 * @param {String|Number} filterIndex OPTIONAL. Set the index to this,
 * defaults to none selected, i.e. "-".
 */
function updateFilterStorageText (filterIndex = '-') {
  const filterStorageText = document.getElementById('filterStorageText');
  const storedFilters = localGet(env.STORAGE_FILTERS_KEY);
  filterStorageText.innerHTML = `${filterIndex}/${storedFilters ? storedFilters.length : 0}`;
}

/**
 * Increments the filter storage index by 1.
 * "-" goes to 1, and if at length then it wraps round back to 1.
 */
function nextStoredFilter () {
  let {index, length} = getFilterIndexAndLength();
  if (index === '-' && length === 0)
    return;

  if (index === '-' || index >= length)
    index = 1;
  else
    index++;

  updateFilterStorageText(index);
  updateFilterValues(index);
  listenForFilterEditing();
}

/**
 * Decrements the filter storage index by 1.
 * "-" wraps round to the length of stored filters array.
 */
function previousStoredFilter () {
  let {index, length} = getFilterIndexAndLength();
  if (index === '-' && length === 0)
    return

  if (index === '-' || index <= 1)
    index = length;
  else
    index--;

  updateFilterStorageText(index);
  updateFilterValues(index);
  listenForFilterEditing();
}
