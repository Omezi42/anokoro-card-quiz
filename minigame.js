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
        currentQuiz.type = null;
        currentQuiz.card = null;
        currentQuiz.hintIndex = 0;
        currentQuiz.attemptCount = 0;
        currentQuiz.fullCardImage = null;
        currentQuiz.transparentIllustrationImage = null;
        currentQuiz.illustrationImage = null;
        currentQuiz.originalImageData = null;

        if (quizDisplayArea) quizDisplayArea.style.display = 'none';
        if (quizTitle) quizTitle.textContent = '';
        if (quizHintArea) quizHintArea.innerHTML = '';
        if (quizImageArea) quizImageArea.style.display = 'none';
        if (quizCanvas) quizCanvas.style.display = 'none';
        if (quizAnswerInput) quizAnswerInput.value = '';
        if (quizResultArea) {
            quizResultArea.textContent = '';
            quizResultArea.className = 'quiz-result-area';
        }
        if (quizAnswerDisplay) quizAnswerDisplay.textContent = '';
        if (quizNextButton) quizNextButton.style.display = 'none';
        if (quizSubmitButton) quizSubmitButton.style.display = 'inline-block';
        if (quizAnswerInput) quizAnswerInput.disabled = false;
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
        switch (type) {
            case 'cardName': return 'カード名当てクイズ';
            case 'enlarge': return 'イラスト拡大クイズ';
            case 'silhouette': return 'イラストシルエットクイズ';
            case 'mosaic': return 'イラストモザイク化クイズ';
            default: return 'ミニゲーム';
        }
    }

    function displayCardNameQuizHint() {
        if (!currentQuiz.card || !quizHintArea || !quizNextButton) return;
        if (currentQuiz.hintIndex < currentQuiz.card.info.length) {
            quizHintArea.innerHTML += (currentQuiz.hintIndex > 0 ? '<br>' : '') + currentQuiz.card.info[currentQuiz.hintIndex];
            currentQuiz.hintIndex++;
            quizNextButton.style.display = 'none';
        } else {
            quizHintArea.innerHTML += '<br><br>これ以上ヒントはありません。';
            endQuiz(false);
        }
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

    // イラスト拡大クイズの描画ロジック
    function drawEnlargedImage(ctx, img, attempt, destX, destY, destWidth, destHeight) {
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        const initialDisplaySize = 10;
        const sizeIncrement = 10;
        let displaySize = initialDisplaySize + attempt * sizeIncrement;

        if (displaySize > Math.min(imgWidth, imgHeight)) {
            displaySize = Math.min(imgWidth, imgHeight);
        }

        const sourceX = Math.floor(imgWidth / 2 - displaySize / 2);
        const sourceY = Math.floor(imgHeight * 0.25 - displaySize / 2);

        ctx.drawImage(
            img,
            sourceX, sourceY, displaySize, displaySize,
            destX, destY, destWidth, destHeight
        );
    }

    // イラストシルエットクイズの描画ロジック
    function drawSilhouetteImage(ctx, bgIllustrationImg, transparentImg, canvasWidth, canvasHeight) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        function calculateDrawDims(image) {
            const imgAspectRatio = image.naturalWidth / image.naturalHeight;
            const canvasAspectRatio = canvasWidth / canvasHeight;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgAspectRatio > canvasAspectRatio) {
                drawWidth = canvasWidth;
                drawHeight = canvasWidth / imgAspectRatio;
                offsetX = 0;
                offsetY = (canvasHeight - drawHeight) / 2;
            } else {
                drawHeight = canvasHeight;
                drawWidth = canvasHeight * imgAspectRatio;
                offsetX = (canvasWidth - drawWidth) / 2;
                offsetY = 0;
            }
            return { drawWidth, drawHeight, offsetX, offsetY };
        }

        if (bgIllustrationImg && bgIllustrationImg.complete && bgIllustrationImg.naturalWidth > 0) {
            const { drawWidth, drawHeight, offsetX, offsetY } = calculateDrawDims(bgIllustrationImg);
            ctx.drawImage(bgIllustrationImg, offsetX, offsetY, drawWidth, drawHeight);
        } else {
            console.error("シルエットクイズ用の背景イラスト画像がロードされていないか、無効です。");
            ctx.fillStyle = 'red';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('画像エラー', canvasWidth / 2, canvasHeight / 2);
            ctx.fillText('(背景イラスト画像が見つからないか無効です)', canvasWidth / 2, canvasHeight / 2 + 30);
            return;
        }

        let blackMaskAlpha = 1.0;

        if (blackMaskAlpha === 0) {
            return;
        }

        if (transparentImg && transparentImg.complete && transparentImg.naturalWidth > 0) {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = canvasWidth;
            offscreenCanvas.height = canvasHeight;
            const offscreenCtx = offscreenCanvas.getContext('2d');

            const { drawWidth: transDrawWidth, drawHeight: transDrawHeight, offsetX: transOffsetX, offsetY: transOffsetY } = calculateDrawDims(transparentImg);
            offscreenCtx.drawImage(transparentImg, transOffsetX, transOffsetY, transDrawWidth, transDrawHeight);

            offscreenCtx.globalCompositeOperation = 'source-in';
            offscreenCtx.fillStyle = 'black';
            offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

            ctx.globalAlpha = blackMaskAlpha;
            ctx.drawImage(offscreenCanvas, 0, 0);
            ctx.globalAlpha = 1.0;
        } else {
            console.error("シルエットクイズ用の透過イラスト画像がロードされていないか、無効です。");
            ctx.fillStyle = 'red';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('画像エラー', canvasWidth / 2, canvasCanvas.height / 2);
            ctx.fillText('(_transparent.pngが見つからないか無効です)', canvasWidth / 2, canvasHeight / 2 + 30);
        }
    }

    // イラストモザイク化クイズの描画ロジック
    function drawMosaicImage(ctx, img, attempt, destX, destY, destWidth, destHeight) {
        const pixelSizeLevels = [128, 64, 32, 16, 8, 4];
        const pixelSize = pixelSizeLevels[attempt] || 1;

        if (!currentQuiz.originalImageData || !quizCanvas) {
            ctx.drawImage(img, destX, destY, destWidth, destHeight);
            return;
        }

        const originalData = currentQuiz.originalImageData.data;
        const originalWidth = currentQuiz.originalImageData.width;
        const originalHeight = currentQuiz.originalImageData.height;

        ctx.clearRect(0, 0, quizCanvas.width, quizCanvas.height);
        
        const mosaicDrawWidth = destWidth;
        const mosaicDrawHeight = destHeight;
        const mosaicOffsetX = destX;
        const mosaicOffsetY = destY;

        for (let y = 0; y < originalHeight; y += pixelSize) {
            for (let x = 0; x < originalWidth; x += pixelSize) {
                let r = 0, g = 0, b = 0, a = 0;
                let count = 0;

                for (let dy = 0; dy < pixelSize && y + dy < originalHeight; dy++) {
                    for (let dx = 0; dx < pixelSize && x + dx < originalWidth; dx++) {
                        const i = ((y + dy) * originalWidth + (x + dx)) * 4;
                        r += originalData[i];
                        g += originalData[i + 1];
                        b += originalData[i + 2];
                        a += originalData[i + 3];
                        count++;
                    }
                }

                if (count > 0) {
                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);
                    a = Math.floor(a / count);
                }

                ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
                
                const rectX = mosaicOffsetX + (x / originalWidth) * mosaicDrawWidth;
                const rectY = mosaicOffsetY + (y / originalHeight) * mosaicDrawHeight;
                const rectWidth = (pixelSize / originalWidth) * mosaicDrawWidth;
                const rectHeight = (pixelSize / originalHeight) * mosaicDrawHeight;

                ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
            }
        }
    }


    // 解答チェック
    function checkAnswer() {
        if (!quizAnswerInput || !quizResultArea || !currentQuiz.card) return;

        const userAnswer = quizAnswerInput.value.trim().toLowerCase();
        const correctAnswer = currentQuiz.card.name.toLowerCase();

        const toFullWidthKatakana = (str) => {
            return str.replace(/[\uFF61-\uFF9F]/g, (s) => {
                return String.fromCharCode(s.charCodeAt(0) + 0x20);
            });
        };
        const toFullWidthKatakanaFromHiragana = (str) => {
            return str.replace(/[\u3041-\u3096]/g, (s) => {
                return String.fromCharCode(s.charCodeAt(0) + 0x60);
            });
        };

        const normalizedUserAnswer = toFullWidthKatakana(toFullWidthKatakanaFromHiragana(userAnswer)).replace(/\s+/g, '');
        const normalizedCorrectAnswer = toFullWidthKatakana(toFullWidthKatakanaFromHiragana(correctAnswer)).replace(/\s+/g, '');

        if (normalizedUserAnswer === normalizedCorrectAnswer) {
            quizResultArea.textContent = '正解！';
            quizResultArea.classList.add('correct');
            quizResultArea.classList.remove('incorrect');
            endQuiz(true);
        } else {
            quizResultArea.textContent = '不正解...';
            quizResultArea.classList.add('incorrect');
            quizResultArea.classList.remove('correct');
            currentQuiz.attemptCount++;

            if (currentQuiz.type === 'cardName') {
                displayCardNameQuizHint();
            } else {
                if (currentQuiz.attemptCount < 5) {
                    drawQuizImage();
                    if (quizNextButton) quizNextButton.style.display = 'inline-block';
                    if (quizNextButton) quizNextButton.textContent = '次のヒント';
                } else {
                    endQuiz(false);
                }
            }
        }
    }

    // クイズ終了
    function endQuiz(isCorrect) {
        if (!quizAnswerInput || !quizSubmitButton || !quizNextButton || !quizAnswerDisplay || !currentQuiz.quizCtx || !currentQuiz.quizCanvas || !quizResetButton) return;

        quizAnswerInput.disabled = true;
        quizSubmitButton.style.display = 'none';
        quizNextButton.style.display = 'none';

        quizAnswerDisplay.innerHTML = `正解は「<strong>${currentQuiz.card.name}</strong>」でした！`;

        const ctx = currentQuiz.quizCtx;
        let finalImage = currentQuiz.fullCardImage;

        if (currentQuiz.type === 'enlarge' || currentQuiz.type === 'silhouette' || currentQuiz.type === 'mosaic') {
            finalImage = currentQuiz.fullCardImage;
        }

        if (finalImage) {
            ctx.clearRect(0, 0, currentQuiz.quizCanvas.width, currentQuiz.quizCanvas.height);

            const imgAspectRatio = finalImage.naturalWidth / finalImage.naturalHeight;
            const canvasAspectRatio = currentQuiz.quizCanvas.width / currentQuiz.quizCanvas.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgAspectRatio > canvasAspectRatio) {
                drawWidth = currentQuiz.quizCanvas.width;
                drawHeight = currentQuiz.quizCanvas.width / imgAspectRatio;
                offsetX = 0;
                offsetY = (currentQuiz.quizCanvas.height - drawHeight) / 2;
            } else {
                drawHeight = currentQuiz.quizCanvas.height;
                drawWidth = canvasAspectRatio === 0 ? finalImage.naturalWidth : currentQuiz.quizCanvas.height * imgAspectRatio;
                offsetX = (currentQuiz.quizCanvas.width - drawWidth) / 2;
                offsetY = 0;
            }
            ctx.drawImage(finalImage, offsetX, offsetY, drawWidth, drawHeight);
        } else {
             console.error("最終表示用の画像がロードされていないか、無効です。");
             ctx.fillStyle = 'red';
             ctx.font = '20px Arial';
             ctx.textAlign = 'center';
             ctx.fillText('画像エラー', quizCanvas.width / 2, quizCanvas.height / 2);
             ctx.fillText('(_transparent.pngが見つからないか無効です)', quizCanvas.width / 2, quizCanvas.height / 2 + 30);
        }

        quizResetButton.style.display = 'inline-block';
    }

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
