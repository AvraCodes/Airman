from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
import math
import os

# ── colours ──────────────────────────────────────────────────────────────────
DARK_NAVY   = colors.HexColor("#1a237e")
MID_BLUE    = colors.HexColor("#283593")
ACCENT_BLUE = colors.HexColor("#3949ab")
LIGHT_BLUE  = colors.HexColor("#e8eaf6")
PALE_BLUE   = colors.HexColor("#f3f4fc")
GOLD        = colors.HexColor("#f9a825")
BORDER_GREY = colors.HexColor("#9fa8da")
TEXT_DARK   = colors.HexColor("#1a1a2e")
TEXT_BODY   = colors.HexColor("#212121")
GREEN_DARK  = colors.HexColor("#1b5e20")
GREEN_LIGHT = colors.HexColor("#e8f5e9")
ORANGE_DARK = colors.HexColor("#e65100")
ORANGE_LT   = colors.HexColor("#fff3e0")
WHITE       = colors.white

W, H = A4

SUBSCRIPT_CHAR_MAP = {
    "\u2080": "0", "\u2081": "1", "\u2082": "2", "\u2083": "3", "\u2084": "4",
    "\u2085": "5", "\u2086": "6", "\u2087": "7", "\u2088": "8", "\u2089": "9",
    "\u208a": "+", "\u208b": "-", "\u208c": "=", "\u208d": "(", "\u208e": ")",
    "\u2098": "m", "\u2099": "n", "\u1d62": "i",
}


def _normalize_subscripts_for_paragraph(text):
    """Convert Unicode subscripts to ReportLab-compatible <sub> markup."""
    out = []
    sub_buf = []
    for ch in text:
        mapped = SUBSCRIPT_CHAR_MAP.get(ch)
        if mapped is not None:
            sub_buf.append(mapped)
            continue
        if sub_buf:
            out.append(f"<sub>{''.join(sub_buf)}</sub>")
            sub_buf = []
        out.append(ch)
    if sub_buf:
        out.append(f"<sub>{''.join(sub_buf)}</sub>")
    return "".join(out)


def draw_subscript_text(c, x, y, text, centered=False, font="Helvetica-Bold", size=9):
    """Draw text on canvas with baseline-shifted subscripts."""
    runs = []
    for ch in text:
        mapped = SUBSCRIPT_CHAR_MAP.get(ch)
        if mapped is not None:
            runs.append((mapped, True))
        else:
            runs.append((ch, False))

    total_w = 0.0
    for seg, is_sub in runs:
        seg_size = size * 0.75 if is_sub else size
        total_w += pdfmetrics.stringWidth(seg, font, seg_size)

    start_x = x - total_w / 2 if centered else x
    tx = c.beginText(start_x, y)
    tx.setFont(font, size)
    for seg, is_sub in runs:
        if is_sub:
            tx.setRise(-size * 0.28)
            tx.setFont(font, size * 0.75)
        else:
            tx.setRise(0)
            tx.setFont(font, size)
        tx.textOut(seg)
    tx.setRise(0)
    c.drawText(tx)

# ── SVG-style graph drawing flowable ─────────────────────────────────────────
class GraphFlowable(Flowable):
    """Draw simple graphs using ReportLab canvas primitives."""
    def __init__(self, draw_fn, width=400, height=180):
        super().__init__()
        self._draw_fn = draw_fn
        self.width  = width
        self.height = height

    def draw(self):
        self._draw_fn(self.canv, self.width, self.height)


def node(c, x, y, label, r=14, fill=LIGHT_BLUE, text_col=DARK_NAVY):
    c.setFillColor(fill)
    c.setStrokeColor(ACCENT_BLUE)
    c.setLineWidth(1.2)
    c.circle(x, y, r, stroke=1, fill=1)
    c.setFillColor(text_col)
    draw_subscript_text(c, x, y - 3, str(label), centered=True, font="Helvetica-Bold", size=9)


def edge(c, x1, y1, x2, y2, col=ACCENT_BLUE, lw=1.2):
    c.setStrokeColor(col)
    c.setLineWidth(lw)
    c.line(x1, y1, x2, y2)


# ── graph draw functions ──────────────────────────────────────────────────────
def draw_c5(c, w, h):
    cx, cy, r = w/2, h/2, min(w,h)*0.38
    pts = [(cx + r*math.sin(2*math.pi*i/5),
            cy + r*math.cos(2*math.pi*i/5)) for i in range(5)]
    for i in range(5):
        edge(c, pts[i][0], pts[i][1], pts[(i+1)%5][0], pts[(i+1)%5][1])
    for i, (x,y) in enumerate(pts):
        node(c, x, y, i+1)
    c.setFillColor(DARK_NAVY)
    draw_subscript_text(c, w/2, 8, "C\u2085  (Cycle graph)", centered=True)

def draw_c5_complement(c, w, h):
    cx, cy, r = w/2, h/2, min(w,h)*0.38
    pts = [(cx + r*math.sin(2*math.pi*i/5),
            cy + r*math.cos(2*math.pi*i/5)) for i in range(5)]
    complement_edges = [(0,2),(0,3),(1,3),(1,4),(2,4)]
    for i,j in complement_edges:
        edge(c, pts[i][0], pts[i][1], pts[j][0], pts[j][1], col=colors.HexColor("#7986cb"))
    for i, (x,y) in enumerate(pts):
        node(c, x, y, i+1, fill=colors.HexColor("#c5cae9"))
    c.setFillColor(DARK_NAVY)
    draw_subscript_text(c, w/2, 8, "C\u0305\u2085  (Complement — also \u2245 C\u2085)", centered=True)

def draw_k3(c, w, h):
    pts = [(w/2, h-25), (w/2-55, 30), (w/2+55, 30)]
    for i in range(3):
        for j in range(i+1,3):
            edge(c, pts[i][0], pts[i][1], pts[j][0], pts[j][1])
    for i,(x,y) in enumerate(pts):
        node(c, x, y, ["v\u2081","v\u2082","v\u2083"][i])
    c.setFillColor(DARK_NAVY)
    draw_subscript_text(c, w/2, 8, "K\u2083  — every vertex degree = 2", centered=True)

def draw_wheel_vs_cycle(c, w, h):
    # Cycle C5 on the left
    cx1, cy, r = w*0.28, h/2, min(w,h)*0.28
    pts1 = [(cx1+r*math.sin(2*math.pi*i/5), cy+r*math.cos(2*math.pi*i/5)) for i in range(5)]
    for i in range(5): edge(c, pts1[i][0], pts1[i][1], pts1[(i+1)%5][0], pts1[(i+1)%5][1])
    for i,(x,y) in enumerate(pts1): node(c, x, y, i+1, r=11)
    c.setFillColor(DARK_NAVY)
    draw_subscript_text(c, cx1, 8, "C\u2085: all degrees = 2", centered=True, size=8)
    # Wheel W5 on the right (hub + rim)
    cx2 = w*0.72
    pts2 = [(cx2+r*math.sin(2*math.pi*i/5), cy+r*math.cos(2*math.pi*i/5)) for i in range(5)]
    for i in range(5): edge(c, pts2[i][0], pts2[i][1], pts2[(i+1)%5][0], pts2[(i+1)%5][1])
    for i in range(5): edge(c, cx2, cy, pts2[i][0], pts2[i][1], col=colors.HexColor("#ef9a9a"))
    for i,(x,y) in enumerate(pts2): node(c, x, y, i+1, r=11)
    node(c, cx2, cy, "H", r=13, fill=colors.HexColor("#ffcdd2"), text_col=ORANGE_DARK)
    c.setFillColor(DARK_NAVY)
    draw_subscript_text(c, cx2, 8, "W\u2085: hub deg=5, rim deg=3", centered=True, size=8)

def draw_binary_trees(c, w, h):
    r=10; lw=1.1
    configs = [
        # (title, nodes_xy, edges)
        ("Both\nchildren",
         [(60,h-30),(35,h-75),(85,h-75)],
         [(0,1),(0,2)]),
        ("Left-left\nchain",
         [(150,h-30),(150,h-75),(150,h-118)],
         [(0,1),(1,2)]),
        ("Left-right",
         [(240,h-30),(215,h-75),(255,h-118)],
         [(0,1),(1,2)]),
        ("Right-left",
         [(330,h-30),(355,h-75),(315,h-118)],
         [(0,1),(1,2)]),
        ("Right-right\nchain",
         [(415,h-30),(415,h-75),(415,h-118)],
         [(0,1),(1,2)]),
    ]
    for title, nodes, edges_list in configs:
        for i,j in edges_list:
            edge(c, nodes[i][0], nodes[i][1]-r, nodes[j][0], nodes[j][1]+r, lw=lw)
        for x,y in nodes:
            node(c, x, y, "", r=r, fill=colors.HexColor("#bbdefb"))
        # title below
        c.setFillColor(DARK_NAVY); c.setFont("Helvetica", 7)
        lines = title.split("\n")
        base_y = min(y for _,y in nodes) - r - 12
        for li, line in enumerate(lines):
            c.drawCentredString(nodes[0][0], base_y - li*10, line)
    c.setFillColor(DARK_NAVY)
    draw_subscript_text(c, 10, 8, "All 5 structurally distinct binary trees with 3 nodes (Catalan number C\u2083 = 5)")

def draw_euler_graph(c, w, h):
    # Simple planar graph with labelled V, E, R
    pts = {"A":(w/2, h-25), "B":(w/2-70,h/2), "C":(w/2+70,h/2),
           "D":(w/2-35,30), "E":(w/2+35,30)}
    elist = [("A","B"),("A","C"),("B","C"),("B","D"),("C","E"),("D","E"),("B","E"),("C","D")]
    for u,v in elist:
        edge(c, pts[u][0],pts[u][1], pts[v][0],pts[v][1])
    for name,(x,y) in pts.items():
        node(c, x, y, name, r=13, fill=colors.HexColor("#ede7f6"), text_col=colors.HexColor("#4527a0"))
    c.setFillColor(DARK_NAVY); c.setFont("Helvetica",8)
    c.drawCentredString(w/2, 8, "|V|=5, |E|=8  \u2192  |R| = 2 \u2212 5 + 8 = 5  (incl. outer face)")

def draw_bipartite(c, w, h):
    left  = [(w*0.3, h-25),(w*0.3, h/2),(w*0.3, 25)]
    right = [(w*0.7, h-40),(w*0.7, h/2),(w*0.7, 40)]
    for x,y in left:  node(c, x, y, "X", r=12, fill=colors.HexColor("#e3f2fd"))
    for x,y in right: node(c, x, y, "Y", r=12, fill=colors.HexColor("#fce4ec"), text_col=colors.HexColor("#880e4f"))
    for lx,ly in left:
        for rx,ry in right:
            edge(c, lx,ly,rx,ry, col=colors.HexColor("#7986cb"), lw=0.9)
    c.setFillColor(DARK_NAVY)
    draw_subscript_text(c, w/2, 8, "Bipartite graph K\u2083\u2083: X\u2229Y=\u2205, all edges cross between sets", centered=True)

def draw_euler_hamilton(c, w, h):
    pts = [(w/2+90*math.sin(2*math.pi*i/5), h/2+70*math.cos(2*math.pi*i/5)) for i in range(5)]
    labels=["A","B","C","D","E"]
    # All edges (Euler: use all edges once; Hamilton: visit all vertices once)
    all_e = [(0,1),(1,2),(2,3),(3,4),(4,0),(0,2),(1,3)]
    for i,j in all_e: edge(c, pts[i][0],pts[i][1],pts[j][0],pts[j][1], col=colors.HexColor("#90a4ae"))
    # Highlight Hamiltonian cycle
    ham = [(0,1),(1,2),(2,3),(3,4),(4,0)]
    for i,j in ham: edge(c, pts[i][0],pts[i][1],pts[j][0],pts[j][1], col=colors.HexColor("#e53935"), lw=2.2)
    for i,(x,y) in enumerate(pts): node(c,x,y,labels[i],fill=colors.HexColor("#ffecb3"),text_col=TEXT_DARK)
    c.setFillColor(colors.HexColor("#e53935")); c.setFont("Helvetica-Bold",8)
    c.drawString(10,h-20,"\u2014 Red path = Hamiltonian cycle (visits every vertex once)")
    c.setFillColor(colors.HexColor("#546e7a")); c.drawString(10,h-32,"Grey edges = Eulerian path uses every edge once")


# ── style helpers ─────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()

    def ps(name, **kw):
        d = dict(fontName="Helvetica", fontSize=11, leading=16,
                 textColor=TEXT_BODY, spaceAfter=6, spaceBefore=2,
                 alignment=TA_JUSTIFY)
        d.update(kw)
        return ParagraphStyle(name, parent=base["Normal"], **d)

    return {
        "cover_title": ps("cover_title", fontName="Helvetica-Bold", fontSize=26,
                          textColor=WHITE, alignment=TA_CENTER, leading=32),
        "cover_sub":   ps("cover_sub",   fontName="Helvetica", fontSize=13,
                          textColor=colors.HexColor("#c5cae9"), alignment=TA_CENTER),
        "q_header":    ps("q_header",    fontName="Helvetica-Bold", fontSize=15,
                          textColor=WHITE, alignment=TA_LEFT, leading=20),
        "sub_header":  ps("sub_header",  fontName="Helvetica-Bold", fontSize=12,
                          textColor=DARK_NAVY, spaceBefore=10, spaceAfter=4),
        "body":        ps("body"),
        "body_bold":   ps("body_bold",   fontName="Helvetica-Bold"),
        "formula":     ps("formula",     fontName="Courier", fontSize=11,
                          textColor=colors.HexColor("#1565c0"),
                          backColor=PALE_BLUE, leftIndent=24, leading=17),
        "bullet":      ps("bullet",      leftIndent=20, firstLineIndent=-14,
                          spaceAfter=4, leading=16),
        "note":        ps("note",        fontName="Helvetica-Oblique", fontSize=10,
                          textColor=GREEN_DARK, backColor=GREEN_LIGHT,
                          leftIndent=10, rightIndent=10, leading=15),
        "proof_step":  ps("proof_step",  leftIndent=28, fontSize=11, leading=16,
                          textColor=TEXT_BODY),
        "table_head":  ps("table_head",  fontName="Helvetica-Bold", fontSize=10,
                          textColor=WHITE, alignment=TA_CENTER),
        "table_body":  ps("table_body",  fontSize=10, alignment=TA_LEFT, leading=14),
    }


S = build_styles()


# ── building-block helpers ────────────────────────────────────────────────────
def sp(n=8):  return Spacer(1, n)
def hr():     return HRFlowable(width="100%", thickness=0.6,
                                color=BORDER_GREY, spaceAfter=6, spaceBefore=6)

def q_box(title):
    data = [[Paragraph(_normalize_subscripts_for_paragraph(title), S["q_header"])]]
    t = Table(data, colWidths=[16*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), DARK_NAVY),
        ("ROUNDEDCORNERS", [6]),
        ("TOPPADDING",    (0,0),(-1,-1), 8),
        ("BOTTOMPADDING", (0,0),(-1,-1), 8),
        ("LEFTPADDING",   (0,0),(-1,-1), 14),
    ]))
    return t

def sub_box(title):
    data = [[Paragraph(_normalize_subscripts_for_paragraph(title), S["sub_header"])]]
    t = Table(data, colWidths=[16*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), LIGHT_BLUE),
        ("LINEBELOW",     (0,0),(-1,-1), 1.5, ACCENT_BLUE),
        ("TOPPADDING",    (0,0),(-1,-1), 5),
        ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
    ]))
    return t

def body(txt): return Paragraph(_normalize_subscripts_for_paragraph(txt), S["body"])
def formula(txt): return Paragraph(_normalize_subscripts_for_paragraph(txt), S["formula"])
def note(txt): return Paragraph(_normalize_subscripts_for_paragraph(txt), S["note"])
def bullet(txt): return Paragraph(_normalize_subscripts_for_paragraph(f"&nbsp;&nbsp;&bull;&nbsp; {txt}"), S["bullet"])
def proof_step(txt): return Paragraph(_normalize_subscripts_for_paragraph(txt), S["proof_step"])

def definition_table(rows):
    """2-column key/value table."""
    data = [[
        Paragraph(_normalize_subscripts_for_paragraph(k), S["table_body"]),
        Paragraph(_normalize_subscripts_for_paragraph(v), S["table_body"])
    ] for k, v in rows]
    t = Table(data, colWidths=[5*cm, 11*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(0,-1), LIGHT_BLUE),
        ("FONTNAME",      (0,0),(0,-1), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0),(-1,-1), 10),
        ("GRID",          (0,0),(-1,-1), 0.4, BORDER_GREY),
        ("TOPPADDING",    (0,0),(-1,-1), 5),
        ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ("LEFTPADDING",   (0,0),(-1,-1), 8),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ]))
    return t

def compare_table(headers, rows):
    head_row = [Paragraph(_normalize_subscripts_for_paragraph(h), S["table_head"]) for h in headers]
    body_rows = [[Paragraph(_normalize_subscripts_for_paragraph(c), S["table_body"]) for c in row] for row in rows]
    col_w = [16*cm / len(headers)] * len(headers)
    t = Table([head_row] + body_rows, colWidths=col_w)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), DARK_NAVY),
        ("BACKGROUND",    (0,1),(-1,-1), PALE_BLUE),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [WHITE, PALE_BLUE]),
        ("GRID",          (0,0),(-1,-1), 0.4, BORDER_GREY),
        ("FONTSIZE",      (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(-1,-1), 5),
        ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ("LEFTPADDING",   (0,0),(-1,-1), 8),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ]))
    return t

def graph_card(draw_fn, width=400, height=160, caption=""):
    g = GraphFlowable(draw_fn, width=width, height=height)
    data = [[g]]
    if caption:
        data.append([Paragraph(caption, ParagraphStyle("cap", parent=S["body"],
                                                        fontSize=9, alignment=TA_CENTER,
                                                        textColor=colors.HexColor("#455a64")))])
    t = Table(data, colWidths=[16*cm])
    t.setStyle(TableStyle([
        ("ALIGN",         (0,0),(-1,-1), "CENTER"),
        ("BACKGROUND",    (0,0),(-1,-1), PALE_BLUE),
        ("BOX",           (0,0),(-1,-1), 0.5, BORDER_GREY),
        ("TOPPADDING",    (0,0),(-1,-1), 10),
        ("BOTTOMPADDING", (0,0),(-1,-1), 10),
        ("ROUNDEDCORNERS",[4]),
    ]))
    return t


# ── cover page ────────────────────────────────────────────────────────────────
def cover_page(story):
    story.append(Spacer(1, 3*cm))
    # big banner
    banner = Table([[Paragraph("Graph Theory", S["cover_title"])]],
                   colWidths=[16*cm])
    banner.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), DARK_NAVY),
        ("TOPPADDING",    (0,0),(-1,-1), 28),
        ("BOTTOMPADDING", (0,0),(-1,-1), 28),
        ("ROUNDEDCORNERS",[8]),
    ]))
    story.append(banner)
    story.append(sp(16))
    story.append(Paragraph("Complete Solutions — All Questions", ParagraphStyle(
        "cs", parent=S["body"], fontSize=15, fontName="Helvetica-Bold",
        textColor=DARK_NAVY, alignment=TA_CENTER)))
    story.append(sp(8))
    story.append(Paragraph(
        "Questions 1 through 7 fully solved with proofs, diagrams, worked examples,\n"
        "and detailed explanations for easy understanding.",
        ParagraphStyle("cs2", parent=S["body"], alignment=TA_CENTER,
                       textColor=colors.HexColor("#455a64"), fontSize=11)))
    story.append(sp(40))
    toc_data = [
        [Paragraph("Question", S["table_head"]), Paragraph("Topic", S["table_head"]),
         Paragraph("Marks", S["table_head"])],
        [Paragraph("Q1 (a–h)", S["table_body"]), Paragraph("Short-answer definitions & fundamentals", S["table_body"]), Paragraph("2×5 = 10", S["table_body"])],
        [Paragraph("Q2", S["table_body"]), Paragraph("Handshaking lemma, simple graphs, edges", S["table_body"]), Paragraph("—", S["table_body"])],
        [Paragraph("Q3", S["table_body"]), Paragraph("Degree sequences, non-simple graphs, edge bound", S["table_body"]), Paragraph("—", S["table_body"])],
        [Paragraph("Q4", S["table_body"]), Paragraph("Isomorphism, adjacency matrix", S["table_body"]), Paragraph("—", S["table_body"])],
        [Paragraph("Q5", S["table_body"]), Paragraph("Euler's formula, planarity bound", S["table_body"]), Paragraph("—", S["table_body"])],
        [Paragraph("Q6", S["table_body"]), Paragraph("Euler/Hamiltonian paths, chromatic number, bipartite, binary trees", S["table_body"]), Paragraph("—", S["table_body"])],
        [Paragraph("Q7", S["table_body"]), Paragraph("Short notes: Four-colour, Hamiltonian graphs, Konigsberg, Catalan numbers", S["table_body"]), Paragraph("—", S["table_body"])],
    ]
    toc = Table(toc_data, colWidths=[3*cm, 10.5*cm, 2.5*cm])
    toc.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), DARK_NAVY),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [WHITE, PALE_BLUE]),
        ("GRID",          (0,0),(-1,-1), 0.4, BORDER_GREY),
        ("FONTSIZE",      (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(-1,-1), 6),
        ("BOTTOMPADDING", (0,0),(-1,-1), 6),
        ("LEFTPADDING",   (0,0),(-1,-1), 8),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
    ]))
    story.append(toc)
    story.append(PageBreak())


# ── Q1 ────────────────────────────────────────────────────────────────────────
def q1(story):
    story.append(q_box("QUESTION 1  —  Short Answer Questions  (Answer any five)   2 × 5 = 10"))
    story.append(sp(10))

    # (a)
    story.append(sub_box("(a)  Order and Size of a Graph"))
    story.append(body(
        "<b>Order</b> of a graph G, written |V| or n, is the total number of "
        "<b>vertices</b> (nodes) in the graph. It tells us how many points the graph has."))
    story.append(body(
        "<b>Size</b> of a graph G, written |E| or m, is the total number of "
        "<b>edges</b> (connections) in the graph. It tells us how many links exist between vertices."))
    story.append(definition_table([
        ("Order |V|", "Number of vertices — e.g. a triangle has Order = 3"),
        ("Size |E|",  "Number of edges — e.g. a triangle has Size = 3"),
    ]))
    story.append(sp(8))

    # (b)
    story.append(sub_box("(b)  Cut Edge and Cut Vertex"))
    story.append(body(
        "A <b>Cut Edge</b> (also called a Bridge) is an edge whose removal causes the graph to "
        "become disconnected — meaning the graph splits into two or more separate components. "
        "If we think of edges as roads, a cut edge is a road with no alternative route."))
    story.append(body(
        "A <b>Cut Vertex</b> (also called an Articulation Point) is a vertex whose removal "
        "(together with all edges attached to it) increases the number of connected components. "
        "It is a critical junction point in the graph."))
    story.append(note(
        "Example: In a path graph A–B–C, every edge is a cut edge and vertex B is a cut vertex."))
    story.append(sp(8))

    # (c)
    story.append(sub_box("(c)  Non-directed Complete Graph where every vertex has degree 2"))
    story.append(body(
        "In a complete graph K<sub>n</sub>, every vertex is connected to every other vertex. "
        "Therefore each vertex has degree (n – 1), because it connects to all the remaining vertices."))
    story.append(body("Setting the degree equal to 2:"))
    story.append(formula("n - 1 = 2   =>   n = 3"))
    story.append(body(
        "So the graph is <b>K<sub>3</sub></b> — a triangle with 3 vertices and 3 edges, "
        "where every vertex has exactly degree 2."))
    story.append(graph_card(draw_k3, height=140))
    story.append(sp(8))

    # (d)
    story.append(sub_box("(d)  Cycle Graph vs Wheel Graph"))
    story.append(body(
        "A <b>Cycle Graph C<sub>n</sub></b> is formed by arranging n vertices in a single closed "
        "loop, where each vertex connects to exactly two neighbours — one on each side. "
        "Every vertex therefore has degree 2. The simplest cycle is C<sub>3</sub> (a triangle)."))
    story.append(body(
        "A <b>Wheel Graph W<sub>n</sub></b> is constructed by taking a cycle C<sub>n</sub> and "
        "adding one extra <i>hub</i> vertex in the centre that is connected to every vertex on the "
        "rim. The hub has degree n (connecting to all rim vertices), while each rim vertex has "
        "degree 3 (two rim neighbours + hub)."))
    story.append(compare_table(
        ["Property", "Cycle C\u2085", "Wheel W\u2085"],
        [["Vertices", "5", "6 (5 rim + 1 hub)"],
         ["Edges",    "5", "10 (5 rim + 5 spokes)"],
         ["Rim degree", "2", "3"],
         ["Hub degree", "N/A", "5"]]))
    story.append(graph_card(draw_wheel_vs_cycle, height=160))
    story.append(sp(8))

    # (e)
    story.append(sub_box("(e)  Complement of a Graph — Complement of C\u2085"))
    story.append(body(
        "The <b>complement</b> <overline>G</overline> of a graph G has the same vertex set, "
        "but contains exactly those edges that are <i>absent</i> in G. "
        "In other words, two vertices are adjacent in the complement if and only if they are "
        "<b>not</b> adjacent in the original graph."))
    story.append(body("For C\u2085 with vertices {1, 2, 3, 4, 5}:"))
    story.append(body("Edges <b>present</b> in C\u2085: {1-2, 2-3, 3-4, 4-5, 5-1}"))
    story.append(body("Edges <b>absent</b> in C\u2085 (= edges in complement): {1-3, 1-4, 2-4, 2-5, 3-5}"))
    story.append(note(
        "Remarkable fact: The complement of C\u2085 is isomorphic to C\u2085 itself — "
        "making C\u2085 a self-complementary graph!"))
    story.append(graph_card(draw_c5, height=160))
    story.append(graph_card(draw_c5_complement, height=160))
    story.append(sp(8))

    # (f)
    story.append(sub_box("(f)  Simple Connected Graph with 70 Edges — Vertex Bounds"))
    story.append(body(
        "For a simple connected graph with n vertices, the number of edges |E| satisfies:"))
    story.append(formula("Minimum edges (connected tree):   n - 1"))
    story.append(formula("Maximum edges (complete graph):   n(n-1)/2"))
    story.append(body("Given |E| = 70, we solve for n:"))
    story.append(body("<b>Lower bound</b> (minimum vertices from max-edge formula):"))
    story.append(formula("n(n-1)/2 >= 70   =>   n(n-1) >= 140   =>   n >= 12  (since 12x11=132 < 140, n >= 13)"))
    story.append(body(
        "So n must be at least 13. Checking: K<sub>12</sub> has 12×11/2 = 66 < 70 edges, "
        "and K<sub>13</sub> has 13×12/2 = 78 >= 70. Therefore the number of vertices is "
        "<b>between 13 and 71</b> (since for a connected graph we also need at least n-1 = 70 "
        "edges, giving n up to 71)."))
    story.append(note("Vertex count lies between 13 and 71 for a simple connected graph with 70 edges."))
    story.append(sp(8))

    # (g)
    story.append(sub_box("(g)  Each vertex has degree 4 and |E| + |V| = 36 — Find |V| and |E|"))
    story.append(body(
        "We use two facts together. First, the <b>Handshaking Lemma</b> states that the sum of "
        "all degrees equals twice the number of edges:"))
    story.append(formula("Sum of degrees = 2 x |E|"))
    story.append(body(
        "Since every vertex has degree 4 and there are |V| vertices:"))
    story.append(formula("4 x |V| = 2 x |E|   =>   |E| = 2|V|"))
    story.append(body("Now substitute into the given condition:"))
    story.append(formula("|E| + |V| = 36   =>   2|V| + |V| = 36   =>   3|V| = 36   =>   |V| = 12"))
    story.append(formula("|E| = 2 x 12 = 24"))
    story.append(note("Answer: |V| = 12 vertices and |E| = 24 edges."))
    story.append(sp(8))

    # (h)
    story.append(sub_box("(h)  Rooted Tree and Level of a Vertex"))
    story.append(body(
        "A <b>Rooted Tree</b> is a tree (connected acyclic graph) in which one particular vertex "
        "is designated as the <b>root</b>. This gives every vertex a clear parent-child "
        "relationship and a defined direction (from root downward to leaves)."))
    story.append(body(
        "The <b>level</b> (or depth) of any vertex v in a rooted tree is the <b>length of the "
        "unique path</b> from the root down to v — i.e., the number of edges on that path."))
    story.append(definition_table([
        ("Root",     "The designated starting vertex — its level is 0"),
        ("Level 0",  "The root itself"),
        ("Level 1",  "All vertices directly connected to the root (children of root)"),
        ("Level 2",  "Children of level-1 vertices (grandchildren of root)"),
        ("Level k",  "Vertices at distance k from the root"),
        ("Height",   "The maximum level among all vertices in the tree"),
    ]))
    story.append(PageBreak())


# ── Q2 ────────────────────────────────────────────────────────────────────────
def q2(story):
    story.append(q_box("QUESTION 2  —  Graph Theory Fundamentals"))
    story.append(sp(10))

    # (a)
    story.append(sub_box("(a)  Prove: Every undirected graph has an even number of vertices of odd degree"))
    story.append(body(
        "This result is a direct consequence of the <b>Handshaking Lemma</b>, one of the most "
        "fundamental theorems in graph theory."))
    story.append(body("<b>Handshaking Lemma:</b>"))
    story.append(formula("Sum of all vertex degrees = 2 x |E|"))
    story.append(body(
        "The right-hand side is always even (since it is 2 times an integer). "
        "Therefore the sum of all degrees is <b>always even</b>."))
    story.append(body("<b>Proof by partition:</b>"))
    story.append(body(
        "Divide the vertex set V into two groups: let <b>A</b> be the set of vertices with "
        "<b>even degree</b>, and <b>B</b> be the set of vertices with <b>odd degree</b>."))
    story.append(formula("Sum over A (even degrees) + Sum over B (odd degrees) = 2|E|  (even)"))
    story.append(body(
        "The sum over A is even (sum of even numbers is always even). "
        "So the sum over B must also be even (since even + something = even)."))
    story.append(body(
        "But the sum over B is a sum of odd numbers. The only way a sum of odd numbers can be "
        "even is if there are an <b>even number of them</b>."))
    story.append(note(
        "Therefore |B| — the number of vertices with odd degree — must be even.  Q.E.D."))
    story.append(sp(8))

    # (b)
    story.append(sub_box("(b)  How many simple graphs exist with vertex set {v\u2081, v\u2082, v\u2083}?"))
    story.append(body(
        "With 3 vertices, the possible edges are the pairs: "
        "{v\u2081v\u2082}, {v\u2081v\u2083}, {v\u2082v\u2083} — a total of C(3,2) = 3 possible edges."))
    story.append(body(
        "In a simple graph, each of these 3 edges is either <b>present</b> or <b>absent</b> — "
        "giving 2 choices per edge. Since the choices are independent:"))
    story.append(formula("Total simple graphs = 2^3 = 8"))
    story.append(body("These 8 graphs range from the empty graph (0 edges) to K\u2083 (3 edges):"))
    story.append(definition_table([
        ("0 edges", "1 graph — empty graph (no edges at all)"),
        ("1 edge",  "3 graphs — one for each of the 3 possible edges"),
        ("2 edges", "3 graphs — one for each pair of edges"),
        ("3 edges", "1 graph — complete graph K\u2083"),
    ]))
    story.append(note("Total = 1 + 3 + 3 + 1 = 8 distinct simple graphs on 3 vertices."))
    story.append(sp(8))

    # (c)
    story.append(sub_box("(c)  Minimum vertices for 12 edges, given 6 vertices of degree 3"))
    story.append(body(
        "We want to find the <b>minimum total number of vertices</b> in a simple graph G that has "
        "exactly 12 edges, where 6 vertices have degree 3 and all other vertices have degree less than 3 "
        "(i.e., degree 0, 1, or 2)."))
    story.append(body("<b>Step 1 — Apply Handshaking Lemma:</b>"))
    story.append(formula("Sum of all degrees = 2 x |E| = 2 x 12 = 24"))
    story.append(body("<b>Step 2 — Calculate contribution from the 6 known vertices:</b>"))
    story.append(formula("Contribution from 6 vertices of degree 3 = 6 x 3 = 18"))
    story.append(body("<b>Step 3 — Remaining degree needed:</b>"))
    story.append(formula("Remaining sum needed = 24 - 18 = 6"))
    story.append(body(
        "<b>Step 4 — Minimise extra vertices:</b> To use the fewest additional vertices, give each "
        "of them the maximum allowed degree, which is 2."))
    story.append(formula("Minimum extra vertices = ceil(6 / 2) = 3"))
    story.append(body(
        "<b>Step 5 — Total:</b> 6 vertices (degree 3) + 3 vertices (degree 2) = <b>9 vertices</b>."))
    story.append(note("Minimum number of vertices G can have = 9."))
    story.append(PageBreak())


# ── Q3 ────────────────────────────────────────────────────────────────────────
def q3(story):
    story.append(q_box("QUESTION 3  —  Degree Sequences and Edge Bound Proof"))
    story.append(sp(10))

    # (a)
    story.append(sub_box("(a)  Find a graph with degree sequence (1, 3, 3, 5, 6, 6, 9)"))
    story.append(body(
        "Before trying to construct a graph, we <b>verify feasibility</b> using the Handshaking Lemma: "
        "the sum of all degrees must be even."))
    story.append(formula("1 + 3 + 3 + 5 + 6 + 6 + 9 = 33  (odd)"))
    story.append(body(
        "Since 33 is <b>odd</b>, this violates the Handshaking Lemma (which requires the sum to be even). "
        "Therefore <b>no graph — simple or otherwise — can have this degree sequence</b>."))
    story.append(note(
        "Conclusion: The degree sequence (1,3,3,5,6,6,9) is non-graphical. No such graph exists."))
    story.append(sp(8))

    # (b)
    story.append(sub_box("(b)  Draw a non-simple graph with degree sequence (1, 1, 3, 3, 4, 6, 7)"))
    story.append(body("First check: Sum = 1+1+3+3+4+6+7 = 25 (odd). This sum is also <b>odd</b>, so even a "
        "non-simple graph (which still obeys the Handshaking Lemma) cannot have this degree sequence."))
    story.append(note(
        "The Handshaking Lemma applies to ALL graphs — simple or non-simple. "
        "Since the sum of degrees must equal 2|E| (always even), no graph of any kind can have "
        "degree sequence (1,1,3,3,4,6,7) because its sum is 25, which is odd."))
    story.append(body(
        "If the intended sequence were, for example, (1,1,3,3,4,6,<b>8</b>) giving sum = 26 (even), "
        "then a non-simple graph could be constructed by using multiple edges and loops on the "
        "high-degree vertices to reach the required degrees. But as stated, no such graph exists."))
    story.append(sp(8))

    # (c)
    story.append(sub_box("(c)  Prove: |E| \u2264 n(n-1)/2 for any simple graph on n vertices"))
    story.append(body("<b>Proof:</b>"))
    story.append(body(
        "Let G be a simple graph with n vertices. By definition, a <b>simple graph</b> has:"))
    story.append(bullet("No loops (no edge from a vertex to itself)"))
    story.append(bullet("No multiple edges (at most one edge between any pair of vertices)"))
    story.append(body(
        "Each edge in G connects two <b>distinct</b> vertices. The number of ways to choose "
        "2 vertices from n vertices (to potentially connect with an edge) is:"))
    story.append(formula("C(n, 2) = n! / (2! x (n-2)!) = n(n-1) / 2"))
    story.append(body(
        "Since simple graphs allow at most <b>one edge per pair</b>, the actual number of edges "
        "|E| cannot exceed the number of available vertex pairs:"))
    story.append(formula("|E|  <=  n(n-1)/2"))
    story.append(body(
        "Equality holds precisely when G is the <b>complete graph K<sub>n</sub></b>, in which every "
        "pair of vertices is connected by exactly one edge."))
    story.append(note("Q.E.D.  The bound is tight — achieved by K\u2099."))
    story.append(PageBreak())


# ── Q4 ────────────────────────────────────────────────────────────────────────
def q4(story):
    story.append(q_box("QUESTION 4  —  Graph Isomorphism and Adjacency Matrices"))
    story.append(sp(10))

    # (a)
    story.append(sub_box("(a)  Define Isomorphism"))
    story.append(body(
        "Two graphs G and H are <b>isomorphic</b> (written G \u2245 H) if there exists a "
        "<b>bijection</b> (one-to-one and onto mapping) f: V(G) \u2192 V(H) such that any two "
        "vertices u and v are adjacent in G <b>if and only if</b> f(u) and f(v) are adjacent in H."))
    story.append(body(
        "Intuitively, isomorphic graphs are <b>structurally identical</b> — they differ only in "
        "the names or labels of their vertices. The mapping f is called an <b>isomorphism</b>."))
    story.append(body("<b>Necessary conditions for isomorphism (invariants that must match):</b>"))
    story.append(bullet("Same number of vertices: |V(G)| = |V(H)|"))
    story.append(bullet("Same number of edges: |E(G)| = |E(H)|"))
    story.append(bullet("Same degree sequence (sorted list of all vertex degrees)"))
    story.append(bullet("Same number of connected components"))
    story.append(bullet("Same cycle structure (e.g., same girth)"))
    story.append(note(
        "Important: These conditions are necessary but NOT sufficient. Two graphs can satisfy all "
        "invariants and still fail to be isomorphic. Confirming isomorphism requires finding the "
        "explicit mapping f, or using a graph isomorphism algorithm."))
    story.append(sp(8))

    story.append(sub_box("(a)  Determining whether graphs H and I are isomorphic"))
    story.append(body(
        "Since the actual graph diagrams H and I were provided as hand-drawn figures in the "
        "exam paper (not transmitted as data here), we demonstrate the <b>complete systematic "
        "procedure</b> to check isomorphism:"))
    story.append(body("<b>Step 1 — Check vertex count:</b>"))
    story.append(formula("If |V(H)| != |V(I)|  =>  NOT isomorphic. Stop."))
    story.append(body("<b>Step 2 — Check edge count:</b>"))
    story.append(formula("If |E(H)| != |E(I)|  =>  NOT isomorphic. Stop."))
    story.append(body("<b>Step 3 — Check degree sequences:</b>"))
    story.append(body(
        "Sort the degree of every vertex in both graphs. If the sorted sequences differ, they "
        "cannot be isomorphic."))
    story.append(body("<b>Step 4 — Attempt to construct the mapping f:</b>"))
    story.append(body(
        "Match vertices of equal degree. For each high-degree vertex in H, try assigning it to a "
        "high-degree vertex of I and verify that all adjacencies are preserved. If a consistent "
        "mapping exists for ALL vertices, the graphs are isomorphic."))
    story.append(body("<b>Step 5 — Check structural features:</b>"))
    story.append(body(
        "If mapping attempts fail, check additional invariants: number of triangles, girth "
        "(shortest cycle length), diameter. Any mismatch confirms non-isomorphism."))
    story.append(note(
        "For the specific graphs H and I given in the exam diagram: apply the steps above. "
        "If all vertex degrees match and a consistent bijection can be found, declare them "
        "isomorphic and state the mapping explicitly."))
    story.append(sp(8))

    # (b)
    story.append(sub_box("(b)  Interpreting the Adjacency Matrix A and A\u00b3"))
    story.append(body(
        "The <b>adjacency matrix</b> A of a graph G is a square n\u00d7n matrix where:"))
    story.append(formula("A[i][j] = 1  if there is an edge between vertex i and vertex j"))
    story.append(formula("A[i][j] = 0  if there is no such edge"))
    story.append(body(
        "For the 6\u00d76 matrix A given in the problem, the graph G has <b>6 vertices</b>. "
        "Each row/column corresponds to one vertex, and each 1 in the matrix means an edge exists."))
    story.append(body("<b>What does A\u00b3 (A cubed) tell us?</b>"))
    story.append(body(
        "The entry A\u00b3[i][j] gives the <b>number of walks of length exactly 3</b> from vertex i "
        "to vertex j. A walk of length 3 uses exactly 3 edges (with possible repetition of vertices)."))
    story.append(body(
        "So A\u00b3[i][i] (the diagonal entries) counts the number of <b>closed walks of length 3</b> "
        "starting and ending at vertex i. These correspond to <b>triangles</b> passing through i."))
    story.append(definition_table([
        ("A[i][j]",   "1 if edge exists between i and j; 0 otherwise"),
        ("A\u00b2[i][j]", "Number of walks of length 2 from vertex i to j"),
        ("A\u00b3[i][j]", "Number of walks of length 3 from vertex i to j"),
        ("A\u00b3[i][i]", "Number of triangles through vertex i (x 2)"),
    ]))
    story.append(body(
        "To reconstruct the graph from matrix A: connect vertex i to vertex j for every position "
        "where A[i][j] = 1. The A\u00b3 matrix then serves as a verification tool — if the "
        "computed A\u00b3 matches the given one, the adjacency structure is correct."))
    story.append(PageBreak())


# ── Q5 ────────────────────────────────────────────────────────────────────────
def q5(story):
    story.append(q_box("QUESTION 5  —  Planar Graphs: Euler's Formula and Edge Bound"))
    story.append(sp(10))

    # (a)
    story.append(sub_box("(a)  Prove Euler's Formula:  |V| - |E| + |R| = 2"))
    story.append(body(
        "Euler's formula applies to any <b>connected planar graph</b>, where |R| denotes the "
        "number of <b>regions</b> (faces), including the one unbounded outer face."))
    story.append(body("<b>Proof by induction on the number of edges |E|:</b>"))
    story.append(sp(4))
    story.append(body("<b>Base Case — Tree (minimum edges for connectivity):</b>"))
    story.append(body(
        "A connected graph with n vertices and no cycles is a <b>tree</b>. A tree has exactly "
        "n-1 edges and exactly 1 region (the single unbounded outer face). Substituting:"))
    story.append(formula("|V| - |E| + |R| = n - (n-1) + 1 = 1 + 1 = 2  \u2713"))
    story.append(sp(4))
    story.append(body("<b>Inductive Step:</b>"))
    story.append(body(
        "Assume the formula holds for all connected planar graphs with fewer than |E| edges. "
        "Now consider a connected planar graph G with |E| edges that contains at least one cycle."))
    story.append(body(
        "Choose any edge e that lies on a cycle. Removing e:"))
    story.append(bullet("Does NOT disconnect G (since e is part of a cycle, the other path remains)"))
    story.append(bullet("|V| stays the same (no vertex is removed)"))
    story.append(bullet("|E| decreases by 1 (we removed one edge)"))
    story.append(bullet("|R| decreases by 1 (the two faces on either side of e merge into one)"))
    story.append(body("The graph G' = G - e has fewer edges, so by the inductive hypothesis:"))
    story.append(formula("|V| - (|E|-1) + (|R|-1) = 2"))
    story.append(formula("|V| - |E| + 1 + |R| - 1 = 2"))
    story.append(formula("|V| - |E| + |R| = 2  \u2713"))
    story.append(note(
        "Q.E.D. Euler's formula holds for every connected planar graph. "
        "Example: A cube graph has |V|=8, |E|=12, |R|=6 and 8-12+6 = 2. \u2713"))
    story.append(graph_card(draw_euler_graph, height=160))
    story.append(sp(8))

    # (b)
    story.append(sub_box("(b)  Prove: |E| \u2264 3|V| - 6 for connected simple planar graphs"))
    story.append(body(
        "This inequality gives us a powerful planarity test: any graph violating it cannot be planar."))
    story.append(body("<b>Proof:</b>"))
    story.append(body(
        "In a connected simple planar graph with |E| > 1, every region (face) is bounded by "
        "at least <b>3 edges</b>. (Since the graph is simple — no loops, no multiple edges — "
        "the shortest possible cycle has length 3, so every face boundary has \u2265 3 edges.)"))
    story.append(body(
        "Each edge borders <b>at most 2</b> faces (one on each side). Counting edge-face incidences:"))
    story.append(formula("3 x |R|  <=  2 x |E|    ...(*)"))
    story.append(body("From Euler's formula:"))
    story.append(formula("|R| = 2 - |V| + |E|"))
    story.append(body("Substitute into (*):"))
    story.append(formula("3(2 - |V| + |E|)  <=  2|E|"))
    story.append(formula("6 - 3|V| + 3|E|   <=  2|E|"))
    story.append(formula("3|E| - 2|E|        <=  3|V| - 6"))
    story.append(formula("|E|                <=  3|V| - 6    Q.E.D."))
    story.append(note(
        "Application: K\u2085 has |V|=5, |E|=10. Check: 3(5)-6 = 9 < 10. "
        "So K\u2085 is NOT planar! (This is one proof of K\u2085 non-planarity.)"))
    story.append(PageBreak())


# ── Q6 ────────────────────────────────────────────────────────────────────────
def q6(story):
    story.append(q_box("QUESTION 6  —  Paths, Colouring, Bipartite Graphs, Binary Trees"))
    story.append(sp(10))

    # (a)
    story.append(sub_box("(a)  Euler Path vs Hamiltonian Path"))
    story.append(body(
        "These two famous path concepts are often confused because they sound similar, but they "
        "focus on completely different elements of a graph:"))
    story.append(compare_table(
        ["Property", "Euler Path", "Hamiltonian Path"],
        [
            ["What it visits", "Every EDGE exactly once", "Every VERTEX exactly once"],
            ["Existence condition",
             "Graph must have exactly 0 or 2 vertices of odd degree",
             "No simple polynomial-time condition known (NP-complete)"],
            ["Closed version",
             "Euler Circuit: 0 vertices of odd degree",
             "Hamiltonian Cycle: return to start vertex"],
            ["Complexity", "Decidable in O(|E|) time", "NP-complete in general"],
            ["Named after", "Leonhard Euler (1736)", "William Rowan Hamilton (1857)"],
            ["Key insight", "About edges — traverse every road", "About vertices — visit every city"],
        ]
    ))
    story.append(graph_card(draw_euler_hamilton, height=160))
    story.append(sp(8))

    # (b)
    story.append(sub_box("(b)  Chromatic Number \u03c7(G)"))
    story.append(body(
        "The <b>chromatic number \u03c7(G)</b> of a graph G is the <b>minimum number of colours</b> "
        "needed to colour the vertices of G such that no two adjacent vertices (connected by an edge) "
        "receive the same colour. This is called a <b>proper colouring</b>."))
    story.append(body("<b>Key facts:</b>"))
    story.append(bullet("\u03c7(G) = 1 if and only if G has no edges (empty graph)"))
    story.append(bullet("\u03c7(G) = 2 if and only if G is a non-empty bipartite graph"))
    story.append(bullet("\u03c7(K\u2099) = n (complete graph needs n colours)"))
    story.append(bullet("\u03c7(C\u2099) = 2 if n is even, 3 if n is odd (cycle graphs)"))
    story.append(body(
        "For graph M given in the exam: To find \u03c7(M), we greedily assign colours starting with "
        "the highest-degree vertex. If M contains an odd cycle (triangle), \u03c7(M) \u2265 3. "
        "If M is bipartite (no odd cycles), \u03c7(M) = 2. The exact value depends on M's structure."))
    story.append(note(
        "General method: (1) Check for triangles — if present, need \u2265 3 colours. "
        "(2) Greedily colour vertices. (3) Verify no two adjacent vertices share a colour. "
        "(4) The minimum number of colours used is \u03c7(G)."))
    story.append(sp(8))

    # (c)
    story.append(sub_box("(c)  Bipartite Graph"))
    story.append(body(
        "A graph G = (V, E) is called <b>bipartite</b> if its vertex set V can be split into "
        "two disjoint, non-empty subsets X and Y (called <b>partitions</b>) such that:"))
    story.append(bullet("X \u222a Y = V  (every vertex belongs to one partition)"))
    story.append(bullet("X \u2229 Y = \u2205  (no vertex is in both partitions)"))
    story.append(bullet("Every edge connects one vertex in X to one vertex in Y"))
    story.append(bullet("No edge connects two vertices within the same partition"))
    story.append(body(
        "A fundamental theorem states: <b>G is bipartite if and only if G contains no odd-length cycles.</b>"))
    story.append(graph_card(draw_bipartite, height=160))
    story.append(body("<b>Common examples of bipartite graphs:</b>"))
    story.append(definition_table([
        ("Path graph P\u2099",       "Always bipartite (alternating vertices form 2 sets)"),
        ("Cycle C\u2099 (even n)",   "Bipartite — vertices alternate between two sets"),
        ("Cycle C\u2099 (odd n)",    "NOT bipartite — contains an odd cycle"),
        ("Complete bipartite K\u2098\u2099", "Every vertex in set of size m connects to all in set of size n"),
        ("Tree",                     "Every tree is bipartite"),
    ]))
    story.append(sp(8))

    # (d)
    story.append(sub_box("(d)  Number of distinct binary trees with 3 nodes"))
    story.append(body(
        "The number of structurally distinct binary trees with n nodes is given by the "
        "<b>n-th Catalan number</b>:"))
    story.append(formula("C\u2099 = (1/(n+1)) x C(2n, n)"))
    story.append(body("For n = 3:"))
    story.append(formula("C\u2083 = (1/4) x C(6,3) = (1/4) x 20 = 5"))
    story.append(body("The 5 distinct structures are:"))
    story.append(definition_table([
        ("Tree 1", "Root has both a left child AND a right child (balanced)"),
        ("Tree 2", "Root has only a left child; that child has only a left child (left-left chain)"),
        ("Tree 3", "Root has only a left child; that child has only a right child (left-right)"),
        ("Tree 4", "Root has only a right child; that child has only a left child (right-left)"),
        ("Tree 5", "Root has only a right child; that child has only a right child (right-right chain)"),
    ]))
    story.append(graph_card(draw_binary_trees, width=460, height=175))
    story.append(PageBreak())


# ── Q7 ────────────────────────────────────────────────────────────────────────
def q7(story):
    story.append(q_box("QUESTION 7  —  Short Notes (All Four)"))
    story.append(sp(10))

    # (a)
    story.append(sub_box("(a)  The Four-Colour Problem"))
    story.append(body(
        "The <b>Four-Colour Problem</b> asks: can every map drawn on a flat plane be coloured "
        "using at most <b>four colours</b> such that no two regions sharing a boundary (more than "
        "a single point) receive the same colour?"))
    story.append(body("<b>History:</b>"))
    story.append(bullet(
        "<b>1852</b> — Francis Guthrie first posed the conjecture while colouring a map of England."))
    story.append(bullet(
        "<b>1879</b> — Alfred Kempe published a 'proof' that was later found to be flawed."))
    story.append(bullet(
        "<b>1890</b> — Percy Heawood identified Kempe's error but proved the <i>Five-Colour Theorem</i>."))
    story.append(bullet(
        "<b>1976</b> — Kenneth Appel and Wolfgang Haken proved the Four-Colour Theorem using a "
        "computer to check 1,936 reducible configurations — the first major theorem proved "
        "with substantial computer assistance."))
    story.append(body("<b>Graph theory formulation:</b>"))
    story.append(body(
        "Every planar graph is 4-colourable — its vertices can be coloured with 4 colours such "
        "that no adjacent vertices share a colour. (Maps correspond to planar graphs where "
        "regions are vertices and shared borders are edges.)"))
    story.append(note(
        "The proof remains controversial in some circles because it cannot be verified by hand. "
        "Simpler proofs are still being sought. The theorem holds, and no map requiring 5 colours "
        "has ever been found."))
    story.append(sp(8))

    # (b)
    story.append(sub_box("(b)  Hamiltonian Graphs"))
    story.append(body(
        "A graph G is called <b>Hamiltonian</b> if it contains a <b>Hamiltonian cycle</b> — a "
        "closed path that visits every vertex of the graph <b>exactly once</b> before returning "
        "to the starting vertex. The concept is named after Sir William Rowan Hamilton, who "
        "studied it in 1857 through a puzzle involving the edges of a dodecahedron."))
    story.append(body("<b>Key definitions:</b>"))
    story.append(definition_table([
        ("Hamiltonian path",  "An open path visiting every vertex exactly once"),
        ("Hamiltonian cycle", "A closed path (circuit) visiting every vertex exactly once"),
        ("Hamiltonian graph", "A graph containing at least one Hamiltonian cycle"),
    ]))
    story.append(body("<b>Sufficient conditions (Ore's and Dirac's theorems):</b>"))
    story.append(bullet(
        "<b>Dirac's Theorem (1952):</b> If G has n \u2265 3 vertices and every vertex has "
        "degree \u2265 n/2, then G is Hamiltonian."))
    story.append(bullet(
        "<b>Ore's Theorem (1960):</b> If for every pair of non-adjacent vertices u and v, "
        "deg(u) + deg(v) \u2265 n, then G is Hamiltonian."))
    story.append(body("<b>Examples:</b>"))
    story.append(bullet("K\u2099 (complete graph, n \u2265 3): Always Hamiltonian"))
    story.append(bullet("C\u2099 (cycle): Is itself a Hamiltonian cycle"))
    story.append(bullet("K\u2081,\u2099 (star graph, n > 1): Never Hamiltonian"))
    story.append(note(
        "Unlike Eulerian graphs, determining if a graph is Hamiltonian is NP-complete — "
        "no efficient algorithm is known for the general case."))
    story.append(sp(8))

    # (c)
    story.append(sub_box("(c)  The Konigsberg Bridges Problem"))
    story.append(body(
        "In the 18th century, the city of <b>Konigsberg</b> (now Kaliningrad, Russia) was "
        "divided by the Pregel River into four landmasses connected by <b>seven bridges</b>. "
        "The townspeople wondered: <i>Is it possible to walk through the city crossing each "
        "bridge exactly once and return to the starting point?</i>"))
    story.append(body(
        "In <b>1736</b>, Swiss mathematician <b>Leonhard Euler</b> proved this was impossible, "
        "and in doing so, founded the entire discipline of <b>graph theory</b>."))
    story.append(body("<b>Euler's model:</b>"))
    story.append(bullet("Each landmass \u2192 a vertex (4 vertices total)"))
    story.append(bullet("Each bridge \u2192 an edge (7 edges total)"))
    story.append(bullet("The question becomes: does this graph have an Eulerian circuit?"))
    story.append(body("<b>Euler's key theorem:</b>"))
    story.append(body(
        "An Eulerian circuit (traversing every edge exactly once and returning to start) "
        "exists if and only if <b>every vertex has even degree</b>."))
    story.append(body(
        "An Eulerian path (not necessarily returning to start) exists if and only if "
        "<b>exactly 0 or 2 vertices have odd degree</b>."))
    story.append(body("<b>In Konigsberg:</b>"))
    story.append(body(
        "All four vertices had <b>odd degree</b> (degrees: 3, 3, 3, 5). Since there are 4 "
        "vertices of odd degree (not 0 or 2), neither an Eulerian circuit nor an Eulerian path "
        "is possible. The walk is impossible."))
    story.append(note(
        "Historical significance: This 1736 paper is considered the first paper in graph theory "
        "and topology. Euler's elegant proof showed how abstract mathematical structure can "
        "resolve real-world puzzles."))
    story.append(sp(8))

    # (d)
    story.append(sub_box("(d)  The Catalan Numbers"))
    story.append(body(
        "The <b>Catalan numbers</b> form a sequence of natural numbers with an extraordinary "
        "range of combinatorial interpretations. The n-th Catalan number is:"))
    story.append(formula("C\u2099 = (1/(n+1)) x C(2n, n) = (2n)! / ((n+1)! x n!)"))
    story.append(body("<b>First several Catalan numbers:</b>"))
    story.append(compare_table(
        ["n", "0", "1", "2", "3", "4", "5", "6"],
        [["C\u2099", "1", "1", "2", "5", "14", "42", "132"]]
    ))
    story.append(body("<b>What do Catalan numbers count?</b>"))
    story.append(definition_table([
        ("Binary trees",      "C\u2099 = number of distinct binary trees with n internal nodes"),
        ("Bracket sequences", "C\u2099 = number of valid sequences of n pairs of parentheses"),
        ("Polygon triangulations", "C\u2099 = ways to triangulate a convex (n+2)-gon"),
        ("Monotonic paths",   "C\u2099 = paths in an n\u00d7n grid that don't cross the diagonal"),
        ("Stack-sortable permutations", "C\u2099 = permutations of {1,...,n} sortable by one stack"),
    ]))
    story.append(body("<b>Recursive formula:</b>"))
    story.append(formula("C\u2080 = 1,   C\u2099 = \u03a3 C\u1d62 x C\u2099\u208b\u2081\u208b\u1d62  (sum for i from 0 to n-1)"))
    story.append(body(
        "This recursion has a beautiful interpretation for binary trees: split at the root — "
        "the left subtree has i nodes and the right subtree has n-1-i nodes, and sum over "
        "all possible splits."))
    story.append(note(
        "Catalan numbers appear in over 200 different combinatorial problems. "
        "They were described by Euler (polygon triangulations, 1751) and later named after "
        "Belgian mathematician Eug\u00e8ne Charles Catalan (1838)."))


# ── main ──────────────────────────────────────────────────────────────────────
def main():
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, "Graph_Theory_Complete_Solutions.pdf")
    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        topMargin=1.8*cm, bottomMargin=1.8*cm,
        leftMargin=2*cm,  rightMargin=2*cm,
        title="Graph Theory — Complete Solutions",
        author="Academic Solutions",
    )

    story = []
    cover_page(story)
    q1(story)
    q2(story)
    q3(story)
    q4(story)
    q5(story)
    q6(story)
    q7(story)

    doc.build(story)
    print("PDF created:", path)

main()
