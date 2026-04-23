import os
from PyPDF2 import PdfMerger

pdf_dir = "PDFlife"
pdfs = [
    "Life_Architecture 1.pdf",
    "Inner_Compass 2.pdf",
    "Biological_Blueprint 3.pdf",
    "Life_Systems_Blueprint 4.pdf",
    "Reality_Architecture 5.pdf"
]

merger = PdfMerger()

for pdf in pdfs:
    path = os.path.join(pdf_dir, pdf)
    print(f"Adding {path}...")
    merger.append(path)

output_path = "Spheres_of_Life_RU.pdf"
merger.write(output_path)
merger.close()
print(f"Merged PDF saved to {output_path}")
