// minigame.js (ミニゲーム単体版)

// グローバル変数
let allCards = [];

/**
 * カスタムダイアログを表示します。
 * @param {string} title - ダイアログのタイトル。
 * @param {string} message - ダイアログに表示するメッセージ。
 * @param {boolean} isConfirm - 確認ダイアログかどうか。
 * @returns {Promise<boolean>} - OK/キャンセルの結果。
 */
function showCustomDialog(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-dialog-overlay');
        const dialogTitle = document.getElementById('dialog-title');
        const dialogMessage = document.getElementById('dialog-message');
        const buttonsWrapper = document.querySelector('.dialog-buttons');

        if (!overlay || !dialogTitle || !dialogMessage || !buttonsWrapper) {
            console.error("Custom dialog elements not found.");
            alert(`${title}\n\n${message}`); // フォールバック
            return resolve(false);
        }

        dialogTitle.textContent = title;
        dialogMessage.innerHTML = message;
        buttonsWrapper.innerHTML = ''; 

        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.addEventListener('click', () => {
            overlay.classList.remove('show');
            resolve(true);
        });
        buttonsWrapper.appendChild(okButton);

        if (isConfirm) {
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'キャンセル';
            cancelButton.addEventListener('click', () => {
                overlay.classList.remove('show');
                resolve(false);
            });
            buttonsWrapper.appendChild(cancelButton);
        }

        overlay.classList.add('show');
    });
};

/**
 * ミニゲームセクションの初期化
 */
async function initMinigamesSection() {
    console.log("Minigames section initialized.");

    let currentQuiz = {
        type: null, card: null, hintIndex: 0, attemptCount: 0,
        quizCanvas: null, quizCtx: null, fullCardImage: null,
        transparentIllustrationImage: null, originalImageData: null
    };

    const quizCardNameButton = document.getElementById('quiz-card-name');
    const quizIllustrationEnlargeButton = document.getElementById('quiz-illustration-enlarge');
    const quizIllustrationSilhouetteButton = document.getElementById('quiz-illustration-silhouette');
    const quizIllustrationMosaicButton = document.getElementById('quiz-illustration-mosaic');
    const quizDisplayArea = document.getElementById('quiz-display-area');
    const quizTitle = document.getElementById('quiz-title');
    const quizHintArea = document.getElementById('quiz-hint-area');
    const quizImageArea = document.getElementById('quiz-image-area');
    const quizCanvas = document.getElementById('quiz-canvas');
    const quizAnswerInput = document.getElementById('quiz-answer-input');
    const quizSubmitButton = document.getElementById('quiz-submit-button');
    const quizResultArea = document.getElementById('quiz-result-area');
    const quizAnswerDisplay = document.getElementById('quiz-answer-display');
    const quizNextButton = document.getElementById('quiz-next-button');
    const quizResetButton = document.getElementById('quiz-reset-button');

    if (quizCanvas) {
        currentQuiz.quizCanvas = quizCanvas;
        currentQuiz.quizCtx = quizCanvas.getContext('2d');
    }

    function resetQuiz() {
        // ... (この関数は変更なし)
    }

    async function startQuiz(type) {
        if (allCards.length === 0) {
            await showCustomDialog('エラー', 'カードデータがロードされていません。');
            return;
        }
        resetQuiz();
        currentQuiz.type = type;

        let cardSelected = false;
        const maxAttempts = 20;
        for (let i = 0; i < maxAttempts; i++) {
            currentQuiz.card = allCards[Math.floor(Math.random() * allCards.length)];
            if (type !== 'cardName') {
                try {
                    await loadImageForQuiz(currentQuiz.card.name, type);
                    cardSelected = true;
                    break;
                } catch (error) {
                    console.warn(`クイズ用の画像読み込みに失敗: ${currentQuiz.card.name}`, error);
                }
            } else {
                cardSelected = true;
                break;
            }
        }

        if (!cardSelected) {
            await showCustomDialog('エラー', 'クイズを開始できませんでした。');
            resetQuiz();
            return;
        }

        if (quizDisplayArea) quizDisplayArea.style.display = 'block';
        if (quizImageArea) quizImageArea.style.display = 'none';
        if (quizTitle) quizTitle.textContent = getQuizTitle(type);

        if (type === 'cardName') {
            displayCardNameQuizHint();
        } else {
            if (quizImageArea) quizImageArea.style.display = 'flex';
            if (quizCanvas) quizCanvas.style.display = 'block';
            drawQuizImage();
        }
    }

    function getQuizTitle(type) {
        // ... (この関数は変更なし)
    }

    function displayCardNameQuizHint() {
        // ... (この関数は変更なし)
    }

    async function loadImageForQuiz(cardName, quizType) {
        const loadImage = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });

        const encodedCardName = encodeURIComponent(cardName);
        const baseUrl = 'https://omezi42.github.io/tcg-assistant-images/cards/';
        
        try {
            currentQuiz.fullCardImage = await loadImage(`${baseUrl}${encodedCardName}.png`);
            
            if (quizType === 'silhouette') {
                currentQuiz.transparentIllustrationImage = await loadImage(`${baseUrl}${encodedCardName}_transparent.png`);
            }

            const parentWidth = quizImageArea ? (quizImageArea.clientWidth > 0 ? quizImageArea.clientWidth : 400) : 400;
            const parentHeight = quizImageArea ? (quizImageArea.clientHeight > 0 ? quizImageArea.clientHeight : 300) : 300;
            const imgNaturalWidth = currentQuiz.fullCardImage.naturalWidth;
            const imgNaturalHeight = currentQuiz.fullCardImage.naturalHeight;
            const aspectRatio = imgNaturalWidth / imgNaturalHeight;
            let drawWidth = parentWidth;
            let drawHeight = parentWidth / aspectRatio;
            if (drawHeight > parentHeight) {
                drawHeight = parentHeight;
                drawWidth = parentHeight * aspectRatio;
            }
            if (quizCanvas) {
                quizCanvas.width = drawWidth;
                quizCanvas.height = drawHeight;
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = imgNaturalWidth;
                offscreenCanvas.height = imgNaturalHeight;
                const offscreenCtx = offscreenCanvas.getContext('2d');
                offscreenCtx.drawImage(currentQuiz.fullCardImage, 0, 0);
                currentQuiz.originalImageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            }
        } catch (error) {
            console.error(`画像読み込みエラー for ${cardName}:`, error);
            throw error;
        }
    }

    function drawQuizImage() { /* ... */ }
    function drawEnlargedImage(ctx, img, attempt, destX, destY, destWidth, destHeight) { /* ... */ }
    function drawSilhouetteImage(ctx, fullCardImg, transparentImg, canvasWidth, canvasHeight) { /* ... */ }
    function drawMosaicImage(ctx, img, attempt, destX, destY, destWidth, destHeight) { /* ... */ }
    function checkAnswer() { /* ... */ }
    function endQuiz(isCorrect) { /* ... */ }

    // イベントリスナー設定
    if (quizCardNameButton) quizCardNameButton.addEventListener('click', () => startQuiz('cardName'));
    if (quizIllustrationEnlargeButton) quizIllustrationEnlargeButton.addEventListener('click', () => startQuiz('enlarge'));
    if (quizIllustrationSilhouetteButton) quizIllustrationSilhouetteButton.addEventListener('click', () => startQuiz('silhouette'));
    if (quizIllustrationMosaicButton) quizIllustrationMosaicButton.addEventListener('click', () => startQuiz('mosaic'));
    if (quizSubmitButton) quizSubmitButton.addEventListener('click', checkAnswer);
    if (quizAnswerInput) quizAnswerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAnswer(); });
    if (quizNextButton) quizNextButton.addEventListener('click', () => {
        if (currentQuiz.type === 'cardName') {
            displayCardNameQuizHint();
        } else {
            drawQuizImage();
            if (quizNextButton) quizNextButton.style.display = 'none';
        }
        if (quizResultArea) {
            quizResultArea.textContent = '';
            quizResultArea.className = 'quiz-result-area';
        }
    });
    if (quizResetButton) quizResetButton.addEventListener('click', resetQuiz);

    resetQuiz();
}

// --- ページの読み込み完了後に実行 ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // cards.jsonを同じ階層から読み込む
        const response = await fetch('cards.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch cards.json: ${response.statusText}`);
        }
        allCards = await response.json();
        console.log(`${allCards.length} cards loaded.`);
        
        // カードデータがロードされたらミニゲームを初期化
        initMinigamesSection();

    } catch (error) {
        console.error("Failed to load card data:", error);
        showCustomDialog('重大なエラー', `カードデータの読み込みに失敗しました。<br>cards.jsonが正しく配置されているか確認してください。`);
    }
});
