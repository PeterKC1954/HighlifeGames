// ===== PERSONAL GAME ACCOUNT =====
// Persists the player's account between games (localStorage now — mirrors the
// Supabase tables in game-rules-schema.sql for when the backend is wired up).
//
// Rules implemented here:
// - Gold Coins collected at GEO chests / credited after games live in the
//   account until registered into a non-prize game.
// - Cash-purchased Boffins persist if unused; Gold-Coin Boffins never persist.
// - Prize seat tickets have 5 parts; each part carries 2 digits of the ticket
//   serial; up to 2 missing parts may be purchased; parts may be traded but a
//   traded part can only ever be transferred once.
// - Cognitive tracking points reset to zero at the end of each week.

const ACCOUNT_KEY = 'hl_game_account';

const TICKET_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const TICKET_PARTS_COUNT = 5;
const MAX_PURCHASABLE_PARTS = 2;

// Price per missing ticket part in pence.
// Bronze/Silver are published prices; higher tiers are only revealed on the
// day that tier's prize game is played.
const TICKET_PART_PRICES = { bronze: 20, silver: 50, gold: 100, platinum: 250, diamond: 500 };
const PUBLISHED_PART_PRICE_TIERS = ['bronze', 'silver'];

const BOFFIN_DEFS = {
  junior: { id: 'junior', name: 'Junior Boffin', icon: '💡', eliminates: 1, coinCost: 3, cashPricePence: 50,  desc: 'Removes 1 wrong answer' },
  senior: { id: 'senior', name: 'Senior Boffin', icon: '✂️', eliminates: 2, coinCost: 5, cashPricePence: 100, desc: 'Removes 2 wrong answers' },
  major:  { id: 'major',  name: 'Major Boffin',  icon: '🎓', swapQuestion: true, coinCost: 8, cashPricePence: 200, desc: 'Swaps the question for a different one' },
};

const TIER_LABELS = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum', diamond: 'Diamond' };
const TIER_ICONS  = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💠', diamond: '💎' };

// ----- ISO week key (cognitive points reset weekly) -----
function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function blankAccount() {
  return {
    goldCoins: 0,
    boffins: [],            // [{ uid, type, source: 'cash' }] — only cash boffins persist
    tickets: [],            // [{ id, tier, serial, parts: [bool x5], purchasedParts, tradedParts, createdAt }]
    cognitive: { weekKey: isoWeekKey(), points: 0 },
    purchases: [],          // pending cash purchases (payment gateway integration point)
  };
}

function loadAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return blankAccount();
    const acc = { ...blankAccount(), ...JSON.parse(raw) };
    // Weekly reset of cognitive tracking points
    if (acc.cognitive.weekKey !== isoWeekKey()) {
      acc.cognitive = { weekKey: isoWeekKey(), points: 0 };
      saveAccount(acc);
    }
    return acc;
  } catch {
    return blankAccount();
  }
}

function saveAccount(acc) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(acc));
}

// ----- Gold Coins -----
function addGoldCoins(n) {
  const acc = loadAccount();
  acc.goldCoins += n;
  saveAccount(acc);
  return acc.goldCoins;
}

function spendGoldCoins(n) {
  const acc = loadAccount();
  if (acc.goldCoins < n) return false;
  acc.goldCoins -= n;
  saveAccount(acc);
  return true;
}

// ----- Boffins -----
// Only cash-purchased boffins may persist in the account between games.
function addBoffin(type, source = 'cash') {
  if (!BOFFIN_DEFS[type] || source !== 'cash') return null;
  const acc = loadAccount();
  const boffin = { uid: `bf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, type, source };
  acc.boffins.push(boffin);
  saveAccount(acc);
  return boffin;
}

// Take boffins out of the account to register them into a game
function withdrawBoffins(uids) {
  const acc = loadAccount();
  const taken = [];
  acc.boffins = acc.boffins.filter(b => {
    if (uids.includes(b.uid)) { taken.push(b); return false; }
    return true;
  });
  saveAccount(acc);
  return taken;
}

// Return unused cash boffins to the account at end of game
function returnBoffins(boffins) {
  const acc = loadAccount();
  boffins.filter(b => b.source === 'cash').forEach(b => acc.boffins.push(b));
  saveAccount(acc);
}

// ----- Seat tickets -----
function generateSerial() {
  // 10-digit serial: printed in full on part 1; each part carries 2 digits
  let s = '';
  for (let i = 0; i < 10; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function createTicket(tier) {
  return {
    id: `tk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tier,
    serial: generateSerial(),
    parts: Array(TICKET_PARTS_COUNT).fill(false),
    purchasedParts: 0,                     // max MAX_PURCHASABLE_PARTS per ticket
    tradedParts: Array(TICKET_PARTS_COUNT).fill(false), // a traded part transfers only once
    createdAt: new Date().toISOString(),
  };
}

function missingParts(ticket) {
  return ticket.parts.map((has, i) => (has ? -1 : i)).filter(i => i >= 0);
}

function isComplete(ticket) {
  return ticket.parts.every(Boolean);
}

// Award `count` random parts of `tier` to the account.
// Parts are added to the newest incomplete ticket of that tier (or a new one).
// Returns { tier, ticket, awarded: [partIdx], spilled: [...] } — spillover parts
// land on a fresh ticket if the first one completes mid-award.
function awardRandomParts(tier, count) {
  const acc = loadAccount();
  let ticket = acc.tickets.find(t => t.tier === tier && !isComplete(t));
  const awarded = [];
  for (let n = 0; n < count; n++) {
    if (!ticket || isComplete(ticket)) {
      ticket = createTicket(tier);
      acc.tickets.push(ticket);
    }
    const missing = missingParts(ticket);
    const idx = missing[Math.floor(Math.random() * missing.length)];
    ticket.parts[idx] = true;
    awarded.push({ ticketId: ticket.id, serial: ticket.serial, part: idx });
  }
  saveAccount(acc);
  return { tier, awarded };
}

// Award a complete 5-part ticket (e.g. 1st place in a free game)
function awardWholeTicket(tier) {
  const acc = loadAccount();
  const ticket = createTicket(tier);
  ticket.parts = Array(TICKET_PARTS_COUNT).fill(true);
  acc.tickets.push(ticket);
  saveAccount(acc);
  return ticket;
}

function getTickets(tier = null) {
  const acc = loadAccount();
  return tier ? acc.tickets.filter(t => t.tier === tier) : acc.tickets;
}

function findCompleteTicket(tier) {
  return getTickets(tier).find(isComplete) || null;
}

// Purchase a missing part (max MAX_PURCHASABLE_PARTS per ticket).
// Price is only available on the game day of that tier.
function partPricePence(tier) {
  return TICKET_PART_PRICES[tier] ?? null;
}

function buyTicketPart(ticketId, partIdx) {
  const acc = loadAccount();
  const ticket = acc.tickets.find(t => t.id === ticketId);
  if (!ticket || ticket.parts[partIdx]) return { error: 'Part already held' };
  if (ticket.purchasedParts >= MAX_PURCHASABLE_PARTS) return { error: `Maximum ${MAX_PURCHASABLE_PARTS} parts may be purchased per ticket` };
  const price = partPricePence(ticket.tier);
  if (price === null) return { error: 'Part price is only shown on the day of the prize game' };
  ticket.parts[partIdx] = true;
  ticket.purchasedParts++;
  acc.purchases.push({ ticketId, part: partIdx, pricePence: price, at: new Date().toISOString() });
  saveAccount(acc);
  return { ticket, pricePence: price };
}

// Consume a complete ticket when taking a seat in a prize game
function consumeTicket(ticketId) {
  const acc = loadAccount();
  const idx = acc.tickets.findIndex(t => t.id === ticketId);
  if (idx < 0 || !isComplete(acc.tickets[idx])) return false;
  acc.tickets.splice(idx, 1);
  saveAccount(acc);
  return true;
}

// ----- Trading -----
// A ticket part may only ever be transferred once.
function markPartTraded(ticketId, partIdx) {
  const acc = loadAccount();
  const ticket = acc.tickets.find(t => t.id === ticketId);
  if (!ticket || !ticket.parts[partIdx]) return { error: 'Part not held' };
  if (ticket.tradedParts[partIdx]) return { error: 'This part has already been transferred once — it cannot be traded again' };
  ticket.parts[partIdx] = false;
  ticket.tradedParts[partIdx] = true;
  saveAccount(acc);
  return { ticket };
}

// ----- Cognitive points -----
function addCognitivePoints(delta) {
  const acc = loadAccount();
  acc.cognitive.points = Math.max(0, acc.cognitive.points + delta);
  saveAccount(acc);
  return acc.cognitive.points;
}

// ----- End-of-game settlement -----
// Rules:
// - Registered-but-unused Gold Coins return to the account.
// - 50% of in-game-earned Gold Coins not used are credited (rounded down).
// - Unused cash-purchased Boffins return; gold-coin Boffins expire.
// - All HECUs acquired in the game are deemed spent — nothing carries over.
function settleGame({ unusedRegisteredCoins, earnedCoins, unusedBoffins }) {
  const coinCredit = (unusedRegisteredCoins || 0) + Math.floor((earnedCoins || 0) / 2);
  const acc = loadAccount();
  acc.goldCoins += coinCredit;
  (unusedBoffins || []).filter(b => b.source === 'cash').forEach(b => acc.boffins.push(b));
  saveAccount(acc);
  return { coinCredit };
}

window.PlayerAccount = {
  TICKET_TIERS, TICKET_PARTS_COUNT, MAX_PURCHASABLE_PARTS,
  TICKET_PART_PRICES, PUBLISHED_PART_PRICE_TIERS,
  BOFFIN_DEFS, TIER_LABELS, TIER_ICONS,
  loadAccount, saveAccount,
  addGoldCoins, spendGoldCoins,
  addBoffin, withdrawBoffins, returnBoffins,
  awardRandomParts, awardWholeTicket, getTickets, findCompleteTicket,
  missingParts, isComplete, partPricePence, buyTicketPart, consumeTicket, markPartTraded,
  addCognitivePoints, settleGame, isoWeekKey,
};
