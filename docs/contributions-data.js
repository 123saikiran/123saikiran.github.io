const DAY = 86400000;

export function prepareCalendar(payload) {
  if (!Array.isArray(payload?.contributions) || !payload.contributions.length || payload.contributions.length > 400) {
    throw new Error('The contribution calendar is unavailable.');
  }
  const days = payload.contributions.map(day => {
    const date = typeof day.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day.date) ? new Date(`${day.date}T00:00:00Z`) : null;
    if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== day.date || !Number.isSafeInteger(day.count) || day.count < 0 || !Number.isInteger(day.level) || day.level < 0 || day.level > 4) {
      throw new Error('Invalid contribution data.');
    }
    return {date:day.date, count:day.count, level:day.level, timestamp:date.getTime()};
  }).sort((a,b) => a.timestamp - b.timestamp);
  for (let index=1; index<days.length; index++) {
    if (days[index].timestamp - days[index-1].timestamp !== DAY) throw new Error('The contribution calendar has missing or duplicate days.');
  }
  const total = days.reduce((sum, day) => sum + day.count, 0);
  if (Number.isSafeInteger(payload.total?.lastYear) && payload.total.lastYear !== total) throw new Error('The contribution total does not match the calendar.');
  const offset = new Date(days[0].timestamp).getUTCDay();
  return {
    total,
    weeks:Math.ceil((offset + days.length)/7),
    start:days[0].date,
    end:days.at(-1).date,
    days:days.map((day,index) => ({...day,column:Math.floor((offset+index)/7),row:(offset+index)%7}))
  };
}
