import os

import cv2

import string



DATA_DIR = './data'

if not os.path.exists(DATA_DIR):

    os.makedirs(DATA_DIR)



alphabet_classes = list(string.ascii_uppercase) + [
    'Hi_There', 'Thank_You', 'Sorry', 'Help', 'How_Are_You',
    'I_Am', 'Fine', 'I_Love_You', 'Space_Bar', 'Good_Bye'
]

dataset_size = 200



cap = cv2.VideoCapture(0)



for label in alphabet_classes:

    class_dir = os.path.join(DATA_DIR, label)

    if not os.path.exists(class_dir):

        os.makedirs(class_dir)



    print(f'Collecting data for class {label}')



    while True:

        ret, frame = cap.read()

        cv2.putText(frame, f'Press "Q" to start capturing for {label}', (50, 50),

                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)

        cv2.imshow('frame', frame)

        if cv2.waitKey(25) & 0xFF == ord('q'):

            break



    counter = 0

    while counter < dataset_size:

        ret, frame = cap.read()

        cv2.imshow('frame', frame)

        cv2.waitKey(25)

        cv2.imwrite(os.path.join(class_dir, f'{counter}.jpg'), frame)

        counter += 1



cap.release()

cv2.destroyAllWindows()