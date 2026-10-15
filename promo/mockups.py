"""Phone mockups for the website. Run: python3 -I promo/mockups.py (needs generate.py next to it)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate as g
from generate import S, font, rrect, draw_text, text_w, check, BOLD, DEMI, MED, REG, HEAVY, GREEN, GREEN_D, INK, INK2, WHITE
from PIL import Image, ImageDraw, ImageFilter

OUT = '/Users/ralphulysse/Documents/ready/bookitbyzewo/public/images'
W, H = 336, 716          # phone screen, logical px
PAD = 48                 # room around the phone for the shadow

def phone(screen):
    """Wraps a W x H screen image (rendered at scale S) in a phone body on a transparent canvas."""
    cw, ch = (W + PAD * 2), (H + PAD * 2)
    canvas = Image.new('RGBA', (cw * S, ch * S), (0, 0, 0, 0))
    # soft shadow
    sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([(PAD - 6) * S, (PAD + 18) * S, (PAD + W + 6) * S, (PAD + H + 18) * S], 52 * S, fill=(0, 0, 0, 120))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(22 * S)))
    d = ImageDraw.Draw(canvas)
    b = 11  # bezel
    d.rounded_rectangle([(PAD - b) * S, (PAD - b) * S, (PAD + W + b) * S, (PAD + H + b) * S], 50 * S, fill=(22, 26, 33, 255), outline=(70, 78, 90, 255), width=2 * S)
    mask = Image.new('L', screen.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, W * S, H * S], 40 * S, fill=255)
    canvas.paste(screen.convert('RGBA'), (PAD * S, PAD * S), mask)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([(PAD + W / 2 - 46) * S, (PAD + 10) * S, (PAD + W / 2 + 46) * S, (PAD + 32) * S], 11 * S, fill=(10, 12, 16, 255))
    return canvas

def screen(bg):
    return Image.new('RGB', (W * S, H * S), bg)

def status_bar(img, color=(255, 255, 255)):
    draw_text(img, (26, 14), '9:41', 13, DEMI, color)

def save(canvas, name):
    os.makedirs(OUT, exist_ok=True)
    canvas.save(os.path.join(OUT, name), optimize=True)
    print('saved', name, canvas.size)

def bubble(img, x, y, w, txt, mine, size=13, fg=(17, 24, 39), bg_in=(255, 255, 255), bg_out=(220, 248, 198), time=None):
    f = font(size, REG)
    lines = g.wrap(txt, f, w - 24)
    h = len(lines) * size * 1.3 + 22 + (10 if time else 0)
    bx = x if not mine else x
    rrect(img, (bx, y, bx + w, y + h), 12, bg_out if mine else bg_in)
    yy = y + 10
    for ln in lines:
        draw_text(img, (bx + 12, yy), ln, size, REG, fg); yy += size * 1.3
    if time:
        draw_text(img, (bx + w - 10, y + h - 17), time, 9, REG, (120, 130, 140), anchor='ra')
    return y + h + 8

# ---------------- screens ----------------
def booking(lang):
    es = lang == 'es'
    img = screen((246, 248, 250))
    rrect(img, (0, 0, W, 170), 0, GREEN_D)
    status_bar(img)
    draw_text(img, (22, 52), "Milo's Barbershop", 22, HEAVY, WHITE)
    draw_text(img, (22, 84), 'Reserva tu cita en línea' if es else 'Book your appointment online', 13, MED, (209, 250, 229))
    draw_text(img, (22, 116), '📍 San Juan, PR', 12, MED, (209, 250, 229))
    draw_text(img, (22, 190), 'Nuestros servicios' if es else 'Our services', 15, BOLD, (17, 24, 39))
    items = [('Corte' if es else 'Haircut', '45 min', '$35', True), ('Barba' if es else 'Beard trim', '20 min', '$15', False), ('Corte y barba' if es else 'Haircut & beard', '60 min', '$45', False)]
    y = 220
    for name, dur, price, sel in items:
        rrect(img, (18, y, W - 18, y + 58), 14, WHITE, outline=GREEN if sel else (226, 232, 240), width=2 if sel else 1)
        draw_text(img, (32, y + 10), name, 14, DEMI, (17, 24, 39))
        draw_text(img, (32, y + 33), dur, 11, REG, (100, 116, 139))
        draw_text(img, (W - 32, y + 17), price, 16, HEAVY, GREEN_D, anchor='ra')
        y += 68
    draw_text(img, (22, y + 8), 'Elige la hora' if es else 'Pick a time', 15, BOLD, (17, 24, 39))
    y += 40
    days = [('LUN','12'),('MAR','13'),('MIÉ','14'),('JUE','15'),('VIE','16')] if es else [('MON','12'),('TUE','13'),('WED','14'),('THU','15'),('FRI','16')]
    for i, (dn, num) in enumerate(days):
        x = 18 + i * 60
        on = i == 2
        rrect(img, (x, y, x + 54, y + 56), 14, GREEN if on else WHITE, outline=None if on else (226, 232, 240), width=1)
        draw_text(img, (x + 27, y + 9), dn, 10, DEMI, WHITE if on else (100, 116, 139), anchor='ma')
        draw_text(img, (x + 27, y + 26), num, 17, HEAVY, WHITE if on else (17, 24, 39), anchor='ma')
    y += 70
    for i, t in enumerate(['9:00', '10:30', '1:00', '3:30']):
        x = 18 + i * 76
        on = i == 1
        rrect(img, (x, y, x + 68, y + 32), 16, (209, 250, 229) if on else WHITE, outline=GREEN if on else (226, 232, 240), width=1)
        draw_text(img, (x + 34, y + 7), t, 12, DEMI, GREEN_D if on else (51, 65, 85), anchor='ma')
    rrect(img, (18, H - 74, W - 18, H - 26), 24, GREEN)
    draw_text(img, (W / 2, H - 62), 'Reservar cita' if es else 'Book appointment', 15, HEAVY, INK, anchor='ma')
    return phone(img)

def whatsapp(lang):
    es = lang == 'es'
    img = screen((236, 229, 221))
    rrect(img, (0, 0, W, 92), 0, (7, 94, 84))
    status_bar(img)
    rrect(img, (20, 44, 56, 80), 18, (209, 250, 229)); draw_text(img, (28, 49), '💈', 24, BOLD)
    draw_text(img, (66, 48), "Milo's Barbershop", 15, BOLD, WHITE)
    draw_text(img, (66, 68), 'en línea' if es else 'online', 11, REG, (209, 250, 229))
    y = 112
    if es:
        y = bubble(img, 16, y, 250, '¡Hola Carlos! 👋 Tu cita es mañana a las 10:30 AM: Corte. ¿Confirmas?', False, time='9:02')
        y = bubble(img, W - 16 - 160, y, 160, 'Sí, ahí estaré 🙌', True, time='9:05 ✓✓')
        y = bubble(img, 16, y, 250, '¡Perfecto! Te esperamos. Depósito de $10 recibido ✅', False, time='9:05')
        y += 6
        y = bubble(img, 16, y, 250, '⏰ Recordatorio: tu cita es en 1 hora. Calle Luna 24, San Juan.', False, time='9:30')
        y = bubble(img, W - 16 - 190, y, 190, 'Voy en camino, 10 min 🚗', True, time='9:41 ✓✓')
        y = bubble(img, 16, y, 250, '¡Excelente! Aquí te espero 💈', False, time='9:41')
    else:
        y = bubble(img, 16, y, 250, 'Hi Carlos! 👋 Your appointment is tomorrow at 10:30 AM: Haircut. Can you confirm?', False, time='9:02')
        y = bubble(img, W - 16 - 160, y, 160, "Yes, I'll be there 🙌", True, time='9:05 ✓✓')
        y = bubble(img, 16, y, 250, 'Perfect! See you then. $10 deposit received ✅', False, time='9:05')
        y += 6
        y = bubble(img, 16, y, 250, '⏰ Reminder: your appointment is in 1 hour. 24 Luna St, San Juan.', False, time='9:30')
        y = bubble(img, W - 16 - 190, y, 190, 'On my way, 10 min 🚗', True, time='9:41 ✓✓')
        y = bubble(img, 16, y, 250, 'Great! See you here 💈', False, time='9:41')
    rrect(img, (12, H - 54, W - 64, H - 14), 20, WHITE)
    draw_text(img, (28, H - 44), 'Mensaje' if es else 'Message', 13, REG, (148, 163, 184))
    rrect(img, (W - 54, H - 54, W - 14, H - 14), 20, (7, 94, 84))
    ImageDraw.Draw(img).polygon([((W - 41) * S, (H - 43) * S), ((W - 27) * S, (H - 34) * S), ((W - 41) * S, (H - 25) * S), ((W - 38) * S, (H - 34) * S)], fill=(255, 255, 255))
    return phone(img)

def assistant(lang):
    es = lang == 'es'
    img = screen((11, 15, 20))
    status_bar(img)
    rrect(img, (0, 40, W, 98), 0, (18, 24, 33))
    rrect(img, (18, 52, 54, 88), 18, GREEN); draw_text(img, (26, 58), '✨', 24, BOLD)
    draw_text(img, (64, 54), 'Asistente IA' if es else 'AI Assistant', 15, BOLD, WHITE)
    draw_text(img, (64, 75), 'Pregunta o dile qué hacer' if es else 'Ask or tell it what to do', 11, REG, (139, 152, 169))
    y = 116
    def msg(txt, mine, w=230):
        nonlocal y
        x = W - 16 - w if mine else 16
        f = font(13, REG)
        lines = g.wrap(txt, f, w - 24)
        h = len(lines) * 17 + 20
        rrect(img, (x, y, x + w, y + h), 14, GREEN if mine else (30, 41, 59))
        yy = y + 10
        for ln in lines:
            draw_text(img, (x + 12, yy), ln, 13, REG, INK if mine else WHITE); yy += 17
        y += h + 10
    if es:
        msg('¿Qué tengo hoy?', True, 150)
        msg('Tienes 3 citas: 9:00 María (corte), 11:30 Luis (barba), 2:00 Ana (corte). Dos están pendientes.', False, 250)
        msg('Acepta las pendientes', True, 190)
        msg('Listo ✅ Acepté las citas de María y Luis.', False, 220)
        msg('Cancela la de Ana', True, 150)
        rrect(img, (16, y, W - 40, y + 92), 14, (18, 24, 33), outline=GREEN, width=1)
        draw_text(img, (28, y + 12), "¿Cancelar la cita de Ana,\ncorte, 2:00 PM, y avisarle?".split('\n')[0], 12, REG, WHITE)
        draw_text(img, (28, y + 30), "corte, 2:00 PM, y avisarle?", 12, REG, WHITE)
        rrect(img, (28, y + 54, 112, y + 80), 13, GREEN); draw_text(img, (70, y + 59), 'Confirmar', 11, HEAVY, INK, anchor='ma')
        rrect(img, (120, y + 54, 196, y + 80), 13, (30, 41, 59)); draw_text(img, (158, y + 59), 'No', 11, DEMI, WHITE, anchor='ma')
    else:
        msg('What do I have today?', True, 170)
        msg('3 appointments: 9:00 Maria (haircut), 11:30 Luis (beard), 2:00 Ana (haircut). Two are pending.', False, 250)
        msg('Accept the pending ones', True, 190)
        msg('Done ✅ I accepted Maria and Luis.', False, 210)
        msg("Cancel Ana's", True, 130)
        rrect(img, (16, y, W - 40, y + 92), 14, (18, 24, 33), outline=GREEN, width=1)
        draw_text(img, (28, y + 12), "Cancel Ana's haircut, 2:00 PM,", 12, REG, WHITE)
        draw_text(img, (28, y + 30), 'and notify her?', 12, REG, WHITE)
        rrect(img, (28, y + 54, 106, y + 80), 13, GREEN); draw_text(img, (67, y + 59), 'Confirm', 11, HEAVY, INK, anchor='ma')
        rrect(img, (114, y + 54, 190, y + 80), 13, (30, 41, 59)); draw_text(img, (152, y + 59), 'Cancel', 11, DEMI, WHITE, anchor='ma')
    rrect(img, (14, H - 56, W - 14, H - 16), 20, (18, 24, 33), outline=(51, 65, 85), width=1)
    draw_text(img, (30, H - 45), 'Escribe un mensaje…' if es else 'Type a message…', 13, REG, (100, 116, 139))
    return phone(img)

def agenda(lang):
    es = lang == 'es'
    img = screen((246, 248, 250))
    rrect(img, (0, 0, W, 120), 0, INK)
    status_bar(img)
    draw_text(img, (22, 46), 'Hoy' if es else 'Today', 24, HEAVY, WHITE)
    draw_text(img, (22, 80), 'Lunes 12 · 6 citas' if es else 'Monday 12 · 6 appointments', 13, MED, (148, 163, 184))
    rows = [('9:00', 'María García', 'Corte' if es else 'Haircut', 'ok'), ('10:30', 'Carlos Rivera', 'Corte y barba' if es else 'Haircut & beard', 'ok'),
            ('11:30', 'Luis Pérez', 'Barba' if es else 'Beard trim', 'pending'), ('1:00', 'Pedro Ortiz', 'Corte' if es else 'Haircut', 'ok'),
            ('2:00', 'Ana López', 'Corte' if es else 'Haircut', 'pending'), ('3:30', 'José Díaz', 'Corte y barba' if es else 'Haircut & beard', 'ok')]
    y = 134
    for t, name, svc, st in rows:
        rrect(img, (16, y, W - 16, y + 82), 16, WHITE, outline=(226, 232, 240), width=1)
        rrect(img, (16, y, 22, y + 82), 3, GREEN if st == 'ok' else (245, 158, 11))
        draw_text(img, (36, y + 12), t, 15, HEAVY, (17, 24, 39))
        draw_text(img, (36, y + 36), 'PM' if t in ('1:00','2:00','3:30') else 'AM', 10, DEMI, (100, 116, 139))
        draw_text(img, (92, y + 12), name, 14, DEMI, (17, 24, 39))
        draw_text(img, (92, y + 32), svc, 12, REG, (100, 116, 139))
        label = ('Confirmada' if es else 'Confirmed') if st == 'ok' else ('Pendiente' if es else 'Pending')
        col, bgc = ((5, 150, 105), (209, 250, 229)) if st == 'ok' else ((180, 83, 9), (254, 243, 199))
        f = font(10, DEMI)
        wch = text_w(label, f) + 20
        rrect(img, (92, y + 54, 92 + wch, y + 72), 9, bgc)
        draw_text(img, (92 + 10, y + 56), label, 10, DEMI, col)
        y += 90
    return phone(img)

if __name__ == '__main__':
    for lang in ('es', 'en'):
        save(booking(lang), f'phone-booking-{lang}.png')
        save(whatsapp(lang), f'phone-whatsapp-{lang}.png')
        save(assistant(lang), f'phone-assistant-{lang}.png')
        save(agenda(lang), f'phone-agenda-{lang}.png')
