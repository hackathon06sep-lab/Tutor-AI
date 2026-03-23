const PDFDocument = require('pdfkit');

function buildPDF(content, meta, res) {
  const doc = new PDFDocument({
    margin: 0,
    size: 'A4',
    bufferPages: true,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="assignment-${meta.topic.replace(/\s+/g, '-').toLowerCase()}.pdf"`
  );

  doc.pipe(res);

  const W      = doc.page.width;   // 595
  const H      = doc.page.height;  // 842
  const LEFT   = 50;
  const RIGHT  = W - 50;
  const INNER  = RIGHT - LEFT;     // 495

  // ─── HEADER BAND ──────────────────────────────────────────────
  doc.rect(0, 0, W, 100).fill('#1a1a2e');

  // Accent stripe
  doc.rect(0, 0, 6, 100).fill('#7c3aed');

  // Logo
  doc
    .fillColor('#a78bfa')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('TutorAI', LEFT + 10, 22);

  // Tagline
  doc
    .fillColor('#c4b5fd')
    .fontSize(9)
    .font('Helvetica')
    .text('AI-Powered Assignment', LEFT + 10, 50);

  // Date — top right
  doc
    .fillColor('#6d6a8a')
    .fontSize(8)
    .text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 0, 22, {
      align: 'right',
      width: W - 20,
    });

  // ─── TITLE BAND ───────────────────────────────────────────────
  doc.rect(0, 100, W, 72).fill('#f8f7ff');

  // Thin top border on title band
  doc.rect(0, 100, W, 3).fill('#7c3aed');

  const titleText = content.title || `${meta.topic} Assignment`;
  doc
    .fillColor('#1a1a2e')
    .fontSize(17)
    .font('Helvetica-Bold')
    .text(titleText, LEFT + 10, 112, { width: INNER - 10 });

  doc
    .fillColor('#6b7280')
    .fontSize(8)
    .font('Helvetica')
    .text(
      `${meta.gradeLevel}  •  ${meta.type}  •  Topic: ${meta.topic}`,
      LEFT + 10,
      138,
      { width: INNER }
    );

  // ─── STUDENT INFO BAR ─────────────────────────────────────────
  let y = 190;

  doc
    .fillColor('#374151')
    .fontSize(9)
    .font('Helvetica')
    .text('Name: _________________________________', LEFT, y);

  doc.text('Date: ________________', LEFT + 280, y);

  doc.text('Score: ______ / 10', LEFT + 420, y);

  y += 22;
  drawLine(doc, LEFT, y, RIGHT, '#e5e7eb');
  y += 18;

  // ─── LEARNING OBJECTIVES ──────────────────────────────────────
  y = sectionHeader(doc, 'Learning Objectives', LEFT, y);

  const objText = content.objectives ||
    'By the end of this assignment, students will understand the key concepts of the topic.';

  const objHeight = doc.heightOfString(objText, { width: INNER, fontSize: 10 });

  // Light tinted background behind objectives
  doc.rect(LEFT, y - 4, INNER, objHeight + 16).fill('#f5f3ff');
  doc.rect(LEFT, y - 4, 3, objHeight + 16).fill('#7c3aed');

  doc
    .fillColor('#374151')
    .fontSize(10)
    .font('Helvetica')
    .text(objText, LEFT + 12, y, {
      width: INNER - 20,
      lineGap: 3,
    });

  y += objHeight + 22;
  drawLine(doc, LEFT, y, RIGHT, '#e5e7eb');
  y += 18;

  // ─── QUESTIONS ────────────────────────────────────────────────
  y = sectionHeader(doc, 'Questions', LEFT, y);

  const questions = content.questions || [];

  questions.forEach((q, i) => {
    // Page break check — leave 80px buffer
    if (y > H - 80) {
      doc.addPage();
      y = 50;
    }

    // Question number badge
    doc.circle(LEFT + 8, y + 7, 8).fill('#7c3aed');
    doc
      .fillColor('#ffffff')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(`${i + 1}`, LEFT + 4, y + 3);

    // Question text
    const qText = q.question || '';
    doc
      .fillColor('#1a1a2e')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(qText, LEFT + 22, y, { width: INNER - 22 });

    y += doc.heightOfString(qText, { width: INNER - 22 }) + 8;

    if (q.type === 'mcq' && Array.isArray(q.options)) {
      q.options.forEach((opt, oi) => {
        if (y > H - 60) { doc.addPage(); y = 50; }

        const optLetters = ['A', 'B', 'C', 'D'];
        const letter = optLetters[oi] || oi;
        const cleanOpt = opt.replace(/^[A-D]\)\s*/i, '');

        // Option bubble
        doc
          .rect(LEFT + 22, y - 1, 16, 14)
          .roundedRect(LEFT + 22, y - 1, 16, 14, 3)
          .fill('#ede9fe');

        doc
          .fillColor('#7c3aed')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text(`${letter}`, LEFT + 26, y + 2);

        doc
          .fillColor('#4b5563')
          .fontSize(9)
          .font('Helvetica')
          .text(cleanOpt, LEFT + 44, y, { width: INNER - 44 });

        y += 18;
      });
      y += 6;
    } else {
      // Short answer lines
      y += 4;
      for (let l = 0; l < 3; l++) {
        doc
          .moveTo(LEFT + 22, y + 6)
          .lineTo(RIGHT, y + 6)
          .strokeColor('#d1d5db')
          .lineWidth(0.5)
          .stroke();
        y += 18;
      }
      y += 6;
    }

    // Separator between questions (not after last)
    if (i < questions.length - 1) {
      doc
        .moveTo(LEFT, y)
        .lineTo(RIGHT, y)
        .strokeColor('#f3f4f6')
        .lineWidth(1)
        .stroke();
      y += 10;
    }
  });

  // ─── ANSWER KEY ───────────────────────────────────────────────
  if (y > H - 140) {
    doc.addPage();
    y = 50;
  }

  y += 10;
  drawLine(doc, LEFT, y, RIGHT, '#e5e7eb');
  y += 18;

  // Answer key header with tinted background
  doc.rect(LEFT, y - 6, INNER, 24).fill('#fdf2f8');
  doc.rect(LEFT, y - 6, 3, 24).fill('#db2777');

  doc
    .fillColor('#831843')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Answer Key', LEFT + 12, y);

  doc
    .fillColor('#9d174d')
    .fontSize(8)
    .font('Helvetica')
    .text('For teacher use only', LEFT + 100, y + 2);

  y += 24;

  const keyText = content.answerKey || 'Answer key not provided.';
  doc
    .fillColor('#374151')
    .fontSize(9)
    .font('Helvetica')
    .text(keyText, LEFT, y, {
      width: INNER,
      lineGap: 3,
    });

  // ─── FOOTER (on every page) ────────────────────────────────────
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);

    // Footer band
    doc.rect(0, H - 28, W, 28).fill('#1a1a2e');
    doc.rect(0, H - 28, 6, 28).fill('#7c3aed');

    doc
      .fillColor('#6d6a8a')
      .fontSize(7)
      .font('Helvetica')
      .text(
        `TutorAI  •  AI-Powered Education Platform  •  ${meta.topic}`,
        LEFT + 10,
        H - 18
      );

    // Page number
    doc
      .fillColor('#6d6a8a')
      .fontSize(7)
      .text(`Page ${i + 1} of ${pages.count}`, 0, H - 18, {
        align: 'right',
        width: W - 20,
      });
  }

  doc.end();
}

// ─── Helpers ────────────────────────────────────────────────────

function sectionHeader(doc, text, x, y) {
  doc
    .fillColor('#7c3aed')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(text, x, y);
  return y + 20;
}

function drawLine(doc, x1, y, x2, color = '#e5e7eb') {
  doc
    .moveTo(x1, y)
    .lineTo(x2, y)
    .strokeColor(color)
    .lineWidth(0.5)
    .stroke();
}

module.exports = buildPDF;