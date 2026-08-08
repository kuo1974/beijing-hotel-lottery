/* ==========================================================================
   🏨 北京旅游飯店抽抽樂 - JAVASCRIPT
   ========================================================================== */

(function () {
    'use strict';

    // ----------------------------------------------------------------------
    // 1. DEFAULT DATA & STATE (6 Default Beijing Hotels)
    // ----------------------------------------------------------------------
    const DEFAULT_CANDIDATES = [
        '長富宮',
        'base佰舍隆福寺',
        '王府井合院漫心',
        '新橋／新僑',
        '天倫松鶴',
        'NOA隆福寺'
    ];

    let candidates = [];
    let history = [];
    let isSpinning = false;
    let soundEnabled = true;

    // ----------------------------------------------------------------------
    // 2. DOM ELEMENTS
    // ----------------------------------------------------------------------
    const strip1 = document.getElementById('strip-1');
    const strip2 = document.getElementById('strip-2');
    const strip3 = document.getElementById('strip-3');
    
    const btnSpin = document.getElementById('btn-spin');
    const statusMessage = document.getElementById('status-message');
    const toggleNoRepeat = document.getElementById('toggle-no-repeat');

    // Header buttons
    const btnRestart = document.getElementById('btn-restart');
    const btnSound = document.getElementById('btn-sound');
    const soundIcon = document.getElementById('sound-icon');
    const btnListModal = document.getElementById('btn-list-modal');
    const btnHistoryToggle = document.getElementById('btn-history-toggle');
    const candidateCountSpan = document.getElementById('candidate-count');

    // Candidate Modal Elements
    const modalCandidates = document.getElementById('modal-candidates');
    const btnCloseCandidates = document.getElementById('btn-close-candidates');
    const inputNewCandidate = document.getElementById('input-new-candidate');
    const btnAddCandidate = document.getElementById('btn-add-candidate');
    const btnClearCandidates = document.getElementById('btn-clear-candidates');
    const btnResetDefault = document.getElementById('btn-reset-default');
    const candidatesUl = document.getElementById('candidates-ul');
    const modalCount = document.getElementById('modal-count');
    const btnSaveCandidates = document.getElementById('btn-save-candidates');

    // Winner Modal Elements
    const modalWinner = document.getElementById('modal-winner');
    const winnerName = document.getElementById('winner-name');
    const winnerCountStat = document.getElementById('winner-count-stat');
    const btnCopyWinner = document.getElementById('btn-copy-winner');
    const btnSpinAgain = document.getElementById('btn-spin-again');

    // History & Statistics Drawer Elements
    const historyDrawer = document.getElementById('history-drawer');
    const btnCloseHistory = document.getElementById('btn-close-history');
    const btnClearHistory = document.getElementById('btn-clear-history');
    const historyTotal = document.getElementById('history-total');
    const historyUl = document.getElementById('history-ul');
    const statsContainer = document.getElementById('stats-container');

    const tabStats = document.getElementById('tab-stats');
    const tabList = document.getElementById('tab-list');
    const tabContentStats = document.getElementById('tab-content-stats');
    const tabContentList = document.getElementById('tab-content-list');

    // Canvas Confetti
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');

    // ----------------------------------------------------------------------
    // 3. WEB AUDIO SYNTHESIZER
    // ----------------------------------------------------------------------
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playClickAudio() {
        if (!soundEnabled) return;
        initAudio();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    let spinTickPitchIndex = 0;
    const spinArpeggioNotes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];

    function playTickAudio() {
        if (!soundEnabled) return;
        initAudio();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        const freq = spinArpeggioNotes[spinTickPitchIndex % spinArpeggioNotes.length];
        spinTickPitchIndex++;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    function playStopAudio() {
        if (!soundEnabled) return;
        initAudio();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    function playWinAudio() {
        if (!soundEnabled) return;
        initAudio();
        if (!audioCtx) return;

        const melody = [
            { note: 523.25, duration: 0.12, delay: 0 },
            { note: 659.25, duration: 0.12, delay: 0.1 },
            { note: 783.99, duration: 0.12, delay: 0.2 },
            { note: 1046.50, duration: 0.25, delay: 0.3 },
            { note: 880.00, duration: 0.12, delay: 0.52 },
            { note: 1046.50, duration: 0.12, delay: 0.62 },
            { note: 1318.51, duration: 0.45, delay: 0.74 }
        ];

        melody.forEach(item => {
            const now = audioCtx.currentTime + item.delay;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(item.note, now);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + item.duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(now);
            osc.stop(now + item.duration);
        });
    }

    // ----------------------------------------------------------------------
    // 4. DATA STORAGE & INITIALIZATION
    // ----------------------------------------------------------------------
    function loadData() {
        const savedCandidates = localStorage.getItem('lucky_draw_candidates');
        if (savedCandidates) {
            try {
                candidates = JSON.parse(savedCandidates);
            } catch (e) {
                candidates = [...DEFAULT_CANDIDATES];
            }
        } else {
            candidates = [...DEFAULT_CANDIDATES];
        }

        const savedHistory = localStorage.getItem('lucky_draw_history');
        if (savedHistory) {
            try {
                history = JSON.parse(savedHistory);
            } catch (e) {
                history = [];
            }
        } else {
            history = [];
        }

        saveData();
        updateCandidateCountDisplay();
        renderInitialReels();
        renderHistoryAndStats();
    }

    function saveData() {
        localStorage.setItem('lucky_draw_candidates', JSON.stringify(candidates));
        localStorage.setItem('lucky_draw_history', JSON.stringify(history));
    }

    function updateCandidateCountDisplay() {
        candidateCountSpan.textContent = candidates.length;
        modalCount.textContent = candidates.length;
    }

    // Render static initial reels displaying candidates
    function renderInitialReels() {
        const strips = [strip1, strip2, strip3];

        strips.forEach(strip => {
            strip.innerHTML = '';
            strip.style.transition = 'none';
            strip.style.transform = 'translateY(-10px)';

            const displayList = candidates.length > 0 ? candidates : ['(無飯店資料)'];

            for (let i = 0; i < 5; i++) {
                displayList.forEach((item, itemIdx) => {
                    const card = createCardElement(item, itemIdx + 1);
                    strip.appendChild(card);
                });
            }
        });
    }

    function createCardElement(text, number) {
        const card = document.createElement('div');
        card.className = 'slot-card';
        
        const textSpan = document.createElement('span');
        textSpan.className = 'card-text';
        textSpan.textContent = text;

        const tagSpan = document.createElement('span');
        tagSpan.className = 'card-tag';
        tagSpan.textContent = `Nº ${number}`;

        card.appendChild(textSpan);
        card.appendChild(tagSpan);
        return card;
    }

    // ----------------------------------------------------------------------
    // 5. SPIN ANIMATION LOGIC
    // ----------------------------------------------------------------------
    function startSpin() {
        if (isSpinning) return;

        if (!candidates || candidates.length === 0) {
            statusMessage.textContent = '❌ 請先新增飯店抽籤名單！';
            openCandidatesModal();
            return;
        }

        let availablePool = [...candidates];
        if (toggleNoRepeat.checked && history.length > 0) {
            const drawnSet = new Set(history.map(h => h.winner));
            availablePool = candidates.filter(c => !drawnSet.has(c));
            
            if (availablePool.length === 0) {
                statusMessage.textContent = '⚠️ 所有飯店皆已抽完！請解除「不重複」或按「重頭開始」。';
                alert('所有名單飯店均已在歷史紀錄中！請點擊上方「🔄 重頭開始」或關閉「避開已中獎」選單。');
                return;
            }
        }

        const winnerIndex = Math.floor(Math.random() * availablePool.length);
        const winnerItem = availablePool[winnerIndex];

        isSpinning = true;
        btnSpin.disabled = true;
        statusMessage.textContent = '🎉 飯店抽籤中，好運滾滾來...';

        playClickAudio();
        animateReels(winnerItem);
    }

    function animateReels(winnerItem) {
        const strips = [strip1, strip2, strip3];
        const cardHeight = 80;
        const reelCenterOffset = (230 - 70) / 2;

        const totalSpinCount = 26;
        const delays = [2200, 2700, 3200];

        spinTickPitchIndex = 0;
        let tickInterval = setInterval(() => {
            playTickAudio();
        }, 110);

        strips.forEach((strip, index) => {
            strip.innerHTML = '';
            const sequence = [];
            
            sequence.push(candidates[0] || '飯店');
            
            for (let i = 0; i < totalSpinCount + index * 5; i++) {
                const randomItem = candidates[Math.floor(Math.random() * candidates.length)];
                sequence.push(randomItem);
            }
            
            sequence.push(winnerItem);
            sequence.push(candidates[1] || candidates[0] || '飯店');
            sequence.push(candidates[2] || candidates[0] || '飯店');

            sequence.forEach((text, i) => {
                const card = createCardElement(text, (i % candidates.length) + 1);
                if (text === winnerItem && i === sequence.length - 3) {
                    card.dataset.winner = 'true';
                }
                strip.appendChild(card);
            });

            const winnerCardIdx = sequence.length - 3;
            const targetY = -(winnerCardIdx * cardHeight) + reelCenterOffset - 5;

            strip.classList.add('spinning');
            strip.style.transition = 'none';
            strip.style.transform = 'translateY(0px)';

            void strip.offsetHeight;

            const duration = delays[index];
            strip.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.35, 1.0)`;
            strip.style.transform = `translateY(${targetY}px)`;

            setTimeout(() => {
                strip.classList.remove('spinning');
                playStopAudio();

                const winnerCardNode = strip.querySelector('[data-winner="true"]');
                if (winnerCardNode) {
                    winnerCardNode.classList.add('winner');
                }

                if (index === strips.length - 1) {
                    clearInterval(tickInterval);
                    finishSpin(winnerItem);
                }
            }, duration);
        });
    }

    function finishSpin(winnerItem) {
        isSpinning = false;
        btnSpin.disabled = false;
        statusMessage.textContent = `🥳 恭喜抽中：${winnerItem}！`;

        playWinAudio();
        triggerConfetti();

        recordHistory(winnerItem);

        const totalWins = history.filter(h => h.winner === winnerItem).length;

        setTimeout(() => {
            winnerName.textContent = winnerItem;
            winnerCountStat.textContent = `已累計抽中 ${totalWins} 次`;
            openWinnerModal();
        }, 500);
    }

    btnSpin.addEventListener('click', startSpin);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isSpinning && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            startSpin();
        }
    });

    // ----------------------------------------------------------------------
    // 6. RESTART & CLEAR HISTORY FEATURE (重頭開始 / 清空紀錄)
    // ----------------------------------------------------------------------
    function clearAllHistoryData() {
        history = [];
        saveData();
        renderInitialReels();
        renderHistoryAndStats();
        statusMessage.textContent = '🔄 已重頭開始！所有抽籤歷史紀錄與次數統計已全數清空。';
        playClickAudio();
    }

    btnRestart.addEventListener('click', () => {
        if (isSpinning) return;
        clearAllHistoryData();
    });

    btnClearHistory.addEventListener('click', () => {
        clearAllHistoryData();
    });

    // ----------------------------------------------------------------------
    // 7. CONFETTI CANNON
    // ----------------------------------------------------------------------
    let confettiParticles = [];
    let confettiAnimationId = null;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function triggerConfetti() {
        confettiParticles = [];
        const colors = ['#ffd700', '#ff007f', '#00f2fe', '#ffffff', '#ff9d00', '#aa00ff'];

        for (let i = 0; i < 160; i++) {
            confettiParticles.push({
                x: canvas.width / 2,
                y: canvas.height / 2 + 40,
                vx: (Math.random() - 0.5) * 24,
                vy: (Math.random() - 0.7) * 24,
                size: Math.random() * 10 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rSpeed: (Math.random() - 0.5) * 14,
                opacity: 1,
                gravity: 0.35
            });
        }

        if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
        updateConfetti();
    }

    function updateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let activeCount = 0;
        confettiParticles.forEach(p => {
            if (p.opacity > 0) {
                activeCount++;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.98;
                p.rotation += p.rSpeed;
                p.opacity -= 0.008;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
        });

        if (activeCount > 0) {
            confettiAnimationId = requestAnimationFrame(updateConfetti);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // ----------------------------------------------------------------------
    // 8. CANDIDATES CRUD MODAL (手動編輯、新增與刪除名單)
    // ----------------------------------------------------------------------
    btnSound.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
        btnSound.title = soundEnabled ? '音效已開啟' : '音效已靜音';
    });

    function openCandidatesModal() {
        renderCandidatesList();
        modalCandidates.classList.add('active');
    }

    function closeCandidatesModal() {
        modalCandidates.classList.remove('active');
    }

    btnListModal.addEventListener('click', openCandidatesModal);
    btnCloseCandidates.addEventListener('click', closeCandidatesModal);

    btnAddCandidate.addEventListener('click', addCandidateItem);
    inputNewCandidate.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addCandidateItem();
    });

    function addCandidateItem() {
        const text = inputNewCandidate.value.trim();
        if (text) {
            candidates.push(text);
            inputNewCandidate.value = '';
            renderCandidatesList();
        }
    }

    // Render Candidates list with INLINE EDITING and DELETION
    function renderCandidatesList() {
        candidatesUl.innerHTML = '';
        modalCount.textContent = candidates.length;

        if (candidates.length === 0) {
            candidatesUl.innerHTML = '<li style="text-align:center; color:#aa99cc; padding:12px;">名單為空，請輸入飯店名稱點擊「新增飯店」</li>';
            return;
        }

        candidates.forEach((item, index) => {
            const li = document.createElement('li');
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'candidate-item-text';
            nameSpan.textContent = `${index + 1}. ${item}`;

            const actionContainer = document.createElement('div');
            actionContainer.className = 'item-action-btns';

            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-item-btn';
            editBtn.innerHTML = '✏️';
            editBtn.title = '編輯此飯店名稱';

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-item-btn';
            delBtn.innerHTML = '🗑️';
            delBtn.title = '刪除此飯店';

            // Inline edit trigger
            editBtn.addEventListener('click', () => {
                li.innerHTML = '';

                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.className = 'inline-edit-input';
                editInput.value = item;
                editInput.maxLength = 30;

                const saveBtn = document.createElement('button');
                saveBtn.className = 'save-item-btn';
                saveBtn.innerHTML = '✅ 儲存';

                const saveInlineEdit = () => {
                    const newText = editInput.value.trim();
                    if (newText) {
                        candidates[index] = newText;
                        saveData();
                        renderCandidatesList();
                        renderInitialReels();
                        renderHistoryAndStats();
                    }
                };

                saveBtn.addEventListener('click', saveInlineEdit);
                editInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveInlineEdit();
                });

                li.appendChild(editInput);
                li.appendChild(saveBtn);
                editInput.focus();
                editInput.select();
            });

            delBtn.addEventListener('click', () => {
                candidates.splice(index, 1);
                renderCandidatesList();
            });

            actionContainer.appendChild(editBtn);
            actionContainer.appendChild(delBtn);

            li.appendChild(nameSpan);
            li.appendChild(actionContainer);
            candidatesUl.appendChild(li);
        });
    }

    btnClearCandidates.addEventListener('click', () => {
        if (candidates.length === 0) return;
        candidates = [];
        renderCandidatesList();
    });

    btnResetDefault.addEventListener('click', () => {
        candidates = [...DEFAULT_CANDIDATES];
        renderCandidatesList();
    });

    btnSaveCandidates.addEventListener('click', () => {
        saveData();
        updateCandidateCountDisplay();
        renderInitialReels();
        renderHistoryAndStats();
        closeCandidatesModal();
        statusMessage.textContent = '✅ 飯店名單已更新並儲存！';
    });

    // ----------------------------------------------------------------------
    // 9. WINNER MODAL & HISTORY STATS
    // ----------------------------------------------------------------------
    function openWinnerModal() {
        modalWinner.classList.add('active');
    }

    function closeWinnerModal() {
        modalWinner.classList.remove('active');
    }

    btnCopyWinner.addEventListener('click', () => {
        const name = winnerName.textContent;
        navigator.clipboard.writeText(name).then(() => {
            alert(`已成功複製飯店名稱：「${name}」！`);
        }).catch(() => {
            alert(`中獎飯店：${name}`);
        });
    });

    btnSpinAgain.addEventListener('click', () => {
        closeWinnerModal();
        startSpin();
    });

    modalWinner.addEventListener('click', (e) => {
        if (e.target === modalWinner) closeWinnerModal();
    });

    function openHistoryDrawer() {
        renderHistoryAndStats();
        historyDrawer.classList.add('active');
    }

    function closeHistoryDrawer() {
        historyDrawer.classList.remove('active');
    }

    btnHistoryToggle.addEventListener('click', openHistoryDrawer);
    btnCloseHistory.addEventListener('click', closeHistoryDrawer);

    tabStats.addEventListener('click', () => {
        tabStats.classList.add('active');
        tabList.classList.remove('active');
        tabContentStats.classList.add('active');
        tabContentList.classList.remove('active');
    });

    tabList.addEventListener('click', () => {
        tabList.classList.add('active');
        tabStats.classList.remove('active');
        tabContentList.classList.add('active');
        tabContentStats.classList.remove('active');
    });

    function recordHistory(winner) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        history.unshift({
            winner: winner,
            timestamp: timeStr
        });

        if (history.length > 100) history.pop();
        saveData();
        renderHistoryAndStats();
    }

    function renderHistoryAndStats() {
        historyTotal.textContent = history.length;

        historyUl.innerHTML = '';
        if (history.length === 0) {
            historyUl.innerHTML = '<li style="text-align:center; color:#aa99cc; padding:20px;">尚無抽籤紀錄</li>';
        } else {
            history.forEach(item => {
                const li = document.createElement('li');
                li.className = 'history-item';
                
                const titleSpan = document.createElement('span');
                titleSpan.className = 'h-title';
                titleSpan.textContent = item.winner;

                const timeSpan = document.createElement('span');
                timeSpan.className = 'h-time';
                timeSpan.textContent = item.timestamp;

                li.appendChild(titleSpan);
                li.appendChild(timeSpan);
                historyUl.appendChild(li);
            });
        }

        statsContainer.innerHTML = '';
        
        const countMap = {};
        candidates.forEach(c => { countMap[c] = 0; });
        history.forEach(h => {
            countMap[h.winner] = (countMap[h.winner] || 0) + 1;
        });

        const totalDraws = history.length;
        const sortedEntries = Object.entries(countMap).sort((a, b) => b[1] - a[1]);

        if (sortedEntries.length === 0 || totalDraws === 0) {
            statsContainer.innerHTML = '<div style="text-align:center; color:#aa99cc; padding:20px;">尚無統計數據</div>';
            return;
        }

        sortedEntries.forEach(([name, count]) => {
            const percent = totalDraws > 0 ? ((count / totalDraws) * 100).toFixed(1) : '0.0';

            const card = document.createElement('div');
            card.className = 'stat-item-card';

            card.innerHTML = `
                <div class="stat-header">
                    <span class="stat-name">${name}</span>
                    <span class="stat-count-badge">${count} 次</span>
                </div>
                <div class="stat-bar-track">
                    <div class="stat-bar-fill" style="width: ${percent}%;"></div>
                </div>
                <div class="stat-percent">占比 ${percent}%</div>
            `;

            statsContainer.appendChild(card);
        });
    }

    // Initialize application
    loadData();

})();
