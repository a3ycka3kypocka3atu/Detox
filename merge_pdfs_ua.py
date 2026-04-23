import os
from PyPDF2 import PdfMerger

pdf_dir = "PDFlife/Life UA"
pdfs = [
    "Architecture_of_Life_(1).pdf",
    "Internal_Compass 2.pdf",
    "Biological_Foundation 3.pdf",
    "Sacred_Botany 4 .pdf",
    "The_Living_Canvas 5 .pdf"
]

merger = PdfMerger()

for pdf in pdfs:
    path = os.path.join(pdf_dir, pdf)
    print(f"Adding {path}...")
    merger.append(path)

output_path = "Spheres_of_Life_UA.pdf"
merger.write(output_path)
merger.close()
print(f"Merged PDF saved to {output_path}")
