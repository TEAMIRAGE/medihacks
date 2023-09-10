from keras.models import load_model
import cv2
import numpy as np
import sys
import mimetypes
from google.cloud import storage
from dotenv import dotenv_values

config = dotenv_values("config.env")

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
image_path = 'resources/bufferFile/' + sys.argv[1]

# Check if it's a radiograph image
if is_radiograph(image_path):
    # Classify the tumor image
    predicted_class = classify_tumor_image(image_path)
    print("Predicted class:", predicted_class)
    # Upload the PDF to a Google Cloud Storage bucket
    bucket_name = "criticalstrike1"
    gcs_object_name = f"{sys.argv[1]}"  # Updated object name format
    # Initialize a GCS client
    client = storage.Client()
    # Get the bucket
    bucket = client.get_bucket(bucket_name)
    # Upload the file to GCS
    blob = bucket.blob(gcs_object_name)
    blob.upload_from_filename(image_path)
else:
    print("Wrong image")

