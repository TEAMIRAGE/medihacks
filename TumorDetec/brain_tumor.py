from keras.models import load_model
import cv2
import numpy as np
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
blob.download_to_filename("resources/bufferFile/tumor" + file_extension)

def classify_tumor_image(image_path):
    # Define the labels
    labels = ['glioma_tumor', 'meningioma_tumor', 'no_tumor', 'pituitary_tumor']

    # Load the model
    loaded_model = load_model("TumorDetec/tumor_classification_model.h5")

    # Load and preprocess the tumor image
    tumor_image = cv2.imread(image_path)
    tumor_image = cv2.resize(tumor_image, (150, 150))
    tumor_image = np.expand_dims(tumor_image, axis=0)

    # Make predictions on the tumor image
    predictions = loaded_model.predict(tumor_image)
    predicted_class_index = np.argmax(predictions)
    predicted_class = labels[predicted_class_index]

    return predicted_class

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

    # Check if the average values are between 30 and 62
    if all(29 <= average <= 40 for average in channel_averages):
        return True
    else:
        return False

# Path to the tumor image to be classified
image_path = "resources/bufferFile/tumor" + file_extension

# Check if it's a radiograph image
if is_radiograph(image_path):
    # Classify the tumor image
    predicted_class = classify_tumor_image(image_path)
    print("Predicted class:", predicted_class)
else:
    print("Wrong image")
