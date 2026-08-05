function switchMode(mode) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '';
    
    // タイトルスペースを非表示・クリアにする
    const titleSpace = document.getElementById('noteTitleSpace');
    if (titleSpace) {
        titleSpace.style.display = 'none';
        const titleText = document.getElementById('noteTitleText');
        if (titleText) titleText.textContent = '';
    }
    
    if (mode === 'create') {
        showCreateMode();
    } else if (mode === 'update') {
        showUpdateMode();
    } else if (mode === 'view') {
        showViewMode();
    }
}

// タイトル表示用スペースの更新と表示
function displayTitleSpace() {
    const titleSpace = document.getElementById('noteTitleSpace');
    const titleText = document.getElementById('noteTitleText');
    if (titleSpace && titleText) {
        titleText.textContent = noteData.title || '';
        titleSpace.style.display = 'flex';
    }
}

// 新規作成モード
function showCreateMode() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div id="createPhase">
            <div class="input-group">
                <label>ノートタイトル</label>
                <input type="text" id="noteTitle" placeholder="タイトルを入力" maxlength="100">
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

        // 末尾の空行を削除する
        const lines = mainText.split('\n');
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
            lines.pop();
        }

        noteData.contents = lines.map(line => ({
            main: line,
            relate: []
        }));
        
        showRelatePhase();
    }
}

function showRelatePhase() {
    displayTitleSpace();
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
            const hasRelate = item.relate && item.relate.length > 0;
            const buttonClass = `toggle-btn ${hasRelate ? 'has-relate' : ''}`;

            lineDiv.innerHTML = `
                <div class="main-text">${escapeHtml(item.main)}</div>
                <button class="${buttonClass}" onclick="toggleRelateInput(${index})">＋</button>
            `;
            
            relateSection = document.createElement('div');
            relateSection.className = 'relate-section';
            relateSection.id = `relate-section-${index}`;
            relateSection.innerHTML = `
                <div id="relate-inputs-${index}">
                    <div class="relate-input-group" id="relate-input-group-${index}-0">
                        <textarea placeholder="関連文を入力" data-index="0" onfocus="checkRelateAssociation(event, ${index})" oninput="handleRelateInput(event, ${index})"></textarea>
                        <button class="small-btn" onclick="addRelateInput(${index})">＋</button>
                    </div>
                </div>
                <div class="button-container">
                    <button class="btn btn-success associate-btn" onclick="associateRelate(${index})">基幹文に関連付ける</button>
                    <span id="dissociate-btn-container-${index}"></span>
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
    newInputGroup.className = 'relate-input-group'; // ID is set in checkRelateAssociation
    newInputGroup.id = `relate-input-group-${mainIndex}-${newIndex}`;
    newInputGroup.innerHTML = `
        <textarea placeholder="関連文を入力" data-index="${newIndex}" onfocus="checkRelateAssociation(event, ${mainIndex})" oninput="handleRelateInput(event, ${mainIndex})"></textarea>
        <button class="small-btn" onclick="addRelateInput(${mainIndex})">＋</button>
        <button class="small-btn minus" onclick="removeRelateInput(this)">ー</button>
    `;
    
    container.appendChild(newInputGroup); // The oninput will handle setting the ID
}

function removeRelateInput(button) {
    const inputGroup = button.closest('.relate-input-group');
    if (!inputGroup) return;

    const textarea = inputGroup.querySelector('textarea');
    const text = textarea ? textarea.value.trim() : '';

    if (text) {
        const truncatedText = text.length > 10 ? text.substring(0, 10) + '...' : text;
        if (confirm(`関連文「${truncatedText}」を削除します。よろしいですか？`)) {
            inputGroup.remove();
        }
    } else {
        if (confirm('この入力欄を削除します。よろしいですか？')) {
            inputGroup.remove();
        }
    }
}

function associateRelate(mainIndex) {
    const container = document.getElementById(`relate-inputs-${mainIndex}`);
    const inputs = container.querySelectorAll('textarea');

    const formattedTexts = Array.from(inputs).map((input, index) => {
        let text = input.value;

        // 1. 先頭と末尾の空白（改行以外）をトリム
        text = text.replace(/^[ \t]+|[ \t]+$/g, '');

        // 2. 先頭の改行を処理
        if (index === 0) { // 最初の関連文
            const leadBreaks = text.match(/^(\n+)/);
            if (leadBreaks && leadBreaks[1].length > 1) {
                text = '\n' + text.replace(/^\n+/, '');
            }
        } else { // 2番目以降
            text = text.replace(/^\n+/, '');
        }

        // 3. 末尾の改行を処理
        const trailBreaks = text.match(/(\n+)$/);
        if (trailBreaks && trailBreaks[1].length > 1) {
            text = text.replace(/\n+$/, '') + '\n';
        }

        return text;
    });

    // 空の入力欄がないかチェック
    if (formattedTexts.some(text => text.trim() === '')) {
        alert('未入力の関連文入力欄があります。');
        return;
    }

    // 念のため、完全に空の文字列は除外
    const nonEmptyTexts = formattedTexts.filter(text => text.trim() !== '');

    if (nonEmptyTexts.length === 0) {
        alert('関連文が入力されていません。');
        return;
    }

    if (confirm('基幹文に関連付けてよろしいですか？')) {
        noteData.contents[mainIndex].relate = nonEmptyTexts.map(text => ({ text: text }));

        const section = document.getElementById(`relate-section-${mainIndex}`);
        section.classList.remove('show');

        const toggleButton = document.querySelector(`button[onclick="toggleRelateInput(${mainIndex})"]`);
        if (toggleButton) toggleButton.textContent = '＋';
    }
}

let lastFocusedTextarea = null;

function checkRelateAssociation(event, mainIndex) {
    const textarea = event.target;
    lastFocusedTextarea = textarea; // 最後にフォーカスされたtextareaを保存

    const text = textarea.value.trim();
    const inputGroup = textarea.closest('.relate-input-group');
    if (!inputGroup.id) {
        const relIndex = textarea.dataset.index;
        inputGroup.id = `relate-input-group-${mainIndex}-${relIndex}`;
    }
    
    const dissociateBtnContainer = document.getElementById(`dissociate-btn-container-${mainIndex}`);
    
    if (text && noteData.contents[mainIndex].relate.some(r => r.text === text)) {
        dissociateBtnContainer.innerHTML = `
            <button id="dissociate-btn-${mainIndex}" class="btn btn-danger" onclick="dissociateRelate(${mainIndex})">
                関連付けを取り消す
            </button>
        `;
    } else {
        dissociateBtnContainer.innerHTML = '';
    }
}

function dissociateRelate(mainIndex) {
    if (!lastFocusedTextarea) return;

    const relateText = lastFocusedTextarea.value.trim();
    if (!relateText) return;

    const truncatedText = relateText.length > 10 ? relateText.substring(0, 10) + '...' : relateText;

    if (confirm(`「${truncatedText}」の関連付けを取り消します。よろしいですか？`)) {
        noteData.contents[mainIndex].relate = noteData.contents[mainIndex].relate.filter(r => r.text !== relateText);

        // UIから入力欄を削除またはクリアする
        const inputGroup = lastFocusedTextarea.closest('.relate-input-group');
        const container = inputGroup.parentElement;
        const allInputs = container.querySelectorAll('.relate-input-group');
        const isFirstInput = allInputs[0] === inputGroup;
        const hasMultipleInputs = allInputs.length > 1;

        if (isFirstInput && !hasMultipleInputs) {
            lastFocusedTextarea.value = ''; // 関連文が1つしかない場合は、テキストエリアを空にする
        } else {
            inputGroup.remove(); // 複数ある場合は、入力欄ごと削除（後続が繰り上がる）
        }

        document.getElementById(`dissociate-btn-container-${mainIndex}`).innerHTML = '';
    }
}

function handleRelateInput(event, mainIndex) {
    const textarea = event.target;
    const inputGroup = textarea.closest('.relate-input-group');
    const container = inputGroup.parentElement;
    const isFirstInput = container.querySelectorAll('.relate-input-group')[0] === inputGroup;

    if (isFirstInput) return; // 最初の入力欄には「ー」ボタンを付けない

    let minusBtn = inputGroup.querySelector('.minus');

    if (textarea.value.trim() === '') {
        if (!minusBtn) {
            minusBtn = document.createElement('button');
            minusBtn.className = 'small-btn minus';
            minusBtn.textContent = 'ー';
            minusBtn.onclick = () => removeRelateInput(minusBtn);
            inputGroup.appendChild(minusBtn);
        }
    }
}

function prepareDownload() {
    // ダウンロード確認時はタイトルスペースを非表示にする
    const titleSpace = document.getElementById('noteTitleSpace');
    if (titleSpace) {
        titleSpace.style.display = 'none';
    }

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
    // ダウンロード直前にデータをディープコピーし、整形する
    const dataToDownload = JSON.parse(JSON.stringify(noteData));

    // 各関連文のテキストを仕様に合わせて整形する
    dataToDownload.contents.forEach(content => {
        if (content.relate && content.relate.length > 0) {
            content.relate.forEach((r, index) => {
                let text = r.text;
                // 1. 先頭と末尾の空白（改行以外）をトリム
                text = text.replace(/^[ \t]+|[ \t]+$/g, '');
                // 2. 先頭の改行を処理
                if (index === 0) { // 最初の関連文
                    const leadBreaks = text.match(/^(\n+)/);
                    if (leadBreaks && leadBreaks[1].length > 1) {
                        text = '\n' + text.replace(/^\n+/, '');
                    }
                } else { // 2番目以降
                    text = text.replace(/^\n+/, '');
                }
                // 3. 末尾の改行を処理
                const trailBreaks = text.match(/(\n+)$/);
                if (trailBreaks && trailBreaks[1].length > 1) {
                    text = text.replace(/\n+$/, '') + '\n';
                }
                r.text = text;
            });
        }
    });

    const contentsLines = dataToDownload.contents.map(item => `    ${JSON.stringify(item)}`).join(',\n');

    // 手動でJSON文字列を構築
    const dataStr = `{\n  "title": ${JSON.stringify(dataToDownload.title)},\n  "created": ${JSON.stringify(dataToDownload.created)},\n  "contents": [\n${contentsLines}\n  ]\n}`;
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
    
    a.download = `${dataToDownload.title || 'note'}_${timestamp}.json`;
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
        <div class="url-input-container">
            <label for="jsonUrlUpdate">または、ストレージに保管中のJSONのURLから読み込む:</label>
            <div class="url-input-group">
                <input type="text" id="jsonUrlUpdate" name="url" placeholder="https://example.com/data.json">
                <button class="btn btn-primary" onclick="loadFromUrl('update')">読み込む</button>
            </div>
        </div>
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
        <div class="url-input-container">
            <label for="jsonUrlView">または、ストレージに保管中のJSONのURLから読み込む:</label>
            <div class="url-input-group">
                <input type="text" id="jsonUrlView" name="url" placeholder="https://example.com/data.json">
                <button class="btn btn-primary" onclick="loadFromUrl('view')">読み込む</button>
            </div>
        </div>
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
            const validationError = validateNoteData(noteData);
            if (validationError) {
                alert(`JSONファイルのデータ構造が正しくありません。\nエラー: ${validationError}`);
                return;
            }
            
            if (mode === 'update') {
                showUpdateRelatePhase();
            } else if (mode === 'view') {
                showViewData();
            }
        } catch (error) {
            alert(`JSONファイルの読み込みに失敗しました。\nエラー: ${error.message}`);
        }
    };
    reader.readAsText(loadedFile);
}

async function loadFromUrl(mode) {
    const urlInput = document.getElementById(`jsonUrl${mode === 'update' ? 'Update' : 'View'}`);
    const url = urlInput.value.trim();

    if (!url) {
        alert('URLを入力してください。');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('url', url);

        const response = await fetch('api/getJsonFromUrl.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.status === 'success') {
            // PHPから受け取ったJSON文字列をパース
            noteData = JSON.parse(result.data);
            const validationError = validateNoteData(noteData);
            if (validationError) {
                alert(`JSONファイルのデータ構造が正しくありません。\nエラー: ${validationError}`);
                return;
            }

            // 成功した場合、各モードの処理を続行
            if (mode === 'update') {
                showUpdateRelatePhase();
            } else if (mode === 'view') {
                showViewData();
            }
        } else {
            // PHP側で検知したエラーを表示
            alert(result.message);
        }
    } catch (error) {
        alert(`データの読み込みに失敗しました。\nエラー: ${error.message}`);
    }
}

function validateNoteData(data) {
    if (typeof data !== 'object' || data === null) {
        return 'JSONデータがオブジェクトではありません。';
    }
    if (typeof data.title !== 'string') {
        return 'プロパティ "title" が見つからないか、文字列ではありません。';
    }
    if (typeof data.created !== 'string') {
        return 'プロパティ "created" が見つからないか、文字列ではありません。';
    }
    if (!Array.isArray(data.contents)) {
        return 'プロパティ "contents" が見つからないか、配列ではありません。';
    }

    for (const item of data.contents) {
        if (typeof item !== 'object' || item === null) {
            return '"contents" 内の要素がオブジェクトではありません。';
        }
        if (typeof item.main !== 'string') {
            return '"contents" 内の要素にプロパティ "main" が見つからないか、文字列ではありません。';
        }
        if (!Array.isArray(item.relate)) {
            return '"contents" 内の要素にプロパティ "relate" が見つからないか、配列ではありません。';
        }
        for (const rel of item.relate) {
            if (typeof rel !== 'object' || rel === null || typeof rel.text !== 'string') {
                return '"relate" 配列内の要素の形式が正しくありません（{ "text": "..." } を期待しています）。';
            }
        }
    }
    return null; // No error
}

function showUpdateRelatePhase() {
    displayTitleSpace();
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div id="updateRelatePhase"></div>';
    const relatePhase = document.getElementById('updateRelatePhase');
    
    noteData.contents.forEach((item, index) => {
        // 基幹文の前に挿入ボタンを表示するためのコンテナ
        const insertContainer = document.createElement('div');
        insertContainer.id = `insert-container-${index}`;
        insertContainer.className = 'insert-main-wrapper';
        insertContainer.innerHTML = `<button class="btn-add-between" onclick="showAddMainUI(${index})">ここに基幹文を追加</button>`;
        relatePhase.appendChild(insertContainer);

        const lineDiv = document.createElement('div');
        lineDiv.className = 'main-line';
        let relateSection = null;
        
        if (item.main.trim() === '') {
            lineDiv.classList.add('empty');
            lineDiv.innerHTML = `
                <div class="empty-line"></div>
                <button class="small-btn minus" onclick="deleteMainLine(${index})" title="この行を削除">削</button>
            `;
        } else {
            const hasRelate = item.relate && item.relate.length > 0;
            const buttonClass = `toggle-btn ${hasRelate ? 'has-relate' : ''}`;

            lineDiv.innerHTML = `
                <div class="main-text">${escapeHtml(item.main)}</div>
                <button class="${buttonClass}" onclick="toggleRelateInput(${index})">＋</button>
                <button class="small-btn minus" onclick="deleteMainLine(${index})" title="この基幹文を削除">削</button>
            `;
            
            relateSection = document.createElement('div');
            relateSection.className = 'relate-section';
            relateSection.id = `relate-section-${index}`;
            
            let inputsHtml = '';
            if (item.relate.length > 0) {
                item.relate.forEach((rel, relIndex) => {
                    // textareaのvalueにはHTMLエスケープが不要なため、escapeHtmlを削除
                    const minusBtn = relIndex > 0 ? '<button class="small-btn minus" onclick="removeRelateInput(this)">ー</button>' : '';
                    inputsHtml += `
                        <div class="relate-input-group">
                            <textarea data-index="${relIndex}" onfocus="checkRelateAssociation(event, ${index})" oninput="handleRelateInput(event, ${index})">${rel.text}</textarea>
                            <button class="small-btn" onclick="addRelateInput(${index})">＋</button>
                            ${minusBtn}
                        </div>
                    `;
                });
            } else {
                inputsHtml = `
                    <div class="relate-input-group">
                        <textarea placeholder="関連文を入力" data-index="0" onfocus="checkRelateAssociation(event, ${index})" oninput="handleRelateInput(event, ${index})"></textarea>
                        <button class="small-btn" onclick="addRelateInput(${index})">＋</button>
                    </div>
                `;
            }
            
            relateSection.innerHTML = `
                <div id="relate-inputs-${index}">${inputsHtml}</div>
                <div class="button-container">
                    <button class="btn btn-success associate-btn" onclick="associateRelate(${index})">基幹文に関連付ける</button>
                    <span id="dissociate-btn-container-${index}"></span>
                </div>
            `;
        }
        
        relatePhase.appendChild(lineDiv);
        // relateSection が存在する場合（空行でない場合）、lineDiv の後に追加
        if (relateSection) relatePhase.appendChild(relateSection);
    });
    
    // 最後の挿入ボタン
    const lastInsertContainer = document.createElement('div');
    const lastIndex = noteData.contents.length;
    lastInsertContainer.id = `insert-container-${lastIndex}`;
    lastInsertContainer.className = 'insert-main-wrapper';
    lastInsertContainer.innerHTML = `<button class="btn-add-between" onclick="showAddMainUI(${lastIndex})">末尾に基幹文を追加</button>`;
    relatePhase.appendChild(lastInsertContainer);

    // JSON化ボタンの追加
    const downloadBtnContainer = document.createElement('div');
    downloadBtnContainer.className = 'button-container';
    downloadBtnContainer.innerHTML = '<button class="btn btn-primary json-btn" onclick="prepareDownload()">データをJSON化する</button>';
    relatePhase.appendChild(downloadBtnContainer);
}

// 基幹文の削除
function deleteMainLine(index) {
    const isMainEmpty = !noteData.contents[index].main || noteData.contents[index].main.trim() === '';
    const targetText = isMainEmpty ? "(空行)" : noteData.contents[index].main;
    const truncatedText = targetText.length > 20 ? targetText.substring(0, 20) + '...' : targetText;
    
    let confirmMessage = `基幹文「${truncatedText}」を削除しますか？`;
    if (!isMainEmpty) {
        confirmMessage += `\n※関連付けられた文もすべて削除されます。`;
    }

    if (confirm(confirmMessage)) {
        noteData.contents.splice(index, 1);
        showUpdateRelatePhase();
    }
}

// 基幹文挿入用UIの表示
function showAddMainUI(index) {
    const container = document.getElementById(`insert-container-${index}`);
    container.innerHTML = `
        <div class="add-main-input-area" style="border: 2px dashed #cbd5e0; padding: 15px; margin: 10px 0; border-radius: 8px; background: #edf2f7;">
            <textarea id="new-main-text-${index}" style="width: 100%; min-height: 80px; margin-bottom: 10px; padding: 8px; border-radius: 4px; border: 1px solid #a0aec0;" placeholder="新しい基幹文を入力してください"></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button class="btn btn-danger btn-sm" onclick="showUpdateRelatePhase()">キャンセル</button>
                <button class="btn btn-primary btn-sm" onclick="confirmAddMain(${index})">この内容を追加する</button>
            </div>
        </div>
    `;
    document.getElementById(`new-main-text-${index}`).focus();
}

// 基幹文挿入の実行
function confirmAddMain(index) {
    const textarea = document.getElementById(`new-main-text-${index}`);
    const text = textarea.value.trim();
    
    if (!text) {
        alert('基幹文の内容を入力してください。');
        return;
    }
    
    if (confirm('この内容で新しい基幹文を追加します。よろしいですか？')) {
        const newItem = {
            main: text,
            relate: []
        };
        
        // 指定した位置に挿入
        noteData.contents.splice(index, 0, newItem);
        showUpdateRelatePhase();
    }
}

function showViewData() {
    displayTitleSpace();
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
            // innerHTMLではなくDOM操作で要素を構築し、textContentで安全にテキストを設定
            const hasRelate = item.relate && item.relate.length > 0;
            const mainTextDiv = document.createElement('div');
            mainTextDiv.className = 'main-text';
            mainTextDiv.textContent = item.main;
            lineDiv.appendChild(mainTextDiv);

            if (hasRelate) {
                const toggleButton = document.createElement('button');
                toggleButton.className = 'toggle-btn';
                toggleButton.textContent = '＋';
                toggleButton.onclick = () => toggleViewRelate(index);
                lineDiv.appendChild(toggleButton);
            }
            
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

                    const relateTextDiv = document.createElement('div');
                    relateTextDiv.className = 'relate-item-text';
                    relateTextDiv.textContent = rel.text;
                    itemDiv.appendChild(relateTextDiv);

                    if (hasNext) {
                        const nextButton = document.createElement('button');
                        nextButton.className = 'toggle-btn';
                        nextButton.textContent = '＋';
                        nextButton.onclick = (event) => showNextRelate(event, index, relIndex);
                        itemDiv.appendChild(nextButton);
                    }
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
    if (nextItem) nextItem.style.display = 'flex';
    event.target.style.display = 'none'; // クリックされたボタンを非表示にする
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
