/** Verbindung des „Sag hallo“-Chats mit dem Matrix-Bot (einmal pro Prozess). */
import { config } from '../config';
import { getDb } from '../db';
import { log } from '../log';
import { getHalloBot, halloBotIsSeparate } from '../notify/matrix';
import { getSetting } from '../settings';
import { handleRoomMessage, type HalloTransport } from './index';

const g = globalThis as unknown as { __halloRoomId?: string | null; __halloRoom?: string; __halloStarted?: boolean };

/** Matrix-Raum für Website-Chat-Nachrichten: Einstellung im Admin, sonst MATRIX_HALLO_CHAT_ROOM. */
export function halloRoom(): string {
  return getSetting(getDb(), 'hallo_chat_room') || config.halloChat.room;
}

/** Raum beobachten, in dem der Bot gerade posten soll. Fehler (z. B. Bot noch nicht eingeladen) werden geloggt. */
async function watchCurrentRoom(): Promise<void> {
  const bot = getHalloBot();
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

/** Beim Start: Chat-Raum beobachten. */
export async function startHallo(): Promise<void> {
  const bot = getHalloBot();
  if (!config.halloChat.enabled || !bot) return;
  // Eigenes Chat-Konto: Sync starten. Es nimmt keine Codes an (das macht der Buchungs-Bot).
  if (halloBotIsSeparate() && !g.__halloStarted) {
    g.__halloStarted = true;
    await bot.start(async () => null);
  }
  await watchCurrentRoom();
}

/**
 * Nach einer Änderung im Admin: neuen Raum beobachten. Der alte Raum wird weiter beobachtet, bis der
 * Server neu startet, damit Antworten in laufenden Threads noch ankommen. Neue Nachrichten gehen in den neuen Raum.
 */
export async function switchHalloRoom(): Promise<void> {
  if (!config.halloChat.enabled || !getHalloBot()) return;
  if (g.__halloRoom === halloRoom() && g.__halloRoomId) return;
  await watchCurrentRoom();
}

/** Status für den Admin-Bereich. */
export function halloStatus(): { room: string; watching: string | null; connected: boolean; configured: boolean } {
  return {
    room: halloRoom(),
    watching: g.__halloRoom ?? null,
    connected: halloAvailable(),
    configured: !!(config.halloChat.enabled && getHalloBot()),
  };
}

/** Ist die Chat-Box nutzbar? */
export function halloAvailable(): boolean {
  const bot = getHalloBot();
  return !!(config.halloChat.enabled && bot && bot.connected && g.__halloRoomId && bot.isJoined(g.__halloRoomId));
}

export function halloTransport(): HalloTransport {
  return {
    async roomId() {
      const bot = getHalloBot();
      if (!bot || !g.__halloRoomId) throw new Error('Website-Chat nicht verbunden');
      return bot.joinedRoom(g.__halloRoomId);
    },
    async send(roomId, text, html, extra) {
      const bot = getHalloBot();
      if (!bot) throw new Error('Matrix-Bot nicht konfiguriert');
      return bot.send(roomId, text, html, false, extra);
    },
  };
}
