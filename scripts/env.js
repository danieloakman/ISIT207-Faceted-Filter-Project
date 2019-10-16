/**
 * Environment settings.
 */
var env = {
  /**
   * Path to CSV server file.
   */
  SERVER_CSV_FILE_PATH: 'assets/server-file.csv',
  // SERVER_CSV_FILE_PATH: 'assets/server-file-report-version.csv',

  /**
   * Key used for the user's stored filters that they have previously used.
   */
  STORAGE_FILTERS_KEY: 'filters',

  /**
   * Maximum amount of stored filters.
   */
  MAX_STORED_FILTERS: 10,

  /**
   * Key used for the full array of VariableItems:
   */
  STORAGE_ITEMS_KEY: 'items',

  
  /**
   * Key used for the keyTypes array.
   * This is an array containing objects with the properties: key and type.
   * This corresponds to what is in the first two lines of the server csv file.
   * Essentially the entire webpage refers to this in order to know exactly what to do with
   * the variables in a VariableItem.
   * Example: [{ key: "Manufacturer", type: "String" }]
   */
  STORAGE_KEY_TYPES_KEY: 'keyTypes',

  /**
   * Set to true to clear local and session storage on load of webpage.
   */
  CLEAR_ALL_STORAGE_ON_LOAD: false,
};
