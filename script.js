let BASE_WAGE = 1080;
const HOLIDAY_BONUS = 50;

// 時給設定状態のデフォルト構造
let wageConfig = {
    mode: 'all', // 'all' または 'custom'
    allWage: 1080,
    customRules: [
        { startDay: 1, endDay: 15, wage: 1080 },
        { startDay: 16, endDay: 31, wage: 1100 }
    ]
};

const yearSelect = document.getElementById('year-select');
const monthSelect = document.getElementById('month-select');
const daysContainer = document.getElementById('days-container');
const totalPriceEl = document.getElementById('total-price');
const totalHoursEl = document.getElementById('total-hours');
const totalMinsEl = document.getElementById('total-mins');
const resetBtn = document.getElementById('reset-btn');
const baseWageDisplay = document.getElementById('base-wage-display');

// 設定モーダル関連要素
const configBtn = document.getElementById('config-btn');
const configModal = document.getElementById('config-modal');
const closeConfigBtn = document.getElementById('close-config-btn');
const saveConfigBtn = document.getElementById('save-config-btn');
const modeAllRadio = document.getElementById('mode-all');
const modeCustomRadio = document.getElementById('mode-custom');
const allWageSection = document.getElementById('all-wage-section');
const customWageSection = document.getElementById('custom-wage-section');
const allWageInput = document.getElementById('all-wage-input');
const customRulesContainer = document.getElementById('custom-rules-container');
const addRuleBtn = document.getElementById('add-rule-btn');

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

// 年の選択肢を生成 (今年から前後3年分)
for (let i = currentYear - 1; i <= currentYear + 2; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    yearSelect.appendChild(option);
}
yearSelect.value = currentYear;

// 月の選択肢を生成
for (let i = 1; i <= 12; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    monthSelect.appendChild(option);
}
monthSelect.value = currentMonth;

// 曜日配列
const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

// --- ローカルストレージ（保存・復元） ---

function loadWageConfig() {
    const savedConfig = localStorage.getItem('tomtom_wage_config');
    if (savedConfig) {
        try {
            wageConfig = JSON.parse(savedConfig);
        } catch (e) {
            console.error('設定のロードに失敗しました', e);
        }
    }
}

function saveWageConfig() {
    localStorage.setItem('tomtom_wage_config', JSON.stringify(wageConfig));
}

function saveWorkData() {
    const year = yearSelect.value;
    const month = monthSelect.value;
    const key = `tomtom_work_${year}_${month}`;

    const cards = document.querySelectorAll('.day-card');
    const data = [];

    cards.forEach((card) => {
        const day = card.dataset.day;
        const isHoliday = card.querySelector('.is-holiday').checked;
        const workHours = card.querySelector('.work-hours').value;
        const overtimeMins = card.querySelector('.overtime-mins').value;

        data.push({
            day: day,
            isHoliday: isHoliday,
            workHours: workHours,
            overtimeMins: overtimeMins
        });
    });

    localStorage.setItem(key, JSON.stringify(data));
}

function getSavedWorkData(year, month) {
    const key = `tomtom_work_${year}_${month}`;
    const saved = localStorage.getItem(key);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// 日付に対応する時給を取得する関数
function getWageForDay(day) {
    if (wageConfig.mode === 'all') {
        return wageConfig.allWage;
    } else {
        const rule = wageConfig.customRules.find(r => day >= r.startDay && day <= r.endDay);
        return rule ? rule.wage : wageConfig.allWage;
    }
}

// 勤務時間のオプションを生成する関数（0時間、3〜7.5時間）
function generateWorkHourOptions(selectedValue = "0") {
    let options = '';
    const values = [0];
    for (let i = 3; i < 8; i += 0.5) values.push(i);

    values.forEach(val => {
        const selected = String(val) === String(selectedValue) ? 'selected' : '';
        options += `<option value="${val}" ${selected}>${val === 0 ? '0時間' : val + '時間'}</option>`;
    });
    return options;
}

// 残業時間のオプションを生成する関数
function generateOvertimeOptions(selectedValue = "0") {
    let options = '';
    for (let i = 0; i <= 120; i += 10) {
        const selected = String(i) === String(selectedValue) ? 'selected' : '';
        options += `<option value="${i}" ${selected}>${i}分</option>`;
    }
    return options;
}

// ヘッダーの基本給テキストを更新
function updateBaseWageDisplay() {
    if (wageConfig.mode === 'all') {
        baseWageDisplay.textContent = `基本給: ${wageConfig.allWage}円/時`;
    } else {
        baseWageDisplay.textContent = `基本給: カスタム設定`;
    }
}

// 日付カードを生成する関数
function renderDays() {
    daysContainer.innerHTML = ''; 
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    
    // その月の日数を取得
    const daysInMonth = new Date(year, month, 0).getDate();
    // 保存データを読み込み
    const savedData = getSavedWorkData(year, month);

    updateBaseWageDisplay();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const weekDayIndex = date.getDay();
        
        let dayClass = '';
        if (weekDayIndex === 0) dayClass = 'sunday';
        if (weekDayIndex === 6) dayClass = 'saturday';

        let savedDayData = null;
        if (savedData) {
            savedDayData = savedData.find(d => parseInt(d.day) === day);
        }

        const isHolidayChecked = savedDayData ? savedDayData.isHoliday : (weekDayIndex === 0);
        const savedHours = savedDayData ? savedDayData.workHours : "0";
        const savedOvertime = savedDayData ? savedDayData.overtimeMins : "0";

        const card = document.createElement('div');
        card.className = 'day-card';
        card.dataset.day = day;
        card.innerHTML = `
            <div class="day-header">
                <span class="${dayClass}">${month}/${day} (${weekDays[weekDayIndex]})</span>
                <label class="holiday-check">
                    <input type="checkbox" class="is-holiday" ${isHolidayChecked ? 'checked' : ''} onchange="onInputChange()">
                    日祝(+50円/h)
                </label>
            </div>
            <div class="input-group">
                <span>勤務時間</span>
                <select class="work-hours" onchange="onInputChange()">
                    ${generateWorkHourOptions(savedHours)}
                </select>
            </div>
            <div class="input-group">
                <span>残業時間</span>
                <select class="overtime-mins" onchange="onInputChange()">
                    ${generateOvertimeOptions(savedOvertime)}
                </select>
            </div>
        `;
        daysContainer.appendChild(card);
    }
    calculateTotal();
}

// 入力変更時のハンドラ（再計算・自動保存）
function onInputChange() {
    calculateTotal();
    saveWorkData();
}

// 合計金額と合計時間を計算する関数
function calculateTotal() {
    let totalPrice = 0;
    let totalWorkMinutes = 0; // 全労働時間を「分」で集計

    const cards = document.querySelectorAll('.day-card');

    cards.forEach(card => {
        const day = parseInt(card.dataset.day);
        const isHoliday = card.querySelector('.is-holiday').checked;
        const hours = parseFloat(card.querySelector('.work-hours').value);
        const overtimeMins = parseInt(card.querySelector('.overtime-mins').value);

        const totalHours = hours + (overtimeMins / 60);

        if (totalHours > 0) {
            // 当日の基本時給を取得
            const dayBaseWage = getWageForDay(day);
            const currentHourlyWage = dayBaseWage + (isHoliday ? HOLIDAY_BONUS : 0);
            const dailyWage = Math.floor(currentHourlyWage * totalHours);
            totalPrice += dailyWage;

            // 時間の集計（分単位に変換して足す）
            totalWorkMinutes += (hours * 60) + overtimeMins;
        }
    });

    // 分単位の合計時間を「〇時間 〇分」に変換
    const displayHours = Math.floor(totalWorkMinutes / 60);
    const displayMins = totalWorkMinutes % 60;

    // 画面に反映
    totalPriceEl.textContent = totalPrice.toLocaleString();
    totalHoursEl.textContent = displayHours;
    totalMinsEl.textContent = displayMins;
}

// --- モーダル・カスタムルール関連 ---

function renderCustomRulesInModal() {
    customRulesContainer.innerHTML = '';
    wageConfig.customRules.forEach((rule, index) => {
        const row = document.createElement('div');
        row.className = 'rule-row';

        let startOptions = '';
        let endOptions = '';
        for (let i = 1; i <= 31; i++) {
            startOptions += `<option value="${i}" ${i === rule.startDay ? 'selected' : ''}>${i}日</option>`;
            endOptions += `<option value="${i}" ${i === rule.endDay ? 'selected' : ''}>${i}日</option>`;
        }

        row.innerHTML = `
            <select class="rule-start">${startOptions}</select>
            〜
            <select class="rule-end">${endOptions}</select>
            <input type="number" class="rule-wage" value="${rule.wage}" min="0">円
            <button type="button" class="remove-rule-btn" onclick="removeRule(${index})">削除</button>
        `;
        customRulesContainer.appendChild(row);
    });
}

function removeRule(index) {
    wageConfig.customRules.splice(index, 1);
    renderCustomRulesInModal();
}

addRuleBtn.addEventListener('click', () => {
    wageConfig.customRules.push({ startDay: 1, endDay: 31, wage: 1080 });
    renderCustomRulesInModal();
});

// モーダル表示
configBtn.addEventListener('click', () => {
    if (wageConfig.mode === 'all') {
        modeAllRadio.checked = true;
        allWageSection.classList.remove('hidden');
        customWageSection.classList.add('hidden');
    } else {
        modeCustomRadio.checked = true;
        allWageSection.classList.add('hidden');
        customWageSection.classList.remove('hidden');
    }

    allWageInput.value = wageConfig.allWage;
    renderCustomRulesInModal();
    configModal.classList.add('show');
});

// モーダル非表示
closeConfigBtn.addEventListener('click', () => {
    configModal.classList.remove('show');
});

// ラジオ切り替え
modeAllRadio.addEventListener('change', () => {
    allWageSection.classList.remove('hidden');
    customWageSection.classList.add('hidden');
});

modeCustomRadio.addEventListener('change', () => {
    allWageSection.classList.add('hidden');
    customWageSection.classList.remove('hidden');
});

// 設定保存
saveConfigBtn.addEventListener('click', () => {
    if (modeAllRadio.checked) {
        wageConfig.mode = 'all';
        wageConfig.allWage = parseInt(allWageInput.value) || 0;
    } else {
        wageConfig.mode = 'custom';
        const rules = [];
        const rows = customRulesContainer.querySelectorAll('.rule-row');
        rows.forEach(row => {
            const startDay = parseInt(row.querySelector('.rule-start').value);
            const endDay = parseInt(row.querySelector('.rule-end').value);
            const wage = parseInt(row.querySelector('.rule-wage').value) || 0;
            rules.push({ startDay, endDay, wage });
        });
        wageConfig.customRules = rules;
    }

    saveWageConfig();
    configModal.classList.remove('show');
    renderDays();
});

// リセットボタンの処理
resetBtn.addEventListener('click', () => {
    if (confirm('表示中の月の入力内容をリセットしますか？')) {
        const year = yearSelect.value;
        const month = monthSelect.value;
        localStorage.removeItem(`tomtom_work_${year}_${month}`);
        renderDays();
    }
});

// 年または月が変更されたらカレンダーを再描画
yearSelect.addEventListener('change', renderDays);
monthSelect.addEventListener('change', renderDays);

// 初期読み込みと描画
loadWageConfig();
renderDays();