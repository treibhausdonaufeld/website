/** Verbindung des „Sag hallo“-Chats mit dem Matrix-Bot (einmal pro Prozess). */
import { config } from '../config';
import { getDb } from '../db';
import { log } from '../log';
import { getMatrixBot } from '../notify/matrix';
import { getSetting } from '../settings';
import { handleRoomMessage, type HalloTransport } from './index';

const g = globalThis as unknown as { __halloRoomId?: string | null; __halloRoom?: string };

/** Matrix-Raum für Website-Chat-Nachrichten: Einstellung im Admin, sonst MATRIX_HALLO_CHAT_ROOM. */
export function halloRoom(): string {
  return getSetting(getDb(), 'hallo_chat_room') || config.halloChat.room;
}

/** Raum beobachten, in dem der Bot gerade posten soll. Fehler (z. B. Bot noch nicht eingeladen) werden geloggt. */
async function watchCurrentRoom(): Promise<void> {
  const bot = getMatrixBot();
  if (!bot) return;
  const room = halloRoom();
  const db = getDb();
  try {
    const roomId = await bot.watchRoom(room, (rid, ev) =>
      handleRoomMessage(db, rid, ev, (userId) => bot.displayName(rid, userId)).then(() => undefined),
    );
    g.__halloRoomId = roomId;
    g.__halloRoom = room;
    if (bot.isJoined(roomId)) log.info('Website-Chat verbunden', { room });
  } catch (err) {
    g.__halloRoomId = null;
    g.__halloRoom = room;
    log.warn('Website-Chat: Raum nicht gefunden', { room, err });
  }
}

/** Beim Start: Chat-Raum beobachten. Der Bot-Sync läuft bereits (siehe boot.ts). */
export async function startHallo(): Promise<void> {
  if (!config.halloChat.enabled || !getMatrixBot()) return;
  await watchCurrentRoom();
}

/**
 * Nach einer Änderung im Admin: neuen Raum beobachten. Der alte Raum wird weiter beobachtet, bis der
 * Server neu startet, damit Antworten in laufenden Threads noch ankommen. Neue Nachrichten gehen in den neuen Raum.
 */
export async function switchHalloRoom(): Promise<void> {
  if (!config.halloChat.enabled || !getMatrixBot()) return;
  if (g.__halloRoom === halloRoom() && g.__halloRoomId) return;
  await watchCurrentRoom();
}

/** Status für den Admin-Bereich. */
export function halloStatus(): { room: string; watching: string | null; connected: boolean; configured: boolean } {
  return {
    room: halloRoom(),
    watching: g.__halloRoom ?? null,
    connected: halloAvailable(),
    configured: !!(config.halloChat.enabled && getMatrixBot()),
  };
}

/** Ist die Chat-Box nutzbar? */
export function halloAvailable(): boolean {
  const bot = getMatrixBot();
  return !!(config.halloChat.enabled && bot && bot.connected && g.__halloRoomId && bot.isJoined(g.__halloRoomId));
}

export function halloTransport(): HalloTransport {
  return {
    async roomId() {
      const bot = getMatrixBot();
      if (!bot || !g.__halloRoomId) throw new Error('Website-Chat nicht verbunden');
      return bot.joinedRoom(g.__halloRoomId);
    },
    async send(roomId, text, html, extra) {
      const bot = getMatrixBot();
      if (!bot) throw new Error('Matrix-Bot nicht konfiguriert');
      return bot.send(roomId, text, html, false, extra);
    },
  };
}
