$fixtureDir = "c:\Users\asus\OneDrive\Desktop\Projects\carrier-switch-assistant\apps\api\test\fixtures\resumes"
if (!(Test-Path $fixtureDir)) {
    New-Item -ItemType Directory -Path $fixtureDir -Force | Out-Null
}

# 1. Create valid-resume.pdf (Valid PDF 1.4 with extractable text)
$pdfContent = @"
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 215 >>
stream
BT
/F1 12 Tf
72 712 Td
(Jane Doe) Tj
0 -20 Td
(Senior Full Stack Engineer with 7 years of professional experience) Tj
0 -20 Td
(Skills: React, TypeScript, Node.js, PostgreSQL, Docker, AWS) Tj
0 -20 Td
(TechCorp - Senior Engineer: Led cloud backend platform) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000511 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
588
%%EOF
"@
[System.IO.File]::WriteAllBytes("$fixtureDir\valid-resume.pdf", [System.Text.Encoding]::ASCII.GetBytes($pdfContent))

# 2. Create empty-scanned.pdf (Valid PDF with zero text / blank page)
$emptyPdfContent = @"
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
192
%%EOF
"@
[System.IO.File]::WriteAllBytes("$fixtureDir\empty-scanned.pdf", [System.Text.Encoding]::ASCII.GetBytes($emptyPdfContent))

# 3. Create corrupted.pdf (Header is %PDF- but rest is invalid garbage)
$corruptedPdf = "%PDF-1.4`n<< CORRUPTED OBJECT DATA WITHOUT XREF OR CATALOG >>`n%%EOF"
[System.IO.File]::WriteAllBytes("$fixtureDir\corrupted.pdf", [System.Text.Encoding]::ASCII.GetBytes($corruptedPdf))

# 4. Create valid-resume.docx (Valid OpenXML archive with word/document.xml)
$tempDocxDir = "$fixtureDir\temp_docx"
if (Test-Path $tempDocxDir) { Remove-Item -Recurse -Force $tempDocxDir }
New-Item -ItemType Directory -Path "$tempDocxDir\_rels" -Force | Out-Null
New-Item -ItemType Directory -Path "$tempDocxDir\word" -Force | Out-Null

$contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
[System.IO.File]::WriteAllText("$tempDocxDir\[Content_Types].xml", $contentTypes)

$rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
[System.IO.File]::WriteAllText("$tempDocxDir\_rels\.rels", $rels)

$docXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Alex Morgan - Senior Backend Engineer with 5 years experience in Go, Python, Docker, Kubernetes, and PostgreSQL. Built resilient distributed microservices.</w:t></w:r></w:p></w:body></w:document>'
[System.IO.File]::WriteAllText("$tempDocxDir\word\document.xml", $docXml)

$docxPath = "$fixtureDir\valid-resume.docx"
if (Test-Path $docxPath) { Remove-Item -Force $docxPath }
Compress-Archive -Path "$tempDocxDir\*" -DestinationPath "$fixtureDir\valid.zip" -Force
Rename-Item "$fixtureDir\valid.zip" "valid-resume.docx" -Force
Remove-Item -Recurse -Force $tempDocxDir

# 5. Create corrupted.docx (Zip file missing word/document.xml)
$tempCorruptDir = "$fixtureDir\temp_corrupt"
if (Test-Path $tempCorruptDir) { Remove-Item -Recurse -Force $tempCorruptDir }
New-Item -ItemType Directory -Path $tempCorruptDir -Force | Out-Null
[System.IO.File]::WriteAllText("$tempCorruptDir\readme.txt", "This zip has no word/document.xml")
$corruptDocxPath = "$fixtureDir\corrupted.docx"
if (Test-Path $corruptDocxPath) { Remove-Item -Force $corruptDocxPath }
Compress-Archive -Path "$tempCorruptDir\*" -DestinationPath "$fixtureDir\corrupt.zip" -Force
Rename-Item "$fixtureDir\corrupt.zip" "corrupted.docx" -Force
Remove-Item -Recurse -Force $tempCorruptDir

# 6. Create unsupported.png
$pngBytes = [byte[]]@(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52)
[System.IO.File]::WriteAllBytes("$fixtureDir\unsupported.png", $pngBytes)

Write-Host "All test resume fixtures created successfully!"
