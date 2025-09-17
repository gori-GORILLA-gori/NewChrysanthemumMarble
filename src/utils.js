

/** Sanitizes HTML to display as plain-text.
 * This prevents some Cross Site Scripting (XSS).
 * This is handy when you are displaying user-made data, and you *must* use innerHTML.
 * @param {string} text - The text to sanitize
 * @returns {string} HTML escaped string
 * @since 0.44.2
 * @example
 * const paragraph = document.createElement('p');
 * paragraph.innerHTML = escapeHTML('<u>Foobar.</u>');
 * // Output:
 * // (Does not include the paragraph element)
 * // (Output is not HTML formatted)
 * <p>
 *   "<u>Foobar.</u>"
 * </p>
 */
export function escapeHTML(text) {
  const div = document.createElement('div'); // Creates a div
  div.textContent = text; // Puts the text in a PLAIN-TEXT property
  return div.innerHTML; // Returns the HTML property of the div
}

/** Converts the server tile-pixel coordinate system to the displayed tile-pixel coordinate system.
 * @param {string[]} tile - The tile to convert (as an array like ["12", "124"])
 * @param {string[]} pixel - The pixel to convert (as an array like ["12", "124"])
 * @returns {number[]} [tile, pixel]
 * @since 0.42.4
 * @example
 * console.log(serverTPtoDisplayTP(['12', '123'], ['34', '567'])); // [34, 3567]
 */
export function serverTPtoDisplayTP(tile, pixel) {
  return [((parseInt(tile[0]) % 4) * 1000) + parseInt(pixel[0]), ((parseInt(tile[1]) % 4) * 1000) + parseInt(pixel[1])];
}

/** Negative-Safe Modulo. You can pass negative numbers into this.
 * @param {number} a - The first number
 * @param {number} b - The second number
 * @returns {number} Result
 * @author osuplace
 * @since 0.55.8
 */
export function negativeSafeModulo(a, b) {
  return (a % b + b) % b;
}

/** Gets the debug logging enabled setting from storage
 * @returns {boolean} Whether debug logging is enabled
 * @since 1.0.0 
 */
export function getDebugLoggingEnabled() {
  try {
    let debugEnabled = null;
    
    // Try TamperMonkey storage first
    if (typeof GM_getValue !== 'undefined') {
      const saved = GM_getValue('bmDebugLoggingEnabled', null);
      if (saved !== null) debugEnabled = JSON.parse(saved);
    }
    
    // Fallback to localStorage
    if (debugEnabled === null) {
      const saved = localStorage.getItem('bmDebugLoggingEnabled');
      if (saved !== null) debugEnabled = JSON.parse(saved);
    }
    
    return debugEnabled !== null ? debugEnabled : false; // Default to disabled
  } catch (error) {
    return false; // Default to disabled on error
  }
}

/** Saves the debug logging enabled setting to storage
 * @param {boolean} enabled - Whether debug logging should be enabled
 * @since 1.0.0
 */
export function saveDebugLoggingEnabled(enabled) {
  try {
    const enabledString = JSON.stringify(enabled);
    
    // Save to TamperMonkey storage
    if (typeof GM_setValue !== 'undefined') {
      GM_setValue('bmDebugLoggingEnabled', enabledString);
    }
    
    // Also save to localStorage as backup
    localStorage.setItem('bmDebugLoggingEnabled', enabledString);
  } catch (error) {
    // Silently fail to avoid console spam
  }
}

/** Conditional debug logging that respects the debug setting
 * @param {...any} args - Arguments to be passed into the `log()` function of the Console
 * @since 1.0.0
 */
export function debugLog(...args) {
  try {
    if (getDebugLoggingEnabled()) {
      console.log(...args);
    }
  } catch (error) {
    // Silently fail if debug logging has issues to prevent breaking the app
  }
}

/** Encodes a number into a custom encoded string.
 * @param {number} number - The number to encode
 * @param {string} encoding - The characters to use when encoding
 * @since 0.65.2
 * @returns {string} Encoded string
 * @example
 * const encode = '012abcABC'; // Base 9
 * console.log(numberToEncoded(0, encode)); // 0
 * console.log(numberToEncoded(5, encode)); // c
 * console.log(numberToEncoded(15, encode)); // 1A
 * console.log(numberToEncoded(12345, encode)); // 1BCaA
 */
export function numberToEncoded(number, encoding) {

  if (number === 0) return encoding[0]; // End quickly if number equals 0. No special calculation needed

  let result = ''; // The encoded string
  const base = encoding.length; // The number of characters used, which determines the base

  // Base conversion algorithm
  while (number > 0) {
    result = encoding[number % base] + result; // Find's the character's encoded value determined by the modulo of the base
    number = Math.floor(number / base); // Divides the number by the base so the next iteration can find the next modulo character
  }

  return result; // The final encoded string
}

/** Converts a Uint8 array to base64 using the browser's built-in binary to ASCII function
 * @param {Uint8Array} uint8 - The Uint8Array to convert
 * @returns {Uint8Array} The base64 encoded Uint8Array
 * @since 0.72.9
 */
export function uint8ToBase64(uint8) {
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary); // Binary to ASCII
}

/** Decodes a base 64 encoded Uint8 array using the browser's built-in ASCII to binary function
 * @param {Uint8Array} base64 - The base 64 encoded Uint8Array to convert
 * @returns {Uint8Array} The decoded Uint8Array
 * @since 0.72.9
 */
export function base64ToUint8(base64) {
  const binary = atob(base64); // ASCII to Binary
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}

/** Converts a 4 element array of coordinates into map longitude and latitude
 * @param {number[]} coordinates A 4 element array of coordinates (Tile X, Tile Y, Pixel X, Pixel Y)
 * @returns {{lng: number, lat: number} | undefined} A lngLat object or undefined if an error occurred e.g. malformed coordinates data
 * @since 1.0.0
 */
export function canvasPosToLatLng(coordinates) {
  // Function provided by courtesy of CloudBurst
  if (coordinates.length !== 4) { return undefined; }
  
  let actualX = (coordinates[0] * 1000) + coordinates[2];
  let actualY = (coordinates[1] * 1000) + coordinates[3];

  const mapSize = 2048000;

  let x = actualX / mapSize;
  let y = actualY / mapSize;

  function inverseO_(n) { return 360 * x - 180; }
  function inverseN_(n) { return (Math.atan(Math.exp(Math.PI - 2 * Math.PI * n)) - Math.PI / 4) * 360 / Math.PI; }

  return {
    lng: inverseO_(x),
    lat: inverseN_(y)
  };
}



/** The color palette used by wplace.live
 * @since 0.78.0
 * @examples
 * import utils from 'src/utils.js';
 * console.log(utils[5]?.name); // "White"
 * console.log(utils[5]?.rgb); // [255, 255, 255]
 */
export const colorpalette = [
  {
    "name": "Transparent",
    // Keep rgb as [0,0,0] for palette index consistency but mark as transparent
    "rgb": [0, 0, 0],
    "free": true
  },
  {
    "name": "Black",
    "rgb": [0, 0, 0],
    "free": true
  },
  {
    "name": "Dark Gray",
    "rgb": [60, 60, 60],
    "free": true
  },
  {
    "name": "Gray",
    "rgb": [120, 120, 120],
    "free": true
  },
  {
    "name": "Light Gray",
    "rgb": [210, 210, 210],
    "free": true
  },
  {
    "name": "White",
    "rgb": [255, 255, 255],
    "free": true
  },
  {
    "name": "Deep Red",
    "rgb": [96, 0, 24],
    "free": true
  },
  {
    "name": "Red",
    "rgb": [237, 28, 36],
    "free": true
  },
  {
    "name": "Orange",
    "rgb": [255, 127, 39],
    "free": true
  },
  {
    "name": "Gold",
    "rgb": [246, 170, 9],
    "free": true
  },
  {
    "name": "Yellow",
    "rgb": [249, 221, 59],
    "free": true
  },
  {
    "name": "Light Yellow",
    "rgb": [255, 250, 188],
    "free": true
  },
  {
    "name": "Dark Green",
    "rgb": [14, 185, 104],
    "free": true
  },
  {
    "name": "Green",
    "rgb": [19, 230, 123],
    "free": true
  },
  {
    "name": "Light Green",
    "rgb": [135, 255, 94],
    "free": true
  },
  {
    "name": "Dark Teal",
    "rgb": [12, 129, 110],
    "free": true
  },
  {
    "name": "Teal",
    "rgb": [16, 174, 166],
    "free": true
  },
  {
    "name": "Light Teal",
    "rgb": [19, 225, 190],
    "free": true
  },
  {
    "name": "Dark Blue",
    "rgb": [40, 80, 158],
    "free": true
  },
  {
    "name": "Blue",
    "rgb": [64, 147, 228],
    "free": true
  },
  {
    "name": "Cyan",
    "rgb": [96, 247, 242],
    "free": true
  },
  {
    "name": "Indigo",
    "rgb": [107, 80, 246],
    "free": true
  },
  {
    "name": "Light Indigo",
    "rgb": [153, 177, 251],
    "free": true
  },
  {
    "name": "Dark Purple",
    "rgb": [120, 12, 153],
    "free": true
  },
  {
    "name": "Purple",
    "rgb": [170, 56, 185],
    "free": true
  },
  {
    "name": "Light Purple",
    "rgb": [224, 159, 249],
    "free": true
  },
  {
    "name": "Dark Pink",
    "rgb": [203, 0, 122],
    "free": true
  },
  {
    "name": "Pink",
    "rgb": [236, 31, 128],
    "free": true
  },
  {
    "name": "Light Pink",
    "rgb": [243, 141, 169],
    "free": true
  },
  {
    "name": "Dark Brown",
    "rgb": [104, 70, 52],
    "free": true
  },
  {
    "name": "Brown",
    "rgb": [149, 104, 42],
    "free": true
  },
  {
    "name": "Beige",
    "rgb": [248, 178, 119],
    "free": true
  },
  {
    "name": "Medium Gray",
    "rgb": [170, 170, 170],
    "free": false
  },
  {
    "name": "Dark Red",
    "rgb": [165, 14, 30],
    "free": false
  },
  {
    "name": "Light Red",
    "rgb": [250, 128, 114],
    "free": false
  },
  {
    "name": "Dark Orange",
    "rgb": [228, 92, 26],
    "free": false
  },
  {
    "name": "Light Tan",
    "rgb": [214, 181, 148],
    "free": false
  },
  {
    "name": "Dark Goldenrod",
    "rgb": [156, 132, 49],
    "free": false
  },
  {
    "name": "Goldenrod",
    "rgb": [197, 173, 49],
    "free": false
  },
  {
    "name": "Light Goldenrod",
    "rgb": [232, 212, 95],
    "free": false
  },
  {
    "name": "Dark Olive",
    "rgb": [74, 107, 58],
    "free": false
  },
  {
    "name": "Olive",
    "rgb": [90, 148, 74],
    "free": false
  },
  {
    "name": "Light Olive",
    "rgb": [132, 197, 115],
    "free": false
  },
  {
    "name": "Dark Cyan",
    "rgb": [15, 121, 159],
    "free": false
  },
  {
    "name": "Light Cyan",
    "rgb": [187, 250, 242],
    "free": false
  },
  {
    "name": "Light Blue",
    "rgb": [125, 199, 255],
    "free": false
  },
  {
    "name": "Dark Indigo",
    "rgb": [77, 49, 184],
    "free": false
  },
  {
    "name": "Dark Slate Blue",
    "rgb": [74, 66, 132],
    "free": false
  },
  {
    "name": "Slate Blue",
    "rgb": [122, 113, 196],
    "free": false
  },
  {
    "name": "Light Slate Blue",
    "rgb": [181, 174, 241],
    "free": false
  },
  {
    "name": "Light Brown",
    "rgb": [219, 164, 99],
    "free": false
  },
  {
    "name": "Dark Beige",
    "rgb": [209, 128, 81],
    "free": false
  },
  {
    "name": "Light Beige",
    "rgb": [255, 197, 165],
    "free": false
  },
  {
    "name": "Dark Peach",
    "rgb": [155, 82, 73],
    "free": false
  },
  {
    "name": "Peach",
    "rgb": [209, 128, 120],
    "free": false
  },
  {
    "name": "Light Peach",
    "rgb": [250, 182, 164],
    "free": false
  },
  {
    "name": "Dark Tan",
    "rgb": [123, 99, 82],
    "free": false
  },
  {
    "name": "Tan",
    "rgb": [156, 132, 107],
    "free": false
  },
  {
    "name": "Dark Slate",
    "rgb": [51, 57, 65],
    "free": false
  },
  {
    "name": "Slate",
    "rgb": [109, 117, 141],
    "free": false
  },
  {
    "name": "Light Slate",
    "rgb": [179, 185, 209],
    "free": false
  },
  {
    "name": "Dark Stone",
    "rgb": [109, 100, 63],
    "free": false
  },
  {
    "name": "Stone",
    "rgb": [148, 140, 107],
    "free": false
  },
  {
    "name": "Light Stone",
    "rgb": [205, 197, 158],
    "free": false
  }
];