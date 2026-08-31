export type TrackingScan = {
  trackingNumber: string;
  status: string;
  eventTime: string;
  location?: string;
  description?: string;
};

export function hasExactTrackingMatch(orderTrackingNumber: string, candidateTrackingNumber: string) {
  return orderTrackingNumber.length > 0 && orderTrackingNumber === candidateTrackingNumber;
}

export function chooseNewestMatchingScan(orderTrackingNumber: string, scans: TrackingScan[]) {
  const matching = scans.filter((scan) => hasExactTrackingMatch(orderTrackingNumber, scan.trackingNumber));
  if (matching.length === 0) return null;

  const timed = matching.map((scan) => ({ scan, time: Date.parse(scan.eventTime) }));
  if (timed.some(({ time }) => !Number.isFinite(time))) return null;

  return timed.reduce((newest, current) => current.time > newest.time ? current : newest).scan;
}
