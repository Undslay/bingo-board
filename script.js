$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const bingoData = urlParams.get('b'); // Base64 encoded JSON data
    let currentSize = 4; // 기본값 3x3

    // lz-string을 이용한 압축 및 URL-safe 인코딩
    function compressData(str) {
        return LZString.compressToEncodedURIComponent(str);
    }

    // lz-string을 이용한 복호화 및 압축 해제
    function decompressData(str) {
        return LZString.decompressFromEncodedURIComponent(str);
    }

    // 입력 그리드 생성 함수
    function createInputGrid(size) {
        currentSize = size;
        const $inputGrid = $('#input-grid').empty();
        const totalCells = size * size;
        
        $inputGrid.css('grid-template-columns', `repeat(${size}, 1fr)`);

        for (let i = 0; i < totalCells; i++) {
            $inputGrid.append('<textarea class="cell-input" placeholder="' + (i + 1) + '"></textarea>');
        }
    }

    // 사이즈 버튼 클릭 이벤트
    $('.size-btn').click(function() {
        const size = parseInt($(this).data('size'));
        $('.size-btn').removeClass('active');
        $(this).addClass('active');
        createInputGrid(size);
    });

    // 초기화 및 데이터 로딩
    if (bingoData) {
        try {
            const decodedStr = decompressData(bingoData);
            // 구분자(\u001f)로 분리: [제목, 항목1, 항목2, ...]
            const parts = decodedStr.split('\u001f');
            const title = parts[0];
            const items = parts.slice(1);
            const size = Math.sqrt(items.length);
            
            if (Number.isInteger(size) && size >= 3 && size <= 5) {
                renderBoard(items, size, title);
                updateShareLink(window.location.href);
            } else {
                throw new Error('Invalid size');
            }
        } catch(e) {
            console.error('Error decoding bingo data:', e);
            alert('잘못되거나 만료된 보드 데이터입니다.');
            showSetup();
        }
    } else {
        createInputGrid(4); // 기본 4x4 생성
    }

    $('#generate-btn').click(function() {
        const title = $('#board-title-input').val().trim();
        const items = [];
        const totalNeeded = currentSize * currentSize;
        
        $('.cell-input').each(function() {
            const val = $(this).val().trim();
            if (val) items.push(val);
        });

        if (items.length < totalNeeded) {
            return alert(`${totalNeeded}개의 칸을 모두 채워주세요. (현재 ${items.length}개)`);
        }

        // 제목과 항목들을 구분자로 합침
        const dataStr = [title, ...items].join('\u001f');
        const encodedData = compressData(dataStr);
        const shareUrl = window.location.origin + window.location.pathname + '?b=' + encodedData;

        renderBoard(items, currentSize, title);
        updateShareLink(shareUrl);
    });

    $('#copy-btn').click(function() {
        const url = $('#share-url').text();
        navigator.clipboard.writeText(url).then(() => {
            alert('링크가 클립보드에 복사되었습니다!');
        });
    });

    $('#download-btn').click(function() {
        const captureArea = document.getElementById('capture-area');
        const title = $('#board-title-display').text() || 'bingo-board';
        html2canvas(captureArea).then(canvas => {
            const link = document.createElement('a');
            link.download = `${title}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    });

    $('#reset-btn').click(function() {
        window.location.href = window.location.origin + window.location.pathname;
    });

    function renderBoard(items, size, title) {
        $('#setup').addClass('hidden');
        $('#board-area').removeClass('hidden');
        $('#board-title-display').text(title);
        
        const $grid = $('#bingo-grid').empty();
        $grid.css('grid-template-columns', `repeat(${size}, 1fr)`);

        items.forEach((item, index) => {
            const $cell = $('<div class="cell"></div>').text(item);
            $cell.click(function() {
                $(this).toggleClass('checked');
                checkBingo(size);
            });
            $grid.append($cell);
        });
    }

    function checkBingo(size) {
        const $cells = $('#bingo-grid .cell');
        const board = [];
        
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push($cells.eq(i * size + j));
            }
            board.push(row);
        }

        // 초기화
        $cells.removeClass('bingo-row bingo-col bingo-diag');

        // 가로 체크
        for (let i = 0; i < size; i++) {
            if (board[i].every($c => $c.hasClass('checked'))) {
                board[i].forEach($c => $c.addClass('bingo-row'));
            }
        }

        // 세로 체크
        for (let j = 0; j < size; j++) {
            const col = [];
            for (let i = 0; i < size; i++) col.push(board[i][j]);
            if (col.every($c => $c.hasClass('checked'))) {
                col.forEach($c => $c.addClass('bingo-col'));
            }
        }

        // 대각선 좌상 -> 우하
        const diag1 = [];
        for (let i = 0; i < size; i++) diag1.push(board[i][i]);
        if (diag1.every($c => $c.hasClass('checked'))) {
            diag1.forEach($c => $c.addClass('bingo-diag'));
        }

        // 대각선 우상 -> 좌하
        const diag2 = [];
        for (let i = 0; i < size; i++) diag2.push(board[i][size - 1 - i]);
        if (diag2.every($c => $c.hasClass('checked'))) {
            diag2.forEach($c => $c.addClass('bingo-diag'));
        }
    }

    function updateShareLink(url) {
        $('#share-url').attr('href', url).text(url);
    }

    function showSetup() {
        $('#setup').removeClass('hidden');
        $('#board-area').addClass('hidden');
        createInputGrid(currentSize);
    }
});
