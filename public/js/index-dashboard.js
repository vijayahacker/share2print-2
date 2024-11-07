let globalData = {};
let globalData2 = 0;

function onloadBody() {
    fetch('./dashboard', {
        method: 'POST',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
    })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            if (data.status == 1) {
                if (globalData2) {
                    listenChats()
                }
                if (data.resData.length) {
                    let rowData = data.resData;
                    const uniqueData = {};
                    rowData.forEach(item => {
                        const uniqueCode = item.unique_code;
                        if (!uniqueData[uniqueCode]) {
                            uniqueData[uniqueCode] = item;
                        }
                    });
                    const uniqueArray = Object.values(uniqueData);
                    globalData = uniqueArray;
                    updateChatList(uniqueArray);
                } else {
                    document.querySelector(".chat-list").innerHTML = "<div class='p-4 h4'>No Users found...!</div>"
                    document.querySelector(".chats").innerHTML = ` <div class="flex-col">
                    <img src="./img/green-doc-share.png" alt="" width="80%">
                    <p class="display-6 fw-medium mt-4">No chat data found...!</p></div>`;
                }

            } else if (data.status == -1) {
                console.log("cookey invalide", data);
                window.location.href = '/login.html';
            } else { console.log("err") }
        })
        .catch(error => console.error('onload api error:', error));

}

function logout() {
    fetch('./logout', {
        method: 'POST',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
    }).then(response => response.json())
        .then(data => {
            window.location.href = '/index.html';
        }).catch(error => console.error('onload api error:', error));
}

function updateChatList(uniqueArray, bool) {
    document.querySelector(".chat-list").innerHTML = "";
    uniqueArray.sort((a, b) => a.sent_time - b.sent_time);
    uniqueArray.map((elem) => {
        let timeDef = Date.now() - new Date(elem.sent_time);
        let tString = ""
        if (timeDef < 60000) {
            tString = "just now";
        } else if (timeDef < 3600000) {
            tString = `${Math.floor(timeDef / 60000)} minutes ago`
        } else if (timeDef < 86400000) {
            tString = `${Math.floor(timeDef / 3600000)} hours ago`
        } else {
            tString = "no longer Exists"
        }

        document.querySelector(".chat-list").innerHTML += `<li id="${elem.unique_code}" onclick="fetchChats(this) " class="container-fluid flex-row c-shadow rounded-4 mt-3"><div class="col-3 flex-center pt-3 pb-3"><span class="mb-0 rounded-circle text-center p-4 pb-3 pt-3 bg-primary">${elem.unique_code.charAt(0)}</span></div><div class="col-7 m-1 mt-0 mb-0 "><p class="h6 m-0 name">${elem.unique_code} <span >(${elem.customer_name})</span></p><small class="time">${tString}</small></div><div class="col-2 text-center btn btn-2" onclick="deleteChat('${elem.unique_code}')"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z" fill="currentColor"/></svg></div></li>`;

    })


    const e = document.querySelector(".chat-list > li:first-child");

    if (e && !bool) {
        fetchChats(e);
    }
}

function fetchChats(e) {
    const unicode = e.id;
    fetch('./getChatData', {
        method: 'POST',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({ unicode })
    }).then(response => response.json()).then(data => {
        if (data.status == 1) {
            const resData = data.resData;

            document.querySelector(".chat-header").innerHTML = `<div class="container-fluid flex-row c-in-shadow rounded-4 mt-0 p-2"><div class="col-2 flex-center p-0"><span class="mb-0 rounded-circle text-center p-4 pb-3 pt-3 bg-primary">${e.querySelector('.name').innerText.trim().charAt(0)}</span></div><div class="col-6 m-3 mt-0 mb-0"><p class="fw-bold m-0 ">${e.querySelector('.name').innerText.trim()}</p><small>${e.querySelector('.time').innerText.trim()}</small></div>
                <div class="col-4 text-center"><button class="btn btn-shadow p-2"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" fill="currentColor"/></svg></button><button class="btn btn-shadow p-3 pt-2 pb-2 "><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z" fill="currentColor"/></svg></button></div></div>`;
            document.getElementById("dataList").innerHTML = ""
            resData.map(dataElem => {
                document.getElementById("dataList").innerHTML += `<li class="container-fluid flex-row c-shadow rounded-2 pt-3 pb-3 mt-3 "><div class=" col-1 p-0 m-2 mb-0 mt-0"><img src="./img/jpg.png" alt="" class="img-size"></div><div class="col-7"><p class="m-0  h6">${dataElem.file_name}</p><div class="flex-row"><small class="p-1"></small><small class="p-1"></small></div></div>
                    <div class="col-4 text-start">
                    <button class="btn btn-shadow p-2" onclick="fileDownload('${dataElem.file_name}')">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
                            <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" fill="currentColor"/>
                            </svg>
                            <small>Download</small>
                        </button>
                    <button class="btn btn-shadow p-2 " onclick="printFile('${dataElem.file_name}')" >
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
                                <path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z" fill="currentColor"/>
                            </svg>
                            <small>Print</small>
                        </button>
                        </div></li>`;
            });

        }
    })
        .catch(error => console.error(error));
}

function searchChats() {
    const uniqueArray = globalData;
    const searchValue = document.getElementById("searchInput").value.trim().toLowerCase();
    if (searchValue.length > 0) {
        const matchedItems = uniqueArray.filter(item => {
            const uniqueCode = item.unique_code.toLowerCase();
            const userName = item.customer_name.toLowerCase();
            return uniqueCode.includes(searchValue) || userName.includes(searchValue);
        });
        updateChatList(matchedItems, true);
    } else {
        updateChatList(uniqueArray);
    }
}

function deleteChat(customerId) {
    console.log(customerId);
    fetch('./deleteChat', {
        method: 'POST',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({ customerId })
    }).then(response => response.json())
        .then(data => {
            console.log(data)
            if (data.status == 1) {
                onloadBody();
            }
        })
        .catch(error => console.error('onload api error:', error));
}

function fileDownload(fileName) {
    const url = `./getPrivateFile/${fileName}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json', // Adjust if necessary
        },
    })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName; // Set the file name for the downloaded file
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error('Error:', error));
}

function printFile(fileName) {
    const url = `./getPrivateFile/${fileName}`;

    fetch(url, {
        method: 'GET',
    })
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], fileName, { type: blob.type });
            const fileURL = URL.createObjectURL(file);

            const printWindow = window.open(fileURL);
            printWindow.onload = () => {
                printWindow.print();
                URL.revokeObjectURL(fileURL);
            };
        })
        .catch(error => console.error('Error:', error));
}

function showQR() {
    fetch('./qrID', {
        method: 'POST',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data) {
                document.getElementById('alert-box').classList.remove('hidden');
                document.getElementById('main-body').classList.add('hidden')
                document.getElementById('alert').innerHTML = `<p class="muted display-6 fw-bold mt-3 pt-4">Your QR code</p> 
                <img src="./qr/${data.qrID}.png" alt="${data.qrID}" width=300px">
                <div class="flex-row"> 
                <a href="./qr/${data.qrID}.png " class="btn btn-width p-3 m-4 border shadow-lg " download><strong>Download</strong></a> 
                <button class="btn btn-width p-3 m-4 border shadow-lg " onclick="closeAlert() "><strong>Close</strong></button>
                </div>`;
            }
        }).catch(err => { console.log(err) })
}

function showHelp() {
    document.getElementById('alert').innerHTML = "";
    document.getElementById('alert-box').classList.remove('hidden');
    document.getElementById('main-body').classList.add('hidden')
    document.getElementById('alert').innerHTML = ` <div class="h-100">
    <div class="modal-header p-5 pb-4 bt-0 border-bottom-0">
        <h1 class="fw-bold mb-0 fs-2 text-start">Sign up for free</h1>
        <button type="button" class="btn-close m-3" onclick="closeAlert()"></button>
    </div>
    <div class="form-floating mb-3 text-start">
        <p class="m-4 mb-1 mt-0">Name:</p>
        <p class="h3 muted text-center">Vijay Mourya</p>
    </div>
    <div class="form-floating mb-3 text-start">
        <p class="m-4 mb-1 mt-0">Mobile Number:</p>
        <p class="h3 muted text-center">6266461606</p>
    </div>
    <hr class="my-4">
    <h2 class="fs-5 fw-bold mb-3 text-start">Or use a third-party</h2>
    <button class="w-100 py-2 mb-2 btn btn-outline-secondary rounded-3 instagram" type="submit">
        Instagram
      </button>
    <button class="w-100 py-2 mb-2 btn btn-outline-secondary rounded-3 whatsapp" type="submit">
        Whatsapp
    </button>
</div>`
}

function closeAlert() {
    document.getElementById('alert-box').classList.add('hidden');
    document.getElementById('main-body').classList.remove('hidden');
}
function getShopIdFromCookie(n) {
    const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${'shop'}=`));

    return cookie ? decodeURIComponent(cookie.split('=')[1]).split('"')[3] : null;
}

