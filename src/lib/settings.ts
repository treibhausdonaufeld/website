/** Im Admin-Bereich änderbare Einstellungen (Tabelle `settings`). */
import { eq } from 'drizzle-orm';
import type { DB } from './db';
import { settings } from './db/schema';

type Db = DB;

export const SETTING_KEYS = ['hallo_chat_room'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export function getSetting(db: Db, key: SettingKey): string | null {
  return db.select().from(settings).where(eq(settings.key, key)).get()?.value ?? null;
}

export function setSetting(db: Db, key: SettingKey, value: string, actor: string): void {
  db.insert(settings)
    .values({ key, value, updatedBy: actor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedBy: actor, updatedAt: new Date() } })
    .run();
}

export function deleteSetting(db: Db, key: SettingKey): void {
  db.delete(settings).where(eq(settings.key, key)).run();
}
