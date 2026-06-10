// ==========================================
// 🌟 基礎設定與共用變數
// ==========================================
let allExercises = [];

// 💡 智慧 API 網址：如果在 Live Server 或直接開檔案，就強制連 3000；如果是透過 Node 或 LocalTunnel 開啟，就用相對路徑
const API_BASE_URL = (window.location.protocol === 'file:' || window.location.port === '5500') 
    ? 'http://localhost:3000/api' 
    : '/api';

// ==========================================
// 🍞 Toast 輕提示系統
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' 
        ? '<i class="fa-solid fa-circle-check" style="color: var(--accent-color); font-size: 20px;"></i>' 
        : '<i class="fa-solid fa-circle-exclamation" style="color: #e74c3c; font-size: 20px;"></i>';
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOutUp 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ==========================================
// 🎨 主題與導覽列邏輯 (ProFit 2.0 Sidebar)
// ==========================================
const themeToggleBtn = document.getElementById('themeToggle');
const htmlElement = document.documentElement;
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

themeToggleBtn?.addEventListener('click', () => {
    const isLight = htmlElement.getAttribute('data-theme') === 'light';
    htmlElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
    themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i> <span>淺色模式</span>' : '<i class="fa-solid fa-moon"></i> <span>深色模式</span>';
});

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        if (document.getElementById(targetId)) {
            document.getElementById(targetId).classList.add('active');
        }
    });
});

// ==========================================
// 🏋️ 動作庫與彈出視窗邏輯
// ==========================================
const addModal = document.getElementById('addExerciseModal');
const detailModal = document.getElementById('exerciseDetailModal');

document.getElementById('openAddModalBtn')?.addEventListener('click', () => addModal.classList.add('show'));
document.getElementById('closeAddModalBtn')?.addEventListener('click', () => addModal.classList.remove('show'));
addModal?.addEventListener('click', (e) => { if(e.target === addModal) addModal.classList.remove('show'); });

document.getElementById('closeDetailModalBtn')?.addEventListener('click', () => detailModal.classList.remove('show'));
detailModal?.addEventListener('click', (e) => { if(e.target === detailModal) detailModal.classList.remove('show'); });

async function fetchExercises() {
    try {
        const response = await fetch(`${API_BASE_URL}/exercises`);
        allExercises = await response.json();
        renderExercises(allExercises);

        const select = document.getElementById('logExerciseSelect');
        if (select) {
            select.innerHTML = '<option value="">請選擇動作...</option>';
            allExercises.forEach(ex => {
                const option = document.createElement('option');
                option.value = ex.exercise_id;
                option.textContent = `${ex.name} (${ex.muscle_group})`;
                select.appendChild(option);
            });
        }

        // 順便把動作載入到圖表的分析下拉選單中
        const chartSelect = document.getElementById('chartExerciseSelect');
        if (chartSelect) {
            chartSelect.innerHTML = '<option value="">請選擇要分析的動作...</option>';
            allExercises.forEach(ex => {
                const option = document.createElement('option');
                option.value = ex.exercise_id;
                option.textContent = `${ex.name} (${ex.muscle_group})`;
                chartSelect.appendChild(option);
            });
        }

        const checkboxContainer = document.getElementById('exerciseCheckboxes');
        if (checkboxContainer) {
            checkboxContainer.innerHTML = '';
            allExercises.forEach(ex => {
                const label = document.createElement('label');
                label.className = 'checkbox-item';
                label.setAttribute('data-name', ex.name.toLowerCase());
                label.setAttribute('data-category', ex.muscle_group);
                label.innerHTML = `<input type="checkbox" name="templateExercise" value="${ex.exercise_id}"> <span>${ex.name} <small class="text-muted">(${ex.muscle_group})</small></span>`;
                checkboxContainer.appendChild(label);
            });
        }
    } catch (error) { console.error('無法抓取動作:', error); }
}

function renderExercises(exercisesToRender) {
    const grid = document.getElementById('exerciseGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    if (exercisesToRender.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1;">找不到相符的動作喔！</p>';
        return;
    }

    exercisesToRender.forEach(ex => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '0'; card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s, box-shadow 0.2s';
        
        card.onmouseover = () => { card.style.transform = 'translateY(-5px)'; card.style.boxShadow = 'var(--shadow)'; };
        card.onmouseout = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; };

        card.innerHTML = `
            <h3 class="mb-10 mt-0">${ex.name}</h3>
            <span style="display: inline-block; padding: 4px 10px; background-color: var(--bg-color); border-radius: 20px; font-size: 14px; font-weight: bold; color: var(--accent-color);">${ex.muscle_group}</span>
        `;
        card.addEventListener('click', () => openExerciseDetail(ex));
        grid.appendChild(card);
    });
}

const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const category = e.target.getAttribute('data-category');
        renderExercises(category === 'all' ? allExercises : allExercises.filter(ex => ex.muscle_group === category));
    });
});

document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-category="all"]').classList.add('active');
    renderExercises(allExercises.filter(ex => ex.name.toLowerCase().includes(keyword)));
});

document.getElementById('exerciseForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
        const response = await fetch(`${API_BASE_URL}/exercises`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: document.getElementById('exerciseName').value, 
                muscle_group: document.getElementById('exerciseMuscleGroup').value, 
                default_video_url: document.getElementById('exerciseVideoUrl').value,
                description: document.getElementById('exerciseDescription').value
            })
        });
        if (response.ok) {
            addModal.classList.remove('show');
            this.reset();
            fetchExercises(); 
            showToast('動作新增成功！');
        }
    } catch (error) { showToast('伺服器連線失敗！', 'error'); }
});

// ==========================================
// 📖 動作詳情與編輯邏輯
// ==========================================
const editDescBtn = document.getElementById('editDescBtn');
const editDescForm = document.getElementById('editDescForm');
const editDescInput = document.getElementById('editDescInput');

function openExerciseDetail(ex) {
    document.getElementById('detailName').textContent = ex.name;
    document.getElementById('detailMuscle').textContent = ex.muscle_group;
    
    const videoBtn = document.getElementById('detailVideoBtn');
    if (ex.default_video_url) {
        videoBtn.style.display = 'inline-flex'; videoBtn.href = ex.default_video_url;
    } else {
        videoBtn.style.display = 'none';
    }
    
    const descText = document.getElementById('detailDescriptionText');
    descText.innerHTML = ex.description 
        ? `💡 <strong>動作要領：</strong><br>${ex.description.replace(/\n/g, '<br>')}` 
        : `💡 <strong>動作要領：</strong><br><span class="text-muted">尚無詳細說明，點擊編輯新增專屬筆記吧！</span>`;
    
    editDescForm.style.display = 'none';
    if(editDescBtn) editDescBtn.style.display = 'inline-block';

    document.getElementById('displayModeHeader').style.display = 'block';
    document.getElementById('editModeHeader').style.display = 'none';
    
    detailModal.setAttribute('data-current-exercise-id', ex.exercise_id);
    // 💡 新增：每次打開某動作詳情時，順便去撈出該動作專屬的所有影片
    fetchCustomVideos(ex.exercise_id);
    
    // 隱藏新增影片的表單，重置輸入框
    document.getElementById('addVideoForm').style.display = 'none';
    document.getElementById('newVideoTitle').value = '';
    document.getElementById('newVideoUrl').value = '';
    detailModal.classList.add('show');
}

// ==========================================
// 📹 自訂教學影片清單互動邏輯 (user_saved_videos)
// ==========================================

// 展開/收合新增影片表單
document.getElementById('btnToggleAddVideo')?.addEventListener('click', () => {
    const form = document.getElementById('addVideoForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('btnCancelCustomVideo')?.addEventListener('click', () => {
    document.getElementById('addVideoForm').style.display = 'none';
});

// 撈取並渲染影片清單
async function fetchCustomVideos(exerciseId) {
    const listContainer = document.getElementById('customVideoList');
    if (!listContainer || !currentUserId) return;
    
    listContainer.innerHTML = '<li class="text-muted text-sm"><i class="fa-solid fa-spinner fa-spin"></i> 載入影片中...</li>';

    try {
        const response = await fetch(`${API_BASE_URL}/exercises/videos/${exerciseId}?userId=${currentUserId}`);
        const videos = await response.json();
        listContainer.innerHTML = '';

        if (videos.length === 0) {
            listContainer.innerHTML = '<li class="text-muted text-sm">尚無自訂影片，點右上角新增自己珍藏的 YouTube 教學吧！</li>';
            return;
        }

        videos.forEach(vid => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justify = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '6px 0';
            li.style.borderBottom = '1px solid var(--border-color)';
            
            li.innerHTML = `
                <a href="${vid.video_url}" target="_blank" style="color: var(--text-main); text-decoration: none; font-size: 14px;" onmouseover="this.style.color='var(--accent-color)'" onmouseout=\"this.style.color='var(--text-main)'\">
                    <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 12px; color: var(--accent-color);"></i> ${vid.title}
                </a>
                <button class="btn-icon text-muted" onclick="deleteCustomVideo(${vid.video_id}, ${exerciseId})" style="padding: 2px 6px;" title="刪除這部影片"><i class="fa-solid fa-xmark"></i></button>
            `;
            listContainer.appendChild(li);
        });
    } catch (err) { console.error('無法抓取自訂影片:', err); }
}

// 送出新增影片
document.getElementById('btnSaveCustomVideo')?.addEventListener('click', async () => {
    const exerciseId = detailModal.getAttribute('data-current-exercise-id');
    const title = document.getElementById('newVideoTitle').value.trim();
    const videoUrl = document.getElementById('newVideoUrl').value.trim();

    if (!title || !videoUrl) return showToast('影片名稱與網址都不能為空！', 'error');
    if (!currentUserId) return showToast('請先登入系統！', 'error');

    try {
        const response = await fetch(`${API_BASE_URL}/exercises/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, exerciseId, title, videoUrl })
        });
        
        if (response.ok) {
            showToast('影片新增成功！');
            document.getElementById('newVideoTitle').value = '';
            document.getElementById('newVideoUrl').value = '';
            document.getElementById('addVideoForm').style.display = 'none';
            // 重新整理清單
            fetchCustomVideos(exerciseId);
        } else {
            showToast('新增失敗，請確認欄位格式。', 'error');
        }
    } catch (err) { showToast('伺服器連線失敗！', 'error'); }
});

// 刪除影片函數 (綁定到全域以便 HTML onclick 呼叫)
window.deleteCustomVideo = async function(videoId, exerciseId) {
    if (!confirm('確定要刪除這部專屬教學影片嗎？')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/exercises/videos/${videoId}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('影片已成功移除！');
            fetchCustomVideos(exerciseId);
        }
    } catch (err) { showToast('連線失敗！', 'error'); }
};

document.getElementById('editExerciseBtn')?.addEventListener('click', () => {
    const exId = parseInt(detailModal.getAttribute('data-current-exercise-id'));
    const currentEx = allExercises.find(e => e.exercise_id === exId);
    
    document.getElementById('editExName').value = currentEx.name;
    document.getElementById('editExMuscle').value = currentEx.muscle_group;
    document.getElementById('editExVideo').value = currentEx.default_video_url || '';
    
    document.getElementById('displayModeHeader').style.display = 'none';
    document.getElementById('editModeHeader').style.display = 'block';
});

document.getElementById('cancelEditExerciseBtn')?.addEventListener('click', () => {
    document.getElementById('displayModeHeader').style.display = 'block';
    document.getElementById('editModeHeader').style.display = 'none';
});

document.getElementById('saveExerciseBtn')?.addEventListener('click', async () => {
    const exId = detailModal.getAttribute('data-current-exercise-id');
    const updatedData = {
        name: document.getElementById('editExName').value,
        muscle_group: document.getElementById('editExMuscle').value,
        default_video_url: document.getElementById('editExVideo').value
    };

    if(!updatedData.name) return showToast('動作名稱不能為空！', 'error');

    try {
        const response = await fetch(`${API_BASE_URL}/exercises/detail/${exId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        
        if (response.ok) {
            showToast('動作資料更新成功！');
            await fetchExercises(); 
            
            document.getElementById('detailName').textContent = updatedData.name;
            document.getElementById('detailMuscle').textContent = updatedData.muscle_group;
            
            const videoBtn = document.getElementById('detailVideoBtn');
            if (updatedData.default_video_url) {
                videoBtn.style.display = 'inline-flex'; videoBtn.href = updatedData.default_video_url;
            } else {
                videoBtn.style.display = 'none';
            }

            document.getElementById('displayModeHeader').style.display = 'block';
            document.getElementById('editModeHeader').style.display = 'none';
        } else {
            showToast('更新失敗，請確認資料格式。', 'error');
        }
    } catch (err) { showToast('伺服器連線失敗！', 'error'); }
});

document.getElementById('deleteExerciseBtn')?.addEventListener('click', async () => {
    const exId = detailModal.getAttribute('data-current-exercise-id');
    const currentEx = allExercises.find(e => e.exercise_id === parseInt(exId));
    
    if(!confirm(`⚠️ 警告：確定要永久刪除「${currentEx.name}」嗎？`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/exercises/${exId}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (response.ok) {
            showToast('動作已成功刪除！');
            detailModal.classList.remove('show');
            fetchExercises(); 
        } else {
            showToast(result.error, 'error');
        }
    } catch (err) { showToast('刪除失敗，無法連線至伺服器。', 'error'); }
});

document.getElementById('btnGoToLog')?.addEventListener('click', () => {
    detailModal.classList.remove('show');
    const targetBtn = document.querySelector('.nav-btn[data-target="history-page"]');
    if(targetBtn) targetBtn.click();
    const exerciseId = detailModal.getAttribute('data-current-exercise-id');
    const select = document.getElementById('logExerciseSelect');
    if (select && exerciseId) {
        select.value = exerciseId;
        select.dispatchEvent(new Event('change')); 
    }
});

editDescBtn?.addEventListener('click', () => {
    editDescBtn.style.display = 'none';
    editDescForm.style.display = 'block';
    const exId = parseInt(detailModal.getAttribute('data-current-exercise-id'));
    editDescInput.value = allExercises.find(e => e.exercise_id === exId)?.description || '';
});

document.getElementById('cancelDescBtn')?.addEventListener('click', () => {
    editDescForm.style.display = 'none';
    editDescBtn.style.display = 'inline-block';
});

document.getElementById('saveDescBtn')?.addEventListener('click', async () => {
    const exId = detailModal.getAttribute('data-current-exercise-id');
    const newDesc = editDescInput.value;
    try {
        const response = await fetch(`${API_BASE_URL}/exercises/${exId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: newDesc })
        });
        if (response.ok) {
            showToast('動作要領更新成功！');
            fetchExercises();
            document.getElementById('detailDescriptionText').innerHTML = newDesc ? `💡 <strong>動作要領：</strong><br>${newDesc.replace(/\n/g, '<br>')}` : `💡 <strong>動作要領：</strong><br><span class="text-muted">尚無詳細說明...</span>`;
            editDescForm.style.display = 'none';
            editDescBtn.style.display = 'inline-block';
        }
    } catch (err) { showToast('更新失敗！', 'error'); }
});

// ==========================================
// 💡 取得上次紀錄 (漸進式超負荷)
// ==========================================
async function fetchLastLog(exerciseId) {
    if (!currentUserId) return null;
    try {
        const response = await fetch(`${API_BASE_URL}/logs/latest/${exerciseId}?userId=${currentUserId}`);
        return await response.json();
    } catch (error) { return null; }
}

const logExerciseSelect = document.getElementById('logExerciseSelect');
if (logExerciseSelect) {
    logExerciseSelect.addEventListener('change', async (e) => {
        const hintDiv = document.getElementById('lastLogHint');
        const exerciseId = e.target.value;
        if (!exerciseId) { hintDiv.style.display = 'none'; return; }

        const lastLog = await fetchLastLog(exerciseId);
        if (lastLog && lastLog.weight) {
            hintDiv.innerHTML = `<i class="fa-solid fa-lightbulb"></i> 上次紀錄：${lastLog.weight} kg × ${lastLog.reps} 下`;
            hintDiv.style.display = 'block';
        } else {
            hintDiv.innerHTML = `<i class="fa-solid fa-seedling"></i> 這是你的第一次訓練，建立基準點吧！`;
            hintDiv.style.display = 'block';
        }
    });
}

// ==========================================
// 📋 訓練模板與 Live 訓練模式邏輯
// ==========================================
const templateSearchInput = document.getElementById('templateSearchInput');
const templateCategorySelect = document.getElementById('templateCategorySelect');

function filterTemplateCheckboxes() {
    const keyword = templateSearchInput.value.toLowerCase();
    const category = templateCategorySelect.value;
    const checkboxes = document.querySelectorAll('#exerciseCheckboxes .checkbox-item');

    checkboxes.forEach(item => {
        const name = item.getAttribute('data-name');
        const cat = item.getAttribute('data-category');
        const matchesKeyword = name.includes(keyword);
        const matchesCategory = (category === 'all' || cat === category);
        item.style.display = (matchesKeyword && matchesCategory) ? 'flex' : 'none';
    });
}
templateSearchInput?.addEventListener('input', filterTemplateCheckboxes);
templateCategorySelect?.addEventListener('change', filterTemplateCheckboxes);

async function fetchTemplates() {
    if (!currentUserId) return;
    try {
        const response = await fetch(`${API_BASE_URL}/templates?userId=${currentUserId}`);
        const templates = await response.json();
        const list = document.getElementById('templateList');
        if(!list) return;
        list.innerHTML = ''; 
        if (templates.length === 0) { list.innerHTML = '<p class="text-muted">你還沒有建立任何模板喔！</p>'; return; }

        templates.forEach(t => {
            const templateCard = document.createElement('div');
            templateCard.className = 'card';
            templateCard.style.padding = '15px'; templateCard.style.marginBottom = '10px'; templateCard.style.cursor = 'pointer';
            templateCard.style.transition = 'all 0.2s';
            templateCard.onmouseover = () => { templateCard.style.borderColor = 'var(--accent-color)'; };
            templateCard.onmouseout = () => { templateCard.style.borderColor = 'var(--border-color)'; };
            
            let exercisesHtml = t.exercises.map(ex => `<span style="display: inline-block; padding: 3px 8px; margin: 3px; background-color: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px; font-size: 12px;">${ex.name}</span>`).join('');
            if (!exercisesHtml) exercisesHtml = '<span class="text-muted text-sm">(空模板)</span>';

            templateCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 class="mt-0 mb-0" style="color: var(--accent-color);">${t.name}</h4>
                    <button class="btn-primary btn-outline" style="padding: 4px 10px; font-size: 12px;"><i class="fa-solid fa-play"></i> 開始</button>
                </div>
                <div style="display: flex; flex-wrap: wrap;">${exercisesHtml}</div>
            `;
            templateCard.addEventListener('click', () => startLiveWorkout(t));
            list.appendChild(templateCard);
        });
    } catch (error) { console.error('無法抓取模板:', error); }
}

document.getElementById('templateForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const checkedBoxes = document.querySelectorAll('input[name="templateExercise"]:checked');
    const exerciseIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
    if (exerciseIds.length === 0) { showToast('請至少選擇一個動作！', 'error'); return; }

    try {
        const response = await fetch(`${API_BASE_URL}/templates`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: document.getElementById('templateName').value, exerciseIds, userId: currentUserId })
        });
        if (response.ok) { showToast('模板建立成功！'); this.reset(); fetchTemplates(); }
    } catch (error) { showToast('連線失敗！', 'error'); }
});

// Live 訓練
let workoutTimer = null;
let workoutSeconds = 0;
let restTimer = null;
let restSeconds = 90; 
let currentWorkoutData = []; 

async function startLiveWorkout(template) {
    document.getElementById('workoutPromptCard').style.display = 'none';
    const liveCard = document.getElementById('liveWorkoutCard');
    liveCard.style.display = 'block';
    
    document.getElementById('liveWorkoutTitle').textContent = template.name;
    const listContainer = document.getElementById('liveWorkoutList');
    listContainer.innerHTML = '<p class="text-muted text-center"><i class="fa-solid fa-spinner fa-spin"></i> 載入動作與歷史紀錄中...</p>';
    currentWorkoutData = [];

    clearInterval(workoutTimer);
    workoutSeconds = 0;
    document.getElementById('liveWorkoutTime').textContent = '⏱️ 00:00';
    workoutTimer = setInterval(() => {
        workoutSeconds++;
        const mins = String(Math.floor(workoutSeconds / 60)).padStart(2, '0');
        const secs = String(workoutSeconds % 60).padStart(2, '0');
        document.getElementById('liveWorkoutTime').textContent = `⏱️ ${mins}:${secs}`;
    }, 1000);

    listContainer.innerHTML = '';

    for (const ex of template.exercises) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'workout-item';
        
        const lastLog = await fetchLastLog(ex.id);
        let hintHtml = (lastLog && lastLog.weight)
            ? `<div style="color: var(--accent-color); font-size: 12px; margin-top: 5px; font-weight: normal;"><i class="fa-solid fa-lightbulb"></i> 上次：${lastLog.weight} kg × ${lastLog.reps} 下</div>`
            : `<div class="text-muted" style="font-size: 12px; margin-top: 5px; font-weight: normal;"><i class="fa-solid fa-seedling"></i> 首次訓練</div>`;
        
        let rowsHtml = '';
        for(let i=1; i<=3; i++) {
            rowsHtml += `
                <div class="set-row" data-ex-id="${ex.id}" data-set="${i}">
                    <span class="set-number">${i}</span>
                    <input type="number" class="set-input weight-input" placeholder="kg" step="0.1" required>
                    <input type="number" class="set-input reps-input" placeholder="下" required>
                    <button type="button" class="check-btn"><i class="fa-solid fa-check"></i></button>
                </div>
            `;
        }

        // 💡 升級：加入切換單位按鈕、刪除組數按鈕
        itemDiv.innerHTML = `
            <h4 style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div>${ex.name} ${hintHtml}</div>
                <div style="display: flex; gap: 5px; margin-top: 5px;">
                    <button class="btn-edit-link unit-toggle-btn text-sm" data-unit="kg" style="padding: 2px 5px;"><i class="fa-solid fa-scale-balanced"></i> 切換 lbs</button>
                    <button class="btn-outline text-sm remove-set-btn" data-ex-id="${ex.id}" style="padding: 2px 8px; border-color: #e74c3c; color: #e74c3c;">- 減一組</button>
                    <button class="btn-outline text-sm add-set-btn" data-ex-id="${ex.id}" style="padding: 2px 8px;">+ 加一組</button>
                </div>
            </h4>
            <div class="set-container">${rowsHtml}</div>
        `;
        listContainer.appendChild(itemDiv);
    }
    bindCheckButtons();
}

function bindCheckButtons() {
    // 1. 打卡按鈕邏輯 (含 lbs 自動轉換 kg)
    const checkBtns = document.querySelectorAll('.check-btn');
    checkBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            const row = this.closest('.set-row');
            const weightInput = row.querySelector('.weight-input');
            const repsInput = row.querySelector('.reps-input');
            
            if(!weightInput.value || !repsInput.value) { showToast('請先填入重量和次數！', 'error'); return; }

            this.classList.toggle('checked');
            const isChecked = this.classList.contains('checked');
            
            weightInput.disabled = isChecked;
            repsInput.disabled = isChecked;

            // 判斷目前這組的單位是什麼
            const unitBtn = this.closest('.workout-item').querySelector('.unit-toggle-btn');
            const unit = unitBtn ? unitBtn.getAttribute('data-unit') : 'kg';
            
            // 💡 核心防呆：如果是 lbs，自動轉換為 kg 並四捨五入到小數點第一位，保證資料庫數值統一！
            let finalWeight = parseFloat(weightInput.value);
            if (unit === 'lbs') {
                finalWeight = (finalWeight * 0.453592).toFixed(1);
            }

            if(isChecked) {
                startRestTimer();
                currentWorkoutData.push({ exerciseId: row.getAttribute('data-ex-id'), weight: finalWeight, reps: repsInput.value });
            } else {
                const exId = row.getAttribute('data-ex-id');
                // 尋找並移除這筆紀錄
                const index = currentWorkoutData.findIndex(d => d.exerciseId === exId && d.weight == finalWeight && d.reps === repsInput.value);
                if(index > -1) currentWorkoutData.splice(index, 1);
            }
        });
    });

    // 2. 加一組邏輯
    document.querySelectorAll('.add-set-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function() {
            const container = this.closest('.workout-item').querySelector('.set-container');
            const exId = this.getAttribute('data-ex-id');
            const newSetNum = container.querySelectorAll('.set-row').length + 1;
            
            // 繼承目前的單位顯示
            const unitBtn = this.closest('.workout-item').querySelector('.unit-toggle-btn');
            const currentUnit = unitBtn ? unitBtn.getAttribute('data-unit') : 'kg';
            
            const newRow = document.createElement('div');
            newRow.className = 'set-row';
            newRow.setAttribute('data-ex-id', exId);
            newRow.innerHTML = `
                <span class="set-number">${newSetNum}</span>
                <input type="number" class="set-input weight-input" placeholder="${currentUnit}" step="0.1" required>
                <input type="number" class="set-input reps-input" placeholder="下" required>
                <button type="button" class="check-btn"><i class="fa-solid fa-check"></i></button>
            `;
            container.appendChild(newRow);
            bindCheckButtons(); 
        });
    });

    // 3. 減一組邏輯
    document.querySelectorAll('.remove-set-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function() {
            const container = this.closest('.workout-item').querySelector('.set-container');
            const rows = container.querySelectorAll('.set-row');
            
            if (rows.length > 1) {
                const lastRow = rows[rows.length - 1];
                const checkBtn = lastRow.querySelector('.check-btn');
                
                // 如果最後一組已經打卡了，先把它從待存陣列中拔除
                if (checkBtn.classList.contains('checked')) {
                    if(!confirm('最後一組已經打卡完成，確定要刪除該組紀錄嗎？')) return;
                    checkBtn.click(); // 模擬點擊取消打卡，觸發資料陣列移除
                }
                lastRow.remove();
            } else {
                showToast('至少要保留一組喔！', 'error');
            }
        });
    });

    // 4. 切換單位 (kg / lbs) 邏輯
    document.querySelectorAll('.unit-toggle-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function() {
            const isKg = this.getAttribute('data-unit') === 'kg';
            const newUnit = isKg ? 'lbs' : 'kg';
            
            this.setAttribute('data-unit', newUnit);
            this.innerHTML = `<i class="fa-solid fa-scale-balanced"></i> 切換 ${isKg ? 'kg' : 'lbs'}`; // 顯示「切換到另一個」
            
            // 將下面所有還沒打卡的重量輸入框 placeholder 換掉
            const container = this.closest('.workout-item').querySelector('.set-container');
            container.querySelectorAll('.weight-input').forEach(input => {
                if (!input.disabled) {
                    input.placeholder = newUnit;
                }
            });
            showToast(`已切換為 ${newUnit} 輸入模式 (儲存時會自動轉為 kg)`);
        });
    });
}

function startRestTimer() {
    clearInterval(restTimer);
    restSeconds = 90;
    document.getElementById('restTimerContainer').style.display = 'block';
    updateRestDisplay();
    restTimer = setInterval(() => {
        restSeconds--;
        if(restSeconds <= 0) { clearInterval(restTimer); document.getElementById('restTimerContainer').style.display = 'none'; }
        updateRestDisplay();
    }, 1000);
}

function updateRestDisplay() {
    const mins = String(Math.floor(restSeconds / 60)).padStart(2, '0');
    const secs = String(restSeconds % 60).padStart(2, '0');
    document.getElementById('restTimeDisplay').textContent = `${mins}:${secs}`;
}

document.getElementById('addTimeBtn')?.addEventListener('click', () => { restSeconds += 30; updateRestDisplay(); });
document.getElementById('skipTimeBtn')?.addEventListener('click', () => { clearInterval(restTimer); document.getElementById('restTimerContainer').style.display = 'none'; });
document.getElementById('cancelWorkoutBtn')?.addEventListener('click', () => {
    if(confirm('確定要結束訓練嗎？未完成的紀錄將不會儲存。')) {
        clearInterval(workoutTimer); clearInterval(restTimer);
        document.getElementById('liveWorkoutCard').style.display = 'none';
        document.getElementById('workoutPromptCard').style.display = 'block';
    }
});

const formatYMD = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

document.getElementById('finishWorkoutBtn')?.addEventListener('click', async () => {
    if(currentWorkoutData.length === 0) { showToast('你還沒有完成任何一組訓練喔！', 'error'); return; }
    if(!confirm('幹得好！確定要儲存這場訓練的紀錄嗎？')) return;

    try {
        const promises = currentWorkoutData.map(data => {
            return fetch(`${API_BASE_URL}/logs`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exerciseId: data.exerciseId, weight: data.weight, reps: data.reps, logDate: formatYMD(new Date()), userId: currentUserId })
            });
        });

        await Promise.all(promises);
        showToast('完美收工！紀錄已成功儲存。');
        clearInterval(workoutTimer); clearInterval(restTimer);
        document.getElementById('liveWorkoutCard').style.display = 'none';
        document.getElementById('workoutPromptCard').style.display = 'block';
        
        fetchLogs(); fetchPRs();
    } catch (error) { showToast('儲存過程中發生錯誤！', 'error'); }
});

// ==========================================
// 📅 歷史紀錄 (行事曆) 與 PR 邏輯
// ==========================================
let allLogs = [];
let currentNavDate = new Date(); 
let selectedDate = new Date();   

async function fetchLogs() {
    if (!currentUserId) return;
    try {
        const response = await fetch(`${API_BASE_URL}/logs?userId=${currentUserId}`);
        allLogs = await response.json();
        renderCalendar();         
        renderSelectedDayLogs();  
        if (typeof updateVolumeChart === 'function') updateVolumeChart(allLogs);
    } catch (error) { console.error('無法抓取訓練紀錄:', error); }
}

function renderCalendar() {
    const year = currentNavDate.getFullYear();
    const month = currentNavDate.getMonth();
    const el = document.getElementById('currentMonthYear');
    if(el) el.textContent = `${year} 年 ${month + 1} 月`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = document.getElementById('calendarDays');
    if(!calendarDays) return;
    calendarDays.innerHTML = '';

    const todayStr = formatYMD(new Date());
    const selectedStr = formatYMD(selectedDate);

    const logsByDate = {};
    allLogs.forEach(log => {
        const dateStr = formatYMD(new Date(log.log_date));
        if (!logsByDate[dateStr]) logsByDate[dateStr] = [];
        logsByDate[dateStr].push(log);
    });

    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day muted';
        calendarDays.appendChild(emptyDiv);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = i;
        const currentDayStr = formatYMD(new Date(year, month, i));

        if (currentDayStr === todayStr) dayDiv.classList.add('today');
        if (currentDayStr === selectedStr) dayDiv.classList.add('active');

        if (logsByDate[currentDayStr] && logsByDate[currentDayStr].length > 0) {
            const dot = document.createElement('div');
            dot.className = 'workout-dot';
            dayDiv.appendChild(dot);
        }

        dayDiv.addEventListener('click', () => {
            selectedDate = new Date(year, month, i);
            renderCalendar(); 
            renderSelectedDayLogs(); 
            document.getElementById('logDate').value = currentDayStr;
            document.getElementById('addLogCard').style.display = 'block';
        });

        calendarDays.appendChild(dayDiv);
    }
}

document.getElementById('prevMonth')?.addEventListener('click', () => { currentNavDate.setMonth(currentNavDate.getMonth() - 1); renderCalendar(); });
document.getElementById('nextMonth')?.addEventListener('click', () => { currentNavDate.setMonth(currentNavDate.getMonth() + 1); renderCalendar(); });

function renderSelectedDayLogs() {
    const list = document.getElementById('selectedDayLogs');
    if(!list) return;
    const targetDateStr = formatYMD(selectedDate);
    const titleDate = targetDateStr === formatYMD(new Date()) ? '今天' : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`;
    document.getElementById('selectedDateTitle').innerHTML = `${titleDate} <span class="text-sm text-muted" style="font-weight:normal;">的訓練</span>`;
    
    list.innerHTML = '';
    const dayLogs = allLogs.filter(log => formatYMD(new Date(log.log_date)) === targetDateStr);

    if (dayLogs.length === 0) {
        list.innerHTML = '<li class="text-muted text-sm">這天沒有訓練紀錄喔，點擊下方按鈕馬上開始！</li>';
        return;
    }

    dayLogs.forEach(log => {
        const li = document.createElement('li');
        li.style.padding = '10px 0'; li.style.borderBottom = '1px solid var(--border-color)';
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-weight: bold; color: var(--accent-color);">${log.exercise_name}</span><br>
                    <span class="text-sm text-muted">${log.weight} kg × ${log.reps} 下</span>
                </div>
                <button class="btn-icon btn-danger" onclick="deleteLog(${log.log_id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        list.appendChild(li);
    });
}

document.getElementById('btnShowAddLog')?.addEventListener('click', () => {
    const formCard = document.getElementById('addLogCard');
    formCard.style.display = formCard.style.display === 'none' ? 'block' : 'none';
    document.getElementById('logDate').value = formatYMD(selectedDate);
});

async function fetchPRs() {
    if (!currentUserId) return;
    try {
        const response = await fetch(`${API_BASE_URL}/prs?userId=${currentUserId}`);
        const prs = await response.json();
        const prList = document.getElementById('prList');
        if(!prList) return;
        prList.innerHTML = ''; 
        if (prs.length === 0) { prList.innerHTML = '<li class="text-muted">創造你的第一個 PR 吧！</li>'; return; }

        prs.forEach(pr => {
            const li = document.createElement('li');
            li.style.background = 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)'; li.style.color = '#5C4000';
            li.style.padding = '10px 16px'; li.style.borderRadius = '12px'; li.style.boxShadow = '0 4px 10px rgba(255, 215, 0, 0.3)'; li.style.fontWeight = 'bold'; li.style.fontSize = '14px';
            li.innerHTML = `🥇 ${pr.exercise_name} : ${pr.pr_weight} kg`;
            prList.appendChild(li);
        });
    } catch (error) { console.error('無法抓取 PR:', error); }
}

// ==========================================
// 📅 行事曆新增紀錄：單位切換與送出邏輯
// ==========================================

// 1. 綁定行事曆的單位切換按鈕
const calendarUnitBtn = document.getElementById('calendarUnitBtn');
if (calendarUnitBtn) {
    calendarUnitBtn.addEventListener('click', function() {
        const isKg = this.getAttribute('data-unit') === 'kg';
        const newUnit = isKg ? 'lbs' : 'kg';
        
        // 更新按鈕狀態與視覺
        this.setAttribute('data-unit', newUnit);
        this.innerHTML = `<i class="fa-solid fa-scale-balanced"></i> ${newUnit}`;
        
        // 更新輸入框的浮水印提示
        document.getElementById('logWeight').placeholder = newUnit;
    });
}

// 2. 行事曆表單送出 (含 lbs 自動轉 kg 防呆機制)
document.getElementById('workoutLogForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 取得使用者輸入的重量與當前選擇的單位
    let weight = parseFloat(document.getElementById('logWeight').value);
    const unit = document.getElementById('calendarUnitBtn')?.getAttribute('data-unit') || 'kg';
    
    // 💡 核心防呆：如果使用者輸入的是 lbs，在送出給資料庫前，偷偷把它轉成 kg！
    if (unit === 'lbs') {
        weight = parseFloat((weight * 0.453592).toFixed(1));
    }

    try {
        const response = await fetch(`${API_BASE_URL}/logs`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                exerciseId: document.getElementById('logExerciseSelect').value, 
                weight: weight, // 這裡送出的一定會是 kg
                reps: document.getElementById('logReps').value, 
                logDate: document.getElementById('logDate').value, 
                userId: currentUserId 
            })
        });
        
        if (response.ok) { 
            // 提示訊息順便告訴使用者我們幫他存成了幾公斤，展現系統的聰明
            showToast(`紀錄成功！(已儲存為 ${weight} kg)`); 
            document.getElementById('logWeight').value = '';
            document.getElementById('logReps').value = '';
            
            // 如果原本是 lbs，打卡完自動幫他切回 kg 預設值
            if(calendarUnitBtn.getAttribute('data-unit') === 'lbs') {
                calendarUnitBtn.click(); 
            }
            
            fetchLogs(); fetchPRs(); 
        }
    } catch (error) { 
        showToast('連線失敗！', 'error'); 
    }
});

window.deleteLog = async function(logId) {
    if (!confirm('確定要刪除這筆訓練紀錄嗎？')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/logs/${logId}`, { method: 'DELETE' });
        if (response.ok) { showToast('已刪除紀錄！'); fetchLogs(); fetchPRs(); }
    } catch (error) { showToast('連線失敗！', 'error'); }
};

// ==========================================
// 🧮 實用計算器邏輯
// ==========================================
document.getElementById('btnCalcRM')?.addEventListener('click', () => {
    const weight = parseFloat(document.getElementById('rmWeight').value);
    const reps = parseInt(document.getElementById('rmReps').value);
    const resultDiv = document.getElementById('rmResult');
    if (!weight || !reps || weight <= 0 || reps <= 0) return resultDiv.innerHTML = '<span class="text-danger">請輸入正確數值！</span>';
    const oneRM = reps > 1 ? weight * (1 + reps / 30) : weight;
    resultDiv.innerHTML = `1RM 預估為：<span style="font-size: 28px; color: var(--accent-color);">${oneRM.toFixed(1)}</span> kg`;
});

document.getElementById('btnCalcBMI')?.addEventListener('click', () => {
    const height = parseFloat(document.getElementById('bmiHeight').value);
    const weight = parseFloat(document.getElementById('bmiWeight').value);
    const resultDiv = document.getElementById('bmiResult');
    if (!height || !weight || height <= 0 || weight <= 0) return resultDiv.innerHTML = '<span class="text-danger">請輸入正確數值！</span>';
    
    const bmi = weight / Math.pow(height / 100, 2);
    let status = '', color = '';
    if (bmi < 18.5) { status = '(過輕)'; color = '#f39c12'; }
    else if (bmi < 24) { status = '(健康)'; color = 'var(--accent-color)'; }
    else if (bmi < 27) { status = '(過重)'; color = '#f39c12'; }
    else { status = '(肥胖)'; color = '#e74c3c'; }
    resultDiv.innerHTML = `BMI 為：<span style="font-size: 28px; color: ${color};">${bmi.toFixed(1)}</span> <span style="color: ${color};" class="text-sm">${status}</span>`;
});

// ==========================================
// 📊 Chart.js 進階動態數據圖表邏輯 (預估 1RM 折線圖)
// ==========================================
let progressChartInstance = null;

function updateProgressChart(exerciseId) {
    const chartCanvas = document.getElementById('progressChart');
    if (!chartCanvas || !currentUserId || !exerciseId) return;

    // 1. 從你所有的訓練紀錄中，篩選出「目前選中」的這個動作
    const exerciseLogs = allLogs.filter(log => log.exercise_id == exerciseId);

    // 2. 演算法：將紀錄依照「日期」分組，並計算出每一天該動作的「最高預估 1RM」
    const rmByDate = {};
    exerciseLogs.forEach(log => {
        const dateStr = formatYMD(new Date(log.log_date));
        // 1RM 計算公式：重量 * (1 + 次數 / 30)
        const oneRM = log.reps > 1 ? parseFloat(log.weight) * (1 + parseInt(log.reps) / 30) : parseFloat(log.weight);
        
        // 如果那天還沒紀錄，或是這組的 1RM 比那天之前算出來的還高，就覆蓋它
        if (!rmByDate[dateStr] || oneRM > rmByDate[dateStr]) {
            rmByDate[dateStr] = oneRM;
        }
    });

    // 3. 把日期由舊到新排序 (這樣折線圖才會從左畫到右)
    const sortedDates = Object.keys(rmByDate).sort((a, b) => new Date(a) - new Date(b));
    const rmData = sortedDates.map(date => rmByDate[date].toFixed(1));

    // 如果沒有資料，也可以提早 return 或顯示空圖表
    if (sortedDates.length === 0) {
        showToast('這個動作目前還沒有紀錄喔！', 'error');
    }

    // 4. 清除舊圖表並繪製新的 Chart.js 折線圖
    if (progressChartInstance) {
        progressChartInstance.destroy();
    }

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#00e676';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim() || '#2c3e50';
    const ctx = chartCanvas.getContext('2d');
    
    progressChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates, // X 軸：日期
            datasets: [{
                label: '預估 1RM (kg)',
                data: rmData,        // Y 軸：最高 1RM 數值
                borderColor: primaryColor,
                backgroundColor: primaryColor + '33', // 加上 33 變成帶透明度的漸層填色
                borderWidth: 3,
                pointBackgroundColor: primaryColor,
                pointRadius: 5,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.3 // 讓折線帶有優美滑順的弧度
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    callbacks: {
                        label: function(context) { return ` 預估極限重量: ${context.parsed.y} kg`; }
                    }
                }
            },
            scales: {
                y: { 
                    ticks: { color: textColor, font: { family: 'Segoe UI' } },
                    grid: { color: 'rgba(200, 200, 200, 0.2)' },
                    // 自動調整 Y 軸下限，讓圖表波動看起來更明顯
                    suggestedMin: rmData.length > 0 ? Math.max(0, Math.min(...rmData) - 10) : 0
                },
                x: { 
                    ticks: { color: textColor, font: { family: 'Segoe UI' } },
                    grid: { display: false } 
                }
            }
        }
    });
}

// 綁定下拉選單的「變更事件」，一選動作就馬上重畫圖表
document.getElementById('chartExerciseSelect')?.addEventListener('change', (e) => {
    updateProgressChart(e.target.value);
});

// 當新增或刪除紀錄後，順便觸發圖表更新 (修改舊的 fetchLogs)
const originalFetchLogs = fetchLogs;
fetchLogs = async function() {
    await originalFetchLogs();
    const selectedEx = document.getElementById('chartExerciseSelect')?.value;
    if (selectedEx) updateProgressChart(selectedEx);
};

// ==========================================
// 🔐 登入/註冊系統與 🚀 網站導覽 (Intro.js) 邏輯
// ==========================================
let isLoginMode = true; 
let currentUserId = null; 

const authForm = document.getElementById('authForm');
const toggleAuthModeBtn = document.getElementById('toggleAuthModeBtn');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authSubtitle = document.getElementById('authSubtitle');

if (authForm && toggleAuthModeBtn) {
    toggleAuthModeBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authSubtitle.textContent = '請登入以繼續你的訓練旅程';
            authSubmitBtn.textContent = '登入系統';
            toggleAuthModeBtn.textContent = '還沒有帳號？點此註冊';
        } else {
            authSubtitle.textContent = '建立新帳號，開始記錄訓練';
            authSubmitBtn.textContent = '註冊帳號';
            toggleAuthModeBtn.textContent = '已經有帳號了？點此登入';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('authUsername').value;
        const password = document.getElementById('authPassword').value;

        const endpoint = isLoginMode ? '/login' : '/register';
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();

            if (response.ok) {
                if (isLoginMode) {
                    currentUserId = data.user.user_id; 
                    showToast(`🎉 歡迎回來，${data.user.username}！`);
                    
                    fetchTemplates();
                    fetchLogs();
                    fetchPRs();
                    
                    document.getElementById('loginOverlay').classList.add('hidden');
                    
                    setTimeout(() => {
                        if(confirm('需要為您進行系統功能導覽嗎？\n(強烈建議新用戶體驗！)')) {
                            startSystemTour();
                        }
                    }, 800);
                } else {
                    showToast('🎉 註冊成功！請直接登入。');
                    toggleAuthModeBtn.click(); 
                    document.getElementById('authPassword').value = ''; 
                }
            } else {
                showToast(data.error, 'error');
            }
        } catch (error) {
            showToast('伺服器連線異常，請確認後端是否啟動！', 'error');
        }
    });
}

function startSystemTour() {
    if (typeof introJs !== 'undefined') {
        introJs().setOptions({
            nextLabel: '下一步',
            prevLabel: '上一步',
            doneLabel: '開始訓練！',
            showProgress: true,
            showBullets: false,
            steps: [
                { title: '🎉 歡迎來到 ProFit 2.0', intro: '這是一款專為健身愛好者打造的專業追蹤系統。' },
                { element: document.querySelector('.nav-menu'), title: '🧭 導覽列', intro: '隨時在此切換動作庫、訓練中心與數據分析。', position: 'right' },
                { element: document.querySelector('.theme-toggle'), title: '🌙 深淺色模式', intro: '點擊這裡隨時切換主題！', position: 'top' },
                { element: document.querySelector('[data-target="training-page"]'), title: '⚡ 實時訓練模式', intro: '在這裡自訂菜單，啟動打卡與組間休息倒數！', position: 'right' }
            ]
        }).start();
    }
}

// ==========================================
// 📱 PWA Service Worker 註冊
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}

// ==========================================
// 🚀 網頁初始化載入
// ==========================================
fetchExercises();