from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
import mediapipe as mp
import pickle
import os


from flask import Flask, send_from_directory, jsonify, request

app = Flask(
    __name__,
    static_folder='Intersign/static',        # path to your JS, CSS, etc.
    static_url_path='/static'                # how Flask will expose it
)
CORS(app)  # Enable CORS

# Serve the HTML pages
@app.route('/')
def home():
    return send_from_directory('Intersign/', 'index.html')

@app.route('/asl')
def asl():
    return send_from_directory('Intersign/', 'asl.html')

@app.route('/detect')
def detect():
    return send_from_directory('Intersign/', 'detect.html')

# Load your model
with open('./model.p', 'rb') as f:
    model_dict = pickle.load(f)
model = model_dict['model']

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

def preprocess_image(image_b64):
    header, encoded = image_b64.split(',', 1)
    data = base64.b64decode(encoded)
    np_arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img
# Example API endpoint for prediction (adjust as needed)
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    image_b64 = data.get('image')

    if not image_b64:
        return jsonify({'error': 'No image data received'}), 400

    img = preprocess_image(image_b64)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(img_rgb)

    if not results.multi_hand_landmarks:
        return jsonify({'predicted_sign': 'No hand detected'})

    for hand_landmarks in results.multi_hand_landmarks:
        x_ = [lm.x for lm in hand_landmarks.landmark]
        y_ = [lm.y for lm in hand_landmarks.landmark]

        data_aux = []
        for lm in hand_landmarks.landmark:
            data_aux.append(lm.x - min(x_))
            data_aux.append(lm.y - min(y_))

        if len(data_aux) == 42:
            prediction = model.predict([np.asarray(data_aux)])
            predicted_character = prediction[0]
            return jsonify({'predicted_sign': predicted_character})

    return jsonify({'predicted_sign': 'No prediction'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
