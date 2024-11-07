function loginCheck() {
    fetch('./loginCheck', {
            method: 'POST',
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        }).then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.status == 0) {
                window.location.href = '/index.html'; // Redirect to login page
            }
        })
        .catch(error => console.log("login error", error))
}

function login() {
    const shopUniCode = document.getElementById('shop-code').value;
    const pass = document.getElementById("pass").value
    fetch('./login', {
            method: 'POST',
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({ shopUniCode, password: pass })
        }).then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.status == 1) {
                // loged in successfull
                console.log("loged in");
                window.location.href = '/index.html'; // Redirect to login page
            } else {
                window.location.href = '/login.html'; // Redirect to login page
            }
        })
        .catch(error => console.log("login error", error))
}