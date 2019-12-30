/*
 * This code creates a 2D board of "blocks" that act like pixels.  The blocks
 * will be able to be toggled individually to create pixel-art style effects.
 * The blocks will be nothing more than <div> HTML elements stored in a 2D
 * array that can have their background color changed.
 *
 */

// Config

/*
 * The number of blocks to place horizontally and vertically.
 */
var BLOCKS_HORIZONTALLY = 36;
var BLOCKS_VERTICALLY = 26;

// how many animation frames to play between faces
var ANIMATION_FRAMES = 5;
// how long each frame should last (in milliseconds, 1000 == 1 second)
var ANIMATION_DELAY = 50;

/*
 * chance that a piece will be colorful during the animation. the number should
 * be between 0 and 1 where 0 is no chance of a colored piece, and 1 is a all
 * pieces are colored.
 */
var RANDOM_CHANCE_ACTIVE = 0.1;

// how often to randomly change the face
var FACE_CHANGE_RATE = 15 * 1000;

// End Config

var ALL_BLOCKS = [];
var BOARD;
var NEW_FACE_TIMER;
var CURRENTLY_ANIMATING = false;
var EXPORT;
var CURRENT_FACE = 0;

/*
 * Main entry point into this file.  This should be called by the HTML file
 * that sources this script.
 */
function rinaChanBoardMain() {
    BOARD = document.getElementById('board');;
    EXPORT = document.getElementById('export');

    /*
     * Clear everything.  Everything should already be clear - this is just for
     * good measure.
     */
    EXPORT.innerHTML = '';
    BOARD.innerHTML = '';
    ALL_BLOCKS = [];
    stopNewFaceTimer();

    // Calculate width and height of each block in percentage
    var cssWidth = (100 / BLOCKS_HORIZONTALLY) + '%';
    var cssHeight = (100 / BLOCKS_VERTICALLY) + '%';

    for (var i = 0; i < BLOCKS_VERTICALLY; i++) {
        ALL_BLOCKS[i] = [];

        var parent = document.createElement('div');
        // Add it to the "parent" class (used for grid layout)
        parent.classList.add('parent');
        parent.style.height = cssHeight;

        for (var j = 0; j < BLOCKS_HORIZONTALLY; j++) {
            // Create a new empty block
            var block = document.createElement('div');

            // Add it to the "block" class (used for styling)
            block.classList.add('block');

            // Add it to the "child" class (used for grid layout)
            block.classList.add('child');
            block.style.width = cssWidth;

            // Register an "onclick" handler
            block.onclick = onClick;

            // Add the block to the HTML
            parent.appendChild(block);

            // Store a reference to the block object in our 2D array
            ALL_BLOCKS[i][j] = block;
        }

        /*
         * Add the parent (collection of children) to the screen.  Each "child"
         * is a block, and each "parent" represents a single row of children.
         */
        BOARD.appendChild(parent);
    }

    // Generate a new face
    newFace();
}

function loadFace(name) {
    console.log('loading face %s', name);
    var face = FACES[name];

    if (!face) {
        /*
         * This shouldn't even fail, but we put error checking here just in
         * case.
         */
        alert('failed to load face ' + name);
        return;
    }

    /*
     * Ensure the face can fit in our board.
     *
     * The board we create has a given width and a given length, and the face
     * itself has a given width and height.  These values don't need to be
     * exactly the same, but the face needs to fit within the board that we
     * have.
     *
     * We first must ensure the face's height is smaller than (or equal to) our
     * board's height, and the face's width is smaller than (or equal to) our
     * board's width.
     */
    var faceHeight = face.length;
    var faceWidth = face[0].length;

    var boardHeight = BLOCKS_VERTICALLY;
    var boardWidth = BLOCKS_HORIZONTALLY;

    if (faceHeight > boardHeight || faceWidth > boardWidth) {
        alert('face ' + name + ' is too big for the given board');
        return;
    }

    // Clear the entire board
    clearBoard();

    /*
     * Now that we know the face can fit in our board, we must figure out where
     * to fit it.  Because our board may be bigger than the face in either
     * direction, we will try our best to center the face.
     *
     * To do this, we subtract the faceHeight from the boardHeight (guaranteed
     * to be positive, or 0, since the board is equal or greater than the face
     * size).  Then, divide that by 2 (this effectively centers it), and round
     * the answer so it's a clean integer.  Repeat this for the Width and bling
     * bling bling bling disco we're good.
     */
    var startingY = Math.round((boardHeight - faceHeight) / 2);
    var startingX = Math.round((boardWidth - faceWidth) / 2);

    for (var i = 0; i < faceHeight; i++) {
        var row = face[i];
        for (var j = 0; j < faceWidth; j++) {
            var piece = row[j];
            var block = ALL_BLOCKS[startingY + i][startingX + j];

            /*
             * piece -> a character of ' ' or 'x'
             * block -> the HTML div element for the current grid piece
             */

            switch (piece) {
            case ' ': // remove any active class for space pieces
                    /*
                     * Because the board is cleared above, we don't need to
                     * clear any existing pieces as they will have all been
                     * wiped.
                     */
                    // block.classList.remove('active');
                    break;
            case 'x': // add active class for 'x' pieces
                    block.classList.add('active');
                    break;
            default: // anything other than 'x' or ' ' is a mistake
                    console.error('invalid piece in face %s at %d,%d: %s',
                        name, j, i, piece);
                    break;
            }
        }
    }
}

/*
 * Clear the entire board (make every piece white)
 */
function clearBoard() {
    for (var i = 0; i < BLOCKS_VERTICALLY; i++) {
        for (var j = 0; j < BLOCKS_HORIZONTALLY; j++) {
            var block = ALL_BLOCKS[i][j];
            block.classList.remove('active');
        }
    }
}

/*
 * Return a random faces name
 */
function randomFace() {
    var faces = Object.keys(FACES).sort();
    var idx = Math.floor(Math.random() * faces.length);
    return faces[idx];
}

/*
 * Generic onclick handler for ALL blocks
 *
 * This allows the user to click a block to toggle it on or off, making it easy
 * to manually draw pixel art.
 */
function onClick() {
    // don't do anything if an animation is currently happening
    if (CURRENTLY_ANIMATING) {
        return;
    }

    /*
     * When a user clicks a block to toggle it we automatically stop the "new
     * face" timer that shows a new face periodically.  This will get started
     * back up when the "Next" button is clicked or the page is refreshed.
     */
    stopNewFaceTimer();

    // toggle the pixel on or off
    this.classList.toggle('active');

    /*
     * this was used for creating faces.  this exports the current face as JSON
     * data at the bottom of the web page
     */
    EXPORT.textContent = JSON.stringify(exportBoard(), null, 2);
}

/*
 * Animate and display a new random face
 */
function newFace() {
    var name = randomFace();
    _showFaceWithAnimation(name);
}

/*
 * Animate and display a new set face
 */
function nextFace() {
    var faces = Object.keys(FACES).sort();
    var name = faces[CURRENT_FACE];

    /*
     * Increment the CURRENT_FACE, and wrap back to 0 if it's over the set
     * number of faces.
     */
    CURRENT_FACE = (CURRENT_FACE + 1) % faces.length;

    _showFaceWithAnimation(name);
}

/*
 * Used above by newFace and nextFace - show's a face by its name with a nice
 * little animation
 */
function _showFaceWithAnimation(name) {
    // don't do anything if an animation is already happening
    if (CURRENTLY_ANIMATING) {
        return;
    }

    // clear any existing timer
    stopNewFaceTimer();

    // do the animation
    randomAnimation(function () {
        // load the new face
        loadFace(name);

        // restart the timer
        startNewFaceTimer();
    });
}

/*
 * Convenience function to stop any newFace timer if it exists
 */
function stopNewFaceTimer() {
    if (NEW_FACE_TIMER) {
        clearTimeout(NEW_FACE_TIMER);
        NEW_FACE_TIMER = null;
    }
}

/*
 * Convenience function to create a new newFace time if it exists
 */
function startNewFaceTimer() {
    stopNewFaceTimer();
    NEW_FACE_TIMER = setTimeout(newFace, FACE_CHANGE_RATE);
}

/*
 * Generate the animation frames.  This function takes a single argument, a
 * callback function, that will get executed when the animation is finished.
 */
function randomAnimation(cb) {
    if (CURRENTLY_ANIMATING) {
        // this is a bug if this happens
        alert('randomAnimation called while animating!');
        return;
    }

    CURRENTLY_ANIMATING = true;

    doAnimate(0);

    function doAnimate(numDone) {
        for (var i = 0; i < BLOCKS_VERTICALLY; i++) {
            for (var j = 0; j < BLOCKS_HORIZONTALLY; j++) {
                var block = ALL_BLOCKS[i][j];

                var rand = Math.random();

                if (rand < RANDOM_CHANCE_ACTIVE) {
                    block.classList.add('active');
                } else {
                    block.classList.remove('active');
                }
            }
        }

        if (numDone >= ANIMATION_FRAMES) {
            CURRENTLY_ANIMATING = false;
            cb();
            return;
        }

        setTimeout(function() {
            numDone++;
            doAnimate(numDone);
        }, ANIMATION_DELAY);
    }
}

/*
 * Used during development.  This serializes the existing board into the JSON
 * format that faces.js expects.
 */
function exportBoard() {
    var columns = [];
    for (var i = 0; i < BLOCKS_VERTICALLY; i++) {
        var row = [];
        for (var j = 0; j < BLOCKS_HORIZONTALLY; j++) {
            var block = ALL_BLOCKS[i][j];
            var active = block.classList.contains('active');
            row.push(active ? 'x' : ' ');
        }
        columns.push(row.join(''));
    }

    /*
     * Condense the board if possible.  This might be the laziest and worst
     * code I've ever written.
     */

    // trim off top
    while (true) {
        var line = columns[0];

        if (!line) {
            break;
        }

        if (line.indexOf('x') >= 0) {
            break;
        }

        columns = columns.slice(1);
    }

    // trim off bottom
    while (true) {
        var line = columns[columns.length - 1];

        if (!line) {
            break;
        }

        if (line.indexOf('x') >= 0) {
            break;
        }

        columns = columns.slice(0, columns.length - 1);
    }

    // trim off left
    while (true) {
        var line = [];

        for (var i = 0; i < columns.length; i++) {
            var c = columns[i][0];

            if (!c) {
                break;
            }

            line.push(c);
        }

        if (line.length === 0) {
            break;
        }

        line = line.join('');

        if (line.indexOf('x') >= 0) {
            break;
        }

        for (var i = 0; i < columns.length; i++) {
            columns[i] = columns[i].slice(1);
        }
    }

    // trim off left
    while (true) {
        var line = [];

        for (var i = 0; i < columns.length; i++) {
            var c = columns[i][columns[i].length - 1];

            if (!c) {
                break;
            }

            line.push(c);
        }

        if (line.length === 0) {
            break;
        }

        line = line.join('');

        if (line.indexOf('x') >= 0) {
            break;
        }

        for (var i = 0; i < columns.length; i++) {
            columns[i] = columns[i].slice(0, columns[i].length - 1);
        }
    }

    return columns;
}
