from datetime import datetime
import sys
import vertexai
from vertexai.language_models import TextGenerationModel
from reportlab.lib.pagesizes import letter, inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import pymongo
from bson import ObjectId
from google.cloud import storage
import os

vertexai.init(project="pure-silicon-390116", location="us-central1")
parameters = {
    "max_output_tokens": 256,
    "temperature": 0.2,
    "top_p": 0.8,
    "top_k": 40
}
model = TextGenerationModel.from_pretrained("text-bison")
# Define sysArgs values
sysargs_values = {
    "WBC": sys.argv[1],
    "RBC": sys.argv[2],
    "HGB": sys.argv[3],
    "HCT": sys.argv[4],
    "MCV": sys.argv[5],
    "MCH": sys.argv[6],
    "MCHC": sys.argv[7],
    "PLT": sys.argv[8],
    "NE": sys.argv[9],
    "LY": sys.argv[10],
    "MO": sys.argv[11],
    "EO": sys.argv[12]
}

# Create the input text with sysargs values
input_text = f"""input:My Blood Report values of "White Blood Cell" is {sysargs_values['WBC']},
"Red Blood Cell" is {sysargs_values['RBC']},"Hemoglobin" is {sysargs_values['HGB']},
"Hematocrit"is {sysargs_values['HCT']},"MCV"is {sysargs_values['MCV']},
"MCH" is {sysargs_values['MCH']},"MCHC" is {sysargs_values['MCHC']},
"Platelet" is {sysargs_values['PLT']},"Neutrophils" is {sysargs_values['NE']},
"Lymphocytes" is {sysargs_values['LY']},"Monocytes" is {sysargs_values['MO']},
"Eosinophils" is {sysargs_values['EO']} give me a brief diagnosis"""

# Generate the response
response = model.predict(input_text, **parameters)

# Print or use the response as needed
# print(response)

current_date_time = datetime.now().strftime("%Y%m%d%H%M%S")
output_directory = "resources/bufferFile/"

# Create a PDF document
pdf_filename = os.path.join(output_directory, current_date_time + "_blood_report.pdf")
document = SimpleDocTemplate(pdf_filename, pagesize=letter)

# Create a list to hold the elements to be added to the PDF
elements = []

# Define paragraph styles
styles = getSampleStyleSheet()
title_style = styles['Title']
heading_style = ParagraphStyle(
    'Heading1',
    fontSize=16,
    alignment=1,
    spaceAfter=12,
    fontName='Helvetica-Bold',
    textColor=colors.black,
)
normal_style = styles['Normal']

# Add title
title = Paragraph("Blood Report", title_style)
elements.append(title)
elements.append(Spacer(1, 24))

# Get the ObjectId string from command-line arguments
target_object_id_str = sys.argv[13]
# Convert the ObjectId string to ObjectId
target_object_id = ObjectId(target_object_id_str)
# Replace with your MongoDB Atlas connection string
connection_string = "mongodb+srv://teammiragencer2024:miragemeansgenjutsu@cluster0.yz9vwrs.mongodb.net/" \
                    "DiagnoScan?retryWrites=true&w=majority"
# Create a MongoDB client
client = pymongo.MongoClient(connection_string)
# Access the desired database
db = client.get_database("DiagnoScan")
# Access the desired collection
collection = db.get_collection("userdetails")

# Define the query to find the document by ObjectId
query = {"_id": target_object_id}

# Retrieve the document with the specified ObjectId
user_document = collection.find_one(query)
user_name = str(user_document.get("name"))
dob = user_document.get("dateOfBirth")
# Calculate the current date
current_date = datetime.now().date()

# Calculate the age
age = str(current_date.year - dob.year - ((current_date.month, current_date.day) < (dob.month, dob.day)))
# Get the current date
current_date = datetime.now().strftime("%B %d, %Y")

# Add patient information
patient_info = Paragraph(
    f"<b>Patient:</b> {user_name}<br/>"
    f"<b>AGE:</b> {age}<br/>"
    "<b>Gender:</b> Male<br/>"
    "<b>Date of Report:</b>" + current_date,
    normal_style
)
elements.append(patient_info)
elements.append(Spacer(1, 12))

# Define blood test results using sys arguments
blood_test_results = [
    ("Test Name", "Result", "Reference Range"),
    ("Hemoglobin", f"{sysargs_values['HGB']}", "Male: 14 - 16 g%<br/>Female: 12 - 14 g%"),
    ("RBC Count", f"{sysargs_values['RBC']}", "4.35 - 5.65 Mcl"),
    ("MCV", f"{sysargs_values['MCV']}", "80 - 99 fl"),
    ("MCH", f"{sysargs_values['MCH']}", "28 - 32 pg"),
    ("MCHC", f"{sysargs_values['MCHC']}", "30 - 40 %"),
    ("WBC Count", f"{sysargs_values['WBC']}", "4000 - 11000 /cu.mm"),
    ("Neutrophils", f"{sysargs_values['NE']}", "40 - 75 %"),
    ("Lymphocytes", f"{sysargs_values['LY']}", "20 -45 %"),
    ("Eosinophils", f"{sysargs_values['EO']}", "00 - 06 %"),
    ("Monocytes", f"{sysargs_values['MO']}", "00 - 10 %"),
    ("Platelet Count", f"{sysargs_values['PLT']}", "150000 - 450000 / cu.mm"),
]

# Create a table with test results
data = [blood_test_results[0]]
data.extend([Paragraph(cell, normal_style) for cell in row] for row in blood_test_results[1:])
test_result_table = Table(data, colWidths=[2.5 * inch, 1.5 * inch, 2 * inch])
test_result_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
]))
elements.append(test_result_table)
elements.append(Spacer(1, 24))

response_text = response.response_text if hasattr(response, "response_text") else str(response)

# Now, create the diagnosis string
diagnosis = Paragraph(f"Diagnosis: <b>{response_text}</b>", normal_style)
elements.append(diagnosis)
elements.append(Spacer(1, 12))

# Add "generated by medilabs.com" at the bottom corner
generated_by = Paragraph("Generated by Medilabs.com", ParagraphStyle(
    'Normal',
    fontSize=10,
    textColor=colors.grey,
    alignment=2  # Right-aligned
))
elements.append(generated_by)

# Build the PDF document
document.build(elements)

# Upload the PDF to a Google Cloud Storage bucket
bucket_name = "criticalstrike1"
gcs_object_name = f"{current_date_time}_BloodReport.pdf"  # Updated object name format
# Initialize a GCS client
client = storage.Client()
# Get the bucket
bucket = client.get_bucket(bucket_name)
# Upload the file to GCS
blob = bucket.blob(gcs_object_name)
blob.upload_from_filename(pdf_filename)  # Use the correct PDF filename

print(gcs_object_name.replace(" ", ""))

# Define the new collection name
new_collection_name = "bloodreportcollections"

# Access the new collection (or create it if it doesn't exist)
new_collection = db.get_collection(new_collection_name)
current_date = datetime.now()
# Define three sample documents
document1 = {
    "date": current_date,
    "Imagename": gcs_object_name,
    "UserId": target_object_id_str
}

# Insert the document into the new collection
new_collection.insert_one(document1)

# print(f"Added to MongoDB collection.")
