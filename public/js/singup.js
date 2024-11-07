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

function singup() {
    const shopName = document.getElementById("shop-name").value;
    const ownerName = document.getElementById("owner-name").value;
    const shopAddress = document.getElementById("shop-address").value;
    const pass = document.getElementById("password").value;

    if (shopAddress && shopName && ownerName && pass) {
        fetch('./singup', {
                method: 'POST',
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                },
                body: JSON.stringify({ shop: shopName, owner: ownerName, address: shopAddress, password: pass })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.status == 1) {
                    fetch('./login', {
                            method: 'POST',
                            headers: {
                                "Content-type": "application/json; charset=UTF-8"
                            },
                            body: JSON.stringify({ shopUniCode: data.shopUniCode, password: pass })
                        }).then(response => response.json())
                        .then(data => {
                            console.log("loged in", data);
                            if (data.status == 1) {

                                // loged in successfull
                                const blob = new Blob([data.addOn], { type: 'text/plain' });
                                const link = document.createElement('a');
                                link.href = URL.createObjectURL(blob);
                                link.download = 'your-private-info.txt';
                               // link.click();
                                window.location.href = '/index.html'; // Redirect to login page
                            } else {
                                // window.location.href = '/login.html'; // Redirect to login page
                            }
                        })
                        .catch(error => console.log("login error", error))
                }
            })
            .catch(error => console.error('singup Error:', error));
    }

}