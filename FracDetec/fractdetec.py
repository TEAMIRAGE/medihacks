import numpy as np
from PIL import Image
import cv2
import tensorflow
import keras
from keras.models import load_model
import sys
import mimetypes
from google.cloud import storage
from dotenv import dotenv_values

config = dotenv_values("config.env")
key_path = config["GCP_JSON_KEY"]
client = storage.Client.from_service_account_json(json_credentials_path=key_path)
# Get the PDF file path from the command line arguments
img_name = sys.argv[1]
bucketName = config["GCP_BUCKET_NAME"]  
bucket = storage.Bucket(client, bucketName)
blob = bucket.blob(img_name)
# Get the MIME type of the file
content_type, _ = mimetypes.guess_type(img_name)

# Set the file extension based on the MIME type
file_extension = mimetypes.guess_extension(content_type)

# Download the file with the appropriate extension
blob.download_to_filename("resources/bufferFile/fracture" + file_extension)

def is_radiograph(image_path):
    # Read the image using OpenCV
    image = cv2.imread(image_path)

    # Check the number of color channels in the image
    num_channels = image.shape[2]

    # Calculate the average value for each channel
    channel_averages = []
    for channel in range(num_channels):
        channel_average = np.mean(image[:, :, channel])
        channel_averages.append(channel_average)

    # Check if the average values are between 30 and 40
    if all(31 <= average <= 62 for average in channel_averages):
        return True
    else:
        return False

def preprocess_data(img_path, img_size=256):
    img = Image.open(img_path).convert('L')
    img = img.resize((img_size, img_size))
    img = np.array(img)
    img = img / 255.0
    img = np.expand_dims(img, axis=-1)
    return img

# Load the saved model from the file
model = load_model('FracDetec/my_model.h5')

# Function to check if the image has a fracture
def has_fracture(image_path):
    if not is_radiograph(image_path):
        return None

    img = preprocess_data(image_path, img_size=256)
    prediction = model.predict(np.array([img]))
    predicted_class = np.argmax(prediction)
    fracture_present = predicted_class == 1
    return fracture_present

# Call the function with the image path
image_path = "resources/bufferFile/fracture" + file_extension
fracture_result = has_fracture(image_path)

if fracture_result is None:
    print("The provided image is not Correct.")
elif fracture_result:
    print("Fracture is present.")
else:
    print("No fracture is detected.")
