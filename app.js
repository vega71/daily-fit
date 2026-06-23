// Daily Fit - App Logic

// --- Constants & Configuration ---
const DAILY_CARDIO_GOALS = {
  steps: 10000,
  cycling: 30 // 30 minutes
};
const DAILY_STRENGTH_GOALS = {
  heelRaise: 50,
  legRaise: 50,
  bandExercise: 30,
  sitUp: 30
};

// --- Application State ---
let currentDate = new Date(); // Active calendar viewport month
let selectedDateStr = formatDate(new Date()); // Selected date for logging YYYY-MM-DD
let currentTimezone = 'morning'; // morning, afternoon, evening
let workoutDatabase = {}; // All saved workouts

// --- Cache DOM Elements ---
const calendarMonthYear = document.getElementById('current-month-year');
const calendarDaysGrid = document.getElementById('calendar-days-grid');
const activeDateDisplay = document.getElementById('active-date-display');
const currentTimezoneTitle = document.getElementById('current-timezone-title');

// Form inputs
const inputSteps = document.getElementById('input-steps');
const inputCycling = document.getElementById('input-cycling');
const inputHeelRaise = document.getElementById('input-heel-raise');
const inputLegRaise = document.getElementById('input-leg-raise');
const inputBandExercise = document.getElementById('input-band-exercise');
const inputSitUp = document.getElementById('input-sit-up');

// Stats and Overview
const cardioPercentText = document.getElementById('cardio-percent');
const cardioProgressBar = document.getElementById('cardio-progress-bar');
const strengthPercentText = document.getElementById('strength-percent');
const strengthProgressBar = document.getElementById('strength-progress-bar');

const totalDaysVal = document.getElementById('total-days-val');
const totalStepsVal = document.getElementById('total-steps-val');
const totalCyclingVal = document.getElementById('total-cycling-val');
const totalStrengthVal = document.getElementById('total-strength-val');
const bestDayVal = document.getElementById('best-day-val');

const weeklyChartContainer = document.getElementById('weekly-chart');

// Toast
const toast = document.getElementById('toast-message');
const toastText = document.getElementById('toast-text');

// --- Helper Functions ---
function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getKoreanDateString(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${m}월 ${d}일`;
}

// --- LocalStorage Logic ---
function loadDatabase() {
  const stored = localStorage.getItem('daily_fit_db');
  if (stored) {
    try {
      workoutDatabase = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse database, initializing fresh.', e);
      workoutDatabase = {};
    }
  } else {
    workoutDatabase = {};
  }
}

function saveDatabase() {
  localStorage.setItem('daily_fit_db', JSON.stringify(workoutDatabase));
}

// Get or initialize data structure for a specific date/timezone
function getWorkoutRecord(dateStr, timezone) {
  if (!workoutDatabase[dateStr]) {
    workoutDatabase[dateStr] = {
      morning: { steps: 0, cycling: 0, heelRaise: 0, legRaise: 0, bandExercise: 0, sitUp: 0 },
      afternoon: { steps: 0, cycling: 0, heelRaise: 0, legRaise: 0, bandExercise: 0, sitUp: 0 },
      evening: { steps: 0, cycling: 0, heelRaise: 0, legRaise: 0, bandExercise: 0, sitUp: 0 }
    };
  }
  return workoutDatabase[dateStr][timezone];
}

// Check if a date has any workout records registered (non-zero)
function dateHasData(dateStr) {
  const data = workoutDatabase[dateStr];
  if (!data) return false;
  
  for (const tz of ['morning', 'afternoon', 'evening']) {
    const r = data[tz];
    if (r.steps > 0 || r.cycling > 0 || r.heelRaise > 0 || r.legRaise > 0 || r.bandExercise > 0 || r.sitUp > 0) {
      return true;
    }
  }
  return false;
}

// Show toast notification
function showToast(message, type = 'success') {
  toastText.textContent = message;
  toast.className = 'toast show';
  if (type === 'success') {
    toast.style.background = 'rgba(16, 185, 129, 0.95)';
  } else {
    toast.style.background = 'rgba(99, 102, 241, 0.95)';
  }
  setTimeout(() => {
    toast.className = 'toast';
  }, 2500);
}

// --- UI Rendering ---

// 1. Calendar Renderer
function renderCalendar() {
  loadDatabase();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  calendarMonthYear.textContent = `${year}년 ${month + 1}월`;

  // First day of current month
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const lastDay = new Date(year, month + 1, 0).getDate();

  // Clear previous grid elements except day headers
  const dayHeaders = calendarDaysGrid.querySelectorAll('.day-name');
  calendarDaysGrid.innerHTML = '';
  dayHeaders.forEach(header => calendarDaysGrid.appendChild(header));

  // Render empty cells for padding
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    calendarDaysGrid.appendChild(emptyCell);
  }

  // Render month days
  for (let day = 1; day <= lastDay; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    dayCell.textContent = day;

    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check if this date has workout data
    if (dateHasData(formattedDate)) {
      dayCell.classList.add('has-data');
    }

    // Check if active
    if (formattedDate === selectedDateStr) {
      dayCell.classList.add('active');
    }

    dayCell.addEventListener('click', () => {
      // Deactivate previous active day
      const prevActive = calendarDaysGrid.querySelector('.calendar-day.active');
      if (prevActive) prevActive.classList.remove('active');
      
      dayCell.classList.add('active');
      selectedDateStr = formattedDate;
      
      loadActiveWorkoutData();
      updateDashboard();
    });

    calendarDaysGrid.appendChild(dayCell);
  }
}

// 2. Load Form Data
function loadActiveWorkoutData() {
  activeDateDisplay.textContent = getKoreanDateString(selectedDateStr);
  const data = getWorkoutRecord(selectedDateStr, currentTimezone);

  inputSteps.value = data.steps || '';
  inputCycling.value = data.cycling || '';
  inputHeelRaise.value = data.heelRaise || '';
  inputLegRaise.value = data.legRaise || '';
  inputBandExercise.value = data.bandExercise || '';
  inputSitUp.value = data.sitUp || '';
}

// 3. Compute Progress for the current active date
function calculateDailyProgress(dateStr) {
  const data = workoutDatabase[dateStr];
  if (!data) return { cardioPct: 0, strengthPct: 0, totalSteps: 0, totalCycling: 0, strengthTotals: {} };

  // Calculate sum of steps & cycling
  const totalSteps = (data.morning?.steps || 0) + (data.afternoon?.steps || 0) + (data.evening?.steps || 0);
  const totalCycling = (data.morning?.cycling || 0) + (data.afternoon?.cycling || 0) + (data.evening?.cycling || 0);

  const stepsPct = Math.min(100, (totalSteps / DAILY_CARDIO_GOALS.steps) * 100);
  const cyclingPct = Math.min(100, (totalCycling / DAILY_CARDIO_GOALS.cycling) * 100);

  // Cardio completion is the average of steps and cycling percentages
  const cardioPct = Math.round((stepsPct + cyclingPct) / 2);

  // Calculate sum of strength repetitions
  const strengthTotals = {
    heelRaise: (data.morning?.heelRaise || 0) + (data.afternoon?.heelRaise || 0) + (data.evening?.heelRaise || 0),
    legRaise: (data.morning?.legRaise || 0) + (data.afternoon?.legRaise || 0) + (data.evening?.legRaise || 0),
    bandExercise: (data.morning?.bandExercise || 0) + (data.afternoon?.bandExercise || 0) + (data.evening?.bandExercise || 0),
    sitUp: (data.morning?.sitUp || 0) + (data.afternoon?.sitUp || 0) + (data.evening?.sitUp || 0)
  };

  // Percent for each strength exercise
  const pHeel = Math.min(100, (strengthTotals.heelRaise / DAILY_STRENGTH_GOALS.heelRaise) * 100);
  const pLeg = Math.min(100, (strengthTotals.legRaise / DAILY_STRENGTH_GOALS.legRaise) * 100);
  const pBand = Math.min(100, (strengthTotals.bandExercise / DAILY_STRENGTH_GOALS.bandExercise) * 100);
  const pSit = Math.min(100, (strengthTotals.sitUp / DAILY_STRENGTH_GOALS.sitUp) * 100);

  // Strength completion is the average of completion across the 4 strength exercises
  const strengthPct = Math.round((pHeel + pLeg + pBand + pSit) / 4);

  return { cardioPct, strengthPct, totalSteps, totalCycling, strengthTotals };
}

// 4. Update Dashboard UI (Progress bars, Monthly Stats, and Charts)
function updateDashboard() {
  // Update progress bars
  const progress = calculateDailyProgress(selectedDateStr);
  
  cardioPercentText.textContent = `${progress.cardioPct}%`;
  cardioProgressBar.style.width = `${progress.cardioPct}%`;
  
  strengthPercentText.textContent = `${progress.strengthPct}%`;
  strengthProgressBar.style.width = `${progress.strengthPct}%`;

  // Update cumulative statistics for the current month
  updateMonthlyStats();

  // Update weekly trend chart
  renderWeeklyChart();
}

// 5. Update Monthly cumulative stats
function updateMonthlyStats() {
  const currentMonthPrefix = selectedDateStr.substring(0, 7); // e.g. "2026-06"
  let totalDaysWithData = 0;
  let monthlyStepsSum = 0;
  let monthlyCyclingSum = 0;
  let monthlyStrengthSum = 0;
  let bestDayDate = '-';
  let bestDayScore = -1;

  Object.keys(workoutDatabase).forEach(dateStr => {
    // Filter by current year-month
    if (dateStr.startsWith(currentMonthPrefix) && dateHasData(dateStr)) {
      totalDaysWithData++;

      const p = calculateDailyProgress(dateStr);
      monthlyStepsSum += p.totalSteps;
      monthlyCyclingSum += p.totalCycling;
      
      const totalStrengthRepsForDay = 
        Object.values(p.strengthTotals).reduce((sum, val) => sum + val, 0);
      monthlyStrengthSum += totalStrengthRepsForDay;

      // Score = average percentage of cardio + strength
      const dayScore = (p.cardioPct + p.strengthPct) / 2;
      if (dayScore > bestDayScore) {
        bestDayScore = dayScore;
        bestDayDate = dateStr;
      }
    }
  });

  totalDaysVal.textContent = `${totalDaysWithData}일`;
  totalStepsVal.textContent = `${monthlyStepsSum.toLocaleString()}보`;
  totalCyclingVal.textContent = `${monthlyCyclingSum.toLocaleString()}분`;
  totalStrengthVal.textContent = `${monthlyStrengthSum.toLocaleString()}회`;
  
  if (bestDayDate !== '-') {
    const [, m, d] = bestDayDate.split('-');
    bestDayVal.textContent = `${parseInt(m)}월 ${parseInt(d)}일 (${Math.round(bestDayScore)}%)`;
  } else {
    bestDayVal.textContent = '-';
  }
}

// 6. Draw Weekly Trend Chart (SVG-like bar chart using HTML / CSS)
function renderWeeklyChart() {
  weeklyChartContainer.innerHTML = '';
  
  // Calculate the dates for the past 7 days based on the selectedDateStr
  const activeDate = new Date(selectedDateStr);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  
  // Create 7 days leading up to and including the active selected date
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(activeDate);
    d.setDate(activeDate.getDate() - i);
    last7Days.push(d);
  }

  last7Days.forEach(date => {
    const dateStr = formatDate(date);
    const progress = calculateDailyProgress(dateStr);
    const dayLabel = weekdays[date.getDay()];

    // UI elements
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-bar-wrapper';

    // Track container
    const track = document.createElement('div');
    track.className = 'chart-bar-track';
    
    // Cardio subbar
    const cardioBar = document.createElement('div');
    cardioBar.className = 'chart-bar cardio-bar';
    cardioBar.style.height = `${progress.cardioPct}%`;
    cardioBar.title = `유산소 달성률: ${progress.cardioPct}% (${(progress.totalSteps || 0).toLocaleString()}보 / ${(progress.totalCycling || 0)}분)`;

    // Strength subbar (we'll split the vertical space or overlay, overlay is neat in columns)
    const strengthBar = document.createElement('div');
    strengthBar.className = 'chart-bar strength-bar';
    strengthBar.style.height = `${progress.strengthPct}%`;
    
    const strengthSum = progress.strengthTotals ? Object.values(progress.strengthTotals).reduce((a, b) => a + b, 0) : 0;
    strengthBar.title = `근력 달성률: ${progress.strengthPct}% (총 ${strengthSum}회)`;

    // Put them in track
    // To show both beautifully, we can show them side-by-side or stacked.
    // Let's modify the CSS a bit to host them side-by-side or overlay. 
    // Side by side look is much cleaner. Let's make the track fit two smaller bars.
    track.style.display = 'flex';
    track.style.gap = '2px';
    track.style.background = 'rgba(255, 255, 255, 0.02)';
    track.style.padding = '2px';
    track.style.width = '24px';
    
    cardioBar.style.width = '10px';
    strengthBar.style.width = '10px';

    track.appendChild(cardioBar);
    track.appendChild(strengthBar);

    // Label
    const label = document.createElement('div');
    label.className = 'chart-label';
    label.textContent = dayLabel;
    if (dateStr === selectedDateStr) {
      label.style.color = 'var(--primary-color)';
      label.style.fontWeight = '700';
      track.style.border = '1px solid rgba(99, 102, 241, 0.4)';
      track.style.boxShadow = '0 0 8px rgba(99, 102, 241, 0.2)';
    }

    wrapper.appendChild(track);
    wrapper.appendChild(label);
    weeklyChartContainer.appendChild(wrapper);
  });
}

// --- Event Handlers & Core Interactions ---

function setupEventListeners() {
  // Calendar month navigation
  document.getElementById('prev-month-btn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('next-month-btn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  // Timezone Tab buttons
  const tabButtons = document.querySelectorAll('#timezone-navigation .tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate current tab UI
      tabButtons.forEach(b => b.classList.remove('active'));
      
      btn.classList.add('active');
      currentTimezone = btn.getAttribute('data-timezone');
      
      // Update form heading
      const emojiMap = { morning: '🌅', afternoon: '☀️', evening: '🌙' };
      const korMap = { morning: '오전', afternoon: '오후', evening: '저녁' };
      currentTimezoneTitle.textContent = `${emojiMap[currentTimezone]} ${korMap[currentTimezone]}에 한 운동`;

      loadActiveWorkoutData();
    });
  });

  // Reset inputs button
  document.getElementById('reset-btn').addEventListener('click', () => {
    inputSteps.value = '';
    inputCycling.value = '';
    inputHeelRaise.value = '';
    inputLegRaise.value = '';
    inputBandExercise.value = '';
    inputSitUp.value = '';
    
    // Save zero state
    saveActiveData(true);
    showToast('기록이 초기화되었습니다.', 'info');
  });

  // Save button
  document.getElementById('save-btn').addEventListener('click', () => {
    saveActiveData();
    showToast('기록이 성공적으로 저장되었습니다!', 'success');
  });

  // Auto-save on inputs
  const inputs = [inputSteps, inputCycling, inputHeelRaise, inputLegRaise, inputBandExercise, inputSitUp];
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      saveActiveData(false); // Silent save (no toast)
    });
  });
}

// Save form values to State & LocalStorage
function saveActiveData(silent = false) {
  const data = getWorkoutRecord(selectedDateStr, currentTimezone);

  data.steps = Math.max(0, parseInt(inputSteps.value) || 0);
  data.cycling = Math.max(0, parseInt(inputCycling.value) || 0);
  data.heelRaise = Math.max(0, parseInt(inputHeelRaise.value) || 0);
  data.legRaise = Math.max(0, parseInt(inputLegRaise.value) || 0);
  data.bandExercise = Math.max(0, parseInt(inputBandExercise.value) || 0);
  data.sitUp = Math.max(0, parseInt(inputSitUp.value) || 0);

  saveDatabase();
  
  // Refresh layout components
  updateDashboard();

  // If a data point was added/removed, calendar indicators might change
  // Quick check: re-render calendar days if it toggled active status
  const formattedMonthPrefix = selectedDateStr.substring(0, 7);
  const currentCalMonthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  if (formattedMonthPrefix === currentCalMonthPrefix) {
    // Only re-render calendar if the active date is currently on viewport
    const dayCells = calendarDaysGrid.querySelectorAll('.calendar-day:not(.empty)');
    const dayNumber = parseInt(selectedDateStr.split('-')[2]);
    const dayCell = dayCells[dayNumber - 1];
    
    if (dayCell) {
      if (dateHasData(selectedDateStr)) {
        dayCell.classList.add('has-data');
      } else {
        dayCell.classList.remove('has-data');
      }
    }
  }
}

// --- Initialization ---
function init() {
  loadDatabase();
  setupEventListeners();
  renderCalendar();
  loadActiveWorkoutData();
  updateDashboard();
}

window.addEventListener('DOMContentLoaded', init);

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registered successfully:', reg))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}
