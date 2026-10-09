export interface ICalendarEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}

export class CalendarService {
  /**
   * Format a single Date object to ICS string (YYYYMMDDTHHmmssZ).
   */
  private static formatDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  /**
   * Generate RFC 5545 compliant .ics string for given calendar events.
   */
  static generateICS(events: ICalendarEvent[]): string {
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TrueLern LMS//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    for (const evt of events) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${evt.uid}@truelern.com`);
      lines.push(`DTSTAMP:${this.formatDate(new Date())}`);
      lines.push(`DTSTART:${this.formatDate(evt.startDate)}`);
      lines.push(`DTEND:${this.formatDate(evt.endDate)}`);
      lines.push(`SUMMARY:${evt.title.replace(/\n/g, " ")}`);
      if (evt.description) {
        lines.push(`DESCRIPTION:${evt.description.replace(/\n/g, "\\n")}`);
      }
      if (evt.location) {
        lines.push(`LOCATION:${evt.location}`);
      }
      if (evt.url) {
        lines.push(`URL:${evt.url}`);
      }
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }
}
