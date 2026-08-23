#!/usr/bin/env python3
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted, HRFlowable, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from svglib.svglib import svg2rlg
from reportlab.graphics.shapes import Drawing
from reportlab.platypus import KeepTogether

OUTPUT = "system_design.pdf"

def build():
    doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
        leftMargin=2.2*cm, rightMargin=2.2*cm, topMargin=2.2*cm, bottomMargin=2.2*cm)

    CORAL = colors.HexColor('#E07A5F')
    DARK  = colors.HexColor('#111827')
    GRAY  = colors.HexColor('#6B7280')
    LGRAY = colors.HexColor('#F3F4F6')
    DGRAY = colors.HexColor('#374151')
    BORD  = colors.HexColor('#E5E7EB')
    GREEN = colors.HexColor('#059669')

    def s(name, **kw):
        return ParagraphStyle(name, parent=getSampleStyleSheet()['Normal'], **kw)

    T  = s('T',  fontSize=23, textColor=CORAL, fontName='Helvetica-Bold', alignment=TA_CENTER, spaceAfter=4)
    ST = s('ST', fontSize=10, textColor=GRAY,  alignment=TA_CENTER, spaceAfter=2)
    AU = s('AU', fontSize=12, textColor=DARK,  fontName='Helvetica-Bold', alignment=TA_CENTER, spaceBefore=6, spaceAfter=1)
    H1 = s('H1', fontSize=12.5, textColor=CORAL, fontName='Helvetica-Bold', spaceBefore=16, spaceAfter=5)
    H2 = s('H2', fontSize=10, textColor=DGRAY, fontName='Helvetica-Bold', spaceBefore=8, spaceAfter=3)
    BD = s('BD', fontSize=9.5, textColor=DARK, leading=15, spaceAfter=7, alignment=TA_JUSTIFY)
    BL = s('BL', fontSize=9.5, textColor=DARK, leading=14, spaceAfter=3, leftIndent=14)
    CD = s('CD', fontSize=7.8, textColor=DGRAY, fontName='Courier', leading=11,
               backColor=LGRAY, leftIndent=8, rightIndent=8, spaceBefore=5, spaceAfter=6, borderPad=5)
    CP = s('CP', fontSize=8, textColor=GRAY, alignment=TA_CENTER, spaceAfter=6, fontName='Helvetica-Oblique')
    FT = s('FT', fontSize=7.5, textColor=GRAY, alignment=TA_CENTER)
    NT = s('NT', fontSize=9, textColor=GREEN, fontName='Helvetica-Bold', spaceAfter=4)

    story = []

    # Cover
    story += [
        Spacer(1, 0.3*cm),
        Paragraph("ENCORE", T),
        Paragraph("Ticket Booking Platform", ST),
        Paragraph("System Design Write-Up", ST),
        Spacer(1, 0.2*cm),
        HRFlowable(width="100%", thickness=2, color=CORAL),
        Spacer(1, 0.15*cm),
        Paragraph("Ajitesh Sharma", AU),
        Paragraph("VIT Vellore &nbsp;·&nbsp; Batch 2023 &nbsp;·&nbsp; Passout 2027", ST),
        Paragraph("Computer Science &amp; Engineering — Information Security", ST),
        Spacer(1, 0.15*cm),
        HRFlowable(width="100%", thickness=0.5, color=BORD),
        Spacer(1, 0.5*cm),
    ]

    # 1. Architecture
    story.append(Paragraph("1. Architecture Overview", H1))
    story.append(Paragraph(
        "The system is split into three independently deployed tiers. "
        "The frontend is a Next.js 15 app on <b>Vercel's global edge CDN</b>. "
        "The backend is a NestJS (Node.js) REST API on <b>Render</b> that handles auth, seat management, "
        "bookings, payments, and background jobs. "
        "State is stored in a <b>Neon serverless PostgreSQL</b> database, and background jobs are "
        "coordinated via <b>BullMQ backed by Upstash Redis</b> (serverless, no always-on cost). "
        "The domain <b>tickets.ajiteshsharma.dev</b> is managed on <b>Cloudflare</b> (DNS-only, grey cloud) "
        "for DDoS protection and fast DNS resolution, with Vercel issuing and renewing SSL automatically.", BD))
    story.append(Paragraph("Figure 1 — Full deployment architecture.", CP))
    
    drawing = svg2rlg("architecture.svg")
    if drawing:
        # Scale down to fit A4 width
        scale_factor = 0.55
        drawing.width = drawing.minWidth() * scale_factor
        drawing.height = drawing.height * scale_factor
        drawing.scale(scale_factor, scale_factor)
        story.append(Spacer(1, 0.2*cm))
        story.append(KeepTogether([drawing]))
        story.append(Spacer(1, 0.5*cm))

    # 2. Seat Hold
    story.append(Paragraph("2. Seat Hold &amp; TTL Mechanism", H1))
    story.append(Paragraph(
        "When a user selects seats and moves to checkout, those seats need to be temporarily reserved "
        "so nobody else can buy them mid-payment. But they can't be locked forever if the user "
        "just closes the tab. The solution is a <b>15-minute TTL (Time-To-Live) hold</b>.", BD))
    story.append(Paragraph(
        "The moment the user clicks 'Hold Seats', a single <b>atomic Postgres transaction</b> fires: "
        "it reads the seat, verifies it is still available, then writes the new state — "
        "<i>status = held</i>, <i>heldByUserId</i>, and critically <b>heldUntil = NOW() + 15 minutes</b>. "
        "That timestamp is the TTL. From this point every downstream API call — "
        "generating a payment intent, confirming the booking — checks the server clock against "
        "<b>heldUntil</b>. If the TTL has passed, the API returns <b>HTTP 409 Conflict</b> immediately "
        "and the cart is dead. No periodic sweep needed; the TTL enforces itself inline.", BD))
    story.append(Preformatted(
        "  POST /api/shows/:showId/hold\n"
        "    │\n"
        "  ┌── ATOMIC POSTGRES TRANSACTION ─────────────────┐\n"
        "  │  SELECT seat WHERE status='available'          │\n"
        "  │         FOR UPDATE  ← exclusive row lock       │\n"
        "  │                                                │\n"
        "  │  UPDATE show_seats SET                         │\n"
        "  │    status       = 'held'                       │\n"
        "  │    heldByUserId = <userId>                     │\n"
        "  │    heldUntil    = NOW() + INTERVAL '15 min'   │\n"
        "  │    version      = version + 1                  │\n"
        "  │                                                │\n"
        "  │  INSERT INTO holds (userId, seatIds, ...)      │\n"
        "  └─────────────────────────────────────────────────┘\n"
        "    │\n"
        "  Returns: { holdId, heldUntil }\n"
        "  UI starts: 15:00 countdown", CD))
    story.append(Paragraph("Figure 2 — Seat hold transaction and TTL assignment.", CP))

    # 3. Concurrency
    story.append(Paragraph("3. Concurrency Prevention", H1))
    story.append(Paragraph(
        "The hardest problem in ticketing: two users click Book on the same seat at the exact same millisecond. "
        "A naive read-then-write would let both through and sell one seat twice. "
        "Encore prevents this with two mechanisms.", BD))
    story.append(Paragraph("Optimistic Concurrency Control (OCC):", H2))
    story.append(Paragraph(
        "Every seat row carries a <b>version</b> integer. "
        "The hold UPDATE includes a version check in its WHERE clause — "
        "it only applies if the version the client read is still current. "
        "If User A's request arrived a millisecond earlier and already incremented "
        "the version, User B's WHERE clause matches zero rows: "
        "the transaction aborts and User B gets an instant 409. "
        "One seat, one winner, every time. No explicit locks held between requests.", BD))
    story.append(Preformatted(
        "  UPDATE show_seats\n"
        "  SET    status = 'held', version = version + 1, ...\n"
        "  WHERE  id      = $seatId\n"
        "    AND  status  = 'available'\n"
        "    AND  version = $clientVersion   -- stale → 0 rows → 409", CD))
    story.append(Paragraph("Pessimistic Lock for Queue Operations:", H2))
    story.append(Paragraph(
        "For waitlist allocation — where multiple BullMQ workers could race to claim "
        "the same waitlist entry — the system uses <b>SELECT … FOR UPDATE SKIP LOCKED</b>. "
        "Each worker skips rows already locked by another worker and claims a different one, "
        "allowing safe parallel processing without any worker blocking another.", BD))

    # 4. Waitlist
    story.append(Paragraph("4. Waitlist Auto-Assignment Flow", H1))
    story.append(Paragraph(
        "When all seats in a category are sold out, users can join the waitlist. "
        "It operates as a strict <b>FIFO (first-in, first-out) queue</b> inside Postgres — "
        "the earliest joiner always gets the next freed seat. "
        "The critical design choice: freed seats <b>bypass the public pool entirely</b> "
        "and go directly to the next person in the queue, guaranteeing fairness.", BD))
    story.append(Preformatted(
        "  Hold TTL expires\n"
        "        │\n"
        "  BullMQ worker (Upstash Redis) picks up job\n"
        "        │\n"
        "  ┌── TRANSACTION ──────────────────────────────────┐\n"
        "  │  Reset show_seats → status = 'available'        │\n"
        "  │  Cancel holds record                            │\n"
        "  └─────────────────────────┬───────────────────────┘\n"
        "        │\n"
        "  Query waitlist_entries ORDER BY createdAt ASC\n"
        "  FOR UPDATE SKIP LOCKED   (safe multi-worker)\n"
        "        │\n"
        "  Found next user in queue?\n"
        "  YES ──► Assign new 15-min hold directly to user\n"
        "          Mark entry → 'offered', set offerExpiresAt\n"
        "          Send email via Resend: '15 min to claim!'\n"
        "  NO  ──► Seat returns to general public pool", CD))
    story.append(Paragraph("Figure 3 — Waitlist auto-allocation triggered by hold expiry.", CP))

    # 5. Time-limited offer
    story.append(Paragraph("5. Time-Limited Offer Handling", H1))
    story.append(Paragraph(
        "Once offered a seat, the waitlisted user has exactly <b>15 minutes</b> — "
        "enforced by the same TTL engine as a regular hold. "
        "If they ignore the email and the offer expires, the BullMQ worker's next cycle "
        "detects <i>offerExpiresAt &lt;= NOW()</i>, marks the entry <i>expired</i>, "
        "releases the hold, and immediately runs allocation again for the next person in line. "
        "This creates a self-sustaining cascade — tickets flow down the waitlist automatically "
        "with no manual intervention from the event organiser.", BD))
    story.append(Paragraph("Worker scheduling is self-rescheduling — no external cron needed:", NT))
    for pt in [
        "App starts → inserts first <b>release_expired_holds</b> job into Postgres.",
        "BullMQ pulls the job via Upstash Redis and executes it.",
        "After completion → schedules next run 30 seconds later.",
        "Cycle repeats indefinitely for the lifetime of the process.",
    ]:
        story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;• {pt}", BL))

    # 6. Security
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph("6. Security", H1))
    story.append(Paragraph(
        "Security decisions are consistent throughout the stack — "
        "no custom crypto, no session databases, no plaintext secrets.", BD))
    rows = [
        ["Mechanism", "Implementation", "Effect"],
        ["JWT", "HS256, 7-day access + refresh rotation", "Stateless auth, no session store"],
        ["Passwords", "Argon2id (memory-hard)", "GPU brute-force resistant"],
        ["DNS", "Cloudflare — DDoS shield, fast resolution", "Protects origin IP"],
        ["CORS", "Whitelist: Vercel + ajiteshsharma.dev", "Blocks rogue cross-origin calls"],
        ["Rate limit", "Throttler: 100 req / 60s / IP", "Stops brute-force login"],
        ["SQL", "Drizzle ORM parameterised queries", "No injection risk"],
        ["Headers", "Helmet middleware on all responses", "XSS, clickjack, MIME protection"],
    ]
    tbl = Table(rows, colWidths=[3*cm, 6.5*cm, 6.5*cm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),(-1,0), CORAL),
        ('TEXTCOLOR',     (0,0),(-1,0), colors.white),
        ('FONTNAME',      (0,0),(-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0,0),(-1,-1), 8.5),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [LGRAY, colors.white]),
        ('GRID',          (0,0),(-1,-1), 0.4, BORD),
        ('LEFTPADDING',   (0,0),(-1,-1), 7),
        ('RIGHTPADDING',  (0,0),(-1,-1), 7),
        ('TOPPADDING',    (0,0),(-1,-1), 5),
        ('BOTTOMPADDING', (0,0),(-1,-1), 5),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
        ('FONTNAME',      (0,1),(0,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR',     (0,1),(0,-1), DGRAY),
    ]))
    story.append(tbl)

    # Footer
    story += [
        Spacer(1, 0.6*cm),
        HRFlowable(width="100%", thickness=0.5, color=BORD),
        Spacer(1, 0.15*cm),
        Paragraph(
            "Encore Ticket Booking &nbsp;·&nbsp; Ajitesh Sharma &nbsp;·&nbsp; VIT Vellore 2027 &nbsp;·&nbsp; "
            "tickets.ajiteshsharma.dev &nbsp;·&nbsp; github.com/AJ1312/encore-ticket-booking", FT),
    ]

    doc.build(story)
    print(f"PDF: {OUTPUT} ({os.path.getsize(OUTPUT):,} bytes)")

if __name__ == '__main__':
    build()
