function switchMode(mode) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '';
    
    if (mode === 'create') {
        showCreateMode();
    } else if (mode === 'update') {
        showUpdateMode();
    } else if (mode === 'view') {
        showViewMode();
    }
}

// 新規作成モード
function showCreateMode() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div id="createPhase">
            <div class="input-group">
                <label>ノートタイトル</label>
                <input type="text" id="noteTitle" placeholder="タイトルを入力">
            </div>
            <div class="input-group">
                <label>基幹文</label>
                <textarea id="mainText" placeholder="基幹文を入力（改行で複数行）"></textarea>
            </div>
            <div class="button-container">
                <button class="btn btn-primary" onclick="registerMain()">登録</button>
            </div>
        </div>
    `;
}

function registerMain() {
    const title = document.getElementById('noteTitle').value.trim();
    const mainText = document.getElementById('mainText').value;
    
    if (!title) {
        alert('タイトルを入力してください');
        return;
    }
    
    if (!mainText) {
        alert('基幹文を入力してください');
        return;
    }
    
    if (confirm('この内容でタイトルと基幹文を登録します。よろしいですか？')) {
        noteData.title = title;
        noteData.created = new Date().toISOString();
        noteData.contents = mainText.split('\n').map(line => ({
            main: line,
            relate: []
        }));
        
        showRelatePhase();
    }
}

function showRelatePhase() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div id="relatePhase"></div>';
    
    const relatePhase = document.getElementById('relatePhase');
    
    noteData.contents.forEach((item, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'main-line';
        let relateSection = null;
        
        if (item.main.trim() === '') {
            lineDiv.classList.add('empty');
            lineDiv.innerHTML = '<div class="empty-line"></div>';
        } else {
            lineDiv.innerHTML = `
                <div class="main-text">${escapeHtml(item.main)}</div>
                <button class="toggle-btn" onclick="toggleRelateInput(${index})">＋</button>
            `;
            
            relateSection = document.createElement('div');
            relateSection.className = 'relate-section';
            relateSection.id = `relate-section-${index}`;
            relateSection.innerHTML = `
                <div id="relate-inputs-${index}">
                    <div class="relate-input-group">
                        <textarea placeholder="関連文を入力" data-index="0"></textarea>
                        <button class="small-btn" onclick="addRelateInput(${index})">＋</button>
                    </div>
                </div>
                <div class="button-container">
                    <button class="btn btn-success associate-btn" onclick="associateRelate(${index})">基幹文に関連付ける</button>
                </div>
            `;
        }
        
        relatePhase.appendChild(lineDiv);
        // relateSection が存在する場合（空行でない場合）、lineDiv の後に追加
        if (relateSection) relatePhase.appendChild(relateSection);
    });
    
    relatePhase.innerHTML += '<div class="button-container"><button class="btn btn-primary json-btn" onclick="prepareDownload()">データをJSON化する</button></div>';
}

function toggleRelateInput(index) {
    const section = document.getElementById(`relate-section-${index}`);
    const btn = event.target;
    
    if (section.classList.contains('show')) {
        section.classList.remove('show');
        btn.textContent = '＋';
    } else {
        section.classList.add('show');
        btn.textContent = 'ー';
    }
}

function addRelateInput(mainIndex) {
    const container = document.getElementById(`relate-inputs-${mainIndex}`);
    const currentInputs = container.querySelectorAll('textarea');
    const lastInput = currentInputs[currentInputs.length - 1];
    
    if (!lastInput.value.trim()) {
        alert('現在の入力欄に内容を入力してください');
        return;
    }
    
    const newIndex = currentInputs.length;
    const newInputGroup = document.createElement('div');
    newInputGroup.className = 'relate-input-group';
    newInputGroup.innerHTML = `
        <textarea placeholder="関連文を入力" data-index="${newIndex}"></textarea>
        <button class="small-btn" onclick="addRelateInput(${mainIndex})">＋</button>
        <button class="small-btn minus" onclick="removeRelateInput(${mainIndex}, ${newIndex})">ー</button>
    `;
    
    container.appendChild(newInputGroup);
}

function removeRelateInput(mainIndex, startIndex) {
    const container = document.getElementById(`relate-inputs-${mainIndex}`);
    const groups = container.querySelectorAll('.relate-input-group');
    
    for (let i = groups.length - 1; i >= startIndex; i--) {
        groups[i].remove();
    }
}

function associateRelate(mainIndex) {
    const container = document.getElementById(`relate-inputs-${mainIndex}`);
    const inputs = container.querySelectorAll('textarea');
    const relatedTexts = Array.from(inputs)
        .map(input => input.value.trim())
        .filter(text => text !== '');

    if (relatedTexts.length === 0) {
        alert('関連文が入力されていません。');
        return;
    }

    if (confirm('基幹文に関連付けてよろしいですか？')) {
        noteData.contents[mainIndex].relate = relatedTexts.map(text => ({ text: text }));

        const section = document.getElementById(`relate-section-${mainIndex}`);
        section.classList.remove('show');

        const toggleButton = document.querySelector(`button[onclick="toggleRelateInput(${mainIndex})"]`);
        if (toggleButton) toggleButton.textContent = '＋';
    }
}

function prepareDownload() {
    const contentArea = document.getElementById('contentArea');
    const relateCount = noteData.contents.filter(item => item.relate.length > 0).length;
    
    contentArea.innerHTML = `
        <div class="download-info">
            <p><strong>ノートタイトル:</strong> ${escapeHtml(noteData.title)}</p>
            <p><strong>基幹文行数:</strong> ${noteData.contents.length}行</p>
            <p><strong>関連文を登録した基幹文の行数:</strong> ${relateCount}行</p>
        </div>
        <div class="button-container">
            <button class="btn btn-success" onclick="downloadJSON()">JSONをダウンロード</button>
        </div>
    `;
}

function downloadJSON() {
    // contentsの各要素を1行のJSON文字列に変換
    const contentsLines = noteData.contents.map(item => {
        return `    ${JSON.stringify(item)}`;
    }).join(',\n');

    // 手動でJSON文字列を構築
    const dataStr = `{
  "title": ${JSON.stringify(noteData.title)},
  "created": ${JSON.stringify(noteData.created)},
  "contents": [\n${contentsLines}\n  ]\n}`;
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteData.title || 'note'}_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// 更新モード
function showUpdateMode() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="drop-zone" id="dropZoneUpdate">
            <p>JSONファイルをドラッグ＆ドロップ<br>またはクリックして選択</p>
        </div>
        <div id="fileInfoUpdate" class="hidden"></div>
    `;
    
    setupFileUpload('dropZoneUpdate', 'fileInfoUpdate', 'update');
}

// 閲覧モード
function showViewMode() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="drop-zone" id="dropZoneView">
            <p>JSONファイルをドラッグ＆ドロップ<br>またはクリックして選択</p>
        </div>
        <div id="fileInfoView" class="hidden"></div>
    `;
    
    setupFileUpload('dropZoneView', 'fileInfoView', 'view');
}

function setupFileUpload(dropZoneId, fileInfoId, mode) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInfo = document.getElementById(fileInfoId);
    
    dropZone.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => handleFileSelect(e.target.files[0], fileInfo, mode);
        input.click();
    });
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files[0], fileInfo, mode);
    });
}

function handleFileSelect(file, fileInfoDiv, mode) {
    if (!file || !file.name.endsWith('.json')) {
        alert('JSONファイルを選択してください');
        return;
    }
    
    loadedFile = file;
    fileInfoDiv.classList.remove('hidden');
    fileInfoDiv.innerHTML = `
        <div class="file-info">
            <p><strong>ファイル名:</strong> ${escapeHtml(file.name)}</p>
            <p><strong>サイズ:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
            <div class="button-container">
                <button class="btn btn-primary" onclick="loadFile('${mode}')">このファイルを読み込む</button>
            </div>
        </div>
    `;
}

function loadFile(mode) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            noteData = JSON.parse(e.target.result);
            
            if (mode === 'update') {
                showUpdateRelatePhase();
            } else if (mode === 'view') {
                showViewData();
            }
        } catch (error) {
            alert('JSONファイルの読み込みに失敗しました');
        }
    };
    reader.readAsText(loadedFile);
}

function showUpdateRelatePhase() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div id="updateRelatePhase"></div>';
    
    const relatePhase = document.getElementById('updateRelatePhase');
    
    noteData.contents.forEach((item, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'main-line';
        let relateSection = null;
        
        if (item.main.trim() === '') {
            lineDiv.classList.add('empty');
            lineDiv.innerHTML = '<div class="empty-line"></div>';
        } else {
            lineDiv.innerHTML = `
                <div class="main-text">${escapeHtml(item.main)}</div>
                <button class="toggle-btn" onclick="toggleUpdateRelateInput(${index})">＋</button>
            `;
            
            relateSection = document.createElement('div');
            relateSection.className = 'relate-section';
            relateSection.id = `update-relate-section-${index}`;
            
            let inputsHtml = '';
            if (item.relate.length > 0) {
                item.relate.forEach((rel, relIndex) => {
                    const minusBtn = relIndex > 0 ? '<button class="small-btn minus" onclick="removeUpdateRelateInput(' + index + ', ' + relIndex + ')">ー</button>' : '';
                    inputsHtml += `
                        <div class="relate-input-group">
                            <textarea data-index="${relIndex}">${escapeHtml(rel.text)}</textarea>
                            <button class="small-btn" onclick="addUpdateRelateInput(${index})">＋</button>
                            ${minusBtn}
                        </div>
                    `;
                });
            } else {
                inputsHtml = `
                    <div class="relate-input-group">
                        <textarea placeholder="関連文を入力" data-index="0"></textarea>
                        <button class="small-btn" onclick="addUpdateRelateInput(${index})">＋</button>
                    </div>
                `;
            }
            
            relateSection.innerHTML = `
                <div id="update-relate-inputs-${index}">${inputsHtml}</div>
                <div class="button-container">
                    <button class="btn btn-success associate-btn" onclick="updateAssociateRelate(${index})">基幹文に関連付ける</button>
                </div>
            `;
        }
        
        relatePhase.appendChild(lineDiv);
        // relateSection が存在する場合（空行でない場合）、lineDiv の後に追加
        if (relateSection) relatePhase.appendChild(relateSection);
    });
    
    relatePhase.innerHTML += '<div class="button-container"><button class="btn btn-primary json-btn" onclick="prepareDownload()">データをJSON化する</button></div>';
}

function toggleUpdateRelateInput(index) {
    const section = document.getElementById(`update-relate-section-${index}`);
    const btn = event.target;
    
    if (section.classList.contains('show')) {
        section.classList.remove('show');
        btn.textContent = '＋';
    } else {
        section.classList.add('show');
        btn.textContent = 'ー';
    }
}

function addUpdateRelateInput(mainIndex) {
    const container = document.getElementById(`update-relate-inputs-${mainIndex}`);
    const currentInputs = container.querySelectorAll('textarea');
    const lastInput = currentInputs[currentInputs.length - 1];
    
    if (!lastInput.value.trim()) {
        alert('現在の入力欄に内容を入力してください');
        return;
    }
    
    const newIndex = currentInputs.length;
    const newInputGroup = document.createElement('div');
    newInputGroup.className = 'relate-input-group';
    newInputGroup.innerHTML = `
        <textarea placeholder="関連文を入力" data-index="${newIndex}"></textarea>
        <button class="small-btn" onclick="addUpdateRelateInput(${mainIndex})">＋</button>
        <button class="small-btn minus" onclick="removeUpdateRelateInput(${mainIndex}, ${newIndex})">ー</button>
    `;
    
    container.appendChild(newInputGroup);
}

function removeUpdateRelateInput(mainIndex, startIndex) {
    const container = document.getElementById(`update-relate-inputs-${mainIndex}`);
    const groups = container.querySelectorAll('.relate-input-group');
    
    for (let i = groups.length - 1; i >= startIndex; i--) {
        groups[i].remove();
    }
}

function updateAssociateRelate(mainIndex) {
    if (confirm('基幹文に関連付けてよろしいですか？')) {
        const container = document.getElementById(`update-relate-inputs-${mainIndex}`);
        const inputs = container.querySelectorAll('textarea');
        
        noteData.contents[mainIndex].relate = [];
        inputs.forEach(input => {
            const text = input.value.trim();
            if (text) {
                noteData.contents[mainIndex].relate.push({ text: text });
            }
        });
        
        const section = document.getElementById(`update-relate-section-${mainIndex}`);
        section.classList.remove('show');
        
        const toggleButton = document.querySelector(`button[onclick="toggleUpdateRelateInput(${mainIndex})"]`);
        if (toggleButton) toggleButton.textContent = '＋';
    }
}

function showViewData() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div id="viewDataPhase"></div>';
    
    const viewPhase = document.getElementById('viewDataPhase');
    
    noteData.contents.forEach((item, index) => {
        const lineDiv = document.createElement('div');
        let relateSection = null;
        lineDiv.className = 'main-line';
        
        if (item.main.trim() === '') {
            lineDiv.classList.add('empty');
            lineDiv.innerHTML = '<div class="empty-line"></div>';
        } else {
            const hasRelate = item.relate && item.relate.length > 0;
            lineDiv.innerHTML = `
                <div class="main-text">${escapeHtml(item.main)}</div>
                ${hasRelate ? `<button class="toggle-btn" onclick="toggleViewRelate(${index})">＋</button>` : ''}
            `;
            
            if (hasRelate) {
                relateSection = document.createElement('div');
                relateSection.className = 'relate-section';
                relateSection.id = `view-relate-${index}`;
                
                item.relate.forEach((rel, relIndex) => {
                    const hasNext = relIndex < item.relate.length - 1;
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'relate-item';
                    itemDiv.id = `view-relate-item-${index}-${relIndex}`;
                    itemDiv.style.display = relIndex === 0 ? 'flex' : 'none';
                    itemDiv.innerHTML = `
                        <div class="relate-item-text">${escapeHtml(rel.text)}</div>
                        ${hasNext ? `<button class="toggle-btn" onclick="showNextRelate(event, ${index}, ${relIndex})">＋</button>` : ''}
                    `;
                    relateSection.appendChild(itemDiv);
                });
            }
        }
        
        viewPhase.appendChild(lineDiv);
        if (relateSection) viewPhase.appendChild(relateSection);
    });
}

function toggleViewRelate(index) {
    const section = document.getElementById(`view-relate-${index}`);
    const btn = event.target;
    
    if (section.classList.contains('show')) {
        section.classList.remove('show');
        btn.textContent = '＋';
        
        // 全ての関連文を非表示にして最初のものだけ表示
        const items = section.querySelectorAll('.relate-item');
        items.forEach((item, i) => {
            item.style.display = i === 0 ? 'flex' : 'none';
        });

        // 表示されていた「＋」ボタンを再表示させる
        const nextButtons = section.querySelectorAll('.toggle-btn');
        nextButtons.forEach(button => {
            button.style.display = ''; // インラインスタイルをリセット
        });
    } else {
        section.classList.add('show');
        btn.textContent = 'ー';
    }
}

function showNextRelate(event, mainIndex, currentIndex) {
    const nextIndex = currentIndex + 1;
    const nextItem = document.getElementById(`view-relate-item-${mainIndex}-${nextIndex}`);
    if (nextItem) {
        nextItem.style.display = 'flex';
    }
    // クリックされたボタンを非表示にする
    event.target.style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
