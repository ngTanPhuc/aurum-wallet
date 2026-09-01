/**
 * Returns the date when yield becomes eligible after a deposit or threshold crossing.
 *
 * Follows MoMo's Túi Thần Tài business-day settlement calendar:
 *   Mon deposit → earns Wed  (next biz day = Tue, +1 = Wed)
 *   Thu deposit → earns Mon  (next biz day = Fri, +1 = Mon)
 *   Fri deposit → earns Tue  (next biz day = Mon, +1 = Tue)
 *   Sat deposit → earns Tue  (next biz day = Mon, +1 = Tue)
 *   Sun deposit → earns Tue  (next biz day = Mon, +1 = Tue) ← confirmed by user
 *
 * Algorithm: advance to the next business day (skip weekends), then advance
 * one more business day. Weekends (Sat=6, Sun=0) are never settlement days.
 */
export function getSettlementDate(fromDate: Date): Date {
  const firstBizDay = addOneBusinessDay(fromDate);
  return addOneBusinessDay(firstBizDay);
}

function addOneBusinessDay(date: Date): Date {
  const d = new Date(date);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6); // skip Sun (0) and Sat (6)
  return d;
}
