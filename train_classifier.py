import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load the dataset
with open('./data.pickle', 'rb') as f:
    data_dict = pickle.load(f)

data = data_dict['data']
labels = data_dict['labels']

# Sanity check: remove samples that do not have consistent feature length (should be 42 = 21 landmarks * 2 coords)
clean_data = []
clean_labels = []

for features, label in zip(data, labels):
    if len(features) == 42:
        clean_data.append(features)
        clean_labels.append(label)

# Convert to numpy arrays
data = np.asarray(clean_data)
labels = np.asarray(clean_labels)

# Split the dataset
x_train, x_test, y_train, y_test = train_test_split(
    data, labels, test_size=0.2, shuffle=True, stratify=labels
)

# Train the model
model = RandomForestClassifier()
model.fit(x_train, y_train)

# Evaluate the model
y_predict = model.predict(x_test)
score = accuracy_score(y_test, y_predict)

print(f'{score * 100:.2f}% of samples were classified correctly!')

# Save the trained model
with open('model.p', 'wb') as f:
    pickle.dump({'model': model}, f)