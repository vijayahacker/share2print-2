const html5QrCode = new Html5Qrcode("canvas");
const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    /* handle success */
    console.log("success", decodedText, decodedResult);
    sotpCamera();
    window.location.href = decodedText;
};
const config = { fps: 10, qrbox: { width: 250, height: 250 } };

function sotpCamera() {
    html5QrCode.stop().then((ignore) => {
        console.log("camera stoped")
        return;
    }).catch((err) => {
        // Stop failed, handle it.
    });
    document.querySelector(".scan-preview").classList.add('hidden')
}
// If you want to prefer back camera
function openScanner() {
    document.querySelector(".scan-preview").classList.remove('hidden')
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback);
}