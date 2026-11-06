#!/usr/bin/env python3
"""Pull the latest FLIGHT LINE BRIEF email from Gmail, parse the plain-text
summary, encrypt it and write data.enc.json for the status display.

Secrets (GitHub repo -> Settings -> Secrets and variables -> Actions):
  BOARD_PASSWORD      password the TVs type in
  GMAIL_USER          the Gmail address that receives the brief
  GMAIL_APP_PASSWORD  a Google app password for that Gmail account
Optional variable: BRIEF_SENDER (default richard.nielson.1@us.af.mil)
"""
import os, re, json, base64, imaplib, email, datetime, sys
from email.utils import parsedate_to_datetime
from email.header import decode_header, make_header
from zoneinfo import ZoneInfo
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

DATA = 'data.enc.json'
PW = os.environ['BOARD_PASSWORD']
ITER = 300000
TZ = ZoneInfo('America/Phoenix')

DEFAULT = {
    'title': '162ND WING', 'unit': 'ALERT DETACHMENT 2',
    'msgId': '', 'briefDate': '', 'lastUpdate': 'AWAITING FIRST BRIEF',
    'tip': 'Status, tails and crew pull from the morning brief at 0600 and 1700.',
    'bays': [{'tail': '', 'status': 'SPARE', 'remark': '', 'aMan': '', 'bMan': '', 'pilot': ''} for _ in range(4)],
    'pilots': ['', ''],
}
STATUS = {'FMC': 'FMC', 'PMC': 'PMC', 'PMCM': 'PMC', 'PMCS': 'PMC', 'PMCB': 'PMC',
          'NMC': 'NMC', 'NMCM': 'NMC', 'NMCS': 'NMC', 'NMCB': 'NMC',
          'FLYING': 'FLYING', 'AIRBORNE': 'FLYING', 'FLY': 'FLYING',
          'SPARE': 'SPARE', 'SP': 'SPARE', 'SP2': 'SPARE'}
BLANK = {'', '-', '—', '–', '___', '__', '_', 'N/A', 'NA', 'NONE'}
ROLE = re.compile(r'^(SAP|JAP|IP|WG|FL|LEAD|WINGMAN|#?\d)[:\-]?$', re.I)


def b64(x): return base64.b64encode(x).decode()


def derive(salt): return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(PW.encode())


def load():
    if not os.path.exists(DATA):
        return json.loads(json.dumps(DEFAULT))
    e = json.load(open(DATA))
    pt = AESGCM(derive(base64.b64decode(e['salt']))).decrypt(base64.b64decode(e['iv']), base64.b64decode(e['ct']), None)
    d = json.loads(pt)
    for k, v in DEFAULT.items():
        d.setdefault(k, v)
    return d


def save(d):
    salt, iv = os.urandom(16), os.urandom(12)
    ct = AESGCM(derive(salt)).encrypt(iv, json.dumps(d).encode(), None)
    json.dump({'v': 1, 'salt': b64(salt), 'iv': b64(iv), 'ct': b64(ct)}, open(DATA, 'w'))


def clean(s, n=30):
    s = re.sub(r'["\'\\<>`]', '', str(s or '')).strip().upper()
    return '' if s in BLANK else s[:n]


def body_text(msg):
    plain, html = None, None
    for part in msg.walk():
        if part.get_content_maintype() == 'multipart' or part.get_filename():
            continue  # never touch attachments
        ct = part.get_content_type()
        try:
            txt = part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', 'replace')
        except Exception:
            continue
        if ct == 'text/plain' and plain is None:
            plain = txt
        elif ct == 'text/html' and html is None:
            html = txt
    if plain is None and html:
        plain = re.sub(r'<br\s*/?>|</p>|</div>', '\n', html, flags=re.I)
        plain = re.sub(r'<[^>]+>', '', plain).replace('&nbsp;', ' ').replace('&amp;', '&')
    return plain or ''


def fetch_latest():
    sender = os.environ.get('BRIEF_SENDER') or 'richard.nielson.1@us.af.mil'
    m = imaplib.IMAP4_SSL('imap.gmail.com')
    m.login(os.environ['GMAIL_USER'], os.environ['GMAIL_APP_PASSWORD'].replace(' ', ''))
    m.select('INBOX', readonly=True)
    since = (datetime.date.today() - datetime.timedelta(days=3)).strftime('%d-%b-%Y')
    typ, ids = m.search(None, 'FROM', '"%s"' % sender, 'SUBJECT', '"FLIGHT LINE BRIEF"', 'SINCE', since)
    ids = ids[0].split() if ids and ids[0] else []
    if not ids:
        m.logout()
        return None
    typ, raw = m.fetch(ids[-1], '(RFC822)')
    m.logout()
    return email.message_from_bytes(raw[0][1])


def parse(text, d):
    lines = [l.strip() for l in text.replace('\r', '').split('\n')]
    seen_bay = False
    pilots_line = None
    for l in lines:
        mdate = re.match(r'^DATE\s*[:\-]\s*(.+)$', l, re.I)
        if mdate:
            d['briefDate'] = clean(mdate.group(1), 16)
            continue
        mp = re.match(r'^PILOTS?\s*[:\-]\s*(.*)$', l, re.I)
        if mp:
            pilots_line = mp.group(1)
            continue
        mb = re.match(r'^BAY\s*0?([1-4])\s*[:\-]\s*(.+)$', l, re.I)
        if not mb:
            continue
        seen_bay = True
        i = int(mb.group(1)) - 1
        parts = [p.strip() for p in mb.group(2).split('|')]
        head = parts[0]
        remark = ''
        if ' - ' in head:
            head, remark = head.split(' - ', 1)
        toks = head.split()
        bay = d['bays'][i]
        new = {'tail': bay['tail'], 'status': bay['status'], 'remark': clean(remark), 'aMan': '', 'bMan': '', 'pilot': ''}
        if toks:
            new['tail'] = clean(toks[0], 12)
        if len(toks) > 1 and toks[1].upper() in STATUS:
            new['status'] = STATUS[toks[1].upper()]
        for p in parts[1:]:
            mf = re.match(r'^(A|B|PILOT|NOTE)\s*[:\-]\s*(.*)$', p, re.I)
            if not mf:
                continue
            k, v = mf.group(1).upper(), mf.group(2)
            if k == 'A': new['aMan'] = clean(v, 20)
            elif k == 'B': new['bMan'] = clean(v, 20)
            elif k == 'PILOT': new['pilot'] = clean(v, 20)
            elif k == 'NOTE': new['remark'] = clean(v)
        d['bays'][i] = new
    if pilots_line is not None:
        names = []
        for raw in pilots_line.split(',')[:2]:
            w = raw.strip().split()
            if len(w) > 1 and ROLE.match(w[0]):
                w = w[1:]
            names.append(clean(' '.join(w), 20))
        while len(names) < 2:
            names.append('')
        d['pilots'] = names
    elif seen_bay:
        jp = [b['pilot'] for b in d['bays'] if b['pilot']]
        if jp:
            d['pilots'] = (jp + ['', ''])[:2]
    return seen_bay


def main():
    d = load()
    if not os.path.exists(DATA):
        save(d)  # first run: publish an empty board so the page can unlock
    msg = fetch_latest()
    if msg is None:
        print('No brief email in the last 3 days; nothing to do.')
        return
    mid = (msg.get('Message-ID') or '').strip()
    if mid and mid == d.get('msgId'):
        print('Latest brief already applied.')
        return
    subject = str(make_header(decode_header(msg.get('Subject', ''))))
    text = body_text(msg)
    if re.search(r'\b(CUI|FOUO|CONTROLLED)\b', subject + '\n' + text, re.I):
        print('Brief contains a CUI/FOUO/CONTROLLED marking; board NOT updated.')
        return
    if not parse(text, d):
        print('Brief has no BAY lines (attachment only?); board NOT updated.')
        return
    d['msgId'] = mid
    try:
        d['lastUpdate'] = parsedate_to_datetime(msg['Date']).astimezone(TZ).strftime('%d %b %H%M').upper() + 'L'
    except Exception:
        d['lastUpdate'] = datetime.datetime.now(TZ).strftime('%d %b %H%M').upper() + 'L'
    save(d)
    print('Board updated.')  # logs are public: never print names, tails or status


if __name__ == '__main__':
    main()
