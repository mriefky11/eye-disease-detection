const TARGET_CLASSES = {
  0: 'Cataract',
  1: 'Diabetic Retinopathy',
  2: 'Glaucoma',
  3: 'Normal',
};

async function loadModel() {
  const model = await tf.loadGraphModel('assets/tfjs_model/model.json');
  return model;
}

async function runModel(imgElement) {
  const model = await loadModel();

  const tensor = tf.browser
    .fromPixels(imgElement)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .expandDims();

  const predictions = await model.predict(tensor).data();
  console.log('Predictions: ', predictions);

  displayPredictions(predictions);
  return Array.from(predictions);
}

// function displayPredictions(predictions) {
//   const output = document.getElementById('output');
//   output.innerHTML = '';

//   predictions.forEach((probability, index) => {
//     const className = TARGET_CLASSES[index];
//     const predictionElement = document.createElement('div');
//     predictionElement.className = 'alert alert-info';
//     predictionElement.textContent = `${className}: ${(
//       probability * 100
//     ).toFixed(2)}%`;
//     output.appendChild(predictionElement);
//   });
// }

function displayPredictions(predictions) {
  const output = document.getElementById('output');
  output.innerHTML = '';

  // Find the index of the highest probability
  const maxProbabilityIndex = predictions.indexOf(Math.max(...predictions));

  predictions.forEach((probability, index) => {
    const className = TARGET_CLASSES[index];
    const predictionElement = document.createElement('div');

    // Apply Bootstrap alert classes for styling
    predictionElement.className = 'alert text-center';
    predictionElement.textContent = `${className}: ${(
      probability * 100
    ).toFixed(2)}%`;

    // Apply Bootstrap colors based on probability
    if (index === maxProbabilityIndex) {
      predictionElement.classList.add('alert-success'); // Green for highest probability
    } else {
      predictionElement.classList.add('alert-danger'); // Red for others
    }

    output.appendChild(predictionElement);
  });
}

if (document.getElementById('imageUpload')) {
  document
    .getElementById('imageUpload')
    .addEventListener('change', function (event) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.getElementById('selectedImage');
        img.src = e.target.result;
        img.onload = function () {
          runModel(img).then((predictions) => {
            // Store predictions in a human-readable format
            const predictionsText = predictions
              .map((probability, index) => {
                return `${TARGET_CLASSES[index]}: ${(probability * 100).toFixed(
                  2
                )}%`;
              })
              .join(', ');

            console.log('Formatted Predictions: ', predictionsText); // Debugging line to check formatted predictions
            document.getElementById('predictions').value = predictionsText;
          });
        };
      };
      reader.readAsDataURL(file);
    });

  document
    .getElementById('userForm')
    .addEventListener('submit', function (event) {
      event.preventDefault();

      const name = document.getElementById('name').value;
      const age = document.getElementById('age').value;
      const gender = document.getElementById('gender').value;
      const image = document.getElementById('selectedImage').src;
      const predictions = document.getElementById('predictions').value;
      const dateAdded = new Date().toLocaleString();

      const record = {name, age, gender, predictions, image, dateAdded};

      let history = localStorage.getItem('history');
      if (history) {
        history = JSON.parse(history);
      } else {
        history = [];
      }

      history.push(record);
      localStorage.setItem('history', JSON.stringify(history));

      alert('Data has been saved successfully!');
      document.getElementById('userForm').reset();
      document.getElementById('selectedImage').src = '';
      document.getElementById('output').innerHTML = '';
    });
}

function deleteRecord(index) {
  let history = JSON.parse(localStorage.getItem('history'));
  history.splice(index, 1);
  localStorage.setItem('history', JSON.stringify(history));
  loadHistory();
}

function showDetailInModal(index) {
  let history = JSON.parse(localStorage.getItem('history'));
  const record = history[index];

  document.getElementById('detailName').innerText = record.name;
  document.getElementById('detailAge').innerText = record.age;
  document.getElementById('detailGender').innerText = record.gender;
  document.getElementById('detailPredictions').innerText = record.predictions;
  document.getElementById('detailImage').src = record.image;
  document.getElementById('detailDateAdded').innerText = record.dateAdded;

  const detailModal = new bootstrap.Modal(
    document.getElementById('detailModal')
  );
  detailModal.show();
}

function loadHistory() {
  const historyOutput = document.getElementById('historyOutput');
  historyOutput.innerHTML = '';

  let history = localStorage.getItem('history');
  if (history) {
    history = JSON.parse(history);
    history.forEach((record, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
              <td>${record.dateAdded}</td>
              <td>${record.name}</td>
              <td>${record.age}</td>
              <td>${record.gender}</td>
              <td>
                  <button class="btn btn-primary btn-sm text-light" onclick="showDetailInModal(${index})">Detail</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteRecord(${index})">Delete</button>
              </td>
          `;
      historyOutput.appendChild(row);
    });
  }
}

if (document.getElementById('historyOutput')) {
  document.addEventListener('DOMContentLoaded', loadHistory);
}
