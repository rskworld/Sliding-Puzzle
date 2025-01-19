$(document).ready(function() {
    // Configure Toastr
    toastr.options = {
        closeButton: true,
        debug: false,
        newestOnTop: false,
        progressBar: true,
        positionClass: "toast-top-right",
        preventDuplicates: true,
        onclick: null,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "5000",
        extendedTimeOut: "1000",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut"
    };

    class SlidingPuzzle {
        constructor(size = 4) {
            // Logging setup
            this.logger = {
                info: (message) => console.log(`[INFO] ${message}`),
                warn: (message) => console.warn(`[WARN] ${message}`),
                error: (message) => console.error(`[ERROR] ${message}`)
            };

            this.size = size;
            this.board = [];
            this.emptyTile = { x: size - 1, y: size - 1 };
            this.moves = 0;
            this.level = 1;
            
            // Separate flags for music and sound effects
            this.isMusicEnabled = true;
            this.isSoundEffectsEnabled = true;
            this.highScore = this.getHighScore();
            
            // Touch support variables
            this.touchStartX = null;
            this.touchStartY = null;

            // Mobile responsiveness setup
            this.setupMobileResponsiveness();
            
            this.initializeAudio();
            this.initializeBoard();
            this.setupEventListeners();
            this.setupKeyboardControls();
            this.updateHighScoreDisplay();

            // Button click sound
            this.buttonClickSound = document.getElementById('button-click-sound');

            // Log game initialization
            this.logger.info('Sliding Puzzle Game Initialized');
        }

        // Keyboard Controls
        setupKeyboardControls() {
            $(document).on('keydown', (e) => {
                // Prevent default scrolling behavior
                e.preventDefault();

                // Find the empty tile's current position
                const emptyX = this.emptyTile.x;
                const emptyY = this.emptyTile.y;

                switch(e.key) {
                    case 'ArrowUp':
                        // Try to move tile from below the empty tile
                        if (emptyY < this.size - 1) {
                            this.moveTile(emptyX, emptyY + 1);
                        }
                        break;
                    case 'ArrowDown':
                        // Try to move tile from above the empty tile
                        if (emptyY > 0) {
                            this.moveTile(emptyX, emptyY - 1);
                        }
                        break;
                    case 'ArrowLeft':
                        // Try to move tile from right of the empty tile
                        if (emptyX < this.size - 1) {
                            this.moveTile(emptyX + 1, emptyY);
                        }
                        break;
                    case 'ArrowRight':
                        // Try to move tile from left of the empty tile
                        if (emptyX > 0) {
                            this.moveTile(emptyX - 1, emptyY);
                        }
                        break;
                }
            });
        }

        // Mobile responsiveness setup
        setupMobileResponsiveness() {
            // Ensure proper viewport
            if ($('meta[name="viewport"]').length === 0) {
                $('head').append(
                    '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'
                );
            }

            // Disable zooming and scrolling
            $('body').css({
                'touch-action': 'none',
                '-ms-touch-action': 'none',
                'overflow': 'hidden'
            });
        }

        // Enhanced logging methods
        logGameState() {
            this.logger.info(JSON.stringify({
                board: this.board,
                emptyTile: this.emptyTile,
                moves: this.moves,
                level: this.level
            }, null, 2));
        }

        // Enhanced error handling
        handleError(error) {
            this.logger.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: error.message,
                footer: 'Something went wrong!'
            });
        }

        // Enhanced button click sound method
        playButtonClickSound() {
            if (this.isSoundEffectsEnabled && this.buttonClickSound) {
                // Clone the audio to allow rapid repeated clicks
                const sound = this.buttonClickSound.cloneNode(true);
                sound.play();
            }
        }

        // Advanced shuffle using Lodash
        advancedShuffle() {
            try {
                // Create a flat array of tiles
                const flatBoard = _.flatten(this.board).filter(tile => tile !== null);
                
                // Shuffle the tiles using Lodash
                const shuffledTiles = _.shuffle(flatBoard);
                
                // Ensure the puzzle is solvable
                let index = 0;
                for (let y = 0; y < this.size; y++) {
                    for (let x = 0; x < this.size; x++) {
                        if (x === this.emptyTile.x && y === this.emptyTile.y) {
                            this.board[y][x] = null;
                        } else {
                            this.board[y][x] = shuffledTiles[index++];
                        }
                    }
                }

                // Additional check for puzzle solvability
                if (!this.isPuzzleSolvable()) {
                    this.logger.warn('Generated unsolvable puzzle, reshuffling');
                    this.advancedShuffle();
                }

                this.moves = 0;
                $('#moves-counter').text('Moves: 0');
                this.logger.info('Advanced shuffle completed');
            } catch (error) {
                this.handleError(error);
            }
        }

        // Method to check if the puzzle is solvable
        isPuzzleSolvable() {
            // Flatten the board, excluding the empty tile
            const flatBoard = _.flatten(this.board).filter(tile => tile !== null);
            
            // Count inversions
            let inversions = 0;
            for (let i = 0; i < flatBoard.length; i++) {
                for (let j = i + 1; j < flatBoard.length; j++) {
                    if (flatBoard[i] > flatBoard[j]) {
                        inversions++;
                    }
                }
            }

            // For 4x4 grid, puzzle is solvable if:
            // - Number of inversions is even when empty tile is on an even row from the bottom
            // - Number of inversions is odd when empty tile is on an odd row from the bottom
            const emptyRowFromBottom = this.size - Math.floor(this.emptyTile.y);
            
            return emptyRowFromBottom % 2 === 0 
                ? inversions % 2 === 0 
                : inversions % 2 === 1;
        }

        initializeAudio() {
            this.moveSound = document.getElementById('move-sound');
            this.winSound = document.getElementById('win-sound');
            this.backgroundMusic = document.getElementById('background-music');
        }

        initializeBoard() {
            $('#game-board').empty();
            this.board = [];
            let number = 1;
            for (let y = 0; y < this.size; y++) {
                this.board[y] = [];
                for (let x = 0; x < this.size; x++) {
                    if (x === this.emptyTile.x && y === this.emptyTile.y) {
                        this.board[y][x] = null;
                    } else {
                        this.board[y][x] = number++;
                    }
                }
            }
            this.advancedShuffle();
            this.renderBoard();
        }

        renderBoard() {
            const $gameBoard = $('#game-board');
            $gameBoard.empty();
            $gameBoard.css('grid-template-columns', `repeat(${this.size}, 1fr)`);

            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    const $tile = $('<div>')
                        .addClass('puzzle-tile')
                        .data('x', x)
                        .data('y', y);

                    if (this.board[y][x] === null) {
                        $tile.addClass('empty');
                    } else {
                        $tile.text(this.board[y][x]);
                    }

                    // Add click and touch events
                    $tile
                        .on('click', () => this.moveTile(x, y))
                        .on('touchstart', (e) => this.handleTouchStart(e, x, y))
                        .on('touchmove', (e) => this.handleTouchMove(e))
                        .on('touchend', (e) => this.handleTouchEnd(e, x, y));

                    $gameBoard.append($tile);
                }
            }

            // Prevent default touch behaviors
            $gameBoard.on('touchstart touchmove touchend', (e) => {
                e.preventDefault();
            });
        }

        // Touch event handlers with enhanced support
        handleTouchStart(e, x, y) {
            // Prevent default touch behavior
            e.preventDefault();

            // Store initial touch coordinates with more precision
            const touch = e.originalEvent.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
    
            // Add visual feedback
            $(e.target).addClass('touch-active');
        }

        handleTouchMove(e) {
            // Prevent default touch behavior and scrolling
            e.preventDefault();
        }

        handleTouchEnd(e, x, y) {
            // Prevent default touch behavior
            e.preventDefault();

            // Remove visual feedback
            $('.puzzle-tile').removeClass('touch-active');

            // If no initial touch coordinates, return
            if (this.touchStartX === null || this.touchStartY === null) return;

            // Get final touch coordinates
            const touch = e.originalEvent.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;

            // Calculate touch movement with increased sensitivity
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Define a threshold to prevent accidental moves
            const SWIPE_THRESHOLD = 50;

            // Determine swipe direction based on movement
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                    if (deltaX > 0 && x > 0) {
                        // Swipe right, try to move tile to the left
                        this.moveTile(x - 1, y);
                    } else if (deltaX < 0 && x < this.size - 1) {
                        // Swipe left, try to move tile to the right
                        this.moveTile(x + 1, y);
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
                    if (deltaY > 0 && y > 0) {
                        // Swipe down, try to move tile up
                        this.moveTile(x, y - 1);
                    } else if (deltaY < 0 && y < this.size - 1) {
                        // Swipe up, try to move tile down
                        this.moveTile(x, y + 1);
                    }
                }
            }

            // Reset touch coordinates
            this.touchStartX = null;
            this.touchStartY = null;
        }

        moveTile(x, y) {
            if (this.isAdjacent(x, y)) {
                this.playSound(this.moveSound);
                this.swapTiles(x, y, this.emptyTile.x, this.emptyTile.y);
                this.emptyTile = { x, y };
                this.moves++;
                $('#moves-counter').text(`Moves: ${this.moves}`);
                this.renderBoard();
                
                if (this.checkWin()) {
                    this.handleWin();
                }
            }
        }

        // Additional method to add difficulty progression
        increaseDifficulty() {
            // Increase grid size or add time constraints as level increases
            if (this.level % 3 === 0 && this.size < 6) {
                this.size++;
                this.logger.info(`Difficulty increased. New grid size: ${this.size}x${this.size}`);
                toastr.success(`Difficulty Increased to ${this.size}x${this.size}!`, 'Level Up');
            }
        }

        handleWin() {
            try {
                // Use Sweet Alert for win notification
                Swal.fire({
                    title: 'Congratulations!',
                    html: `You solved the puzzle in ${this.moves} moves!`,
                    icon: 'success',
                    confirmButtonText: 'Play Again',
                    animation: true,
                    customClass: {
                        popup: 'animate__animated animate__bounceIn'
                    }
                });

                // Increase difficulty
                this.increaseDifficulty();

                // Toastr notification
                toastr.success(`Level Up! You are now on Level ${this.level}`, 'Congratulations');

                // Existing win logic
                this.playSound(this.winSound);
                this.level++;
                $('#level-display').text(`Level: ${this.level}`);
                
                if (this.moves < this.highScore || this.highScore === 0) {
                    this.highScore = this.moves;
                    this.saveHighScore();
                    this.updateHighScoreDisplay();
                }

                $('.puzzle-tile:not(.empty)').addClass('correct');
                
                setTimeout(() => {
                    $('.puzzle-tile').removeClass('correct');
                    this.initializeBoard();
                }, 1500);

                this.logGameState();
            } catch (error) {
                this.handleError(error);
            }
        }

        saveHighScore() {
            localStorage.setItem('slidingPuzzleHighScore', this.highScore);
        }

        getHighScore() {
            return parseInt(localStorage.getItem('slidingPuzzleHighScore')) || 0;
        }

        updateHighScoreDisplay() {
            $('#high-score-display').text(`High Score: ${this.highScore}`);
        }

        playSound(sound) {
            if (this.isSoundEffectsEnabled && sound) {
                sound.play();
            }
        }

        toggleMusic() {
            this.isMusicEnabled = !this.isMusicEnabled;
            const $musicIcon = $('#music-icon');
            
            if (this.isMusicEnabled) {
                $musicIcon.removeClass('fa-music-slash').addClass('fa-music');
                this.backgroundMusic.play();
                toastr.info('Background Music Enabled', 'Music');
            } else {
                $musicIcon.removeClass('fa-music').addClass('fa-music-slash');
                this.backgroundMusic.pause();
                toastr.info('Background Music Disabled', 'Music');
            }
        }

        toggleSoundEffects() {
            this.isSoundEffectsEnabled = !this.isSoundEffectsEnabled;
            const $sfxIcon = $('#sfx-icon');
            
            if (this.isSoundEffectsEnabled) {
                $sfxIcon.removeClass('fa-volume-mute').addClass('fa-volume-up');
                toastr.info('Sound Effects Enabled', 'SFX');
            } else {
                $sfxIcon.removeClass('fa-volume-up').addClass('fa-volume-mute');
                toastr.info('Sound Effects Disabled', 'SFX');
            }
        }

        setupEventListeners() {
            $('#shuffle-btn').on('click', () => {
                this.playButtonClickSound();
                this.advancedShuffle();
                this.renderBoard();
                toastr.info('Puzzle Shuffled!', 'Shuffle');
            });
            
            $('#music-btn').on('click', () => {
                this.playButtonClickSound();
                this.toggleMusic();
            });

            $('#sfx-btn').on('click', () => {
                this.playButtonClickSound();
                this.toggleSoundEffects();
            });
            
            $('#play-btn').on('click', () => {
                this.playButtonClickSound();
                this.initializeBoard();
                toastr.success('New Game Started!', 'Play');
            });

            $('#help-btn').on('click', () => {
                this.playButtonClickSound();
                $('#helpModal').modal('show');
            });
        }

        isAdjacent(x, y) {
            return (
                (Math.abs(x - this.emptyTile.x) === 1 && y === this.emptyTile.y) ||
                (Math.abs(y - this.emptyTile.y) === 1 && x === this.emptyTile.x)
            );
        }

        swapTiles(x1, y1, x2, y2) {
            [this.board[y1][x1], this.board[y2][x2]] = [this.board[y2][x2], this.board[y1][x1]];
        }

        checkWin() {
            let number = 1;
            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    if (x === this.emptyTile.x && y === this.emptyTile.y) continue;
                    if (this.board[y][x] !== number++) return false;
                }
            }
            return true;
        }
    }

    // Initialize the game with error handling
    try {
        const game = new SlidingPuzzle();
    } catch (error) {
        console.error('Game Initialization Failed:', error);
        Swal.fire({
            icon: 'error',
            title: 'Game Initialization Error',
            text: 'Unable to start the game. Please refresh the page.'
        });
    }
});