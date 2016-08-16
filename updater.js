var path = require('path');
var fs = require('fs');
var request = require('request');
var semver = require('semver');
var admZip = require('adm-zip');
var child_process = require("child_process");
/**
 * 重启应用
 * @param App
 */
exports.restartApp = function (App) {
    var child;
    if (process.platform == "darwin") {
        child = child_process.spawn("open", ["-n", "-a", process.execPath.match(/^([^\0]+?\.app)\//)[1]], {detached: true, stdio: 'ignore'});
    } else {
        child = child_process.spawn(process.execPath, [], {detached: true, stdio: 'ignore'});
    }
    child.unref();
    //gui.App.quit();
    App.quit();
}

/**
 * 检查新版本
 * @param checkVersionUrl
 * @param cb
 */
exports.checkVersion = function(checkVersionUrl, cb){
    request.get(checkVersionUrl, {timeout: 3000}, function (err, req, data) {
        if (err) {
            cb(err);
        }
        if (req.statusCode < 200 || req.statusCode > 299) {
            return cb(new Error(req.statusCode));
        }
        try {
            data = JSON.parse(data);
        } catch (e) {
            return cb(e)
        }
        cb(null, data)
    });
}

/**
 * 比较版本号
 * @param localVersion
 * @param latestVersion
 * @returns {*}
 */
exports.ifNeedUpdate = function(localVersion, latestVersion){
    return semver.gt(latestVersion, localVersion);
}

/**
 * 下载新版本
 * @param url
 * @param toUrl
 * @param cb
 */
exports.downloadNewVersion = function(url, toUrl, cb) {
    var pkg = request(url, function(err, response){
        if(err){
            cb(err);
        }
        if(response && (response.statusCode < 200 || response.statusCode >= 300)){
            pkg.abort();
            return cb(new Error(response.statusCode));
        }
    });
    pkg.on('response', function(response){
        if(response && response.headers && response.headers['content-length']){
            pkg['content-length'] = response.headers['content-length'];
        }
    });
    var filename = path.basename(url);
    var destinationPath = path.join(toUrl, filename);

    fs.unlink(destinationPath, function(){
        pkg.pipe(fs.createWriteStream(destinationPath));
        pkg.resume();
    });
    pkg.on('error', cb);
    pkg.on('end', function () {
        process.nextTick(function(){
            if(pkg.response.statusCode >= 200 && pkg.response.statusCode < 300){
                cb(null, destinationPath);
            }
        });
    });
    pkg.pause();
    return pkg;
}

/**
 * 解压缩新版本
 * @param filePath
 * @param cb
 */
exports.unpackNewVersion = function(filePath, cb){
    var zip = new admZip(filePath);
    var dir = path.dirname(filePath);
    zip.extractAllTo(dir, true);
    fs.unlink(filePath, function(){
        cb();
    });
}

/**
 * 清理旧版本目录
 * @param oldPath
 * @param cb
 */
exports.cleanOldVersion = function(oldPath, cb) {
    var child = child_process.exec('rm -rf ' + oldPath, function(err) {
        cb(err);
    })
}