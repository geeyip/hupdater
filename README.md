## nw.js 客户端更新模块
## 安装
```
    npm install hupdater
```

## 主要API

### restartApp(App)
* 重启应用
* App nw.js的App对象(require('nw.gui').App)

### checkVersion(checkVersionUrl, cb)
* checkVersionUrl 新版本检查Rest Url ，返回 x.y.x 格式版本号
* cb 回调函数，cb(err, version), 且函数第一个参数为err， 第二个为版本号

### ifNeedUpdate(localVersion, latestVersion)

* 是否需要更新版本
* localVersion 本地客户端版本号
* latestVersion 最新版本号

### downloadNewVersion(url, toUrl, cb)

* 下载新版本文件
* url ，新版本下载地址
* toUrl， 本地保存路径
* cb，回调函数，cb(err, dir), 且函数第一个参数为err， 第二个为文件下载后本地绝对路径


### unpackNewVersion(filePath, cb)

* 解压缩下载的新版本压缩包
* filePath， 新版本压缩包的本地绝对路径
* cb，解压完成后回调函数

### cleanOldVersion(oldPath, cb)

* 版本更新后，清理旧版本文件
* oldPath， 旧版本文件夹绝对路径
* cb，清理完成后回调函数



## Demo

```javascript
var gui = require('nw.gui');
var path = require('path');
var updater = require('hupdater');
var pkg = require('./../package.json');

/**
 * 更新
 */
function update(){
    console.log('--开始检查新版本');

    var serverUrl = pkg.updateServer; //更新服务地址
    var localVersion = pkg.version;  //本地版本号
    var targetPath =  path.dirname(process.execPath); //本地程序根目录

    var versionCheckApi = serverUrl + '/api/client/one/version';
  
    //开始检查版本号
    updater.checkVersion(versionCheckApi, function (err, newVersion) {
        if(err){
            console.log(err);
            console.log('--检查更新失败');
            return;
        }
        //判断是否需要更新
        var ifUpdate = updater.ifNeedUpdate(localVersion, newVersion);
        if(ifUpdate){
            console.log('--发现新版本，开始下载新版本');

            var downloadApi = serverUrl + '/api/client/one/version/'+newVersion+'.zip';
            //开始下载新版本包
            updater.downloadNewVersion(downloadApi, targetPath, function(err, filePath){
                if(err){
                    console.log(err);
                    console.log('--下载更新失败>');
                    return;
                }
                //下载完成后，开始解压缩更新包
                console.log('--下载完成，开始更新新版本');
                updater.unpackNewVersion(filePath, function() {
                    console.log('--更新完成，5秒后将重启程序');
                    updater.cleanOldVersion(filePath, function(err) {
                        
                    });
                    setTimeout(function () {
                        updater.restartApp(gui.App);
                    },5000);

                });
            });
        }else{
            console.log('--没有发现新版本');
        }
    });
}
```