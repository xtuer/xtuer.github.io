在前面介绍的图片裁剪、图片压缩后得到 Blob 格式图片，最后需要把它们上传到服务器，下面介绍使用 Axios 和 jQuery 分别进行上传。



## Axios 上传 Blob 图片

```js
function uploadBlobImage(blobImage) {
    const url  = 'http://localhost:8080/upload-file';
    const form = new FormData();
    form.append('file', blobImage, blobImage.name);
    
    axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(response => {
        console.log(response);
    }).catch(error => {
        console.error(error);
    });
}
```

## jQuery 上传 Blob 图片

```js
function uploadBlobImage(blobImage) {
    const url  = 'http://localhost:8080/upload-file';
    const form = new FormData();
    form.append('file', blobImage, blobImage.name);
    
    $.ajax({
        type: 'POST',
        url : url,
        data: form,
        processData: false,
        contentType: false,
    }).done(response => {
        console.log(response);
    }).fail(error => {
        console.error(error);
    });
}
```

