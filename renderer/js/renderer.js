const form = document.querySelector('#img-form');
const img = document.querySelector('#img');
const outputPath = document.querySelector('#output-path');
const filename = document.querySelector('#filename');
const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');

const allowImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

function toggleResizerExportSettings(bool) {
    form.style.display = bool ? 'block' : 'none';
}

function loadImage(e) {

    const file = e.target.files[0];
    if(!validateImageFile(file)) {
        toggleResizerExportSettings(false);
        return;
    }
    toast.success('Image loaded successfully.');

    // Get original image dimensions
    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = function() {
        widthInput.value = image.width;
        heightInput.value = image.height;
    }

    toggleResizerExportSettings(true);
    filename.innerHTML = file.name;
    outputPath.innerText = path.join(os.homedir(), 'imageresizer')
}

function sendImage(e) {
    e.preventDefault();
    
    const width = widthInput.value;
    const height = heightInput.value;
    
    if(!img.files[0]) {
        toast.error('Please select a file.');
        return;
    }

    const imgPath = img.files[0].path;

    if(width === '' || height === '') {
        toast.error('Please enter width and height you want to resize to.');
        return;
    }

    // Send message to main process
    ipcRenderer.send('image:resize', {
        imgPath,
        width,
        height
    });
}

// Catch message from image:done
ipcRenderer.on('image:resized', (data) => {
    const {width, height, dest} = data;
    toast.success(`Image resized to ${width}x${height} successfully.\nSaved to ${dest}`);
});


// Make sure the file is image
function validateImageFile(file) {
    if(!file){
        toast.error('Please select a file.');
        return false;
    }

    if (!allowImageTypes.includes(file.type)) {
        toast.error('Please select an image file.');
        return false;
    }

    return true
}

// Toastify implementation
const toast = {
    error: (msg) => {
        Toastify.toast({
            text: msg,
            duration: 5000,
            close: false,
            style: {
                background: 'red',
                color: 'white',
                textAlign: 'center'
            }
        });
    },
    success: (msg) => {
        Toastify.toast({
            text: msg,
            duration: 5000,
            close: false,
            style: {
                background: 'green',
                color: 'white',
                textAlign: 'center'
            }
        });
    }
}


img.addEventListener('change', loadImage)
form.addEventListener('submit', sendImage);