const fileInput = document.getElementById("file-inputs");

function cookieCheck() {

    fetch('./cookieCustomer', {
        method: 'POST',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    }).then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.status === 1) {
                document.getElementById("user-id").innerText = data.user;
            } else if (data.status == 2) {
                document.getElementById("user-id").innerText = data.user;
            }
        })
        .catch(error => console.error('singup Error:', error));
}


function upload() {
    document.getElementById("file-inputs").click();
}
fileInput.addEventListener("change", async (e) => {
    e.preventDefault();
    console.log("object");
    const files = fileInput.files;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;

        const uploadedFileContainer = document.createElement('div');
        uploadedFileContainer.classList.add('uploaded');

        uploadedFileContainer.innerHTML = `
        <i class="far fa-file-pdf"></i>
        <div class="file">
            <div class="w-100 space-between file__name">
            <p>${fileName}</p>
                <div class="right">
                    <button class="btn text-blue p-2 m-0" onclick="removeFile(this)">
                    <p class="hidden fileId"></p>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" class="dlt-icon">
                            <path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z" fill="currentColor"/>
                        </svg>
                    </button></div></div><div class="progress"><div class="progress-bar bg-success progress-bar-striped progress-bar-animated" style="width: 100%;"></div></div><div class="done text-start small muted hidden">File uploaded</div></div>`;

        document.querySelector('.wrapper').appendChild(uploadedFileContainer);

        const progressBar = uploadedFileContainer.querySelector('.progress-bar');
        const done = uploadedFileContainer.querySelector('.done');

        const urlParam = new URLSearchParams(window.location.search);
        let shopid = urlParam.get('shopID')
        if (shopid) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append("choiceCenter", shopid);

            try {
                const response = await axios.post('./upload', formData, {
                    onUploadProgress: progressEvent => {
                        const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        progressBar.style.width = percentComplete + '%';
                        if (percentComplete == 100) {
                            done.innerText = "File uploaded";
                            done.classList.remove("hidden")
                            uploadedFileContainer.querySelector('.progress').classList.add("hidden")
                        }
                    },
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Cookie': document.cookie,
                    }
                });

                if (response.status === 200) {
                    console.log('File uploaded successfully', response.data);
                    uploadedFileContainer.classList.add(`fID-${response.data.fileId}`)
                    uploadedFileContainer.querySelector('.fileId').innerText = response.data.fileId;
                    inform_server(shopid)
                } else {
                    console.error('File upload failed', response);
                 
                }
            } catch (error) {
                console.error('Error uploading file', error);
            }
        } else {
            window.location.href = "./home.html";
        }
    }
});

function removeFile(param) {
    const fId = param.querySelector('.fileId').innerText;
    axios.post('./removeFile', { fId })
        .then(response => {
            console.log(response.data);
            if (response.data.status) {
                console.log('File removed successfully');
                const uploadedFileContainer = document.querySelector(`.fID-${fId}`);
                uploadedFileContainer.remove(); // Remove the uploaded file element from the DOM
            } else {

            }
        })
        .catch(error => {
            console.error('Error removing file', error);
            // Handle any error that occurs during file removal
        });
}

function inform_server(shopid) {
    let id = document.getElementById("user-id").innerText;
    socket.emit("fileUploaded", {
        msg: "file uploaded",
        senderName: id, 
        reciverid : shopid
    })
}