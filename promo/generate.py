import os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = '/Users/ralphulysse/Documents/ready/bookitbyzewo/promo'
S = 2  # supersample factor; everything is designed in 1080-wide logical px
FONT = '/System/Library/Fonts/Avenir Next.ttc'
EMOJI = '/System/Library/Fonts/Apple Color Emoji.ttc'
BOLD, DEMI, MED, REG, HEAVY = 0, 2, 5, 7, 8

GREEN, GREEN_D = (16, 185, 129), (5, 150, 105)
INK, INK2 = (11, 15, 20), (18, 24, 33)
WHITE, MUTED = (255, 255, 255), (148, 163, 184)

def font(size, idx=BOLD):
    return ImageFont.truetype(FONT, int(size * S), index=idx)

def blend_bg(w, h, base, glows):
    """Solid base colour with soft radial glows [(cx, cy, radius, colour, alpha)] (logical px)."""
    img = Image.new('RGB', (w * S, h * S), base)
    for cx, cy, r, col, a in glows:
        layer = Image.new('RGB', img.size, col)
        mask = Image.new('L', img.size, 0)
        d = ImageDraw.Draw(mask)
        d.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=int(255 * a))
        mask = mask.filter(ImageFilter.GaussianBlur(r * S * 0.45))
        img = Image.composite(layer, img, mask)
    return img

def rrect(img, box, radius, fill, outline=None, width=0, shadow=False):
    x0, y0, x1, y1 = [v * S for v in box]
    if shadow:
        sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([x0, y0 + 14 * S, x1, y1 + 14 * S], radius * S, fill=(0, 0, 0, 110))
        sh = sh.filter(ImageFilter.GaussianBlur(18 * S))
        img.paste(sh, (0, 0), sh)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x0, y0, x1, y1], radius * S, fill=fill, outline=outline, width=int(width * S))

def is_emoji(ch):
    return ord(ch) >= 0x2300

EMOJI_CACHE = {}
def emoji_tile(ch):
    if ch not in EMOJI_CACHE:
        f = ImageFont.truetype(EMOJI, 160)
        tile = Image.new('RGBA', (220, 220), (0, 0, 0, 0))
        ImageDraw.Draw(tile).text((110, 110), ch, font=f, embedded_color=True, anchor='mm')
        EMOJI_CACHE[ch] = tile.crop(tile.getbbox())
    return EMOJI_CACHE[ch]

def text_w(txt, f):
    size = f.size / S
    total = 0.0
    run = ''
    meas = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    for ch in txt + '\0':
        if ch != '\0' and not is_emoji(ch):
            run += ch
            continue
        total += meas.textlength(run, font=f) / S
        run = ''
        if ch != '\0':
            total += size * 1.15
    return total

def wrap(txt, f, maxw):
    lines, cur = [], ''
    for word in txt.split():
        t = (cur + ' ' + word).strip()
        if text_w(t, f) <= maxw: cur = t
        else:
            lines.append(cur); cur = word
    if cur: lines.append(cur)
    return lines

def draw_line(img, x, y, ln, size, f, fill, anchor):
    """One line of text where emoji characters are pasted as colour images."""
    d = ImageDraw.Draw(img)
    width = text_w(ln, f)
    if anchor[0] == 'm': x -= width / 2
    elif anchor[0] == 'r': x -= width
    cx = x
    run = ''
    def flush():
        nonlocal cx, run
        if run:
            d.text((cx * S, y * S), run, font=f, fill=fill, anchor='la')
            cx += d.textlength(run, font=f) / S
            run = ''
    for ch in ln:
        if is_emoji(ch):
            flush()
            tile = emoji_tile(ch)
            k = size * 1.0 * S / max(tile.size)
            t = tile.resize((int(tile.width * k), int(tile.height * k)), Image.LANCZOS)
            img.paste(t, (int(cx * S), int((y + size * 0.12) * S)), t)
            cx += size * 1.15
        else:
            run += ch
    flush()

def draw_text(img, xy, txt, size, idx=BOLD, fill=WHITE, anchor='la', maxw=None, line=1.18):
    """Draws (optionally wrapped) text; returns the y just below it."""
    f = font(size, idx)
    x, y = xy
    lines = wrap(txt, f, maxw) if maxw else [txt]
    for ln in lines:
        draw_line(img, x, y, ln, size, f, fill, anchor)
        y += size * line
    return y

def check(img, x, y, size, color):
    """Hand-drawn tick mark (no font dependency)."""
    d = ImageDraw.Draw(img)
    pts = [(x, y + size * 0.55), (x + size * 0.32, y + size * 0.85), (x + size * 0.85, y + size * 0.15)]
    d.line([(px * S, py * S) for px, py in pts], fill=color, width=int(size * 0.14 * S), joint='curve')

def emoji(img, xy, ch, size):
    f = ImageFont.truetype(EMOJI, 160)
    tile = Image.new('RGBA', (200, 200), (0, 0, 0, 0))
    ImageDraw.Draw(tile).text((100, 100), ch, font=f, embedded_color=True, anchor='mm')
    tile = tile.crop(tile.getbbox())
    k = size * S / max(tile.size)
    tile = tile.resize((int(tile.width * k), int(tile.height * k)), Image.LANCZOS)
    img.paste(tile, (int(xy[0] * S), int(xy[1] * S)), tile)

def pill(img, xy, txt, size=26, fill=GREEN, color=INK, pad=(26, 14)):
    f = font(size, DEMI)
    w = text_w(txt, f) + pad[0] * 2
    h = size * 1.2 + pad[1] * 2
    rrect(img, (xy[0], xy[1], xy[0] + w, xy[1] + h), h / 2, fill)
    draw_text(img, (xy[0] + pad[0], xy[1] + pad[1] - 2), txt, size, DEMI, color)
    return w, h

def brand(img, w, y=64, color=WHITE, mark=GREEN):
    rrect(img, (64, y, 64 + 56, y + 56), 16, mark)
    emoji(img, (64 + 11, y + 11), '📅', 34)
    draw_text(img, (140, y + 4), 'BookIt', 34, BOLD, color)
    draw_text(img, (140, y + 38), 'by Zewo', 18, MED, MUTED)

def footer(img, w, h, lang):
    y = h - 110
    d = ImageDraw.Draw(img)
    d.line([(64 * S, y * S), ((w - 64) * S, y * S)], fill=(255, 255, 255, 40), width=S)
    draw_text(img, (64, y + 26), 'bookitbyzewo.com' if False else ('Prueba gratis 30 días' if lang == 'es' else 'Try it free for 30 days'), 28, DEMI, WHITE)
    draw_text(img, (w - 64, y + 26), 'Sin tarjeta' if lang == 'es' else 'No card needed', 28, DEMI, GREEN, anchor='ra')

def save(img, name, w, h):
    img = img.resize((w, h), Image.LANCZOS)
    img.save(os.path.join(OUT, name), optimize=True)
    print('saved', name, img.size)

def canvas(w, h):
    return blend_bg(w, h, INK, [(w * 0.1, h * 0.95, 620, GREEN_D, 0.55), (w * 0.95, h * 0.05, 520, (30, 64, 175), 0.35)])

def chat(img, x, y, w, txt, mine=False, size=28):
    f = font(size, MED)
    lines = wrap(txt, f, w - 56)
    h = len(lines) * size * 1.3 + 36
    rrect(img, (x, y, x + w, y + h), 26, GREEN if mine else (30, 41, 59), shadow=True)
    yy = y + 18
    for ln in lines:
        draw_text(img, (x + 28, yy), ln, size, MED, INK if mine else WHITE); yy += size * 1.3
    return y + h + 18

# ---------------- copy (en / es) ----------------
COPY = {
 'en': dict(
  hero_h='Your bookings.\nOn WhatsApp.', hero_s='Clients book online. You get confirmations, reminders and deposits — without chasing anyone.',
  wa_h='Reminders that send themselves', wa_s='Automated WhatsApp messages cut no-shows while you work.',
  wa_msgs=[('Hi Carlos! Your oil change is tomorrow at 10:00 AM. See you then 🔧', False), ('Confirmed ✅', True)],
  ai_h='Just tell your assistant', ai_s='Read, accept or cancel appointments by chatting.',
  ai_msgs=[('What do I have today?', True), ('3 appointments: 9:00 Maria, 11:30 Luis, 2:00 Ana. Two are pending.', False), ('Accept the pending ones', True)],
  who_h='Built for people who work with their hands', who_s='If clients book you, BookIt keeps your calendar full.',
  who=[('💈','Barbers'),('🔧','Mechanics'),('🪚','Carpenters'),('💅','Nail techs'),('🧹','Cleaners'),('📸','Photographers')],
  price_h='Simple pricing', price_s='Every feature in both plans.',
  starter='Starter', starter_d='1 business · up to 10 staff', pro='Pro', pro_d='Unlimited businesses & staff', mo='/month',
  inc=['Automated WhatsApp', 'AI assistant', 'Online booking page', 'Deposits & payments'],
  trial_h='Try BookIt free\nfor 30 days', trial_s='Set up your booking page in minutes. No card needed.', cta='Start free',
 ),
 'es': dict(
  hero_h='Tus citas.\nPor WhatsApp.', hero_s='Tus clientes reservan en línea. Tú recibes confirmaciones, recordatorios y depósitos sin perseguir a nadie.',
  wa_h='Recordatorios que se envían solos', wa_s='Mensajes automáticos de WhatsApp que reducen las citas perdidas.',
  wa_msgs=[('¡Hola Carlos! Tu cambio de aceite es mañana a las 10:00 AM. ¡Te esperamos! 🔧', False), ('Confirmado ✅', True)],
  ai_h='Solo díselo a tu asistente', ai_s='Lee, acepta o cancela citas conversando.',
  ai_msgs=[('¿Qué tengo hoy?', True), ('3 citas: 9:00 María, 11:30 Luis, 2:00 Ana. Dos están pendientes.', False), ('Acepta las pendientes', True)],
  who_h='Hecho para quienes trabajan con sus manos', who_s='Si tus clientes te reservan, BookIt mantiene tu calendario lleno.',
  who=[('💈','Barberos'),('🔧','Mecánicos'),('🪚','Carpinteros'),('💅','Uñas'),('🧹','Limpieza'),('📸','Fotógrafos')],
  price_h='Precios simples', price_s='Todas las funciones en ambos planes.',
  starter='Básico', starter_d='1 negocio · hasta 10 empleados', pro='Pro', pro_d='Negocios y personal ilimitados', mo='/mes',
  inc=['WhatsApp automático', 'Asistente con IA', 'Página de reservas', 'Depósitos y pagos'],
  trial_h='Prueba BookIt\ngratis por 30 días', trial_s='Crea tu página de reservas en minutos. Sin tarjeta.', cta='Empieza gratis',
 ),
}

def multiline(img, x, y, txt, size, idx=HEAVY, fill=WHITE, maxw=None, line=1.08):
    for part in txt.split('\n'):
        y = draw_text(img, (x, y), part, size, idx, fill, maxw=maxw, line=line)
    return y

def post_hero(lang, w=1080, h=1350, name=None):
    c = COPY[lang]; img = canvas(w, h); brand(img, w)
    pill(img, (64, 250), '📲  WhatsApp-first' if lang=='en' else '📲  Todo por WhatsApp', 28)
    y = multiline(img, 64, 340, c['hero_h'], 118, HEAVY, WHITE)
    draw_text(img, (64, y + 20), c['hero_s'], 36, MED, MUTED, maxw=w - 128, line=1.35)
    yy = 800
    yy = chat(img, 64, yy, 640, '✅ ' + ('Cita confirmada: Corte, sábado 3:00 PM' if lang=='es' else 'Booking confirmed: Haircut, Sat 3:00 PM'), False, 27)
    chat(img, w - 64 - 440, yy, 440, ('¡Gracias! Ahí estaré 🙌' if lang=='es' else 'Thanks! See you there 🙌'), True, 27)
    footer(img, w, h, lang); save(img, name or f'post-1-hero-{lang}.png', w, h)

def post_whatsapp(lang):
    c = COPY[lang]; w, h = 1080, 1350; img = canvas(w, h); brand(img, w)
    y = multiline(img, 64, 260, c['wa_h'], 92, HEAVY, WHITE, maxw=w - 128)
    y = draw_text(img, (64, y + 16), c['wa_s'], 34, MED, MUTED, maxw=w - 128, line=1.35)
    rrect(img, (64, y + 50, w - 64, y + 50 + 300), 40, INK2, outline=(255, 255, 255, 25), width=2, shadow=True)
    yy = y + 90
    for txt, mine in c['wa_msgs']:
        bw = 330 if mine else 700
        yy = chat(img, (w - 64 - 36 - bw) if mine else 64 + 36, yy, bw, txt, mine, 30)
    footer(img, w, h, lang); save(img, f'post-2-whatsapp-{lang}.png', w, h)

def post_ai(lang):
    c = COPY[lang]; w, h = 1080, 1350; img = canvas(w, h); brand(img, w)
    pill(img, (64, 250), '✨  AI assistant' if lang=='en' else '✨  Asistente con IA', 28)
    y = multiline(img, 64, 340, c['ai_h'], 96, HEAVY, WHITE, maxw=w - 128)
    y = draw_text(img, (64, y + 24), c['ai_s'], 34, MED, MUTED, maxw=w - 128, line=1.35)
    rrect(img, (64, y + 50, w - 64, y + 50 + 450), 40, INK2, outline=(255, 255, 255, 25), width=2, shadow=True)
    yy = y + 90
    for txt, mine in c['ai_msgs']:
        bw = 560 if not mine else 400
        yy = chat(img, (w - 64 - 36 - bw) if mine else 64 + 36, yy, bw, txt, mine, 29)
    footer(img, w, h, lang); save(img, f'post-3-ai-assistant-{lang}.png', w, h)

def post_who(lang):
    c = COPY[lang]; w, h = 1080, 1350; img = canvas(w, h); brand(img, w)
    y = multiline(img, 64, 230, c['who_h'], 70, HEAVY, WHITE, maxw=w - 128)
    y = draw_text(img, (64, y + 14), c['who_s'], 32, MED, MUTED, maxw=w - 128, line=1.35)
    cw, chh, gx, gy = 456, 215, 40, 26
    top = y + 40
    for i, (em, label) in enumerate(c['who']):
        col, row = i % 2, i // 2
        x0, y0 = 64 + col * (cw + gx), top + row * (chh + gy)
        rrect(img, (x0, y0, x0 + cw, y0 + chh), 36, INK2, outline=(255, 255, 255, 22), width=2, shadow=True)
        emoji(img, (x0 + 36, y0 + 28), em, 84)
        draw_text(img, (x0 + 36, y0 + 140), label, 38, DEMI, WHITE)
    footer(img, w, h, lang); save(img, f'post-4-who-{lang}.png', w, h)

def post_pricing(lang):
    c = COPY[lang]; w, h = 1080, 1350; img = canvas(w, h); brand(img, w)
    y = multiline(img, 64, 250, c['price_h'], 100, HEAVY, WHITE)
    draw_text(img, (64, y + 6), c['price_s'], 34, MED, MUTED)
    cards = [(c['starter'], '$29.99', c['starter_d'], INK2, WHITE), (c['pro'], '$59.99', c['pro_d'], GREEN, INK)]
    for i, (nm, price, desc, bg, fg) in enumerate(cards):
        x0 = 64 + i * 500
        rrect(img, (x0, 500, x0 + 452, 1130), 44, bg, outline=None if i else (255, 255, 255, 25), width=2, shadow=True)
        draw_text(img, (x0 + 40, 540), nm, 44, HEAVY, fg)
        draw_text(img, (x0 + 40, 612), price, 82, HEAVY, fg)
        draw_text(img, (x0 + 40, 712), c['mo'], 28, MED, fg if i else MUTED)
        draw_text(img, (x0 + 40, 770), desc, 28, DEMI, fg, maxw=370, line=1.25)
        yy = 880
        for item in c['inc']:
            check(img, x0 + 40, yy + 2, 28, fg if i else GREEN)
            draw_text(img, (x0 + 84, yy), item, 26, MED, fg, maxw=330)
            yy += 56
    footer(img, w, h, lang); save(img, f'post-5-pricing-{lang}.png', w, h)

def post_trial(lang):
    c = COPY[lang]; w, h = 1080, 1350
    img = blend_bg(w, h, GREEN_D, [(w * 0.9, h * 0.1, 700, (52, 211, 153), 0.6), (w * 0.1, h * 0.95, 650, (4, 120, 87), 0.8)])
    brand(img, w, mark=GREEN_D)
    y = multiline(img, 64, 330, c['trial_h'], 108, HEAVY, WHITE)
    draw_text(img, (64, y + 24), c['trial_s'], 40, MED, (230, 255, 245), maxw=w - 160, line=1.35)
    rrect(img, (64, 960, 64 + 520, 960 + 130), 65, WHITE, shadow=True)
    draw_text(img, (64 + 260, 960 + 30), c['cta'], 48, HEAVY, GREEN_D, anchor='ma')
    draw_text(img, (64, h - 80), 'BookIt by Zewo', 28, DEMI, WHITE)
    save(img, f'post-6-free-trial-{lang}.png', w, h)

def story(lang):
    c = COPY[lang]; w, h = 1080, 1920; img = canvas(w, h); brand(img, w, y=120)
    pill(img, (64, 380), '📲  WhatsApp-first' if lang=='en' else '📲  Todo por WhatsApp', 30)
    y = multiline(img, 64, 480, c['hero_h'], 114, HEAVY, WHITE)
    y = draw_text(img, (64, y + 24), c['hero_s'], 40, MED, MUTED, maxw=w - 128, line=1.35)
    yy = max(y + 90, 1060)
    yy = chat(img, 64, yy, 700, '✅ ' + ('Cita confirmada: Corte, sábado 3:00 PM' if lang=='es' else 'Booking confirmed: Haircut, Sat 3:00 PM'), False, 30)
    chat(img, w - 64 - 460, yy, 460, ('¡Gracias! Ahí estaré 🙌' if lang=='es' else 'Thanks! See you there 🙌'), True, 30)
    rrect(img, (64, 1620, w - 64, 1620 + 150), 75, GREEN, shadow=True)
    draw_text(img, (w / 2, 1620 + 40), c['cta'] if lang=='es' else 'Start free for 30 days', 46, HEAVY, INK, anchor='ma')
    save(img, f'story-hero-{lang}.png', w, h)

# ---------------- app backgrounds (1920x1080) ----------------
def bg_dark(w=1920, h=1080):
    img = blend_bg(w, h, INK, [(w*0.12, h*0.9, 760, GREEN_D, 0.6), (w*0.92, h*0.1, 640, (30, 64, 175), 0.4), (w*0.55, h*0.5, 520, (16, 185, 129), 0.14)])
    save(img, 'bg-dark-emerald.png', w, h)

def bg_light(w=1920, h=1080):
    img = blend_bg(w, h, (244, 247, 250), [(w*0.1, h*0.95, 760, (167, 243, 208), 0.7), (w*0.95, h*0.05, 640, (186, 230, 253), 0.7), (w*0.6, h*0.6, 520, (209, 250, 229), 0.45)])
    save(img, 'bg-light-mint.png', w, h)

def bg_emerald(w=1920, h=1080):
    img = blend_bg(w, h, GREEN_D, [(w*0.9, h*0.1, 820, (52, 211, 153), 0.65), (w*0.08, h*0.95, 760, (4, 120, 87), 0.85)])
    save(img, 'bg-emerald.png', w, h)

def bg_dots(w=1920, h=1080):
    img = blend_bg(w, h, INK, [(w*0.5, h*1.0, 900, GREEN_D, 0.45), (w*0.1, h*0.1, 500, (30, 64, 175), 0.25)])
    d = ImageDraw.Draw(img)
    step = 48
    for yy in range(step // 2, h, step):
        for xx in range(step // 2, w, step):
            d.ellipse([(xx - 2) * S, (yy - 2) * S, (xx + 2) * S, (yy + 2) * S], fill=(255, 255, 255, 28))
    save(img, 'bg-dots-dark.png', w, h)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for lang in ('es', 'en'):
        post_hero(lang); post_whatsapp(lang); post_ai(lang); post_who(lang); post_pricing(lang); post_trial(lang); story(lang)
    bg_dark(); bg_light(); bg_emerald(); bg_dots()
