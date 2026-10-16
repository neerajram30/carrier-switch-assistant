import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import mammoth from 'mammoth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixtureDir = path.resolve(__dirname, 'resumes');

if (!fs.existsSync(fixtureDir)) {
  fs.mkdirSync(fixtureDir, { recursive: true });
}

// 1. Create valid-resume.docx with standard POSIX zip paths
const zip = new JSZip();

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Alex Morgan</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Senior Backend Engineer with 5 years experience in Go, Python, Docker, Kubernetes, and PostgreSQL.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Built resilient distributed microservices at CloudSystems.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

zip.file('[Content_Types].xml', contentTypes);
zip.file('_rels/.rels', rels);
zip.file('word/document.xml', docXml);

const docxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
fs.writeFileSync(path.join(fixtureDir, 'valid-resume.docx'), docxBuffer);

// Verify with mammoth
const extraction = await mammoth.extractRawText({ buffer: docxBuffer });
console.log('Mammoth verified extracted text:', extraction.value.trim());

// 2. Corrupted docx (missing document.xml)
const corruptZip = new JSZip();
corruptZip.file('readme.txt', 'This archive is not a docx document');
const corruptBuffer = await corruptZip.generateAsync({ type: 'nodebuffer' });
fs.writeFileSync(path.join(fixtureDir, 'corrupted.docx'), corruptBuffer);

console.log('Valid and corrupted docx fixtures generated successfully!');
