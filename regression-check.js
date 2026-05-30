const fs = require('fs');
const path = require('path');
const vm = require('vm');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createLocalStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

function createClassList(initial = []) {
  const set = new Set(initial);
  return {
    add(...names) { names.forEach(name => set.add(name)); },
    remove(...names) { names.forEach(name => set.delete(name)); },
    toggle(name, force) {
      if (force === true) { set.add(name); return true; }
      if (force === false) { set.delete(name); return false; }
      if (set.has(name)) { set.delete(name); return false; }
      set.add(name); return true;
    },
    contains(name) { return set.has(name); },
    toString() { return Array.from(set).join(' '); }
  };
}

function createElement(tagName = 'div') {
  const element = {
    tagName: tagName.toUpperCase(),
    style: {},
    dataset: {},
    children: [],
    disabled: false,
    textContent: '',
    innerHTML: '',
    value: '',
    checked: false,
    className: '',
    classList: createClassList(),
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    remove() {
      if (!this.parentNode) return;
      this.parentNode.children = this.parentNode.children.filter(item => item !== this);
      this.parentNode = null;
    },
    querySelector(selector) {
      if (selector === '.sheet-body') {
        if (!this._sheetBody) this._sheetBody = createElement('div');
        return this._sheetBody;
      }
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };

  Object.defineProperty(element, 'className', {
    get() {
      return element.classList.toString();
    },
    set(value) {
      element.classList = createClassList(String(value || '').split(/\s+/).filter(Boolean));
    }
  });

  return element;
}

function createDocument() {
  const elementsById = new Map();
  const allTimeSlotButtons = [];
  const paymentMethods = [createElement('div'), createElement('div')];
  paymentMethods.forEach(el => { el.className = 'payment-method'; });

  function ensure(id) {
    if (!elementsById.has(id)) {
      const el = createElement('div');
      elementsById.set(id, el);
    }
    return elementsById.get(id);
  }

  const timeSlotsGrid = createElement('div');
  timeSlotsGrid.className = 'time-slots-grid';
  timeSlotsGrid.appendChild = function(child) {
    this.children.push(child);
    if (child.className.includes('time-slot-btn')) allTimeSlotButtons.push(child);
    child.parentNode = this;
    return child;
  };
  Object.defineProperty(timeSlotsGrid, 'innerHTML', {
    get() { return this._html || ''; },
    set(value) {
      this._html = value;
      this.children = [];
      allTimeSlotButtons.length = 0;
    }
  });

  const body = createElement('body');

  return {
    body,
    createElement,
    addEventListener() {},
    getElementById(id) {
      return ensure(id);
    },
    querySelector(selector) {
      if (selector === '.time-slots-grid') return timeSlotsGrid;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.time-slot-btn') return allTimeSlotButtons;
      if (selector === '.payment-method') return paymentMethods;
      return [];
    }
  };
}

function loadApp() {
  const document = createDocument();
  const localStorage = createLocalStorage();
  const timeouts = [];
  const intervals = [];
  const context = {
    console,
    Math,
    Date,
    JSON,
    localStorage,
    document,
    window: null,
    location: { hostname: 'localhost' },
    navigator: {},
    setTimeout(fn) { timeouts.push(fn); return timeouts.length; },
    clearTimeout() {},
    setInterval(fn) { intervals.push(fn); return intervals.length; },
    clearInterval() {},
    fetch: async () => ({ json: async () => ({ success: false, error: 'network disabled in tests' }) }),
    startSocialFeed() {},
    unlockAchievement() {}
  };
  context.window = context;
  vm.createContext(context);

  const root = __dirname;
  const storageSource = fs.readFileSync(path.join(root, 'storage.js'), 'utf8');
  const apiClientSource = fs.readFileSync(path.join(root, 'api-client.js'), 'utf8');
  const scriptSource = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  const hooks = `
window.__testApi = API;
window.__testHooks = {
  setState(patch) {
    if ('isLoggedIn' in patch) isLoggedIn = patch.isLoggedIn;
    if ('currentUser' in patch) currentUser = patch.currentUser;
    if ('selectedDate' in patch) selectedDate = patch.selectedDate;
    if ('selectedTime' in patch) selectedTime = patch.selectedTime;
    if ('selectedSpotId' in patch) selectedSpotId = patch.selectedSpotId;
    if ('ticketCounts' in patch) ticketCounts = patch.ticketCounts;
    if ('selectedIdentity' in patch) selectedIdentity = patch.selectedIdentity;
    if ('selectedPaymentMethod' in patch) selectedPaymentMethod = patch.selectedPaymentMethod;
    if ('queuePosition' in patch) queuePosition = patch.queuePosition;
    if ('currentQueueId' in patch) currentQueueId = patch.currentQueueId;
    if ('bookingState' in patch) bookingState = patch.bookingState;
    if ('currentBookingId' in patch) currentBookingId = patch.currentBookingId;
    if ('hasAgreedSession' in patch) hasAgreedSession = patch.hasAgreedSession;
    if ('currentSpotsData' in patch) currentSpotsData = patch.currentSpotsData;
  },
  getState() {
    return {
      isLoggedIn,
      currentUser,
      selectedDate,
      selectedTime,
      selectedSpotId,
      ticketCounts,
      selectedIdentity,
      selectedPaymentMethod,
      queuePosition,
      currentQueueId,
      bookingState,
      currentBookingId,
      hasAgreedSession,
      currentSpotsData
    };
  }
};`;

  vm.runInContext(storageSource, context, { filename: 'storage.js' });
  vm.runInContext(apiClientSource, context, { filename: 'api-client.js' });
  vm.runInContext(scriptSource + hooks, context, { filename: 'script.js' });

  const requiredIds = [
    'booking-not-logged', 'booking-logged', 'booking-queue', 'time-slots-section', 'ticket-section', 'identity-section',
    'booking-action-btn', 'display-date', 'display-time', 'agreement-sheet', 'agreement-scroll', 'agreement-progress',
    'agree-btn', 'payment-sheet', 'payment-amount', 'pay-countdown', 'total-count', 'total-price', 'queue-count',
    'queue-time', 'success-sheet'
  ];
  requiredIds.forEach(id => document.getElementById(id));

  context.__intervals = intervals;
  context.__timeouts = timeouts;

  return { context, document, localStorage };
}

function testAgreementResume() {
  const { context, document } = loadApp();
  const hooks = context.__testHooks;
  hooks.setState({
    isLoggedIn: true,
    currentUser: { phone: '138****6789' },
    selectedSpotId: 'gugong',
    selectedDate: '2026-05-31',
    hasAgreedSession: true,
    currentSpotsData: [{
      id: 'gugong',
      slots: [{ id: 'morning', label: '上午场', timeRange: '08:30-12:00', remaining: 10, total: 100, displayStatus: 'available' }]
    }]
  });
  context.loadTimeSlots = context.loadTimeSlots.bind(context);
  hooks.setState({ hasAgreedSession: false });
  context.confirmDate();
  context.agreeAgreement();
  assert(document.querySelector('.time-slots-grid').children.length > 0, 'agreeAgreement should resume and load time slots');
}

async function testQueueCompletionContinuesToPayment() {
  const { context, document } = loadApp();
  const hooks = context.__testHooks;
  hooks.setState({
    isLoggedIn: true,
    currentUser: { phone: '138****6789' },
    bookingState: 'queue',
    currentQueueId: 'Q1',
    queuePosition: 1,
    selectedSpotId: 'gugong',
    selectedDate: '2026-05-31',
    selectedTime: 'morning',
    ticketCounts: { adult: 1, child: 0, senior: 0 },
    selectedIdentity: { name: '李逍遥', id: '310101199001011234' }
  });
  context.__testApi.getQueueStatus = async () => ({ position: 0, completed: true });
  context.startQueueCountdown();
  assert(context.__intervals.length > 0, 'queue countdown should register polling interval');
  await context.__intervals[0]();
  assert(document.getElementById('payment-sheet').classList.contains('show'), 'queue completion should continue to payment');
}

function testRestartClearsBookingId() {
  const { context } = loadApp();
  const hooks = context.__testHooks;
  hooks.setState({ currentBookingId: 'BK123', selectedDate: '2026-05-31', selectedTime: 'morning' });
  context.restartBooking();
  assert(hooks.getState().currentBookingId === null, 'restartBooking should clear stale currentBookingId');
}

async function main() {
  const failures = [];

  try { testAgreementResume(); } catch (error) { failures.push(error.message); }
  try { await testQueueCompletionContinuesToPayment(); } catch (error) { failures.push(error.message); }
  try { testRestartClearsBookingId(); } catch (error) { failures.push(error.message); }

  if (failures.length) {
    console.error('Regression failures:');
    failures.forEach(msg => console.error(`- ${msg}`));
    process.exit(1);
  }

  console.log('Regression checks passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
