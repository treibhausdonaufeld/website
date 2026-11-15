import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/lib/db';
import { halloConversations, halloMessages } from '../../src/lib/db/schema';
import {
  HalloError,
  cleanContact,
  firstName,
  cleanText,
  cleanupHallo,
  findConversation,
  handleRoomMessage,
  messagesFor,
  sendGuestMessage,
  stripReplyFallback,
  type HalloTransport,
} from '../../src/lib/hallo';
import { testDb } from './helpers';

const ROOM = '!hallo:treibhaus';

function fakeTransport() {
  const sent: { roomId: string; text: string; html: string; extra: Record<string, any>; id: string }[] = [];
  let n = 0;
  const t: HalloTransport & { fail?: boolean } = {
    async roomId() {
      return ROOM;
    },
    async send(roomId, text, html, extra) {
      if (t.fail) throw new Error('down');
      const id = `$ev${++n}`;
      sent.push({ roomId, text, html, extra, id });
      return id;
    },
  };
  return { t, sent };
}

const names = async (u: string) => (u === '@anna:th' ? 'Anna (Raum-AG)' : u);

describe('Website-Chat „Sag hallo“', () => {
  let db: DB;
  let tr: ReturnType<typeof fakeTransport>;
  let ipN = 0;
  const ip = () => `10.0.0.${++ipN}`;
  beforeEach(() => {
    db = testDb();
    tr = fakeTransport();
  });

  it('erste Nachricht als Beitrag, weitere im Thread', async () => {
    const a = await sendGuestMessage(db, tr.t, { name: 'Mia', text: 'Hallo! Wann ist der Treff?', ip: ip() });
    expect(a.token).toMatch(/.{20,}/);
    expect(tr.sent[0].text).toContain('Gast „Mia“ (über die Website): Hallo! Wann ist der Treff?');
    expect(tr.sent[0].extra).toEqual({});
    expect(a.conversation.rootEventId).toBe('$ev1');

    const b = await sendGuestMessage(db, tr.t, { token: a.token, text: 'Und kostet das was?', ip: ip() });
    expect(b.conversation.id).toBe(a.conversation.id);
    expect(tr.sent[1].text).toBe('Gast „Mia“: Und kostet das was?');
    expect(tr.sent[1].extra['m.relates_to']).toMatchObject({ rel_type: 'm.thread', event_id: '$ev1', 'm.in_reply_to': { event_id: '$ev1' } });

    // Unbekanntes Token → neues Gespräch
    const c = await sendGuestMessage(db, tr.t, { token: 'quatsch', text: 'Hi', ip: ip() });
    expect(c.conversation.id).not.toBe(a.conversation.id);
    expect(tr.sent[2].text).toMatch(/^Gast \(über die Website\): Hi/);
  });

  it('Kontakt (Telefon/E-Mail) wird beim ersten Beitrag und bei Änderung mitgeschickt', async () => {
    const a = await sendGuestMessage(db, tr.t, { name: 'Mia', contact: ' +43 660 123 45 67 ', text: 'Ruft mich wer zurück?', ip: ip() });
    expect(a.conversation.contact).toBe('+43 660 123 45 67');
    expect(tr.sent[0].text).toContain('📞 Rückmeldung an: +43 660 123 45 67');
    expect(tr.sent[0].html).toContain('Rückmeldung an:</b> +43 660 123 45 67');

    // gleicher Kontakt: nicht wiederholen
    await sendGuestMessage(db, tr.t, { token: a.token, contact: '+43 660 123 45 67', text: 'Noch was', ip: ip() });
    expect(tr.sent[1].text).toBe('Gast „Mia“: Noch was');

    // neuer Kontakt: im Thread nennen
    const c = await sendGuestMessage(db, tr.t, { token: a.token, contact: 'mia@example.org', text: 'Lieber per Mail', ip: ip() });
    expect(c.conversation.contact).toBe('mia@example.org');
    expect(tr.sent[2].text).toBe('Gast „Mia“: Lieber per Mail\n📞 Rückmeldung an: mia@example.org');

    // leer lassen löscht den gespeicherten Kontakt nicht
    const d = await sendGuestMessage(db, tr.t, { token: a.token, text: 'Danke', ip: ip() });
    expect(d.conversation.contact).toBe('mia@example.org');
    expect(tr.sent[3].text).toBe('Gast „Mia“: Danke');
  });

  it('auf der Website steht nur der Vorname', () => {
    expect(firstName('Anna Muster')).toBe('Anna');
    expect(firstName('Anna Muster (Raum-AG)')).toBe('Anna');
    expect(firstName('[Raum-AG] Jörg Huber')).toBe('Jörg');
    expect(firstName('@anna.muster:treibhausdonaufeld.at')).toBe('Anna');
    expect(firstName('anna_muster')).toBe('Anna');
    expect(firstName('Marie-Luise Berger')).toBe('Marie-Luise');
    expect(firstName('🌱 Lena 🌱')).toBe('Lena');
    expect(firstName('')).toBeNull();
    expect(firstName(null)).toBeNull();
  });

  it('Kontakt wird geprüft', async () => {
    expect(cleanContact('')).toBeNull();
    expect(cleanContact('0660/1234567')).toBe('0660/1234567');
    expect(cleanContact('a.b@c.at')).toBe('a.b@c.at');
    expect(() => cleanContact('ruf mich an')).toThrow(HalloError);
    expect(() => cleanContact('12345')).toThrow(HalloError);
    await expect(sendGuestMessage(db, tr.t, { contact: 'quatsch', text: 'Hi', ip: ip() })).rejects.toBeInstanceOf(HalloError);
    expect(tr.sent).toHaveLength(0);
  });

  it('HTML wird maskiert, @room entschärft, Steuerzeichen entfernt', async () => {
    await sendGuestMessage(db, tr.t, { name: '<b>x</b>', text: '<script>alert(1)</script> @room\u0007', ip: ip() });
    expect(tr.sent[0].html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(tr.sent[0].html).toContain('&lt;script&gt;');
    expect(tr.sent[0].html).not.toContain('<script>');
    expect(tr.sent[0].text).not.toMatch(/@room\b(?!⁠)/);
    expect(tr.sent[0].text).toContain('@⁠room');
    expect(cleanText('a\u0007b‮\n\n\n\nc', 100)).toBe('ab\n\nc');
    await expect(sendGuestMessage(db, tr.t, { text: '   ', ip: ip() })).rejects.toBeInstanceOf(HalloError);
  });

  it('Antworten aus dem Thread und direkte Antworten landen beim Gast', async () => {
    const a = await sendGuestMessage(db, tr.t, { name: 'Mia', text: 'Hallo', ip: ip() });
    const other = await sendGuestMessage(db, tr.t, { text: 'Anderes Gespräch', ip: ip() });

    // Antwort im Thread
    expect(
      await handleRoomMessage(db, ROOM, { event_id: '$r1', sender: '@anna:th', type: 'm.room.message', origin_server_ts: 1_800_000_000_000, content: { msgtype: 'm.text', body: 'Samstag 13:30!', 'm.relates_to': { rel_type: 'm.thread', event_id: '$ev1', is_falling_back: true, 'm.in_reply_to': { event_id: '$ev1' } } } }, names),
    ).toBe(a.conversation.id);
    // Direkte Antwort (mit Zitat) auf eine Gast-Nachricht im Haupt-Verlauf
    await handleRoomMessage(db, ROOM, { event_id: '$r2', sender: '@bo:th', type: 'm.room.message', content: { msgtype: 'm.text', body: '> <@bot:th> Gast: Hallo\n\nWillkommen!', 'm.relates_to': { 'm.in_reply_to': { event_id: '$ev1' } } } }, names);
    // Nicht zugeordnet: normale Raumnachricht, fremder Thread, Bearbeitung
    expect(await handleRoomMessage(db, ROOM, { event_id: '$x1', sender: '@bo:th', type: 'm.room.message', content: { body: 'Hallo alle' } }, names)).toBeNull();
    expect(await handleRoomMessage(db, ROOM, { event_id: '$x2', sender: '@bo:th', type: 'm.room.message', content: { body: 'x', 'm.relates_to': { rel_type: 'm.thread', event_id: '$fremd' } } }, names)).toBeNull();
    expect(await handleRoomMessage(db, ROOM, { event_id: '$x3', sender: '@bo:th', type: 'm.room.message', content: { body: '* neu', 'm.relates_to': { rel_type: 'm.replace', event_id: '$r1' } } }, names)).toBeNull();
    // Doppelt zugestellt → nur einmal gespeichert
    await handleRoomMessage(db, ROOM, { event_id: '$r1', sender: '@anna:th', type: 'm.room.message', content: { body: 'Samstag 13:30!', 'm.relates_to': { rel_type: 'm.thread', event_id: '$ev1' } } }, names);

    const msgs = messagesFor(db, a.conversation.id);
    expect(msgs.map((m) => `${m.from}:${m.author ?? ''}:${m.text}`)).toEqual([
      'gast::Hallo',
      'team:Anna:Samstag 13:30!',
      'team:Bo:Willkommen!',
    ]);
    expect(messagesFor(db, a.conversation.id, msgs[1].id).map((m) => m.text)).toEqual(['Willkommen!']);
    expect(messagesFor(db, other.conversation.id).map((m) => m.text)).toEqual(['Anderes Gespräch']);
    // Gast-Nachrichten verraten keine Event-IDs o. Ä.
    expect(Object.keys(msgs[0]).sort()).toEqual(['at', 'author', 'from', 'id', 'text']);
  });

  it('Rate-Limits: neue Gespräche pro IP, Nachrichten pro IP', async () => {
    const one = '192.168.1.1';
    for (let i = 0; i < 3; i++) await sendGuestMessage(db, tr.t, { text: `neu ${i}`, ip: one });
    await expect(sendGuestMessage(db, tr.t, { text: 'noch eins', ip: one })).rejects.toMatchObject({ code: 'limit' });
    const two = '192.168.1.2';
    const c = await sendGuestMessage(db, tr.t, { text: 'start', ip: two });
    for (let i = 0; i < 14; i++) await sendGuestMessage(db, tr.t, { token: c.token, text: `m${i}`, ip: two });
    await expect(sendGuestMessage(db, tr.t, { token: c.token, text: 'zu viel', ip: two })).rejects.toMatchObject({ code: 'limit' });
  });

  it('Matrix nicht erreichbar: Fehler, nichts gespeichert', async () => {
    tr.t.fail = true;
    await expect(sendGuestMessage(db, tr.t, { text: 'Hallo', ip: ip() })).rejects.toMatchObject({ code: 'unavailable' });
    expect(db.select().from(halloMessages).all()).toHaveLength(0);
  });

  it('Löschfrist und Antwort-Zitate', async () => {
    const a = await sendGuestMessage(db, tr.t, { text: 'alt', ip: ip() });
    db.update(halloConversations).set({ lastActivityAt: new Date(Date.now() - 31 * 86_400_000) }).run();
    expect(cleanupHallo(db, 30)).toBe(1);
    expect(findConversation(db, a.token)).toBeUndefined();
    expect(db.select().from(halloMessages).all()).toHaveLength(0);
    expect(stripReplyFallback('> <@a:b> zitat\n> zeile 2\n\nAntwort')).toBe('Antwort');
    expect(stripReplyFallback('Normal')).toBe('Normal');
  });
});
