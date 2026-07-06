import { DateTime } from 'luxon';

export function date(string) {
    if (string) {
        return DateTime.fromISO(String(string)).toLocaleString();
    }
}

export function datetime(string) {
    if (string) {
        return DateTime.fromISO(String(string)).toLocaleString(DateTime.DATETIME_MED);
    }
}
